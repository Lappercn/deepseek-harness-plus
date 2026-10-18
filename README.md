# DeepSeek Harness Plus · 跃数AI 增强包

> 给 **DeepSeek Harness（简称 DSH）** 装上一段电影级的开机动画：打开软件先过一遍「HARNESS OS 开机自检」，鲸鱼标志亮起 → 验证访问权限 → 确认身份 → 读取进度条 → 核验通过 → `WELCOME TO HARNESS OS`，然后才进入主界面。
>
> **作者：抖音 @孤影**
> **赞助：跃数AI中转站 · [ys666.site](https://ys666.site)**

---

## 📢 广告位

> 🚀 **跃数AI中转站 · [ys666.site](https://ys666.site)**
> 一个 Key 打通 DeepSeek、GLM、Kimi、MiniMax 等主流大模型，写代码、跑 Agent、做翻译一个地址全搞定。
> —— 本项目的技术支持与中转服务由「跃数AI」提供。

---

## 目录

- [一、这是什么](#一这是什么)
- [二、装之前要准备什么](#二装之前要准备什么)
- [三、安装（小白版，3 步）](#三安装小白版3-步)
- [四、安装（进阶版，一行命令）](#四安装进阶版一行命令)
- [五、装好之后怎么玩](#五装好之后怎么玩)
- [六、设置项说明](#六设置项说明)
- [七、换掉开屏音乐](#七换掉开屏音乐)
- [八、把「跃数」改成你自己的名字](#八把跃数改成你自己的名字)
- [九、卸载](#九卸载)
- [十、常见问题 FAQ](#十常见问题-faq)
- [十一、目录结构](#十一目录结构)
- [十二、关于作者 / 声明 / 更新日志](#十二关于作者--声明--更新日志)

---

## 一、这是什么

一个 **DSH 插件**（不是独立软件，不能单独运行）。装进 DSH 以后，每次你打开 DSH，会先播一段大约 **16 秒** 的开机过场动画：

| 时间 | 画面 |
| --- | --- |
| 0.5s | 🐳 鲸鱼 Logo 浮现，`深度求索 / DEEPSEEK` |
| 3.9s | `需要访问许可` —— 英文打字机逐字出现，按钮淡入 |
| 7.3s | `身份资料确认` —— 访问姓名 **跃数**、权限 `ADMIN`、验证码逐字输入 |
| 9.9s | `接收访问需求` |
| 10.9s | `开始读取权限` —— 进度条 0.9 秒跑满 |
| 11.9s | `读取完毕 · 核验通过` —— 圆环 1.5 秒画完 |
| 14.3s | `WELCOME TO HARNESS OS` |
| 16.2s | 淡出，进入 DSH 主界面 |

细节：黑底 HUD、四角边框、等宽小字、打字机英文、读取条、核验圆环、背景音轨；开屏期间会自动全屏并隐藏右上角那几个白色窗口按钮，播完自动恢复。

---

## 二、装之前要准备什么

1. **已经装好 DeepSeek Harness（DSH）桌面版**，并且能正常打开。
   - 官方默认安装在 `C:\Users\你的用户名\AppData\Local\Programs\...`
   - **便携版 / 绿色版也支持**（比如整个文件夹放在 `D:\deepseek`），安装脚本会自动去找。
2. **Windows 10 / 11**。安装脚本用的是 PowerShell（系统自带，不用另装任何东西）。
3. 本插件**不需要**联网安装依赖，也不需要 Node.js。

> ⚠️ 说明：卸载、重装、换版本都不会动你的聊天记录和账号信息。插件只往 DSH 里加 3 个本地接口（音轨、设置、窗口效果），不联网、不上传任何数据。

---

## 三、安装（小白版，3 步）

### 第 1 步：把仓库下载到本地

任选一种，**推荐第一种**：

- **方式 A（不用装 git）**：在仓库首页点绿色的 **「克隆/下载」→「下载 ZIP」**，下载后解压到一个固定的文件夹（例如 `D:\DSH插件\deepseek-harness-plus`）。
  > 不要直接在压缩包里双击运行！一定要先**解压**。
- **方式 B（会用 git 的）**：

  ```bash
  git clone https://gitee.com/leapai/deepseek-harness-plus.git
  ```

### 第 2 步：双击「一键安装.bat」

在解压出来的文件夹里找到 **`一键安装.bat`**，双击它。

- 会弹出一个黑色窗口，自动做三件事：找到你的 DSH → 选择要装的配置（profile）→ 把插件装进去。
- 看到绿色的 **「安装完成」** 就成功了，按任意键关掉窗口。

### 第 3 步：完全退出 DSH，再重新打开

- **不是最小化！** 要真的退出：关掉主窗口后，再到右下角**系统托盘**里右键 DSH 图标 → 退出。
- 然后重新打开 DSH —— 开机动画就会播了。

> 💡 装完不重启是不会生效的，这是插件类修改的通用规则。

### 如果双击没反应 / 一闪就没了

说明脚本没能自动找到你的 DSH，或者窗口关得太快。请手动打开 PowerShell 运行一次，就能看到具体原因：

```powershell
cd "D:\DSH插件\deepseek-harness-plus"
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

如果提示「没找到 dsh 命令」，就把 DSH 的 `dsh.cmd` 路径直接告诉它：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "D:\deepseek\resources\runtime\cli\bin\dsh.cmd"
```

> `dsh.cmd` 在哪里？就在你安装 DSH 的那个文件夹里，特征是路径长得像
> `…\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd`。
> 便携版的话，就是你放 `DeepSeek Harness.exe` 那个目录下的 `resources\runtime\cli\bin\dsh.cmd`。

---

## 四、安装（进阶版，一行命令）

已经装好 git、也知道自己 DSH 在哪的用户，直接：

```powershell
git clone https://gitee.com/leapai/deepseek-harness-plus.git
cd deepseek-harness-plus
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

或者干脆只用 DSH 自带命令（把 `<仓库目录>` 换成你的实际路径）：

```powershell
# 找到你自己的 dsh.cmd，然后：
& "D:\deepseek\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add "file:<仓库目录>/release/dsh-whale-splash-1.1.1.tgz"
```

- `--profile desktop`：装给**桌面应用**用（绝大多数人都用这个）。
- `--profile web`：装给 `dsh web`（浏览器里跑的那种）用。
- 不想用脚本、想装到别处：把 `desktop` 换成对应的 profile 名即可。

---

## 五、装好之后怎么玩

| 操作 | 效果 |
| --- | --- |
| 打开 DSH | 自动播完整开屏（约 16 秒） |
| **点击屏幕任意位置** | 立即推进到下一幕 |
| **按 `Esc`** | 立刻结束开屏，进主界面 |
| 点右下角「**跳过开屏 ESC**」 | 同上 |
| 什么也不做 | 16 秒后自动结束 |

**只播一次**：同一个窗口里只播一次，按 F5 刷新、断线重连、界面热更新都**不会**让它重播；关掉 DSH 再打开才会再播。

想立刻再看一遍？→ 「设置 → 开屏动画 → **立即重播**」。

---

## 六、设置项说明

路径：DSH 里点 **设置 → 开屏动画**（和换主题、换模型在同一个设置页里）。

| 设置项 | 说明 | 建议 |
| --- | --- | --- |
| **启用开屏动画** | 总开关，关掉就直接进主界面 | 演示时开，嫌烦就关 |
| **播放声音** | 是否播背景音轨 | 办公室建议关 |
| **音量** | 0–100% | 60% 左右 |
| **开屏时全屏** | 开屏期间真正全屏，右上角白色按钮消失，播完恢复窗口 | 想沉浸就开 |
| **显示跳过提示** | 右下角「跳过开屏 ESC」提示；Logo 那一幕不显示 | 建议开 |
| **开屏长度** | **完整开屏**（约 16 秒）/ **仅 Logo**（约 4 秒） | 天天用建议「仅 Logo」 |
| **立即重播** | 马上预览一遍整段动画 | — |
| **恢复默认** | 全部恢复默认值 | — |

设置会保存在 `C:\Users\你的用户名\.dsh-whale-splash\config.json`，重启不丢。

> 小贴士：动画播到一半想改设置，直接按 `Esc` 跳过就行，不用等它播完。

---

## 七、换掉开屏音乐

默认音轨是插件自带的合成氛围音（无版权问题）。想换成自己的 BGM：

1. 把任意音频转成 **m4a** 格式（手机录的 mp3 也行，用格式工厂 / 剪映 / 在线转换都行）。
2. 重命名为 **`splash.m4a`**。
3. 覆盖到这个位置（`你的用户名` 换成自己的）：

   ```
   C:\Users\你的用户名\.dsh\profiles\desktop\node_modules\dsh-whale-splash\assets\splash.m4a
   ```

   > 找不到 `.dsh`？这是隐藏文件夹：在文件资源管理器地址栏直接输入 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-whale-splash\assets` 回车即可。
4. 重启 DSH 生效。

时长没有硬限制，但动画只有 16 秒，建议把高潮部分剪到前 16 秒内。

---

## 八、把「跃数」改成你自己的名字

开屏第三幕 `身份资料确认` 里有一行「访问姓名：**跃数**」。这行字在源码里，改起来很简单：

1. 用记事本 / VS Code 打开 `plugin\client.js`。
2. 搜索 `访问姓名`，你会看到这一行：

   ```js
   '<div class="k">访问姓名</div><div class="v">跃数</div>' +
   ```

3. 把 `跃数` 改成你想要的名字（2–6 个字最好看），保存。

改完之后有两种生效方式，**推荐第一种（最快）**：

- **方式 A：直接改已安装的那份**（不用重新打包）

  ```
  C:\Users\你的用户名\.dsh\profiles\desktop\node_modules\dsh-whale-splash\client.js
  ```

  同样搜索 `访问姓名`，把 `跃数` 换成你的名字，保存，**重启 DSH** 即可。

- **方式 B：改源码后重新打包，再重装**

  ```powershell
  cd "D:\DSH插件\deepseek-harness-plus"
  # 打包要求压缩包内顶层目录名必须是 package
  Copy-Item plugin -Destination package -Recurse
  tar -czf release\dsh-whale-splash-1.1.1.tgz package
  Remove-Item package -Recurse
  # 然后重新运行一键安装
  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
  ```

  最后别忘了重启 DSH。

---

## 九、卸载

**方法 A（推荐）**：在 DSH 里 **设置 → 插件**，找到 `dsh-whale-splash`，点移除/卸载，然后重启 DSH。

**方法 B（命令行）**：

```powershell
& "D:\deepseek\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-whale-splash
```

（路径换成你自己的 `dsh.cmd`）

**方法 C（彻底清净）**：上面任一方法执行完，再删掉配置文件夹：

```
C:\Users\你的用户名\.dsh-whale-splash
```

重启 DSH，就完全恢复到装之前的样子了。

---

## 十、常见问题 FAQ

**Q1：装完打开 DSH，还是直接进主界面，没有动画？**
- 90% 是**没真正重启**：关窗口 ≠ 退出，请到系统托盘右键图标退出后再开。
- 其次检查 **设置 → 开屏动画 → 启用开屏动画** 是不是被关掉了。
- 再确认装的是不是当前在用的那个 profile（桌面版一般是 `desktop`）。

**Q2：提示「没找到 dsh 命令」怎么办？**
你的 DSH 装在非默认位置（比如便携版 `D:\deepseek`）。用参数指定即可：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Dsh "你的路径\resources\runtime\cli\bin\dsh.cmd"
```

**Q3：黑窗口一闪就关了，什么也看不到？**
右键 `install.ps1` → 「使用 PowerShell 运行」，或者按[第三节](#如果双击没反应--一闪就没了)的方法在 PowerShell 里手动跑，就能看到报错。

**Q4：没有声音？**
- 检查设置里「播放声音」是否开启、音量是否 0。
- Windows 上某些浏览器策略会拦截自动播放：开屏后随便点一下屏幕，声音就出来了。
- 桌面版一般可以直接播。

**Q5：动画太长了，每次都要等 16 秒。**
设置里把「开屏长度」改成 **仅 Logo**（约 4 秒），或者直接关掉。播放时随时可以按 `Esc`。

**Q6：开屏时电脑变全屏了，会卡吗？**
播完自动恢复窗口，不会改变你原来的窗口状态。不喜欢就在设置里关掉「开屏时全屏」。

**Q7：会不会影响我的聊天记录、模型配置、API Key？**
不会。插件只注册了 3 个本地接口：`/whale-splash/audio`（发音轨）、`/whale-splash/settings`（存设置）、`/whale-splash/window`（开屏全屏效果），不联网、不读取你的会话内容。

**Q8：macOS / Linux 能用吗？**
动画本体是网页实现的，跨平台没问题；但一键安装脚本是按 Windows 的 PowerShell 写的。Mac 用户可以手动执行：

```bash
dsh plugin --profile desktop add "file:<仓库目录>/release/dsh-whale-splash-1.1.1.tgz"
```

**Q9：更新了新版本怎么办？**
下载新仓库覆盖旧文件夹，重新双击 `一键安装.bat` 即可（会覆盖安装），然后重启 DSH。你的设置和自定义音乐不会被覆盖（除非你改的是插件目录里的文件）。

**Q10：能不能只改颜色 / 字号 / 文案？**
可以。开屏的 HTML 和样式全在 `plugin\client.js` 里（搜 `ws-title`、`ws-phase`、`injectCss` 就能找到），改完重启 DSH 生效。玩坏了就重新下载仓库再装一次。

---

## 十一、目录结构

```
deepseek-harness-plus/
├─ README.md                       ← 你正在看的这份教程
├─ 一键安装.bat                     ← 小白双击这个
├─ install.ps1                     ← 实际干活的安装脚本（支持便携版）
├─ release/
│  └─ dsh-whale-splash-1.1.1.tgz   ← 打包好的插件（安装用的就是它）
├─ plugin/                         ← 插件源码（想改就改这里）
│  ├─ package.json                 ← 插件声明：bundle patch + 浏览器端入口
│  ├─ index.js                     ← 宿主端：音轨 / 设置 / 窗口效果 三个接口
│  ├─ client.js                    ← 浏览器端：动画七幕、HUD、打字机、设置页
│  ├─ cordis.patch.yml             ← 往 DSH 配置树里插入 whale-splash 插件
│  └─ assets/
│     ├─ splash.m4a                ← 开屏音轨（可替换）
│     ├─ whale.svg / whale-path.txt← 鲸鱼图形（DeepSeek 官方标志）
│     └─ NOTICE.md                 ← 素材版权说明
└─ LICENSE                         ← MIT
```

---

## 十二、关于作者 / 声明 / 更新日志

### 作者

**抖音 @孤影** —— 有问题、想看更多 DSH 玩法，来抖音找我。

### 赞助 / 技术支持

**跃数AI中转站 · [ys666.site](https://ys666.site)** —— DeepSeek、GLM、Kimi、MiniMax 等主流模型 API 一站式接入。

### 声明

- 鲸鱼图形取自 **DeepSeek 官方标志**（品牌标识），本插件仅作个人开屏动画使用，与深度求索官方无关，不代表官方立场。
- 插件代码以 **MIT** 协议开源，可自由修改、二次分发，请保留作者署名。
- 使用本插件造成的任何问题请自行评估，作者不承担连带责任。

### 更新日志

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| 1.1.1 | 2026-10-18 | 开屏「访问姓名」改为「跃数」；设置页加入作者与赞助信息；安装脚本支持便携版 DSH 自动探测 |
| 1.1.0 | — | 朋友分享版：七幕过场、音轨、全屏与窗口按钮处理、完整设置面板 |
