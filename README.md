<div align="center">

# 🐳 DeepSeek Harness 皮肤

**HARNESS OS 开机动画 —— 打开 DSH，先看一场 16 秒的开机自检**

`v1.1.1` · `Windows` · `MIT` · 作者 **抖音 @孤影**

<img src="docs/preview.png" alt="DeepSeek Harness 皮肤 · 开屏动画预览" width="100%">

</div>

---

## ✨ 这是什么

一个 **DeepSeek Harness（DSH）皮肤**：每次启动 DSH，先播一段电影感的开机过场 —— 鲸鱼标志亮起 → 需要访问许可 → 身份资料确认 → 接收访问需求 → 读取权限 → 核验通过 → `WELCOME TO HARNESS OS`，然后才进入主界面。

黑底 HUD、四角边框、等宽小字、英文打字机、读取条、核验圆环、背景音轨一应俱全；开屏期间自动全屏并隐藏右上角那几个白色窗口按钮，播完原样恢复。

> 皮肤只改「开机动画」这一件事，**不碰你的聊天记录、模型配置和 API Key**。

---

## 🎬 效果

| 时间 | 画面 |
| :---: | --- |
| `0.5s` | 🐳 鲸鱼 Logo 浮现 · 深度求索 / DEEPSEEK |
| `3.9s` | 需要访问许可 —— 英文打字机逐字出现，按钮淡入 |
| `7.3s` | 身份资料确认 —— 访问姓名 **跃数**、权限 `ADMIN`、验证码逐字输入 |
| `9.9s` | 接收访问需求 |
| `10.9s` | 开始读取权限 —— 进度条 0.9 秒跑满 |
| `11.9s` | 读取完毕 · 核验通过 —— 圆环 1.5 秒画完 |
| `14.3s` | `WELCOME TO HARNESS OS` |
| `16.2s` | 淡出，进入主界面 |

---

