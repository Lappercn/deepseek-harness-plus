# AGENTS.md · 给 AI 助手的安装说明

> 本文件是写给 **AI 编程助手**看的。人类用户请看 [README.md](README.md)。
> 用户可能只丢给你一句「帮我装这个皮肤 + 仓库地址」，照下面做即可。

## 这是什么

`DeepSeek Harness（DSH）` 的开屏动画皮肤。装法是 **把 `release/dsh-whale-splash-<version>.tgz` 用 DSH 自己的 CLI 加进用户的 profile**，然后重启 DSH 生效。它不是独立程序，不能单独运行。

## 环境前提

- Windows（DSH 桌面版）。CLI 是 PowerShell 脚本 `install.ps1`。
- 不需要 Node.js、不需要联网装依赖（tgz 自带全部文件）。
- 目标 profile 通常是 `desktop`（DSH 桌面应用用的那个）。

## 标准安装流程

```powershell
git clone https://gitee.com/leapai/deepseek-harness-plus.git
cd deepseek-harness-plus
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

脚本会自己完成：找 `dsh.cmd` → 选 profile → 执行
`dsh plugin --profile <profile> add "file:<绝对路径>/release/dsh-whale-splash-1.1.1.tgz"`。

成功标志：输出里出现 `安装完成`，且 pnpm 打印 `+ dsh-whale-splash 1.1.1`。

## 如果脚本报「没找到 dsh 命令」

说明用户的 DSH 装在非默认位置（便携版很常见）。**你去帮他找**，不要直接失败：

```powershell
# 找 dsh.cmd（官方版 / 便携版都覆盖）
Get-ChildItem -Path "C:\","D:\","E:\" -Filter dsh.cmd -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -like '*resources\runtime\cli\bin\dsh.cmd' } |
  Select-Object -First 3 -ExpandProperty FullName
```

然后用找到的路径重跑：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"
```

> 便携版目录里一定能看到 `DeepSeek Harness.exe`，`dsh.cmd` 与它同级目录下的
> `resources\runtime\cli\bin\dsh.cmd`。

## 验证安装结果

```powershell
# 1) 依赖已写入 profile
Get-Content "$env:USERPROFILE\.dsh\profiles\desktop\package.json" -Raw

# 2) 插件文件已落地
Get-ChildItem "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-whale-splash"

# 3) 版本正确（应为 1.1.1）
(Get-Content "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-whale-splash\package.json" -Raw) -match '"version":\s*"([^"]+)"'
```

`package.json` 的 `dependencies` 里应出现 `dsh-whale-splash`，
`dsh.profile.bundles` 数组里也应出现 `dsh-whale-splash`。

## 必须告诉用户的一件事

**装完必须完全退出 DSH 再启动**（关掉主窗口后，还要到系统托盘右键退出）。不重启不会生效。

## 常见坑

| 坑 | 说明 |
| --- | --- |
| `dsh --profile desktop --dump-config` 报错 | 正常。`desktop` profile 被 Electron 应用独占，CLI 不允许启动/检查它，只能 `plugin add/remove` |
| 想验证配置树是否挂上 | 复制 profile 到临时名字再 dump，验证完删除（非必需） |
| `file:` 依赖 | 依赖指向 tgz 的绝对路径，**别删仓库文件夹**，否则之后 pnpm 重装会失败 |
| 已装旧版本 | 先 `dsh plugin --profile desktop remove dsh-whale-splash` 再 add |
| 中文乱码 | `install.ps1` 已存为 UTF-8 **带 BOM**，Windows PowerShell 5.1 才能正确读中文；改动它时请保留 BOM |

## 卸载

```powershell
dsh plugin --profile desktop remove dsh-whale-splash
```

配置目录 `~/.dsh-whale-splash` 可一并删除。重启 DSH 恢复原样。

## 仓库结构参考

```
README.md            人类教程
AGENTS.md            本文件（AI 安装说明）
install.ps1          安装脚本（自动探测 dsh、自动选 profile）
一键安装.bat         双击入口，调用 install.ps1
release/*.tgz        预打包的皮肤（安装用的就是它）
plugin/              源码：package.json + index.js（宿主端）+ client.js（浏览器端）
```
