[CmdletBinding()]
param([ValidateSet('splash','restore','inspect')][string]$mode = 'splash')
$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class DshSplashWindow {
    public delegate bool EnumProc(IntPtr hwnd, IntPtr param);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc proc, IntPtr param);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int command);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hwnd, int index);
    [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr hwnd, int index, int value);
    [DllImport("user32.dll", SetLastError=true)] public static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);
    [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr monitor, ref MONITORINFO info);
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
    public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct MONITORINFO { public int Size; public RECT Monitor, Work; public uint Flags; }
    public static IntPtr Find(uint[] pids) {
        IntPtr found = IntPtr.Zero; long largest = 0;
        EnumWindows(delegate(IntPtr hwnd, IntPtr param) {
            uint pid; GetWindowThreadProcessId(hwnd, out pid);
            if (!IsWindowVisible(hwnd) || Array.IndexOf(pids, pid) < 0) return true;
            RECT r; GetWindowRect(hwnd, out r);
            long area = (long)(r.Right-r.Left)*(r.Bottom-r.Top);
            if (r.Right-r.Left > 400 && r.Bottom-r.Top > 300 && area > largest) { found=hwnd; largest=area; }
            return true;
        }, IntPtr.Zero);
        return found;
    }
    public static RECT Bounds(IntPtr hwnd) { RECT r; GetWindowRect(hwnd, out r); return r; }
    public static RECT Screen(IntPtr hwnd) {
        MONITORINFO info = new MONITORINFO(); info.Size=Marshal.SizeOf(info);
        if (!GetMonitorInfo(MonitorFromWindow(hwnd,2), ref info)) throw new Exception("monitor_not_found");
        return info.Monitor;
    }
}
"@

try { [void][DshSplashWindow]::SetThreadDpiAwarenessContext([IntPtr](-4)) } catch {}
$stateFile = Join-Path $env:TEMP 'dsh_whale_splash_win_state.json'
try {
    if ($mode -eq 'restore') {
        if (!(Test-Path $stateFile)) { @{ok=$true; restored=$false} | ConvertTo-Json -Compress; exit 0 }
        $saved = Get-Content $stateFile -Raw | ConvertFrom-Json
        $hwnd = [IntPtr]([long]$saved.hwnd)
        [uint32]$owner = 0
        [void][DshSplashWindow]::GetWindowThreadProcessId($hwnd, [ref]$owner)
        if ([DshSplashWindow]::IsWindow($hwnd) -and $owner -eq $saved.processId) {
            [void][DshSplashWindow]::SetWindowLong($hwnd, -16, [int]$saved.style)
            $order = if ($saved.topmost) { [IntPtr](-1) } else { [IntPtr](-2) }
            if (![DshSplashWindow]::SetWindowPos($hwnd,$order,$saved.left,$saved.top,$saved.width,$saved.height,0x0030)) { throw 'restore_failed' }
        }
        # Fixed, known per-user temporary state path, validated above.
        Remove-Item -LiteralPath $stateFile -Force
        @{ok=$true; restored=$true} | ConvertTo-Json -Compress
        exit 0
    }
    [uint32[]]$ids = @(Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
    $hwnd = [DshSplashWindow]::Find($ids)
    if ($hwnd -eq [IntPtr]::Zero -and $mode -eq 'splash') {
        $main = Get-Process -Name 'DeepSeek Harness' | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($main -and [DshSplashWindow]::IsIconic($main.MainWindowHandle)) {
            $hwnd = $main.MainWindowHandle
            [void][DshSplashWindow]::ShowWindow($hwnd,9)
        }
    }
    if ($hwnd -eq [IntPtr]::Zero) { throw 'dsh_window_not_found' }
    $rect = [DshSplashWindow]::Bounds($hwnd)
    $screen = [DshSplashWindow]::Screen($hwnd)
    if ($mode -eq 'splash') {
        [uint32]$owner = 0
        [void][DshSplashWindow]::GetWindowThreadProcessId($hwnd, [ref]$owner)
        $saved = $null
        if (Test-Path $stateFile) { $saved = Get-Content $stateFile -Raw | ConvertFrom-Json }
        if (!$saved -or $saved.hwnd -ne $hwnd.ToInt64() -or $saved.processId -ne $owner) {
            @{ hwnd=$hwnd.ToInt64(); processId=$owner; style=[DshSplashWindow]::GetWindowLong($hwnd,-16);
               topmost=(([DshSplashWindow]::GetWindowLong($hwnd,-20) -band 8) -ne 0);
               left=$rect.Left; top=$rect.Top; width=($rect.Right-$rect.Left); height=($rect.Bottom-$rect.Top)
            } | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
        }
        # Remove native caption/resize borders, use the actual monitor rectangle (not work area).
        $style = [DshSplashWindow]::GetWindowLong($hwnd,-16) -band (-bnot 0x00CF0000)
        [void][DshSplashWindow]::SetWindowLong($hwnd,-16,$style)
        if (![DshSplashWindow]::SetWindowPos($hwnd,[IntPtr](-1),$screen.Left,$screen.Top,($screen.Right-$screen.Left),($screen.Bottom-$screen.Top),0x0030)) { throw 'fullscreen_failed' }
        $rect = [DshSplashWindow]::Bounds($hwnd)
    }
    $covers = $rect.Left -le $screen.Left -and $rect.Top -le $screen.Top -and $rect.Right -ge $screen.Right -and $rect.Bottom -ge $screen.Bottom
    @{ok=$true; hwnd=$hwnd.ToInt64(); fullscreen=$covers;
      bounds=@{left=$rect.Left;top=$rect.Top;width=($rect.Right-$rect.Left);height=($rect.Bottom-$rect.Top)};
      monitor=@{left=$screen.Left;top=$screen.Top;width=($screen.Right-$screen.Left);height=($screen.Bottom-$screen.Top)}
    } | ConvertTo-Json -Compress
} catch {
    @{ok=$false;error=$_.Exception.Message} | ConvertTo-Json -Compress
    exit 1
}