> ### 🚀 跃数AI中转站 · 稳定运行中的千人 AI 中转站
>
> **一个 Key，接入 DeepSeek / GLM / Kimi / MiniMax 等主流模型。**
> 长期稳定 · 低延迟 · 不掉线 —— 写代码、跑 Agent、做翻译，一个地址全搞定。
>
> 👉 **[ys666.site](https://ys666.site)**

---

## 🚀 安装

### 方法一 · 把仓库地址丢给 AI（最省事）

复制下面这段话，发给任意 AI —— DSH 里的 AI、Claude、ChatGPT、Codex 都可以：

```text
帮我安装这个 DeepSeek Harness 皮肤：
https://gitee.com/leapai/deepseek-harness-plus.git

1. 克隆仓库到本地；
2. 运行仓库里的 install.ps1，装到 desktop profile；
3. 如果提示找不到 dsh，就搜索 resources\runtime\cli\bin\dsh.cmd，再用 -Dsh 参数重试；
4. 装完告诉我怎么重启 DSH 才能看到开机动画。
```

AI 会自己完成「克隆 → 找 dsh → 安装」，你只需要按它说的重启 DSH。

> 仓库根目录带了一份 [`AGENTS.md`](AGENTS.md)，专门写给 AI 看，它读完就知道该怎么做，不用你多解释。

### 方法二 · 双击安装（三步）

**① 下载仓库**

在仓库首页点绿色的 **「克隆/下载」→「下载 ZIP」**，解压到一个固定文件夹（例如 `D:\DSH皮肤\deepseek-harness-plus`）。

> ⚠️ 一定要先**解压**，不要在压缩包里直接双击运行。

**② 双击 `一键安装.bat`**

脚本会自动找到你的 DSH → 选择配置（profile）→ 安装。看到绿色的「安装完成」即成功。

**③ 完全退出 DSH，再重新打开**

关掉主窗口后，还要到右下角**系统托盘**右键图标退出，然后重新打开 —— 开机动画就会播放。

> 💡 不重启不生效，这是所有插件的通用规则。

### 方法三 · 命令行

```powershell
git clone https://gitee.com/leapai/deepseek-harness-plus.git
cd deepseek-harness-plus
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

常用参数：

```powershell
# 装到 web profile（浏览器里跑的那种）
.\install.ps1 -Profile web

# DSH 装在自定义 / 便携目录时，手动指定 dsh.cmd
.\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"
```

### 装不上？看这里

| 现象 | 原因 & 解决 |
| --- | --- |
| 双击后黑窗口一闪就没 | 手动跑一次就能看到原因：`powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1` |
| 提示「没找到 dsh 命令」 | DSH 装在非默认位置，用 `-Dsh "你的路径\resources\runtime\cli\bin\dsh.cmd"` 指定即可 |
| 装完没动画 | 99% 是没真正重启（托盘也要退），其次看设置里「启用开屏动画」是否打开 |

> `dsh.cmd` 在哪？就在你安装 DSH 的目录里，路径特征是 `…\resources\runtime\cli\bin\dsh.cmd`。

---

## 🎮 播放时怎么玩

| 操作 | 效果 |
| --- | --- |
| **点击屏幕** | 立即推进到下一幕 |
| **按 `Esc`** | 立刻结束开屏，进主界面 |
| 点右下角「跳过开屏 ESC」 | 同上 |
| 什么都不做 | 16 秒后自动结束 |

**只播一次**：同一个窗口里只播一次 —— F5 刷新、断线重连、界面热更新都不会重播；关掉 DSH 再打开才会再播。

想立刻再看一遍：「设置 → 开屏动画 → **立即重播**」。

---

## ⚙️ 设置

路径：DSH 里点 **设置 → 开屏动画**。

| 设置项 | 说明 | 建议 |
| --- | --- | --- |
| **启用开屏动画** | 总开关，关掉直接进主界面 | 演示开，嫌烦就关 |
| **播放声音** | 是否播背景音轨 | 办公室建议关 |
| **音量** | 0–100% | 60% 左右 |
| **开屏时全屏** | 开屏期间真全屏，播完恢复窗口 | 想沉浸就开 |
| **显示跳过提示** | 右下角「跳过开屏 ESC」；Logo 那一幕不显示 | 建议开 |
| **开屏长度** | **完整开屏**（约 16 秒）/ **仅 Logo**（约 4 秒） | 天天用建议「仅 Logo」 |
| **立即重播 / 恢复默认** | 预览整段动画 / 一键还原 | — |

设置保存在 `C:\Users\你的用户名\.dsh-whale-splash\config.json`，重启不丢。

---

## 🎵 换成自己的音乐

默认音轨是插件自带的合成氛围音（无版权问题）。换成自己的 BGM：

1. 把音频转成 **m4a**（格式工厂 / 剪映 / 在线转换都行），重命名为 **`splash.m4a`**；
2. 覆盖到（把 `你的用户名` 换成自己的）：

   ```
   C:\Users\你的用户名\.dsh\profiles\desktop\node_modules\dsh-whale-splash\assets\splash.m4a
   ```

   > 找不到 `.dsh`？它是隐藏文件夹，在资源管理器地址栏直接粘贴上面这行路径回车即可。

3. 重启 DSH 生效。

时长没有硬限制，但动画只有 16 秒，建议把高潮剪进前 16 秒。

---

## ✏️ 把「跃数」改成你自己的名字

开屏第三幕「身份资料确认」里的访问姓名默认是 **跃数**，改成你自己的名字很简单：

1. 用记事本 / VS Code 打开 `plugin\client.js`，搜索 `访问姓名`：

   ```js
   '<div class="k">访问姓名</div><div class="v">跃数</div>' +
   ```

2. 把 `跃数` 改成你的名字（2–6 个字最好看），保存；
3. 重新打包并重装：

   ```powershell
   cd "你的仓库目录"
   Copy-Item plugin -Destination package -Recurse
   tar -czf release\dsh-whale-splash-1.1.1.tgz package
   Remove-Item package -Recurse
   powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
   ```

   > 图快也可以直接改**已安装**的那份，不用重新打包：
   > `C:\Users\你的用户名\.dsh\profiles\desktop\node_modules\dsh-whale-splash\client.js`

4. 重启 DSH。

颜色、字号、文案同理 —— 全在 `plugin\client.js` 里（搜 `ws-title`、`ws-phase`、`injectCss`）。

---

## 🗑️ 卸载

```powershell
& "你的路径\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-whale-splash
```

然后在 DSH 里 **设置 → 插件** 确认 `dsh-whale-splash` 已消失；想彻底清净，再删掉配置文件夹 `C:\Users\你的用户名\.dsh-whale-splash`，重启即可。

---

## ❓ 常见问题

**Q：没有声音？**
检查设置里「播放声音」和音量；浏览器策略可能拦截自动播放，开屏后随便点一下屏幕声音就出来了。

**Q：每次等 16 秒太久了。**
设置里把「开屏长度」改成 **仅 Logo**（约 4 秒），或直接关掉；播放时随时按 `Esc`。

**Q：开屏变全屏会卡吗？**
播完自动恢复窗口，不会改变原来的窗口状态；不喜欢就关掉「开屏时全屏」。

**Q：会不会影响聊天记录 / 模型配置 / API Key？**
不会。皮肤只注册 3 个本地接口（音轨、设置、窗口效果），不联网、不读取会话内容。

**Q：macOS / Linux 能用吗？**
动画本体是网页实现，跨平台可用；一键脚本是 Windows PowerShell 写的。Mac 用户手动执行：

```bash
dsh plugin --profile desktop add "file:<仓库目录>/release/dsh-whale-splash-1.1.1.tgz"
```

**Q：更新了新版本？**
下载新仓库覆盖旧文件夹，重新双击 `一键安装.bat`（覆盖安装），重启 DSH。你的设置和自定义音乐不受影响。

---

## 📁 目录结构

```
deepseek-harness-plus/
├─ README.md                        ← 你正在看的这份说明
├─ CHANGELOG.md                     ← 更新日志
├─ AGENTS.md                        ← 写给 AI 的安装说明（丢给 AI 用）
├─ 一键安装.bat                      ← 小白双击这个
├─ install.ps1                      ← 安装脚本（支持官方版 / 便携版）
├─ docs/preview.png                 ← 开屏四幕效果预览
├─ release/
│  └─ dsh-whale-splash-1.1.1.tgz    ← 打包好的皮肤
└─ plugin/                          ← 源码（想改就改这里）
   ├─ package.json                  ← 皮肤声明：bundle patch + 浏览器端入口
   ├─ index.js                      ← 宿主端：音轨 / 设置 / 窗口效果
   ├─ client.js                     ← 浏览器端：七幕动画、HUD、打字机、设置页
   ├─ cordis.patch.yml              ← 把 whale-splash 挂进 DSH 配置树
   └─ assets/                       ← 音轨、鲸鱼图形、版权说明
```

---

<div align="center">

## 📄 关于

作者 **抖音 @孤影**　·　皮肤代码 [MIT](LICENSE) 开源，欢迎二改　·　版本变更见 [CHANGELOG.md](CHANGELOG.md)

感谢 **[跃数AI中转站 · ys666.site](https://ys666.site)** 对本项目的支持

鲸鱼图形取自 DeepSeek 官方标志（品牌标识），本项目与深度求索官方无关，不代表官方立场

**如果这个皮肤让你每次打开 DSH 都心情不错，去抖音点个关注吧 ✨**

</div>
