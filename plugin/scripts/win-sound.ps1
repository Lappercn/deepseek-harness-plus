[CmdletBinding()]
param(
    [string]$action = "play",
    [string]$wav = ""
)

$pidFile = Join-Path $env:TEMP "dsh_whale_splash_sound.pid"

if ($action -eq "play") {
    if (-not (Test-Path $wav)) { exit 0 }
    # Run background player
    $script = @"
`$sp = [System.Media.SoundPlayer]::new('$wav')
`$sp.PlaySync()
"@
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($script)
    $encoded = [Convert]::ToBase64String($bytes)
    $proc = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $encoded" -WindowStyle Hidden -PassThru
    Set-Content $pidFile $proc.Id -Force
} elseif ($action -eq "stop") {
    if (Test-Path $pidFile) {
        try {
            $p = Get-Content $pidFile -Raw
            Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}
