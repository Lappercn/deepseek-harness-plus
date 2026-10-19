/**
 * dsh-whale-splash — 浏览器端（Client half）。
 *
 * 按视频逐帧还原的开屏过场（HARNESS OS 开机动画）：
 *   鲸鱼 Logo 淡入 → 需要访问许可 → 身份资料确认 → 接收访问需求
 *   → 开始读取权限 → 读取完毕·核验通过 → 淡出进入 DSH 界面。
 *
 *  - 搭配 HUD 四角、等宽小字、打字机英文、读取进度与核验圆环；
 *  - 声音用插件自带 assets/splash.m4a（从参考视频抽出的音轨，可替换）；
 *  - 点击屏幕推进下一幕，Esc 或「跳过开屏」立即结束；
 *  - 设置存 ~/.dsh-whale-splash/config.json，localStorage 兜底。
 */
window.__ModuleLoader__.load({
  id: "dsh-whale-splash",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const h = React.createElement;

    const STYLE_ID = "dsh-whale-splash-style";
    const STORAGE_KEY = "dsh-whale-splash:settings";
    const AUDIO_URL = "/whale-splash/audio";
    const SETTINGS_URL = "/whale-splash/settings";

    const DEFAULTS = {
      enabled: true,
      mode: "full", // full = 完整过场 / 视频; logo = 仅Logo
      theme: "red_eyes", // red_eyes | blue_eyes | default | custom
      fullscreen: true,
      sound: true,
      volume: 0.75,
      showHint: true,
      customText: "跃数AI",
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function normalizeSettings(input, base) {
      const src = input && typeof input === "object" ? input : {};
      const merged = Object.assign({}, DEFAULTS, base || {});
      return {
        enabled: typeof src.enabled === "boolean" ? src.enabled : merged.enabled,
        mode: ["logo", "full", "video"].includes(src.mode) ? src.mode : merged.mode,
        theme: typeof src.theme === "string" && src.theme ? src.theme : (merged.theme || "red_eyes"),
        fullscreen: typeof src.fullscreen === "boolean" ? src.fullscreen : merged.fullscreen,
        sound: typeof src.sound === "boolean" ? src.sound : merged.sound,
        volume: clamp(Number(src.volume) || 0, 0, 1) || merged.volume,
        showHint: typeof src.showHint === "boolean" ? src.showHint : merged.showHint,
        customText: typeof src.customText === "string" ? src.customText.trim() : (merged.customText || "跃数AI"),
      };
    }

    function readLocal() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? normalizeSettings(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    }

    function writeLocal(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        /* 忽略 */
      }
    }

    let settings = normalizeSettings(readLocal() || DEFAULTS);
    const listeners = new Set();

    function notify() {
      for (const fn of listeners) {
        try {
          fn(settings);
        } catch {
          /* 忽略单个订阅者异常 */
        }
      }
    }

    async function persistRemote(value) {
      try {
        await fetch(SETTINGS_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
      } catch {
        /* 宿主不可用：localStorage 已保存 */
      }
    }

    async function fetchRemote(timeoutMs) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(SETTINGS_URL, { cache: "no-store", signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        settings = normalizeSettings(await res.json(), settings);
        writeLocal(settings);
        notify();
      } catch {
        /* 用本地设置 */
      }
      return settings;
    }

    function updateSettings(patch, persist) {
      settings = normalizeSettings(Object.assign({}, settings, patch), settings);
      writeLocal(settings);
      notify();
      if (persist !== false) void persistRemote(settings);
      return settings;
    }

    // ── 音轨预加载 ──────────────────────────────────────────────────────────────
    // 插件一加载就开始拉音轨，别等动画开场才请求——否则声音会比画面晚半秒。
    let audioEl = null;
    function primeAudio(volume) {
      if (typeof Audio === "undefined") return null;
      if (!audioEl) {
        audioEl = new Audio(AUDIO_URL);
        audioEl.preload = "auto";
        audioEl.load();
      }
      audioEl.volume = clamp(Number(volume) || 0, 0, 1);
      return audioEl;
    }

    // 官方 DeepSeek 鲸鱼标志路径（viewBox 0 0 532 339，MIT，见 assets/NOTICE.md）
    const WHALE_D = "M55.6128,3.4712c-.5953-.2917-.8517.2642-1.1998.5466-.1191.0911-.2198.2095-.3206.3188-.8701.9292-1.8867,1.5398-3.2148,1.4668-1.9417-.1094-3.5995.5012-5.065,1.9863-.3114-1.8313-1.3463-2.9248-2.9217-3.6262-.8242-.3645-1.6577-.729-2.2348-1.5217-.403-.5647-.5129-1.1934-.7144-1.813-.1283-.3735-.2565-.7563-.687-.8201-.4671-.0728-.6503.3188-.8335.647-.7327,1.3394-1.0166,2.8154-.9892,4.3096.0641,3.3621,1.4838,6.0406,4.3047,7.9449.3206.2187.403.4372.3023.7563-.1924.656-.4214,1.2937-.6228,1.9497-.1283.4192-.3207.5103-.7694.3279-1.5479-.6467-2.8852-1.6035-4.0667-2.7605-2.0058-1.9407-3.8193-4.0818-6.0815-5.7583-.5312-.3918-1.0625-.7561-1.6121-1.1025-2.3081-2.2412.3023-4.0818.9068-4.3003.6319-.2278.2198-1.0115-1.8227-1.0022-2.0425.009-3.9109.6924-6.2922,1.6035-.348.1367-.7145.2368-1.09.3188-2.1615-.4099-4.4055-.5012-6.7502-.2368-4.4147.4919-7.9408,2.5784-10.5328,6.1409C.1914,13.1289-.5413,17.9941.3563,23.0691c.9434,5.3481,3.6727,9.7761,7.8676,13.2385,4.3506,3.5896,9.3606,5.3481,15.0758,5.011,3.4713-.2004,7.3364-.665,11.6961-4.355,1.099.5467,2.2531.7652,4.1674.9292,1.4746.1367,2.8943-.0728,3.9933-.3005,1.7219-.3645,1.6029-1.959.9801-2.2505-5.0466-2.3506-3.9385-1.394-4.9459-2.1685,2.5645-3.0339,6.4297-6.1865,7.9409-16.4001.119-.8108.0183-1.3211,0-1.9771-.0092-.4008.0824-.5556.5404-.6013,1.2639-.1458,2.4912-.4919,3.6178-1.1115,3.2698-1.7857,4.5886-4.7195,4.9-8.2364.0459-.5376-.0091-1.0935-.577-1.3757ZM27.119,35.123c-4.8909-3.8447-7.263-5.1113-8.2431-5.0566-.9159.0547-.751,1.1025-.5496,1.7859.2107.6741.4855,1.1389.8701,1.731.2656.3918.4489.9748-.2655,1.4123-1.5754.9749-4.314-.3281-4.4423-.3918-3.1872-1.877-5.8525-4.3553-7.7302-7.7444-1.8135-3.262-2.8667-6.7605-3.0408-10.4961-.0458-.9019.2198-1.221,1.1174-1.3848,1.1815-.2187,2.3997-.2644,3.5812-.0913,4.9918.729,9.2415,2.9612,12.8043,6.4963,2.0333,2.0135,3.572,4.419,5.1566,6.7696,1.6852,2.4963,3.4987,4.8745,5.8068,6.8242.8151.6833,1.4654,1.2026,2.0882,1.5854-1.8775.2095-5.01.2552-7.1532-1.4397ZM29.4637,20.0442c0-.4009.3206-.7197.7237-.7197.0916,0,.174.018.2473.0453.1008.0366.1924.0913.2656.1731.1283.1277.2015.3098.2015.5012,0,.4009-.3205.7197-.7234.7197s-.7145-.3188-.7145-.7197ZM36.7452,23.7798c-.4671.1914-.9342.3552-1.383.3735-.6961.0364-1.4563-.2461-1.8684-.5923-.6411-.5376-1.0991-.8381-1.2914-1.7766-.0825-.4009-.0367-1.0205.0367-1.3757.1648-.7654-.0184-1.2573-.5587-1.7039-.4397-.3645-.9984-.4646-1.6121-.4646-.229,0-.4395-.1003-.5953-.1823-.2565-.1275-.467-.4464-.2656-.8382.0641-.1274.3756-.4373.4489-.4919.8335-.4739,1.7952-.3189,2.6836.0364.8244.3371,1.4472.9567,2.3447,1.8313.9159,1.0568,1.0807,1.3486,1.6028,2.1411.4123.6196.7878,1.2573,1.0442,1.9863.1557.4556-.0458.8291-.5862,1.0569Z";
    const WHALE_VIEW = { w: 56.2, h: 41.36 };

    function whaleSvg(className) {
      return (
        '<svg class="' + className + '" viewBox="0 0 ' + WHALE_VIEW.w + " " + WHALE_VIEW.h + '" aria-hidden="true">' +
        '<path d="' + WHALE_D + '" fill="currentColor" fill-rule="evenodd"></path></svg>'
      );
    }

    // ── 样式 ────────────────────────────────────────────────────────────────────
    const CSS = `
      /* 视频开机动画全屏容器 */
      .ws-video-wrap {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: #000; overflow: hidden;
      }
      .ws-video-media {
        width: 100%; height: 100%;
        object-fit: cover;
        background: #000;
      }

      .ws-cine {
        position: fixed; inset: 0; z-index: 2147483600;
        background: #000; color: #e8f0f8;
        overflow: hidden;
        font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
        opacity: 1; transition: opacity 520ms ease;
        cursor: default; user-select: none; -webkit-user-select: none;
      }
      .ws-cine.ws-out { opacity: 0; pointer-events: none; }

      /* 背景：极淡网格 + 中心冷光 + 扫描线 */
      .ws-grid {
        position: absolute; inset: 0; opacity: 0.5;
        background-image:
          linear-gradient(to right, rgba(120, 170, 220, 0.055) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(120, 170, 220, 0.045) 1px, transparent 1px);
        background-size: 96px 96px, 96px 96px;
        -webkit-mask-image: radial-gradient(70% 60% at 50% 48%, #000 20%, transparent 100%);
        mask-image: radial-gradient(70% 60% at 50% 48%, #000 20%, transparent 100%);
      }
      .ws-glow { position: absolute; inset: 0; background: radial-gradient(46% 38% at 50% 46%, rgba(70, 130, 200, 0.16) 0%, rgba(0, 0, 0, 0) 70%); }
      .ws-scan {
        position: absolute; inset: 0; opacity: 0.35; pointer-events: none;
        background: repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, rgba(0,0,0,0) 1px 3px);
        animation: ws-flicker 7s ease-in-out infinite;
      }
      @keyframes ws-flicker { 0%,100% { opacity: 0.3; } 47% { opacity: 0.38; } 48% { opacity: 0.22; } 49% { opacity: 0.36; } }

      .ws-corner { position: absolute; width: 26px; height: 26px; border-color: rgba(210, 228, 245, 0.38); border-style: solid; border-width: 0; }
      .ws-corner.tl { top: 20px; left: 22px; border-top-width: 1px; border-left-width: 1px; }
      .ws-corner.tr { top: 20px; right: 22px; border-top-width: 1px; border-right-width: 1px; }
      .ws-corner.bl { bottom: 20px; left: 22px; border-bottom-width: 1px; border-left-width: 1px; }
      .ws-corner.br { bottom: 20px; right: 22px; border-bottom-width: 1px; border-right-width: 1px; }

      .ws-hud-top {
        position: absolute; top: 26px; left: 34px; right: 34px;
        display: flex; justify-content: space-between; align-items: flex-start;
        color: rgba(232, 240, 248, 0.86);
      }
      .ws-brand-main { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; color: #fff; }
      .ws-brand-cn { margin-top: 4px; font-size: 8.5px; letter-spacing: 0.16em; color: rgba(210, 228, 245, 0.55); }
      .ws-brand-os { margin-top: 2px; font-size: 15px; font-weight: 600; letter-spacing: 0.32em; color: #fff; }
      .ws-hud-right { text-align: right; font-family: Consolas, "SFMono-Regular", Menlo, monospace; font-size: 8px; line-height: 1.9; letter-spacing: 0.12em; color: rgba(200, 220, 240, 0.45); }

      .ws-hud-bottom {
        position: absolute; left: 34px; right: 34px; bottom: 26px;
        display: flex; justify-content: space-between; align-items: flex-end;
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 8px; letter-spacing: 0.14em; color: rgba(200, 220, 240, 0.42);
        white-space: pre;
      }
      .ws-hud-bottom .mid { text-align: center; letter-spacing: 0.22em; color: rgba(215, 232, 248, 0.6); }
      .ws-hud-bottom .right { text-align: right; }

      .ws-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
      .ws-phase {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 0; opacity: 0; transition: opacity 480ms ease; pointer-events: none;
      }
      .ws-phase.is-on { opacity: 1; }
      .ws-title {
        font-size: clamp(21px, 2.1vw, 30px); font-weight: 600;
        letter-spacing: 0.42em; text-indent: 0.42em; color: #f4f8fc;
        text-shadow: 0 0 22px rgba(140, 190, 240, 0.18);
      }
      .ws-sub {
        margin-top: 12px; min-height: 15px;
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 9.5px; letter-spacing: 0.26em; text-transform: uppercase;
        color: rgba(200, 222, 245, 0.62);
        padding-left: 0.26em;
      }
      .ws-rule {
        width: min(430px, 48vw); height: 1px; margin: 18px 0 16px;
        background: linear-gradient(90deg, transparent, rgba(220, 235, 250, 0.35), transparent);
        transform: scaleX(0); transition: transform 700ms ease;
      }
      .ws-phase.is-on .ws-rule { transform: scaleX(1); }
      .ws-meta {
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 8.5px; letter-spacing: 0.18em; color: rgba(190, 214, 238, 0.42);
        text-align: center; line-height: 1.9; white-space: pre-wrap;
      }
      .ws-btn {
        margin-top: 20px; padding: 9px 22px;
        border: 1px solid rgba(220, 236, 250, 0.45);
        background: rgba(255, 255, 255, 0.02);
        color: #eef5fb; font-size: 9.5px; letter-spacing: 0.3em; text-indent: 0.3em;
        cursor: pointer; transition: background 180ms ease, border-color 180ms ease;
        font-family: inherit;
      }
      .ws-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(235, 245, 255, 0.8); }
      .ws-btn small {
        display: block; margin-top: 5px;
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 7px; letter-spacing: 0.22em; color: rgba(200, 220, 240, 0.5);
      }

      .ws-lockup { display: flex; flex-direction: column; align-items: center; }
      .ws-mark { width: clamp(78px, 7vw, 108px); height: auto; color: #fff; filter: drop-shadow(0 0 26px rgba(130, 195, 255, 0.22)); }
      .ws-lockup .ws-cn { margin-top: 18px; font-size: clamp(19px, 1.95vw, 26px); font-weight: 600; letter-spacing: 0.5em; text-indent: 0.5em; }
      .ws-lockup .ws-en {
        margin-top: 7px; font-family: "Helvetica Neue", Arial, "Segoe UI", sans-serif;
        font-size: clamp(9px, 0.82vw, 11px); font-weight: 500;
        letter-spacing: 0.66em; text-indent: 0.66em; color: rgba(255,255,255,0.82);
      }
      .ws-dots { margin-top: 14px; display: flex; gap: 6px; height: 5px; }
      .ws-dots i { width: 4px; height: 4px; border-radius: 50%; background: #fff; opacity: 0.22; animation: ws-dot 1.25s ease-in-out infinite; }
      .ws-dots i:nth-child(2) { animation-delay: 0.18s; }
      .ws-dots i:nth-child(3) { animation-delay: 0.36s; }
      @keyframes ws-dot { 0%,100% { opacity: 0.2; transform: translateY(0); } 50% { opacity: 0.95; transform: translateY(-2px); } }
      .ws-phase[data-phase="logo"] .ws-lockup { opacity: 0; transform: scale(1.04) translateY(6px); filter: blur(7px) brightness(0.35); }
      .ws-phase[data-phase="logo"].is-on .ws-lockup { animation: ws-lockup-in 1050ms cubic-bezier(.18,.72,.24,1) 80ms forwards; }
      @keyframes ws-lockup-in {
        0% { opacity: 0; transform: scale(1.04) translateY(6px); filter: blur(7px) brightness(0.35); }
        55% { opacity: 1; filter: blur(1px) brightness(1.06); }
        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1); }
      }

      .ws-form {
        display: grid; grid-template-columns: auto auto; column-gap: 34px; row-gap: 9px;
        margin-top: 4px;
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 10px; letter-spacing: 0.16em;
      }
      .ws-form .k { color: rgba(180, 205, 230, 0.5); }
      .ws-form .v { color: #eaf3fb; }
      .ws-form .v.accent { color: #8fd6ff; }

      .ws-mini { width: 58px; height: auto; color: #fff; opacity: 0.9; margin-bottom: 14px; }

      .ws-bar { width: min(360px, 44vw); height: 2px; margin-top: 18px; background: rgba(220, 235, 250, 0.16); overflow: hidden; }
      .ws-bar span { display: block; height: 100%; width: 0; background: #dfeaf6; }
      .ws-phase[data-phase="read"].is-on .ws-bar span { animation: ws-bar-fill 3.1s cubic-bezier(.3,.6,.4,1) forwards; }
      @keyframes ws-bar-fill { from { width: 0; } to { width: 100%; } }
      .ws-pct { margin-top: 9px; font-family: Consolas, monospace; font-size: 8.5px; letter-spacing: 0.22em; color: rgba(200, 222, 245, 0.5); }

      .ws-verify { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
      .ws-verify svg.ws-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
      .ws-verify circle { fill: none; stroke: rgba(220, 238, 252, 0.85); stroke-width: 1; stroke-dasharray: 339; stroke-dashoffset: 339; }
      .ws-phase[data-phase="done"].is-on .ws-verify circle { animation: ws-ring 1500ms ease-out 120ms forwards; }
      @keyframes ws-ring { to { stroke-dashoffset: 0; } }
      .ws-verify .ws-mark { width: 46px; filter: none; }

      .ws-skip {
        position: absolute; right: 36px; bottom: 58px;
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 8.5px; letter-spacing: 0.2em;
        color: rgba(200, 220, 240, 0.45);
        border: 0; background: transparent; cursor: pointer; padding: 4px;
      }
      .ws-skip:hover { color: rgba(235, 245, 255, 0.85); }

      @media (prefers-reduced-motion: reduce) {
        .ws-phase[data-phase="logo"].is-on .ws-lockup { animation-duration: 1ms; }
        .ws-dots i { animation: none; opacity: 0.6; }
        .ws-rule { transition: none; transform: scaleX(1); }
        .ws-cine { transition-duration: 200ms; }
      }

      /* ── 对照参考视频的第二版比例修正：中心内容放大，HUD 按幕显隐 ── */
      .ws-cine .ws-hud-top, .ws-cine .ws-hud-bottom, .ws-cine .ws-corner { transition: opacity 700ms ease; }
      .ws-cine[data-hud="off"] .ws-hud-top,
      .ws-cine[data-hud="off"] .ws-hud-bottom,
      .ws-cine[data-hud="off"] .ws-corner,
      .ws-cine[data-hud="off"] .ws-hud-status { opacity: 0; }
      .ws-brand-main { font-size: 15px; }
      .ws-brand-cn { font-size: 10px; }
      .ws-brand-os { font-size: 19px; }
      .ws-hud-right { font-size: 9.5px; }
      .ws-hud-bottom { font-size: 9.5px; }
      .ws-corner { width: 34px; height: 34px; }
      .ws-hud-status {
        position: absolute; top: 104px; left: 34px;
        display: flex; align-items: center; gap: 10px;
        font-family: Consolas, "SFMono-Regular", Menlo, monospace;
        font-size: 9px; letter-spacing: 0.18em; color: rgba(200, 220, 240, 0.42);
        transition: opacity 700ms ease;
      }
      .ws-hud-status .dot {
        width: 5px; height: 5px; border-radius: 50%; background: #ff5b6e;
        box-shadow: 0 0 8px rgba(255, 90, 110, 0.85);
        animation: ws-red 2.4s ease-in-out infinite;
      }
      @keyframes ws-red { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }

      .ws-title { font-size: clamp(30px, 3vw, 44px); letter-spacing: 0.38em; text-indent: 0.38em; }
      .ws-sub { font-size: clamp(11px, 1vw, 14px); letter-spacing: 0.3em; }
      .ws-meta { font-size: 10px; letter-spacing: 0.2em; }
      .ws-rule { width: min(520px, 56vw); margin: 20px 0 18px; }
      .ws-btn {
        font-size: 12px; padding: 10px 24px;
        display: inline-flex; align-items: baseline; gap: 10px;
      }
      .ws-btn small { display: inline; margin: 0; font-size: 8.5px; letter-spacing: 0.22em; }
      .ws-form {
        font-size: 12px; column-gap: 40px; row-gap: 0;
        border-top: 1px solid rgba(210, 228, 245, 0.12);
      }
      .ws-form .k, .ws-form .v { padding: 7px 2px; border-bottom: 1px solid rgba(210, 228, 245, 0.12); }
      .ws-form .v { text-align: right; min-width: 160px; }
      .ws-lockup .ws-cn { font-size: clamp(24px, 2.5vw, 34px); }
      .ws-lockup .ws-en { font-size: clamp(12px, 1.1vw, 15px); letter-spacing: 0.72em; text-indent: 0.72em; }
      .ws-mark { width: clamp(118px, 12vw, 186px); }
      .ws-mini { width: 70px; }
      .ws-bar { width: min(460px, 52vw); }
      .ws-pct { font-size: 10px; }
      .ws-verify { width: 150px; height: 150px; }
      .ws-verify .ws-mark { width: 58px; }
      .ws-skip {
        font-size: 9.5px; transition: opacity 500ms ease;
      }
      .ws-cine[data-hud="off"] .ws-skip { opacity: 0; }
      /* Logo 幕整体略高于画面中心，与视频一致。 */
      .ws-phase[data-phase="logo"] { padding-bottom: 5vh; box-sizing: border-box; }

      /* 逐帧对齐：按钮/内容按视频里的时间点淡入；读取条 1s、圆环 1.5s。 */
      @keyframes ws-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .ws-phase[data-phase="auth"].is-on .ws-btn { animation: ws-fade-up 0.5s ease 0.95s both; }
      .ws-phase[data-phase="id"].is-on .ws-btn { animation: ws-fade-up 0.5s ease 0.9s both; }
      .ws-phase[data-phase="read"].is-on .ws-bar span { animation-duration: 0.9s; }
      .ws-phase[data-phase="welcome"].is-on .ws-mini { animation: ws-fade-up 0.7s ease 0.3s both; }
      .ws-welcome {
        font-family: "Helvetica Neue", Arial, "Segoe UI", sans-serif;
        font-size: clamp(22px, 2.2vw, 32px);
        font-weight: 600; letter-spacing: 0.34em; text-indent: 0.34em;
        color: #f4f8fc; white-space: nowrap;
      }
      .ws-phase[data-phase="welcome"] .ws-mini { width: 44px; margin: 0 0 10px; }

      /* 全屏失败时的兜底：顶部一条极淡的标题栏渐变，让白色窗口按钮不那么刺眼。 */
      .ws-cine[data-chrome="fallback"]::before {
        content: ""; position: absolute; top: 0; left: 0; right: 0; height: 42px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0));
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        z-index: 2; pointer-events: none;
      }
    `;

    function injectCss() {
      if (document.getElementById(STYLE_ID)) return;
      const tag = document.createElement("style");
      tag.id = STYLE_ID;
      tag.dataset.plugin = "dsh-whale-splash";
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // ── 时序（对着参考视频的逐帧时间轴） ──────────────────────────────────────
    // 0.5s Logo 浮现（比视频里多留一拍，让「看够图标」再进下一幕）
    // → 3.9 需要访问许可 → 7.3 身份资料确认 → 9.9 接收访问需求
    // → 10.9 开始读取权限 → 11.9 读取完毕·核验（圆环）→ 14.3 WELCOME TO HARNESS OS → 16.2 收场
    const FULL_SCHEDULE = [
      { at: 500, phase: "logo" },
      { at: 3900, phase: "auth" },
      { at: 7300, phase: "id" },
      { at: 9900, phase: "recv" },
      { at: 10900, phase: "read" },
      { at: 11900, phase: "done" },
      { at: 14300, phase: "welcome" },
      { at: 16200, phase: "end" },
    ];
    const LOGO_SCHEDULE = [
      { at: 500, phase: "logo" },
      { at: 4200, phase: "end" },
    ];

    function hudMarkup() {
      return (
        '<div class="ws-grid"></div><div class="ws-glow"></div><div class="ws-scan"></div>' +
        '<i class="ws-corner tl"></i><i class="ws-corner tr"></i><i class="ws-corner bl"></i><i class="ws-corner br"></i>' +
        '<div class="ws-hud-top">' +
          '<div><div class="ws-brand-main">DEEPSEEK</div>' +
          '<div class="ws-brand-cn">人工智能整体解决方案提供商 · SYNTHESIS INTELLIGENCE</div>' +
          '<div class="ws-brand-os">HARNESS OS</div></div>' +
          '<div class="ws-hud-right">SECURE CHANNEL<br>04:01:1101<br>PROTECTED · 深度求索</div>' +
        '</div>' +
        '<div class="ws-hud-status"><i class="dot"></i><span>SYS · 01 04 01 1101 · 0010 0110</span></div>' +
        '<div class="ws-hud-bottom">' +
          '<div class="left">SYS.01 04 01 1101 0010 0110<br>PROTECTED BY 深度求索</div>' +
          '<div class="mid">填写访客信息<br>VISITOR ENTRY · SECURE</div>' +
          '<div class="right">PROTECTED BY DEEPSEEK<br>深度求索 · 2026</div>' +
        '</div>'
      );
    }

    function phasesMarkup() {
      return (
        '<div class="ws-phase" data-phase="logo"><div class="ws-lockup">' +
          whaleSvg("ws-mark") +
          '<div class="ws-cn">深度求索</div>' +
          '<div class="ws-en">DEEPSEEK</div>' +
          '<div class="ws-dots"><i></i><i></i><i></i></div>' +
        "</div></div>" +

        '<div class="ws-phase" data-phase="auth">' +
          '<div class="ws-title">需要访问许可</div>' +
          '<div class="ws-sub ws-type" data-text="ACCESS AUTHORIZATION IS REQUIRED. GRANT?"></div>' +
          '<div class="ws-rule"></div>' +
          '<div class="ws-meta">该程序请求访问 DSH 核心界面\nREQUESTED SCOPE: FULL INTERFACE ACCESS</div>' +
          '<button class="ws-btn" type="button">授予访问权限<small>AUTHORIZATION REQUIRED · PROTECTED BY 深度求索</small></button>' +
        "</div>" +

        '<div class="ws-phase" data-phase="id">' +
          '<div class="ws-title">身份资料确认</div>' +
          '<div class="ws-sub ws-type" data-text="IDENTITY CONFIRMATION IS REQUIRED"></div>' +
          '<div class="ws-rule"></div>' +
          '<div class="ws-form">' +
            '<div class="k">访问姓名</div><div class="v">跃数</div>' +
            '<div class="k">访问权限</div><div class="v accent">ADMIN</div>' +
            '<div class="k">验证码</div><div class="v ws-type" data-text="9 4 0 7" data-speed="90" data-delay="1200"></div>' +
          '</div>' +
          '<button class="ws-btn" type="button">确认身份<small>IDENTITY CONFIRMATION</small></button>' +
        "</div>" +

        '<div class="ws-phase" data-phase="recv">' +
          whaleSvg("ws-mini") +
          '<div class="ws-title">接收访问需求</div>' +
          '<div class="ws-sub ws-type" data-text="ACCESS REQUEST RECEIVED"></div>' +
          '<div class="ws-rule"></div>' +
          '<div class="ws-meta">REQUEST ID 0401-1101-0110\nCHANNEL VERIFIED · 深度求索</div>' +
        "</div>" +

        '<div class="ws-phase" data-phase="read">' +
          '<div class="ws-title">开始读取权限</div>' +
          '<div class="ws-sub ws-type" data-text="BEGINNING TO READ..."></div>' +
          '<div class="ws-rule"></div>' +
          '<div class="ws-bar"><span></span></div>' +
          '<div class="ws-pct" data-pct>0%</div>' +
        "</div>" +

        '<div class="ws-phase" data-phase="done">' +
          '<div class="ws-verify"><svg class="ws-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54"></circle></svg>' +
          whaleSvg("ws-mark") + "</div>" +
          '<div class="ws-title">读取完毕 · 核验通过</div>' +
          '<div class="ws-sub ws-type" data-text="ACCESS GRANTED. WELCOME."></div>' +
          '<div class="ws-rule"></div>' +
          '<div class="ws-meta">HARNESS OS READY\n深度求索，我们正在遇见未来</div>' +
        "</div>" +

        '<div class="ws-phase" data-phase="welcome">' +
          '<div class="ws-welcome ws-type" data-text="WELCOME TO HARNESS OS" data-speed="46"></div>' +
          '<div class="ws-rule"></div>' +
          whaleSvg("ws-mini") +
          '<div class="ws-meta ws-type" data-text="SECURE SESSION ESTABLISHED\n正在载入深度求索界面…" data-speed="24"></div>' +
        "</div>"
      );
    }

    let current = null;

    /** 尝试进入浏览器全屏（Electron 下会同时隐藏右上角窗口按钮）。 */
    function requestFullscreenQuietly() {
      try {
        if (typeof document === "undefined") return Promise.resolve(false);
        if (document.fullscreenElement) return Promise.resolve(false); // 本来就在全屏，不算我们进的
        const el = document.documentElement;
        if (!el) return Promise.resolve(false);
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (typeof req !== "function") return Promise.resolve(false);
        const result = req.call(el, { navigationUI: "hide" });
        if (result && typeof result.then === "function") return result.then(() => true).catch(() => false);
        return Promise.resolve(true);
      } catch {
        return Promise.resolve(false);
      }
    }

    function typeInto(el, text, speed, delay) {
      const total = Math.max(1, text.length) * (speed || 26);
      const startAt = Date.now() + (delay || 0);
      let raf = 0;
      const tick = () => {
        if (Date.now() < startAt) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = Math.min(1, (Date.now() - startAt) / total);
        el.textContent = text.slice(0, Math.round(text.length * t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    /** 浏览器层兜底全屏：Electron 宿主不可用时，用 Fullscreen API（可能需用户手势）。 */
    function applyClientFullscreen(state, overlay, cfg) {
      if (!cfg.fullscreen) {
        overlay.dataset.chrome = "fallback";
        return;
      }
      void requestFullscreenQuietly().then((ok) => {
        if (state.finished) return;
        if (ok) {
          state.enteredFullscreen = true;
          return;
        }
        overlay.dataset.chrome = "fallback";
        const retry = () => {
          window.removeEventListener("pointerdown", retry, true);
          document.removeEventListener("keydown", retry, true);
          if (state.finished) return;
          void requestFullscreenQuietly().then((again) => {
            if (again && !state.finished) {
              state.enteredFullscreen = true;
              delete overlay.dataset.chrome;
            }
          });
        };
        state.fullscreenRetry = retry;
        window.addEventListener("pointerdown", retry, true);
        document.addEventListener("keydown", retry, true);
      });
    }

    function buildCinematic(cfg) {
      const overlay = document.createElement("div");
      overlay.className = "ws-cine";
      overlay.id = "dsh-whale-splash";
      overlay.innerHTML = hudMarkup() + '<div class="ws-stage">' + phasesMarkup(cfg) + "</div>";

      if (cfg.showHint) {
        const skip = document.createElement("button");
        skip.type = "button";
        skip.className = "ws-skip";
        skip.textContent = "跳过开屏  ESC";
        overlay.appendChild(skip);
      }

      const cancelers = [];
      const state = {
        overlay,
        finished: false,
        timers: [],
        audio: null,
        cancelers,
        enteredFullscreen: false,
        fullscreenRetry: null,
        hostWindow: false,
      };

      const phaseEls = new Map();
      overlay.querySelectorAll(".ws-phase").forEach((el) => phaseEls.set(el.dataset.phase, el));

      let keyHandler = null;

      function cleanup() {
        for (const t of state.timers) clearTimeout(t);
        state.timers = [];
        for (const cancel of cancelers.splice(0)) {
          try {
            cancel();
          } catch {
            /* noop */
          }
        }
        if (state.audio) {
          try {
            state.audio.pause();
            state.audio.currentTime = 0;
          } catch {
            /* noop */
          }
        }
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (current === state) current = null;
        if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
        if (state.fullscreenRetry) {
          window.removeEventListener("pointerdown", state.fullscreenRetry, true);
          document.removeEventListener("keydown", state.fullscreenRetry, true);
          state.fullscreenRetry = null;
        }
        // 开屏结束：让宿主恢复窗口按钮颜色 / 退出全屏。
        if (state.hostWindow) {
          try {
            fetch("/whale-splash/window", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "restore" }),
              keepalive: true,
            }).catch(() => {});
          } catch {
            /* noop */
          }
        }
        // 开屏结束：如果全屏是我们进来的，就退回去，把窗口还给用户原来的样子。
        if (state.enteredFullscreen && typeof document.exitFullscreen === "function" && document.fullscreenElement) {
          try {
            const result = document.exitFullscreen();
            if (result && typeof result.catch === "function") result.catch(() => {});
          } catch {
            /* noop */
          }
        }
      }

      function activate(name) {
        const el = phaseEls.get(name);
        if (!el) return;
        // 第一幕（纯 Logo）不显示 HUD；从「需要访问许可」起 HUD 淡入。
        overlay.dataset.hud = name === "logo" ? "off" : "on";
        phaseEls.forEach((node, key) => {
          if (key === name) node.classList.add("is-on");
          else node.classList.remove("is-on");
        });
        for (const cancel of cancelers.splice(0)) {
          try {
            cancel();
          } catch {
            /* noop */
          }
        }
        el.querySelectorAll(".ws-type").forEach((node) => {
          const text = node.getAttribute("data-text") || "";
          const speed = Number(node.getAttribute("data-speed")) || 26;
          const delay = Number(node.getAttribute("data-delay")) || 0;
          node.textContent = "";
          cancelers.push(typeInto(node, text, speed, delay));
        });
        const pct = el.querySelector("[data-pct]");
        if (pct) {
          const started = Date.now();
          const timer = setInterval(() => {
            const t = Math.min(1, (Date.now() - started) / 3100);
            pct.textContent = Math.round(t * 100) + "%";
            if (t >= 1) clearInterval(timer);
          }, 60);
          cancelers.push(() => clearInterval(timer));
        }
      }

      function currentPhaseName() {
        for (const [name, el] of phaseEls) if (el.classList.contains("is-on")) return name;
        return "logo";
      }

      function finish(reason) {
        if (state.finished) return;
        state.finished = true;
        overlay.classList.add("ws-out");
        if (state.audio && !state.audio.paused) {
          const startVolume = state.audio.volume;
          const started = Date.now();
          const fade = () => {
            const t = Math.min(1, (Date.now() - started) / 500);
            try {
              state.audio.volume = startVolume * (1 - t);
            } catch {
              /* noop */
            }
            if (t < 1) requestAnimationFrame(fade);
          };
          requestAnimationFrame(fade);
        }
        state.timers.push(setTimeout(cleanup, 580));
        overlay.dataset.reason = reason || "auto";
      }

      keyHandler = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          finish("esc");
        }
      };
      document.addEventListener("keydown", keyHandler, true);

      const schedule = cfg.mode === "logo" ? LOGO_SCHEDULE : FULL_SCHEDULE;
      let started = false;

      function startTimeline() {
        if (started) return;
        started = true;
        activate("logo");
        for (const step of schedule) {
          if (step.at === 0) continue;
          if (step.phase === "end") state.timers.push(setTimeout(() => finish("auto"), step.at));
          else state.timers.push(setTimeout(() => activate(step.phase), step.at));
        }
      }

      overlay.addEventListener("click", (event) => {
        // 还在等音轨缓冲时，点一下直接开演，别让人对着黑屏等。
        if (!started) {
          startTimeline();
          return;
        }
        if (event.target.closest(".ws-skip")) {
          finish("skip");
          return;
        }
        const phases = schedule.filter((s) => s.phase !== "end").map((s) => s.phase);
        const idx = phases.indexOf(currentPhaseName());
        const next = phases[idx + 1];
        if (!next) finish("click");
        else activate(next);
      });

      function armKick(audio) {
        const kick = () => {
          audio.play().catch(() => {});
          window.removeEventListener("pointerdown", kick, true);
          document.removeEventListener("keydown", kick, true);
        };
        window.addEventListener("pointerdown", kick, true);
        document.addEventListener("keydown", kick, true);
      }

      if (cfg.sound) {
        const audio = primeAudio(cfg.volume);
        state.audio = audio;
        try {
          audio.currentTime = 0;
        } catch {
          /* 未加载完成时可能抛错 */
        }
        const begin = () => {
          if (started) return;
          let played = null;
          try {
            played = audio.play();
          } catch {
            /* noop */
          }
          // 关键：画面时间轴与音频在同一帧启动，声音不再落后。
          startTimeline();
          if (played && typeof played.catch === "function") played.catch(() => armKick(audio));
        };
        if (audio.readyState >= 2) {
          begin();
        } else {
          let fired = false;
          const onReady = () => {
            if (fired) return;
            fired = true;
            begin();
          };
          audio.addEventListener("canplay", onReady, { once: true });
          audio.addEventListener("loadeddata", onReady, { once: true });
          audio.addEventListener("error", onReady, { once: true });
          audio.load();
          // 兜底：音轨迟迟不就绪也不能一直黑屏。
          state.timers.push(setTimeout(onReady, 1200));
        }
      } else {
        startTimeline();
      }

      document.body.appendChild(overlay);

      // 先请宿主（Electron 主进程）处理窗口：把右上角白色窗口按钮的 symbolColor 设成黑色，
      // 融进开屏黑底；需要全屏时也由宿主直接 setFullScreen，不受浏览器手势限制。
      // web profile 里没有 Electron，宿主返回 electron:false，再退回浏览器 Fullscreen API。
      void fetch("/whale-splash/window", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "splash", fullscreen: cfg.fullscreen === true }),
      })
        .then((res) => (res.ok ? res.json() : { electron: false }))
        .then((info) => {
          if (info && info.electron) {
            state.hostWindow = true;
            return null;
          }
          applyClientFullscreen(state, overlay, cfg);
          return null;
        })
        .catch(() => applyClientFullscreen(state, overlay, cfg));

      current = state;
      return state;
    }

    // ── 每次启动只播一次 ────────────────────────────────────────────────────────
    // DSH 的客户端在同一窗口里会重挂载（HMR / 重连 / 刷新页面）；
    // 只用模块变量挡不住刷新，所以按「窗口会话」记一次：sessionStorage 在
    // 同一标签页的 F5 之间保留，关掉窗口（= 退出应用）后清空。
    const PLAYED_KEY = "dsh-whale-splash:played";
    function hasPlayedThisSession() {
      try {
        return window.sessionStorage.getItem(PLAYED_KEY) === "1";
      } catch {
        return false;
      }
    }
    function markPlayed() {
      try {
        window.sessionStorage.setItem(PLAYED_KEY, "1");
      } catch {
        /* 隐私模式等：退化为每次加载都播 */
      }
    }


    function buildVideoSplash(cfg) {
      const overlay = document.createElement("div");
      overlay.className = "ws-cine";
      overlay.id = "dsh-whale-splash";

      const wrap = document.createElement("div");
      wrap.className = "ws-video-wrap";

      const video = document.createElement("video");
      video.className = "ws-video-media";
      video.autoplay = true;
      video.playsInline = true;
      video.controls = false;
      video.preload = "auto";
      video.volume = cfg.volume !== undefined ? cfg.volume : 0.75;

      const themeQuery = cfg.theme ? ("?theme=" + encodeURIComponent(cfg.theme)) : "";
      video.src = "/whale-splash/video" + themeQuery;

      wrap.appendChild(video);

      const customBadge = document.createElement("div");
      customBadge.className = "ws-custom-brand-badge";
      customBadge.textContent = cfg.customText || "跃数AI";
      wrap.appendChild(customBadge);

      overlay.appendChild(wrap);

      if (cfg.showHint) {
        const skip = document.createElement("button");
        skip.type = "button";
        skip.className = "ws-skip";
        skip.textContent = "跳过开屏  ESC";
        skip.style.zIndex = "999";
        overlay.appendChild(skip);
      }

      const state = {
        overlay,
        finished: false,
        video,
        timers: [],
        enteredFullscreen: false,
        fullscreenRetry: null,
        hostWindow: false,
      };

      let keyHandler = null;

      function cleanup() {
        for (const t of state.timers) clearTimeout(t);
        state.timers = [];
        try {
          video.pause();
          video.src = "";
          video.load();
        } catch {}
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (current === state) current = null;
        if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
        if (state.fullscreenRetry) {
          window.removeEventListener("pointerdown", state.fullscreenRetry, true);
          document.removeEventListener("keydown", state.fullscreenRetry, true);
          state.fullscreenRetry = null;
        }
        if (state.hostWindow) {
          try {
            fetch("/whale-splash/window", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "restore" }),
              keepalive: true,
            }).catch(() => {});
          } catch {}
        }
        if (state.enteredFullscreen && typeof document.exitFullscreen === "function" && document.fullscreenElement) {
          try {
            const result = document.exitFullscreen();
            if (result && typeof result.catch === "function") result.catch(() => {});
          } catch {}
        }
      }

      function finish(reason) {
        if (state.finished) return;
        state.finished = true;
        overlay.classList.add("is-out");
        const t = setTimeout(cleanup, 240);
        state.timers.push(t);
      }
      state.finish = finish;

      keyHandler = (e) => {
        if (e.key === "Escape" || e.code === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish("esc");
        }
      };
      document.addEventListener("keydown", keyHandler, true);

      overlay.addEventListener("click", () => {
        finish("click");
      });

      video.addEventListener("ended", () => {
        finish("video_ended");
      });

      video.addEventListener("error", () => {
        console.warn("[whale-splash] video error, finishing");
        finish("video_error");
      });

      // 先静音确保一定能播起来，然后立刻尝试取消静音
      video.muted = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(() => {
          // 播放成功了，立刻尝试取消静音
          if (cfg.sound) {
            video.muted = false;
            video.volume = cfg.volume !== undefined ? cfg.volume : 0.75;
          }
          // 视频已经在播了，现在安全地触发全屏（延迟 300ms 让播放稳定）
          if (cfg.fullscreen) {
            setTimeout(() => {
              if (!state.finished) {
                fetch("/whale-splash/window", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mode: "splash", fullscreen: true }),
                })
                  .then((res) => (res.ok ? res.json() : { electron: false }))
                  .then((info) => {
                    if (info && info.electron) state.hostWindow = true;
                  })
                  .catch(() => {});
              }
            }, 300);
          }
        }).catch(() => {});
      }

      document.body.appendChild(overlay);

      // 请求深色标题栏（全屏操作延迟到视频播放成功后触发）
      void fetch("/whale-splash/window", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "splash", fullscreen: false }),
      })
        .then((res) => (res.ok ? res.json() : { electron: false }))
        .then((info) => {
          if (info && info.electron) {
            state.hostWindow = true;
          }
          return null;
        })
        .catch(() => {});

      current = state;
      return state;
    }

    function playSplash(force) {
      if (typeof document === "undefined" || !document.body) return;
      injectCss();
      if (current) current.finish("restart");
      const cfg = normalizeSettings(settings, settings);
      if (!force) {
        if (!cfg.enabled) return;
        if (hasPlayedThisSession()) return; // 本次启动已经播过，别再重来一遍
      }
      markPlayed();
      // 根据 theme 判断：如果是 default 则播放 SVG 逐帧自检，否则播放超燃机能视频
      if (cfg.theme && cfg.theme !== "default") {
        buildVideoSplash(cfg);
      } else {
        buildCinematic(cfg);
      }
      if (!force) {
        void fetchRemote(400).then((remote) => {
          if (!remote.enabled && current) current.finish("disabled");
        });
      }
    }

    // ── 设置页 ──────────────────────────────────────────────────────────────────
    const ui = {
      page: { display: "flex", flexDirection: "column", gap: 14, padding: "4px 2px 20px", fontSize: 13, lineHeight: 1.55 },
      hero: {
        borderRadius: 16, padding: "18px 20px 16px",
        background: "linear-gradient(135deg, rgba(8,14,28,0.98) 0%, rgba(14,24,46,0.98) 60%, rgba(22,48,88,0.95) 100%)",
        color: "#eaf6ff", position: "relative", overflow: "hidden",
        boxShadow: "0 10px 30px rgba(2, 8, 22, 0.4)",
        border: "1px solid rgba(79,140,255,0.25)",
      },
      heroGlow: {
        position: "absolute", inset: "-40% -20% auto auto", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(90,170,255,0.28) 0%, rgba(0,0,0,0) 70%)",
        pointerEvents: "none",
      },
      heroTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
      heroBadge: {
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: "rgba(79,140,255,0.2)", border: "1px solid rgba(79,140,255,0.4)", color: "#a8caff"
      },
      heroTitle: { fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: "#fff" },
      heroSub: { marginTop: 4, fontSize: 12, color: "rgba(206,232,255,0.8)" },

      // 中转站特惠卡片
      promoCard: {
        borderRadius: 16, padding: "18px 20px",
        background: "linear-gradient(135deg, rgba(34, 16, 62, 0.95) 0%, rgba(18, 24, 52, 0.96) 55%, rgba(14, 38, 72, 0.95) 100%)",
        border: "1px solid rgba(168, 85, 247, 0.45)",
        boxShadow: "0 10px 32px rgba(120, 60, 220, 0.16)",
        color: "#f3e8ff", display: "flex", flexDirection: "column", gap: 12,
        position: "relative", overflow: "hidden",
      },
      promoGlow: {
        position: "absolute", top: -50, right: -40, width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(0,0,0,0) 70%)",
        pointerEvents: "none",
      },
      promoHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
      promoTitle: { fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 },
      promoTag: {
        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
        background: "rgba(168, 85, 247, 0.25)", border: "1px solid rgba(168, 85, 247, 0.5)", color: "#d8b4fe",
      },
      promoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginTop: 2 },
      promoItem: {
        padding: "8px 10px", borderRadius: 8, background: "rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.08)", fontSize: 12, color: "#e9d5ff",
      },
      promoActions: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 },
      btnPurple: {
        padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
        background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
        border: "1px solid #c084fc", color: "#fff", boxShadow: "0 2px 10px rgba(147, 51, 234, 0.35)",
        transition: "transform .15s ease, box-shadow .15s ease",
      },
      btnPurpleOutline: {
        padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12,
        background: "rgba(147, 51, 234, 0.12)", border: "1px solid rgba(192, 132, 252, 0.4)",
        color: "#e9d5ff",
      },

      // 实时预览窗
      previewCard: {
        border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.12))", borderRadius: 16,
        padding: "16px", background: "var(--dsw-specific-tip, rgba(255,255,255,.5))",
        display: "flex", flexDirection: "column", gap: 12,
      },
      previewFrame: {
        position: "relative", width: "100%", aspectRatio: "16 / 9", maxHeight: 270,
        background: "#000", borderRadius: 12, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid rgba(255, 255, 255, 0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      },
      previewControls: {
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      },

      card: {
        border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.12))", borderRadius: 14,
        padding: "14px 16px 16px", background: "var(--dsw-specific-tip, rgba(255,255,255,.5))",
        display: "flex", flexDirection: "column", gap: 12,
      },
      row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
      label: { fontSize: 13, fontWeight: 600 },
      hint: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #8a919f)", marginTop: 2 },
      value: { fontSize: 12, color: "var(--dsw-alias-label-tertiary, #8a919f)", minWidth: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" },
      slider: { width: "100%", accentColor: "#4f8cff", cursor: "pointer" },

      themeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 },
      themeCard: {
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
        border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.12))",
        background: "rgba(255, 255, 255, 0.03)", color: "inherit",
        position: "relative", transition: "all .15s ease", minHeight: 74,
      },
      themeCardActive: {
        border: "1.5px solid #4f8cff", background: "rgba(79,140,255,0.12)",
        boxShadow: "0 0 12px rgba(79,140,255,0.2) inset",
      },
      themeBadgeActive: {
        position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%",
        background: "#4f8cff", color: "#fff", fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      },

      btn: {
        padding: "8px 14px", borderRadius: 10,
        border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.12))",
        background: "transparent", color: "inherit", fontSize: 12, cursor: "pointer",
      },
      btnPrimary: {
        padding: "8px 16px", borderRadius: 10,
        border: "1px solid rgba(79,140,255,0.7)", background: "rgba(79,140,255,0.18)",
        color: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
      },
      footer: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #8a919f)" },
    };

    function Switch({ checked, onChange }) {
      return h(
        "button",
        {
          type: "button", role: "switch", "aria-checked": checked ? "true" : "false",
          onClick: () => onChange(!checked),
          style: {
            position: "relative", width: 40, height: 22, borderRadius: 999, border: "none",
            cursor: "pointer", flex: "none",
            background: checked ? "#4f8cff" : "rgba(140,148,160,0.42)",
            transition: "background .2s ease",
          },
        },
        h("span", {
          style: {
            position: "absolute", top: 2, left: checked ? 20 : 2, width: 18, height: 18,
            borderRadius: "50%", background: "#fff", transition: "left .2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,.35)",
          },
        }),
      );
    }

    function SliderRow({ label, hint, value, min, max, step, format, onChange }) {
      return h(
        "div",
        null,
        h(
          "div",
          { style: ui.row },
          h("div", null, h("div", { style: ui.label }, label), hint ? h("div", { style: ui.hint }, hint) : null),
          h("div", { style: ui.value }, format ? format(value) : String(value)),
        ),
        h("input", {
          type: "range", min, max, step, value, style: ui.slider,
          onChange: (e) => onChange(Number(e.target.value)),
        }),
      );
    }

    const DEFAULT_THEMES = [
      { id: "red_eyes", label: "🔥 超燃写轮眼", hint: "跃数AI · 黑红机能流光 (15秒)" },
      { id: "thorns_glory", label: "👑 荆棘与荣光", hint: "暗黑救赎 · 圣冠荆棘重低音 (15秒)" },
      { id: "blue_eyes", label: "❄️ 苍天之瞳", hint: "五条悟 · 无量空处苍眸 (15秒)" },
      { id: "default", label: "🐳 经典科技蓝鲸", hint: "HARNESS OS 原生 SVG 自检过场 (16秒)" },
    ];

    function SettingsSection() {
      const [state, setState] = React.useState(settings);
      const [themes, setThemes] = React.useState(DEFAULT_THEMES);
      const [userDir, setUserDir] = React.useState("~/.dsh-whale-splash/videos");
      const [previewMuted, setPreviewMuted] = React.useState(true);
      const [copiedText, setCopiedText] = React.useState("");

      const videoRef = React.useRef(null);

      React.useEffect(() => {
        const fn = (next) => setState(next);
        listeners.add(fn);
        setState(settings);

        fetch("/whale-splash/videos")
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data && Array.isArray(data.videos)) {
              setThemes(data.videos);
              if (data.userDir) setUserDir(data.userDir);
            }
          })
          .catch(() => {});

        return () => listeners.delete(fn);
      }, []);

      const patch = (value) => {
        const next = updateSettings(value);
        setState(next);
      };

      const copyToClipboard = (text, label) => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
          } else {
            const input = document.createElement("input");
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
          }
          setCopiedText(label);
          setTimeout(() => setCopiedText(""), 2200);
        } catch {
          setCopiedText("复制失败，请手动复制");
          setTimeout(() => setCopiedText(""), 2200);
        }
      };

      const openUserFolder = () => {
        fetch("/whale-splash/open-folder", { method: "POST" })
          .then((r) => r.ok ? r.json() : null)
          .then((d) => {
            if (d && d.ok) {
              setCopiedText("已在资源管理器中打开文件夹！");
              setTimeout(() => setCopiedText(""), 2500);
            }
          })
          .catch(() => {});
      };

      const currentTheme = state.theme || "red_eyes";
      const isCurrentVideo = currentTheme !== "default";
      const activeThemeObj = themes.find((t) => t.id === currentTheme) || DEFAULT_THEMES[0];

      return h(
        "div",
        { style: ui.page },

        // 1. 顶部 Header
        h(
          "div",
          { style: ui.hero },
          h("div", { style: ui.heroGlow }),
          h(
            "div",
            { style: ui.heroTop },
            h("div", { style: ui.heroBadge }, "🐳 DSH 皮肤引擎 · PRO"),
            h("div", { style: { fontSize: 11, color: "rgba(160,210,255,0.85)" } }, "● 状态就绪"),
          ),
          h("div", { style: ui.heroTitle }, "开屏动画与动态壁纸管理"),
          h("div", { style: ui.heroSub }, "支持超燃黑红写轮眼、五条悟苍天之瞳、经典蓝鲸自检与任意本地 DIY 视频。"),
        ),

        // 2. 跃数AI中转站 · 官方直连与特惠中心
        h(
          "div",
          { style: ui.promoCard },
          h("div", { style: ui.promoGlow }),
          h(
            "div",
            { style: ui.promoHeader },
            h(
              "div",
              { style: ui.promoTitle },
              "🚀 跃数AI 中转站 (ys666.site)",
            ),
            h("div", { style: ui.promoTag }, "✨ 稳定运行千人站点"),
          ),
          h(
            "div",
            { style: { fontSize: 12, color: "#f5d0fe", lineHeight: 1.45 } },
            "全网主流大模型一站直达 · DeepSeek R1/V3 · Claude 3.5 Sonnet · GPT-4o · Gemini 1.5 Pro · 官方正品专线",
          ),
          h(
            "div",
            { style: ui.promoGrid },
            h("div", { style: ui.promoItem }, "🎁【新人福利】注册即送测试额度，无门槛秒开测试"),
            h("div", { style: ui.promoItem }, "⚡【超低延迟】专线网络加速，千人并发稳定不掉线"),
            h("div", { style: ui.promoItem }, "💰【超值特惠】折上折充值特惠，高性价比长期运营"),
            h("div", { style: ui.promoItem }, "💎【一个Key全通】无缝适配 DSH、NextChat、Cline 等"),
          ),
          h(
            "div",
            { style: ui.promoActions },
            h(
              "button",
              {
                type: "button",
                style: ui.btnPurple,
                onClick: () => window.open("https://ys666.site", "_blank"),
              },
              "🔗 访问 ys666.site 官网",
            ),
            h(
              "button",
              {
                type: "button",
                style: ui.btnPurpleOutline,
                onClick: () => copyToClipboard("https://ys666.site", "官网链接已复制 (https://ys666.site)"),
              },
              "📋 复制官网链接",
            ),
            copiedText && copiedText.includes("官网")
              ? h("span", { style: { fontSize: 12, color: "#4ade80", fontWeight: 600 } }, "✓ " + copiedText)
              : null,
          ),
        ),

        // 3. 实时效果小窗预览
        h(
          "div",
          { style: ui.previewCard },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
            h("div", { style: ui.label }, "🎬 实时效果小窗预览"),
            h(
              "div",
              { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #8a919f)", display: "flex", alignItems: "center", gap: 6 } },
              h("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" } }),
              activeThemeObj ? activeThemeObj.label : currentTheme,
            ),
          ),
          h(
            "div",
            { style: ui.previewFrame },
            isCurrentVideo
              ? h("video", {
                  ref: videoRef,
                  key: currentTheme,
                  src: "/whale-splash/video?theme=" + encodeURIComponent(currentTheme),
                  autoPlay: true,
                  loop: true,
                  playsInline: true,
                  muted: previewMuted,
                  style: { width: "100%", height: "100%", objectFit: "cover" },
                })
              : h(
                  "div",
                  { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#93c5fd" } },
                  h("div", { style: { fontSize: 32 } }, "🐳"),
                  h("div", { style: { fontSize: 14, fontWeight: 600 } }, "深度求索 · HARNESS OS 原生自检"),
                  h("div", { style: { fontSize: 11, color: "#bfdbfe" } }, "纯代码 SVG / HUD 七幕过场 (16秒)"),
                ),
          ),
          h(
            "div",
            { style: ui.previewControls },
            h(
              "div",
              { style: { display: "flex", gap: 8 } },
              isCurrentVideo
                ? h(
                    "button",
                    {
                      type: "button",
                      style: ui.btn,
                      onClick: () => {
                        const next = !previewMuted;
                        setPreviewMuted(next);
                        if (videoRef.current) videoRef.current.muted = next;
                      },
                    },
                    previewMuted ? "🔇 开启小窗原声" : "🔊 静音小窗原声",
                  )
                : null,
              h(
                "button",
                {
                  type: "button",
                  style: ui.btnPrimary,
                  onClick: () => void playSplash(true),
                },
                "🖥️ 全屏沉浸体验 (按 ESC 跳过)",
              ),
            ),
            h(
              "div",
              { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #8a919f)" } },
              isCurrentVideo ? "1080P 高清 · 15.0s 循环" : "矢量自检 · 16.0s 过场",
            ),
          ),
        ),

        // 4. 开机动画风格选择 (卡片网格)
        h(
          "div",
          { style: ui.card },
          h("div", { style: ui.label }, "🎨 选择开机动画风格"),
          h("div", { style: ui.hint }, "点击下方卡片即可实时在上方小窗预览，启动 DSH 时将按此风格播放："),
          h(
            "div",
            { style: ui.themeGrid },
            ...themes.map((th) => {
              const isActive = currentTheme === th.id;
              return h(
                "div",
                {
                  key: th.id,
                  style: Object.assign({}, ui.themeCard, isActive ? ui.themeCardActive : {}),
                  onClick: () => patch({ theme: th.id }),
                },
                h("div", { style: { fontWeight: 600, fontSize: 13, marginBottom: 4 } }, th.label),
                h("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary, #8a919f)", lineHeight: 1.35 } }, th.hint || (th.custom ? "自定义本地视频" : "")),
                isActive ? h("div", { style: ui.themeBadgeActive }, "✓") : null,
              );
            }),
          ),
        ),

        // 5. 基础常规开关
        h(
          "div",
          { style: ui.card },
          h(
            "div",
            { style: ui.row },
            h(
              "div",
              null,
              h("div", { style: ui.label }, "启用开屏动画"),
              h("div", { style: ui.hint }, "关闭后打开界面直接进主工作区。"),
            ),
            h(Switch, { checked: state.enabled, onChange: (v) => patch({ enabled: v }) }),
          ),
          h(
            "div",
            { style: ui.row },
            h(
              "div",
              null,
              h("div", { style: ui.label }, "播放声音 / BGM"),
              h("div", { style: ui.hint }, "全屏开机时播放超燃原声或背景音乐。"),
            ),
            h(Switch, { checked: state.sound, onChange: (v) => patch({ sound: v }) }),
          ),
          h(
            "div",
            { style: ui.row },
            h(
              "div",
              null,
              h("div", { style: ui.label }, "显示跳过提示"),
              h("div", { style: ui.hint }, "按 ESC 键或点击屏幕随时快速跳过。"),
            ),
            h(Switch, { checked: state.showHint, onChange: (v) => patch({ showHint: v }) }),
          ),
          h(
            "div",
            { style: ui.row },
            h(
              "div",
              null,
              h("div", { style: ui.label }, "开屏时全屏"),
              h("div", { style: ui.hint }, "隐藏窗口按钮，播完自动平滑恢复窗口。"),
            ),
            h(Switch, { checked: state.fullscreen, onChange: (v) => patch({ fullscreen: v }) }),
          ),
        ),

        // 6. 音量调节
        h(
          "div",
          { style: ui.card },
          h(SliderRow, {
            label: "开机音量大小",
            value: state.volume,
            min: 0, max: 1, step: 0.01,
            format: (v) => Math.round(v * 100) + "%",
            onChange: (v) => patch({ volume: v }),
          }),
        ),

        // 6.5 自定义开机显示文字/姓名/品牌
        h(
          "div",
          { style: ui.card },
          h(
            "div",
            { style: ui.row },
            h(
              "div",
              null,
              h("div", { style: ui.label }, "✏️ 开机动画显示文字 / 品牌名称"),
              h("div", { style: ui.hint }, "自定义经典蓝鲸「访问姓名」或视频中的品牌悬浮标（支持中英文、任意个性网名）"),
            ),
          ),
          h(
            "div",
            { style: { display: "flex", gap: 8, alignItems: "center" } },
            h("input", {
              type: "text",
              value: state.customText || "",
              placeholder: "例如：跃数AI / 你的专属昵称",
              maxLength: 20,
              style: {
                flex: "1 1 auto",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.15))",
                background: "rgba(0,0,0,0.06)",
                color: "inherit",
                fontSize: 13,
                outline: "none",
              },
              onChange: (e) => patch({ customText: e.target.value }),
            }),
            h(
              "button",
              {
                type: "button",
                style: ui.btn,
                onClick: () => patch({ customText: "跃数AI" }),
              },
              "重置为跃数AI",
            ),
          ),
        ),

        // 7. DIY 自定义视频教程与快速直达
        h(
          "div",
          { style: Object.assign({}, ui.card, { borderLeft: "3.5px solid #4f8cff", background: "rgba(79,140,255,0.04)" }) },
          h("div", { style: Object.assign({}, ui.label, { color: "#4f8cff" }) }, "✨ DIY 本地视频换源教程"),
          h("div", { style: ui.hint }, "你可以把任意 MP4 / WebM 视频放入以下目录，无需重新打包，在上方即可直接选用："),
          h("div", { style: { fontFamily: "monospace", fontSize: 11, background: "rgba(0,0,0,0.3)", padding: "7px 10px", borderRadius: 6, margin: "6px 0", wordBreak: "break-all" } }, userDir),
          h(
            "div",
            { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 } },
            h(
              "button",
              { type: "button", style: ui.btn, onClick: openUserFolder },
              "📂 一键打开视频目录",
            ),
            h(
              "button",
              { type: "button", style: ui.btn, onClick: () => copyToClipboard(userDir, "目录路径已复制") },
              "📋 复制目录路径",
            ),
            copiedText && copiedText.includes("目录")
              ? h("span", { style: { fontSize: 12, color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center" } }, "✓ " + copiedText)
              : null,
          ),
        ),

        // 8. 恢复默认与关于
        h(
          "div",
          { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 } },
          h("button", { type: "button", style: ui.btn, onClick: () => patch(Object.assign({}, DEFAULTS)) }, "↺ 恢复默认设置"),
          h("div", { style: ui.footer }, "设置保存在 ~/.dsh-whale-splash/config.json"),
        ),

        // 9. 页脚官方品牌与作者署名
        h(
          "div",
          { style: Object.assign({}, ui.footer, { textAlign: "center", marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }) },
          h("div", null, "🚀 作者：跃数AI (ys666.site) · 稳定运行千人站点"),
          h("div", null, "开屏动画皮肤 · 1.0 灵感来源：抖音 @孤影 · 遵循 MIT 开源协议"),
        ),
      );
    }
    // ── 插件入口 ────────────────────────────────────────────────────────────────
    const inject = ["slots"];

    function apply(ctx) {
      if (typeof document === "undefined") return;

      const boot = () => {
        injectCss();
        // 先把音轨拉起来，再开演；避免「画面已出现、声音还在加载」。
        if (settings.sound) primeAudio(settings.volume);
        playSplash(false);
      };
      if (document.body) boot();
      else document.addEventListener("DOMContentLoaded", boot, { once: true });

      if (ctx.effect) {
        ctx.effect(() => () => {
          if (current) current.finish("unload");
        });
      }

      if (ctx.slots) {
        ctx.slots.inject("settings.section", () =>
          ctx.slots.register(
            { name: "settings.section", id: "whale-splash", order: 520, label: "开屏动画" },
            () => h(SettingsSection, null),
          ),
        );
      }
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.__test__ = { playSplash, updateSettings, DEFAULTS };
    return module.exports;
  },
});
