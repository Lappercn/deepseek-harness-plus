/**
 * dsh-whale-splash — 宿主端（Host half）。
 *
 * 职责：
 *   1. `GET /whale-splash/audio`：流式提供开屏音频
 *   2. `GET /whale-splash/video`：流式提供自定义视频开机动画（支持 theme=red_eyes, blue_eyes, custom）
 *   3. `GET/PUT /whale-splash/settings`：读写设置持久化
 *   4. `GET /whale-splash/videos`：列出当前可用的视频主题（内置与用户自定义）
 *   5. `POST /whale-splash/window`：全屏与窗口按钮颜色控制
 *   6. `GET /whale-splash/health`：健康检查
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const BASE = '/whale-splash';
const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(HERE, 'assets');
const AUDIO_FILE = join(ASSETS_DIR, 'splash.m4a');
const CONFIG_DIR = join(homedir(), '.dsh-whale-splash');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const USER_VIDEOS_DIR = join(CONFIG_DIR, 'videos');

/** 默认设置；客户端有同样一份兜底值，两边保持一致。 */
export const DEFAULTS = Object.freeze({
  enabled: true,
  sound: true,
  volume: 0.75,
  holdMs: 3400,
  mode: 'full', // 'full' | 'logo' | 'video'
  theme: 'red_eyes', // 'default' (SVG动画) | 'red_eyes' | 'blue_eyes' | 自定义视频文件名
  fullscreen: true,
  showHint: true,
  customText: '跃数AI',
});

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export function normalizeSettings(input, base = DEFAULTS) {
  const src = input && typeof input === 'object' ? input : {};
  const merged = { ...DEFAULTS, ...base };
  return {
    enabled: typeof src.enabled === 'boolean' ? src.enabled : merged.enabled,
    mode: ['logo', 'full', 'video'].includes(src.mode) ? src.mode : merged.mode,
    theme: typeof src.theme === 'string' && src.theme ? src.theme : merged.theme,
    fullscreen: typeof src.fullscreen === 'boolean' ? src.fullscreen : merged.fullscreen,
    sound: typeof src.sound === 'boolean' ? src.sound : merged.sound,
    volume: clamp(src.volume, 0, 1, merged.volume),
    holdMs: clamp(src.holdMs, 1200, 8000, merged.holdMs),
    showHint: typeof src.showHint === 'boolean' ? src.showHint : merged.showHint,
    customText: typeof src.customText === 'string' ? src.customText.trim() : (merged.customText || '跃数AI'),
  };
}

function readSettings() {
  try {
    if (!existsSync(CONFIG_FILE)) return { ...DEFAULTS };
    return normalizeSettings(JSON.parse(readFileSync(CONFIG_FILE, 'utf8')));
  } catch {
    return { ...DEFAULTS };
  }
}

function writeSettings(next) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const tmp = CONFIG_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
  renameSync(tmp, CONFIG_FILE);
}

function resolveVideoPath(themeName) {
  mkdirSync(USER_VIDEOS_DIR, { recursive: true });

  // 1. Check user custom directory first (~/.dsh-whale-splash/videos/<themeName>.mp4 or exact filename)
  if (themeName) {
    const candidates = [
      join(USER_VIDEOS_DIR, themeName),
      join(USER_VIDEOS_DIR, `${themeName}.mp4`),
      join(USER_VIDEOS_DIR, `${themeName}.webm`),
      join(ASSETS_DIR, `${themeName}.mp4`),
      join(ASSETS_DIR, `${themeName}.webm`),
    ];
    for (const c of candidates) {
      if (existsSync(c) && statSync(c).isFile()) return c;
    }
  }

  // 2. Default fallbacks
  const defaultRed = join(USER_VIDEOS_DIR, 'red_eyes.mp4');
  if (existsSync(defaultRed)) return defaultRed;
  const assetRed = join(ASSETS_DIR, 'red_eyes.mp4');
  if (existsSync(assetRed)) return assetRed;

  const defaultBlue = join(USER_VIDEOS_DIR, 'blue_eyes.mp4');
  if (existsSync(defaultBlue)) return defaultBlue;
  const assetBlue = join(ASSETS_DIR, 'blue_eyes.mp4');
  if (existsSync(assetBlue)) return assetBlue;

  // 3. Scan user directory for any video
  if (existsSync(USER_VIDEOS_DIR)) {
    const files = readdirSync(USER_VIDEOS_DIR).filter(f => /\.(mp4|webm|mkv)$/i.test(f));
    if (files.length > 0) return join(USER_VIDEOS_DIR, files[0]);
  }

  return null;
}

