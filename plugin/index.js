/**
 * dsh-whale-splash — 宿主端（Host half）。
 *
 * 职责很小：
 *   1. `GET /whale-splash/audio`：把插件自带的开屏音轨（assets/splash.m4a）
 *      用 Range 流式返回给浏览器，`<audio>` 才能正常加载/拖动；
 *   2. `GET/PUT /whale-splash/settings`：把开屏设置持久化到
 *      `~/.dsh-whale-splash/config.json`（与端口无关，重启不丢）。
 *
 * 不写别的文件、不联网、不注册工具。
 */

import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const BASE = '/whale-splash';
const HERE = dirname(fileURLToPath(import.meta.url));
const AUDIO_FILE = join(HERE, 'assets', 'splash.m4a');
const CONFIG_DIR = join(homedir(), '.dsh-whale-splash');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/** 默认设置；客户端有同样一份兜底值，两边保持一致。 */
export const DEFAULTS = Object.freeze({
  enabled: true,
  sound: true,
  volume: 0.65,
  holdMs: 3400,
  mode: 'full',
  fullscreen: true,
  showHint: true,
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
    mode: src.mode === 'logo' || src.mode === 'full' ? src.mode : merged.mode,
    fullscreen: typeof src.fullscreen === 'boolean' ? src.fullscreen : merged.fullscreen,
    sound: typeof src.sound === 'boolean' ? src.sound : merged.sound,
    volume: clamp(src.volume, 0, 1, merged.volume),
    holdMs: clamp(src.holdMs, 1200, 8000, merged.holdMs),
    showHint: typeof src.showHint === 'boolean' ? src.showHint : merged.showHint,
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

export const name = 'whale-splash';
export const inject = ['webServer'];

/**
 * 宿主插件运行在 DSH Desktop 主进程里，可以直接操作 Electron 窗口：
 * 开屏时把标题栏窗口按钮的 symbolColor 设成黑色，让它融进纯黑背景
 * （看起来就像全屏、没有那几个白点），播完恢复。
 * 普通 web profile 里 require('electron') 失败，自动退化为纯前端方案。
 */
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
    const all = electron.BrowserWindow.getAllWindows().filter((win) => win && !win.isDestroyed());
    const visible = all.filter((win) => win.isVisible());
    return visible.length > 0 ? visible : all;
  } catch {
    return [];
  }
}

/** 每个窗口开屏前的状态，播完恢复。 */
const windowState = new WeakMap();

function enterSplashWindow(electron, fullscreen) {
  const dark = electron.nativeTheme?.shouldUseDarkColors !== false;
  for (const win of targetWindows(electron)) {
    if (!windowState.has(win)) {
      windowState.set(win, { fullscreen: win.isFullScreen?.() === true });
    }
    const state = windowState.get(win);
    if (fullscreen && !state.fullscreen) {
      try {
        win.setFullScreen(true);
      } catch {
        /* 忽略 */
      }
    }
    try {
      // 黑色按钮 + 黑色底：和开屏的纯黑背景融为一体
      win.setTitleBarOverlay?.({ color: '#000000', symbolColor: '#000000', height: 40 });
    } catch {
      /* 非 Windows / 无 overlay 时忽略 */
    }
    state.symbolColor = dark ? '#f9fafb' : '#0f1115';
  }
}

function leaveSplashWindow(electron) {
  for (const win of targetWindows(electron)) {
    const state = windowState.get(win);
    if (!state) continue;
    windowState.delete(win);
    try {
      win.setTitleBarOverlay?.({
        color: '#00000000',
        symbolColor: state.symbolColor || '#f9fafb',
        height: 40,
      });
    } catch {
      /* 忽略 */
    }
    if (state.fullscreen !== true && win.isFullScreen?.()) {
      try {
        win.setFullScreen(false);
      } catch {
        /* 忽略 */
      }
    }
  }
}

export function apply(ctx) {
  const webServer = ctx.webServer;
  if (!webServer || typeof webServer.register !== 'function') return () => {};

  const disposers = [];

  // 音轨：Range 支持（audio 标签会先发 Range 探测）。
  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/audio`,
      handler: (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          sendJson(res, 405, { error: 'method_not_allowed' });
          return;
        }
        if (!existsSync(AUDIO_FILE)) {
          sendJson(res, 404, { error: 'audio_missing' });
          return;
        }
        const total = statSync(AUDIO_FILE).size;
        const range = req.headers.range;
        res.setHeader('Content-Type', 'audio/mp4');
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
              else createReadStream(AUDIO_FILE, { start, end }).pipe(res);
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
        else createReadStream(AUDIO_FILE).pipe(res);
      },
    }),
  );

  // 设置读写（GET 读，PUT/POST 存；webserver 不允许同路径重复注册，所以合并）。
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

  // 开屏窗口效果：隐藏右上角窗口按钮（必要时全屏），播完恢复。
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

  disposers.push(
    webServer.register({
      kind: 'exact',
      path: `${BASE}/health`,
      handler: (req, res) =>
        sendJson(res, 200, {
          ok: true,
          plugin: 'dsh-whale-splash',
          audio: existsSync(AUDIO_FILE),
          audioBytes: existsSync(AUDIO_FILE) ? statSync(AUDIO_FILE).size : 0,
        }),
    }),
  );

  if (typeof ctx.effect === 'function') {
    ctx.effect(() => () => {
      for (const dispose of disposers.splice(0)) {
        try {
          if (typeof dispose === 'function') dispose();
        } catch {
          /* 卸载期清理失败忽略 */
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
