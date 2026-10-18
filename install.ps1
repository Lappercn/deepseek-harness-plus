<#
  DeepSeek Harness 皮肤（HARNESS OS 开屏动画）· 一键安装脚本
  作者：抖音 @孤影

  用法（在仓库根目录执行）：
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Profile web
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"

  参数：
    -Profile <name>  装到哪个 profile（默认自动：有 desktop 用 desktop，否则 web）
    -Dsh <path>      手动指定 dsh.cmd 的完整路径（便携版 / 自定义安装位置用）
#>
param(
  [string]$Profile = '',
  [string]$Dsh = ''
)

$ErrorActionPreference = 'Stop'

function Say  ($m) { Write-Host $m -ForegroundColor Cyan }
function Ok   ($m) { Write-Host $m -ForegroundColor Green }
function Warn ($m) { Write-Host $m -ForegroundColor Yellow }

Say ""
Say "=============================================="
Say "  DeepSeek Harness 皮肤 · 开屏动画"
Say "  作者：抖音 @孤影"
Say "=============================================="
Say ""

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseDir = Join-Path $here 'release'
$tgz = Get-ChildItem $releaseDir -Filter 'dsh-whale-splash-*.tgz' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $tgz) {
  throw "找不到安装包：$releaseDir\dsh-whale-splash-*.tgz`n请确认下载的是【完整仓库】（含 release 文件夹），而不是单独一个文件。"
}
Say "安装包：$($tgz.Name)"

# ── 1. 找 dsh 命令 ────────────────────────────────────────────────────────────
function Find-DshCli {
  param([string]$Explicit)

  if ($Explicit) {
    if (Test-Path $Explicit) { return (Resolve-Path $Explicit).Path }
    throw "你指定的 dsh 不存在：$Explicit"
  }

  $cands = New-Object System.Collections.Generic.List[string]
  if ($env:DSH_CLI) { $cands.Add($env:DSH_CLI) }

  # 官方默认安装位置
  $roots = @($env:LOCALAPPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:APPDATA)
  foreach ($root in $roots) {
    if (-not $root) { continue }
    foreach ($name in @('DeepSeek Harness', 'DSH Desktop', 'DeepSeekHarness', 'DSH')) {
      $cands.Add((Join-Path $root "Programs\$name\resources\runtime\cli\bin\dsh.cmd"))
      $cands.Add((Join-Path $root "$name\resources\runtime\cli\bin\dsh.cmd"))
    }
  }

  # 便携版：常见目录名放在任意盘的根目录下
  foreach ($drive in (Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue).Name) {
    foreach ($folder in @('deepseek', 'DeepSeek Harness', 'DeepSeekHarness', 'DSH', 'dsh')) {
      $cands.Add("${drive}:\$folder\resources\runtime\cli\bin\dsh.cmd")
    }
  }

  foreach ($c in $cands) {
    if ($c -and (Test-Path $c)) { return $c }
  }

  # %LOCALAPPDATA%\Programs 下扫一层目录
  $progRoot = Join-Path $env:LOCALAPPDATA 'Programs'
  if (Test-Path $progRoot) {
    $hit = Get-ChildItem $progRoot -Directory -ErrorAction SilentlyContinue |
      ForEach-Object { Join-Path $_.FullName 'resources\runtime\cli\bin\dsh.cmd' } |
      Where-Object { Test-Path $_ } |
      Select-Object -First 1
    if ($hit) { return $hit }
  }

  # PATH 里的 dsh
  $cmd = Get-Command dsh -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  return $null
}

$cli = Find-DshCli -Explicit $Dsh
if (-not $cli) {
  Warn ""
  Warn "× 没找到 dsh 命令。"
  Warn ""
  Write-Host @"
你的 DSH 可能装在自定义位置（比如便携版）。请把 dsh.cmd 的完整路径告诉脚本，例如：

  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"

dsh.cmd 就在你安装 DSH 的目录里，路径特征是：
  …\resources\runtime\cli\bin\dsh.cmd
"@
  exit 1
}
Ok "√ 找到 dsh：$cli"

# ── 2. 选 profile ────────────────────────────────────────────────────────────
$profilesDir = Join-Path $env:USERPROFILE '.dsh\profiles'
if (-not $Profile) {
  if (Test-Path (Join-Path $profilesDir 'desktop')) { $Profile = 'desktop' }
  elseif (Test-Path (Join-Path $profilesDir 'web')) { $Profile = 'web' }
  else { $Profile = 'desktop' }
}
Ok "√ 安装到 profile：$Profile"

# ── 3. 安装 ─────────────────────────────────────────────────────────────────
$uri = 'file:' + ($tgz.FullName -replace '\\', '/')
Say ""
Say "正在安装，请稍候…"
Say ""

& $cli plugin --profile $Profile add $uri
if ($LASTEXITCODE -ne 0) {
  throw "安装失败（退出码 $LASTEXITCODE）。可以把上面的报错截图发给作者（抖音 @孤影）。"
}

Say ""
Ok "=============================================="
Ok "  安装完成！"
Ok "=============================================="
Write-Host ""
Write-Host "下一步（很重要）：" -ForegroundColor Yellow
Write-Host "  1. 完全退出 DSH —— 关掉主窗口后，还要到右下角【系统托盘】右键图标退出；" -ForegroundColor Yellow
Write-Host "  2. 重新打开 DSH，开机动画就会播放。" -ForegroundColor Yellow
Write-Host ""
Write-Host "播放时：点击屏幕 = 下一幕，Esc = 跳过。" -ForegroundColor Gray
Write-Host "想调音量 / 全屏 / 时长：DSH 里打开 设置 → 开屏动画。" -ForegroundColor Gray
Write-Host "想换音乐：替换插件目录 assets\splash.m4a 后重启 DSH。" -ForegroundColor Gray
Write-Host ""