function listAvailableVideos() {
  const result = [
    { id: 'default', label: '🐳 经典科技蓝鲸 (HARNESS OS 自检)', isVideo: false },
    { id: 'red_eyes', label: '🔥 超燃写轮眼 (跃数AI)', isVideo: true },
    { id: 'thorns_glory', label: '👑 荆棘与荣光 (暗黑救赎)', isVideo: true },
    { id: 'blue_eyes', label: '❄️ 苍天之瞳 (五条悟)', isVideo: true },
  ];

  try {
    if (existsSync(USER_VIDEOS_DIR)) {
      const files = readdirSync(USER_VIDEOS_DIR).filter(f => /\.(mp4|webm)$/i.test(f));
      for (const file of files) {
        const id = file;
        const base = basename(file, extname(file));
        if (base === 'red_eyes' || base === 'blue_eyes' || base === 'thorns_glory') continue;
        result.push({
          id: file,
          label: `🎬 自定义视频: ${file}`,
          isVideo: true,
          custom: true,
        });
      }
    }
  } catch {
    /* noop */
  }

  return result;
}

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const readBody = (req, limit = 32 * 1024) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

function serveRangeFile(filePath, contentType, req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }
  if (!filePath || !existsSync(filePath)) {
    sendJson(res, 404, { error: 'file_missing' });
    return;
  }
  const total = statSync(filePath).size;
  const range = req.headers.range;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(range));
    if (match) {
      const start = match[1] === '' ? total - Number(match[2]) : Number(match[1]);
      const end = match[2] === '' || match[1] === '' ? total - 1 : Number(match[2]);
      if (start >= 0 && end >= start && start < total) {
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', String(end - start + 1));
        if (req.method === 'HEAD') res.end();
        else createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }
    res.statusCode = 416;
    res.setHeader('Content-Range', `bytes */${total}`);
    res.end();
    return;
  }
  res.setHeader('Content-Length', String(total));
  if (req.method === 'HEAD') res.end();
  else createReadStream(filePath).pipe(res);
}

export const name = 'whale-splash';
export const inject = ['webServer'];

function electronBridge() {
  try {
    const electron = require('electron');
    if (!electron || typeof electron.BrowserWindow?.getAllWindows !== 'function') return null;
    return electron;
  } catch {
    return null;
  }
}

