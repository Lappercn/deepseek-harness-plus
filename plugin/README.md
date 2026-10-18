# dsh-whale-splash · 深度求索开屏动画

打开 DSH 时，先播一段 **HARNESS OS 开机过场**（对着参考视频逐帧对齐）：

鲸鱼标志 → `需要访问许可` → `身份资料确认` → `接收访问需求` → `开始读取权限` → `读取完毕 · 核验通过` → `WELCOME TO HARNESS OS` → 淡出进入界面。

黑底 HUD、四角框、等宽小字、打字机英文、读取条、核验圆环都有；声音用的是参考视频里的原声（`assets/splash.m4a`，可替换）。鲸鱼用的是**官方 DeepSeek 鲸鱼标志**（带眼睛、胸鳍、尾鳍的那只，不是简化版）。

## 效果

| 第一幕 · Logo | 需要访问许可 | 身份资料确认 |
| --- | --- | --- |
| ![logo](docs/01-logo.png) | ![auth](docs/02-auth.png) | ![identity](docs/03-identity.png) |

| 接收访问需求 | 开始读取权限 | 读取完毕 · 核验通过 |
| --- | --- | --- |
| ![received](docs/04-received.png) | ![read](docs/05-read.png) | ![verified](docs/06-verified.png) |

| WELCOME TO HARNESS OS | 设置页 |
| --- | --- |
| ![welcome](docs/08-welcome.png) | ![settings](docs/07-settings.png) |

## 时间轴（与视频逐帧对齐）

| 时间 | 这一幕 |
| --- | --- |
| 0.5s | 鲸鱼 Logo 浮现（约停留到 3.9s，比视频多留一拍，先看够图标） |
| 3.9s | 需要访问许可（英文打字机逐字出现，按钮随后淡入） |
| 7.3s | 身份资料确认（表单 + 验证码逐字输入） |
| 9.9s | 接收访问需求 |
| 10.9s | 开始读取权限（读取条 0.9s 走完） |
| 11.9s | 读取完毕 · 核验通过（圆环 1.5s 画完） |
| 14.3s | WELCOME TO HARNESS OS |
| 16.2s | 淡出进入界面 |

## 右上角窗口按钮

DSH Desktop 用的是 Electron 的 `titleBarOverlay`（Windows 原生绘制的窗口按钮），网页 CSS 改不了它的颜色。

本插件的**宿主端跑在 Electron 主进程里**，所以开屏时会直接把窗口按钮的 `symbolColor` 设成黑色、并按设置进入全屏——白按钮融进纯黑开屏，播完再把颜色和窗口状态恢复；如果宿主拿不到 Electron（普通 `dsh web`），会退回浏览器 Fullscreen API，并给顶部加一条很淡的标题栏渐变兜底。

## 交互

- **点击屏幕**：推进到下一幕。
- **Esc** 或右下角「跳过开屏」：立即结束。
- **只播一次**：同一窗口里只会播一次；DSH 的 HMR / 会话重连 / F5 刷新都不会让它重播；关掉窗口（= 退出应用）再打开才会再播。
- **声音**：与画面同一帧启动（先等音轨 canplay 再同时开演），不会出现「画面先跑、声音后到」。Chrome/Edge 若拦截自动播放，会等你第一次点击/按键再补播；Electron 桌面端一般直接播放。
- 设置里「立即重播」可随时预览整段。

## 设置

「设置 → 开屏动画」：

| 项 | 说明 |
| --- | --- |
| 启用开屏动画 | 关掉后打开界面直接进主界面 |
| 播放声音 | 是否播 `assets/splash.m4a` |
| 显示跳过提示 | 右下角「跳过开屏 ESC」；Logo 幕不显示 |
| 开屏时全屏 | 开屏期间真正全屏（宿主直接 `setFullScreen`），右上角白色窗口按钮消失，播完恢复窗口 |
| 开屏长度 | **完整开屏**（约 16 秒）/ **仅 Logo**（约 4 秒） |
| 音量 | 0–100% |
| 立即重播 | 立即预览整段动画 |
| 恢复默认 | 恢复默认值 |

设置持久化到 `~/.dsh-whale-splash/config.json`（宿主接口），localStorage 兜底。

### 换声音

把音轨放到 `<插件目录>/assets/splash.m4a`（覆盖原文件），重启 DSH 生效。当前音轨是从参考视频抽的 21 秒原声（结尾 2 秒淡出）。

## 安装

小白请看仓库根目录的 **README.md**（有图文步骤），或者直接双击 `一键安装.bat`。

手动安装（把 `<仓库目录>` 换成你的实际路径，`dsh` 换成你自己的 `dsh.cmd`）：

```powershell
dsh plugin --profile desktop add "file:<仓库目录>/release/dsh-whale-splash-1.1.1.tgz"
```

卸载：

```powershell
dsh plugin --profile desktop remove dsh-whale-splash
```

> `desktop` profile 由 Electron 应用独占管理，CLI 不能直接启动/检查它；`dsh plugin --profile desktop ...` 只改依赖与 bundles，真正加载要重启应用。

## 结构

```
package.json           dsh.bundle.patch + dsh.client（platform=web, immediately）
cordis.patch.yml       宿主插件行（id: whale-splash）
index.js               宿主：/whale-splash/audio（Range 流式）+ /whale-splash/settings + /health
client.js              浏览器端：HUD + 七幕时序 + 打字机 + 进度/圆环 + 声音 + 设置页
assets/splash.m4a      开屏音轨（21s，可替换）
assets/whale.svg       官方 DeepSeek 鲸鱼标志（MIT）
assets/whale-path.txt  鲸鱼单色路径（嵌入 client.js 用）
tools/embed-whale.mjs  把 whale-path.txt 写进 client.js 的 WHALE_D（幂等）
tools/capture-phases.mjs  按「当前在播哪一幕」逐幕截图（避免受加载耗时影响）
tools/verify-splash.mjs   验证 Logo 停留时长 + 二次加载不重播
tools/shot.mjs / ui-check.mjs / bbox.mjs  截图、设置页截图、SVG 取 bbox
preview.html           免启动 DSH 的静态预览
```

## 开发

```powershell
node tools/embed-whale.mjs   # 改过 assets/whale-path.txt 后重新嵌入
```

时间轴在 `client.js` 的 `FULL_SCHEDULE` / `LOGO_SCHEDULE`；每幕里 `data-text` 的 `data-speed`、`data-delay` 控制打字机节奏。

## 版权

- 作者：**抖音 @孤影**
- 鲸鱼路径取自 [DeepSeek 官方标志](https://commons.wikimedia.org/wiki/File:DeepSeek_logo.svg) 中的鲸鱼图形（品牌标识，本插件仅作个人开屏动画使用）。
- 开屏音轨为插件自带素材，如需再分发请替换成自己的音轨。
- 插件代码 MIT。
