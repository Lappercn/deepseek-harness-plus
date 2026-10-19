<#
  DeepSeek Harness 鐨偆锛圚ARNESS OS 寮€灞忓姩鐢伙級路 涓€閿畨瑁呰剼鏈?  浣滆€咃細鎶栭煶 @瀛ゅ奖

  鐢ㄦ硶锛堝湪浠撳簱鏍圭洰褰曟墽琛岋級锛?    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Profile web
    powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"

  鍙傛暟锛?    -Profile <name>  瑁呭埌鍝釜 profile锛堥粯璁よ嚜鍔細鏈?desktop 鐢?desktop锛屽惁鍒?web锛?    -Dsh <path>      鎵嬪姩鎸囧畾 dsh.cmd 鐨勫畬鏁磋矾寰勶紙渚挎惡鐗?/ 鑷畾涔夊畨瑁呬綅缃敤锛?#>
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
Say "  DeepSeek Harness 鐨偆 路 寮€灞忓姩鐢?
Say "  浣滆€咃細鎶栭煶 @瀛ゅ奖"
Say "=============================================="
Say ""

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseDir = Join-Path $here 'release'
$tgz = Get-ChildItem $releaseDir -Filter 'dsh-whale-splash-*.tgz' -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $tgz) {
  throw "鎵句笉鍒板畨瑁呭寘锛?releaseDir\dsh-whale-splash-*.tgz`n璇风‘璁や笅杞界殑鏄€愬畬鏁翠粨搴撱€戯紙鍚?release 鏂囦欢澶癸級锛岃€屼笉鏄崟鐙竴涓枃浠躲€?
}
Say "瀹夎鍖咃細$($tgz.Name)"

# 鈹€鈹€ 1. 鎵?dsh 鍛戒护 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function Find-DshCli {
  param([string]$Explicit)

  if ($Explicit) {
    if (Test-Path $Explicit) { return (Resolve-Path $Explicit).Path }
    throw "浣犳寚瀹氱殑 dsh 涓嶅瓨鍦細$Explicit"
  }

  $cands = New-Object System.Collections.Generic.List[string]
  if ($env:DSH_CLI) { $cands.Add($env:DSH_CLI) }

  # 瀹樻柟榛樿瀹夎浣嶇疆
  $roots = @($env:LOCALAPPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:APPDATA)
  foreach ($root in $roots) {
    if (-not $root) { continue }
    foreach ($name in @('DeepSeek Harness', 'DSH Desktop', 'DeepSeekHarness', 'DSH')) {
      $cands.Add((Join-Path $root "Programs\$name\resources\runtime\cli\bin\dsh.cmd"))
      $cands.Add((Join-Path $root "$name\resources\runtime\cli\bin\dsh.cmd"))
    }
  }

  # 渚挎惡鐗堬細甯歌鐩綍鍚嶆斁鍦ㄤ换鎰忕洏鐨勬牴鐩綍涓?  foreach ($drive in (Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue).Name) {
    foreach ($folder in @('deepseek', 'DeepSeek Harness', 'DeepSeekHarness', 'DSH', 'dsh')) {
      $cands.Add("${drive}:\$folder\resources\runtime\cli\bin\dsh.cmd")
    }
  }

  foreach ($c in $cands) {
    if ($c -and (Test-Path $c)) { return $c }
  }

  # %LOCALAPPDATA%\Programs 涓嬫壂涓€灞傜洰褰?  $progRoot = Join-Path $env:LOCALAPPDATA 'Programs'
  if (Test-Path $progRoot) {
    $hit = Get-ChildItem $progRoot -Directory -ErrorAction SilentlyContinue |
      ForEach-Object { Join-Path $_.FullName 'resources\runtime\cli\bin\dsh.cmd' } |
      Where-Object { Test-Path $_ } |
      Select-Object -First 1
    if ($hit) { return $hit }
  }

  # PATH 閲岀殑 dsh
  $cmd = Get-Command dsh -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  return $null
}

$cli = Find-DshCli -Explicit $Dsh
if (-not $cli) {
  Warn ""
  Warn "脳 娌℃壘鍒?dsh 鍛戒护銆?
  Warn ""
  Write-Host @"
浣犵殑 DSH 鍙兘瑁呭湪鑷畾涔変綅缃紙姣斿渚挎惡鐗堬級銆傝鎶?dsh.cmd 鐨勫畬鏁磋矾寰勫憡璇夎剼鏈紝渚嬪锛?
  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"

dsh.cmd 灏卞湪浣犲畨瑁?DSH 鐨勭洰褰曢噷锛岃矾寰勭壒寰佹槸锛?  鈥resources\runtime\cli\bin\dsh.cmd
"@
  exit 1
}
Ok "鈭?鎵惧埌 dsh锛?cli"

# 鈹€鈹€ 2. 閫?profile 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
$profilesDir = Join-Path $env:USERPROFILE '.dsh\profiles'
if (-not $Profile) {
  if (Test-Path (Join-Path $profilesDir 'desktop')) { $Profile = 'desktop' }
  elseif (Test-Path (Join-Path $profilesDir 'web')) { $Profile = 'web' }
  else { $Profile = 'desktop' }
}
Ok "鈭?瀹夎鍒?profile锛?Profile"

# 鈹€鈹€ 3. 瀹夎 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
$uri = 'file:' + ($tgz.FullName -replace '\\', '/')
Say ""
Say "姝ｅ湪瀹夎锛岃绋嶅€欌€?
Say ""

& $cli plugin --profile $Profile add $uri
if ($LASTEXITCODE -ne 0) {
  throw "瀹夎澶辫触锛堥€€鍑虹爜 $LASTEXITCODE锛夈€傚彲浠ユ妸涓婇潰鐨勬姤閿欐埅鍥惧彂缁欎綔鑰咃紙鎶栭煶 @瀛ゅ奖锛夈€?
}

Say ""
Ok "=============================================="
Ok "  瀹夎瀹屾垚锛?
Ok "=============================================="
Write-Host ""
Write-Host "涓嬩竴姝ワ紙寰堥噸瑕侊級锛? -ForegroundColor Yellow
Write-Host "  1. 瀹屽叏閫€鍑?DSH 鈥斺€?鍏虫帀涓荤獥鍙ｅ悗锛岃繕瑕佸埌鍙充笅瑙掋€愮郴缁熸墭鐩樸€戝彸閿浘鏍囬€€鍑猴紱" -ForegroundColor Yellow
Write-Host "  2. 閲嶆柊鎵撳紑 DSH锛屽紑鏈哄姩鐢诲氨浼氭挱鏀俱€? -ForegroundColor Yellow
Write-Host ""
Write-Host "鎾斁鏃讹細鐐瑰嚮灞忓箷 = 涓嬩竴骞曪紝Esc = 璺宠繃銆? -ForegroundColor Gray
Write-Host "鎯宠皟闊抽噺 / 鍏ㄥ睆 / 鍒囨崲椋庢牸 / DIY瑙嗛锛欴SH 閲屾墦寮€ 璁剧疆 鈫?寮€灞忓姩鐢汇€? -ForegroundColor Gray
Write-Host "瑙嗛鐩綍锛殈/.dsh-whale-splash/videos (鏀惧叆浠绘剰 mp4 鍗冲彲鐩存帴閫夋嫨)" -ForegroundColor Gray
Write-Host ""