function targetWindows(electron) {
  try {
    return electron.BrowserWindow.getAllWindows().filter((win) => {
      try {
        return !win.isDestroyed();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

const windowStateMap = new WeakMap();

function enterSplashWindow(electron, wantFullscreen = true) {
  for (const win of targetWindows(electron)) {
    try {
      if (!windowStateMap.has(win)) {
        windowStateMap.set(win, {
          fullscreen: win.isFullScreen(),
          titleBarStyle: win.getTitleBarStyle ? win.getTitleBarStyle() : undefined,
        });
      }
      try {
        win.setTitleBarOverlay({ color: '#000000', symbolColor: '#000000', height: 0 });
      } catch {
        /* titleBarOverlay 在非 win32 或未开启时不生效，忽略 */
      }
      if (wantFullscreen && !win.isFullScreen()) {
        try {
          win.setFullScreen(true);
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }
  }
}

function leaveSplashWindow(electron) {
  for (const win of targetWindows(electron)) {
    try {
      const saved = windowStateMap.get(win);
      try {
        win.setTitleBarOverlay({ color: '#00000000', symbolColor: '#e0e0e0', height: 32 });
      } catch {
        /* noop */
      }
      if (saved && typeof saved.fullscreen === 'boolean') {
        try {
          if (win.isFullScreen() !== saved.fullscreen) {
            win.setFullScreen(saved.fullscreen);
          }
        } catch {
          /* noop */
        }
      }
      windowStateMap.delete(win);
    } catch {
      /* noop */
    }
  }
}

export function apply(ctx) {
  const { webServer } = ctx;
  if (!webServer || typeof webServer.register !== 'function') return () => {};

  const disposers = [];

  // 1. 音轨
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/audio`,
      handler: (req, res) => serveRangeFile(AUDIO_FILE, 'audio/mp4', req, res),
    }),
  );

  // 2. 视频流（支持 ?theme=xxx 参数）
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/video`,
      handler: (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://127.0.0.1');
          const theme = urlObj.searchParams.get('theme') || readSettings().theme;
          const videoPath = resolveVideoPath(theme);
          if (!videoPath) {
            sendJson(res, 404, { error: 'no_video_found', searched: theme });
            return;
          }
          const cType = videoPath.endsWith('.webm') ? 'video/webm' : 'video/mp4';
          serveRangeFile(videoPath, cType, req, res);
        } catch (e) {
          sendJson(res, 500, { error: String(e) });
        }
      },
    }),
  );

  // 3. 视频主题列表
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/videos`,
      handler: (req, res) => {
        sendJson(res, 200, {
          videos: listAvailableVideos(),
          userDir: USER_VIDEOS_DIR,
        });
      },
    }),
  );

  // 4. 设置读写
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/settings`,
      handler: async (req, res) => {
        if (req.method === 'GET') {
          sendJson(res, 200, readSettings());
          return;
        }
        if (req.method !== 'PUT' && req.method !== 'POST') {
          sendJson(res, 405, { error: 'method_not_allowed' });
          return;
        }
        try {
          const body = JSON.parse(await readBody(req));
          const next = normalizeSettings(body, readSettings());
          writeSettings(next);
          sendJson(res, 200, next);
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          sendJson(res, message === 'body_too_large' ? 413 : 400, { error: message });
        }
      },
    }),
  );

  // 5. 窗口效果
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/window`,
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'method_not_allowed' });
          return;
        }
        try {
          const payload = JSON.parse(await readBody(req));
          const electron = electronBridge();
          if (!electron) {
            // Windows native fullscreen fallback via win-fullscreen.ps1 to cover taskbar
            if (process.platform === 'win32') {
              try {
                const scriptPath = join(__dirname, 'scripts', 'win-fullscreen.ps1');
                if (existsSync(scriptPath)) {
                  const { spawn } = await import('node:child_process');
                  spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-mode', payload.mode === 'splash' ? 'splash' : 'restore'], {
                    detached: true,
                    stdio: 'ignore',
                  });
                  sendJson(res, 200, { ok: true, electron: false, win32: true });
                  return;
                }
              } catch {}
            }
            sendJson(res, 200, { ok: true, electron: false });
            return;
          }
          if (payload.mode === 'splash') enterSplashWindow(electron, payload.fullscreen === true);
          else if (payload.mode === 'restore') leaveSplashWindow(electron);
          sendJson(res, 200, { ok: true, electron: true, windows: targetWindows(electron).length });
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          sendJson(res, 400, { error: message });
        }
      },
    }),
  );

  // 6. 健康检查
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/health`,
      handler: (req, res) => {
        const settings = readSettings();
        const curVideo = resolveVideoPath(settings.theme);
        sendJson(res, 200, {
          ok: true,
          plugin: 'dsh-whale-splash',
          audio: existsSync(AUDIO_FILE),
          video: Boolean(curVideo && existsSync(curVideo)),
          videoPath: curVideo,
          theme: settings.theme,
          userVideosDir: USER_VIDEOS_DIR,
        });
      },
    }),
  );

  // 7. 打开本地视频目录
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/open-folder`,
      handler: async (req, res) => {
        mkdirSync(USER_VIDEOS_DIR, { recursive: true });
        const electron = electronBridge();
        if (electron && electron.shell && typeof electron.shell.openPath === 'function') {
          try {
            await electron.shell.openPath(USER_VIDEOS_DIR);
            sendJson(res, 200, { ok: true, opened: true, path: USER_VIDEOS_DIR });
            return;
          } catch {}
        }
        try {
          const { spawn } = await import('node:child_process');
          spawn('explorer.exe', [USER_VIDEOS_DIR], { detached: true, stdio: 'ignore' });
          sendJson(res, 200, { ok: true, opened: true, path: USER_VIDEOS_DIR });
        } catch (e) {
          sendJson(res, 200, { ok: false, error: String(e), path: USER_VIDEOS_DIR });
        }
      },
    }),
  );

  if (typeof ctx.effect === 'function') {
    ctx.effect(() => () => {
      for (const dispose of disposers.splice(0)) {
        try {
          if (typeof dispose === 'function') dispose();
        } catch {
          /* noop */
        }
      }
    });
  }

  return () => {
    for (const dispose of disposers.splice(0)) {
      try {
        if (typeof dispose === 'function') dispose();
      } catch {
        /* noop */
      }
    }
  };
}
