[CmdletBinding()]
param([string]$mode = "splash")

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DshWinCtrl {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);
    
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    public struct RECT {
        public int Left; public int Top; public int Right; public int Bottom;
    }
}
"@

$stateFile = Join-Path $env:TEMP "dsh_whale_splash_win_state.json"
$dshProcs = Get-Process -Name "DeepSeek Harness" -ErrorAction SilentlyContinue
if (-not $dshProcs) { exit 0 }

$targetHwnd = [IntPtr]::Zero
$targetRect = $null

[DshWinCtrl]::EnumWindows({
    param($h, $lp)
    if ([DshWinCtrl]::IsWindowVisible($h)) {
        [uint32]$pidVal = 0
        [DshWinCtrl]::GetWindowThreadProcessId($h, [ref]$pidVal)
        if ($dshProcs.Id -contains $pidVal) {
            $r = New-Object DshWinCtrl+RECT
            [DshWinCtrl]::GetWindowRect($h, [ref]$r)
            $w = $r.Right - $r.Left
            $hgt = $r.Bottom - $r.Top
            if ($w -gt 400 -and $hgt -gt 400) {
                $script:targetHwnd = $h
                $script:targetRect = $r
                return $false
            }
        }
    }
    return $true
}, [IntPtr]::Zero)

if ($targetHwnd -eq [IntPtr]::Zero) { exit 0 }

if ($mode -eq "splash") {
    $w = $targetRect.Right - $targetRect.Left
    $hgt = $targetRect.Bottom - $targetRect.Top
    @{
        hwnd = $targetHwnd.ToInt64()
        left = $targetRect.Left
        top = $targetRect.Top
        width = $w
        height = $hgt
    } | ConvertTo-Json | Set-Content $stateFile -Force
    
    $sw = [DshWinCtrl]::GetSystemMetrics(0)
    $sh = [DshWinCtrl]::GetSystemMetrics(1)
    [void][DshWinCtrl]::SetWindowPos($targetHwnd, [DshWinCtrl]::HWND_TOPMOST, 0, 0, $sw, $sh, 0x0040)
} elseif ($mode -eq "restore") {
    if (Test-Path $stateFile) {
        try {
            $saved = Get-Content $stateFile -Raw | ConvertFrom-Json
            $h = [IntPtr]$saved.hwnd
            [void][DshWinCtrl]::SetWindowPos($h, [DshWinCtrl]::HWND_NOTOPMOST, $saved.left, $saved.top, $saved.width, $saved.height, 0x0040)
            Remove-Item $stateFile -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}
