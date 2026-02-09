import { Env } from '../types';

// NOTE: Kept as a single file with inline HTML/CSS to avoid external assets.
// This file splits the old monolithic setup page into reusable page generators.

type Lang = 'zh' | 'en';

function isChineseFromRequest(request: Request): boolean {
  const acceptLang = (request.headers.get('accept-language') || '').toLowerCase();
  return acceptLang.includes('zh');
}

function t(lang: Lang, key: string): string {
  const zh: Record<string, string> = {
    app: 'NodeWarden',
  tag: '部署在 Cloudflare Workers 上的 Bitwarden 兼容服务端。',

    // Config warning page
    cfgTitle: '需要配置 JWT_SECRET',
    cfgDescMissing: '当前服务没有配置 JWT_SECRET（用于签名登录令牌）。为了安全起见，必须先配置后才能注册/使用。',
    cfgDescDefault: '检测到你正在使用示例/默认 JWT_SECRET。为了安全起见，请先修改为随机强密钥后再注册/使用。',
    cfgDescTooShort: '检测到 JWT_SECRET 长度不足 32 个字符。为了安全起见，请使用至少 32 位的随机字符串。',
    cfgStepsTitle: '如何在 Cloudflare 修改 JWT_SECRET',
  cfgSteps: '打开 Cloudflare 控制台 → Workers 和 Pages → 选择 nodewarden → 设置 → 变量和机密 → 添加变量。\n类型：密钥\n名称：JWT_SECRET\n值：粘贴你生成的随机密钥\n保存后，等待重新部署生效。',
    cfgGenTitle: '随机密钥生成器',
    cfgGenHint: '建议长度：至少 32 字符（推荐 64+）。点击刷新生成新的随机值。',
    cfgCopy: '复制',
    cfgRefresh: '刷新',

    // Shared
    by: '作者',
    github: 'GitHub',
  };

  const en: Record<string, string> = {
    app: 'NodeWarden',
  tag: 'Minimal Bitwarden-compatible server on Cloudflare Workers.',

    // Config warning page
    cfgTitle: 'JWT_SECRET is required',
    cfgDescMissing: 'This server has no JWT_SECRET configured (used to sign login tokens). For safety, you must configure it before registration/usage.',
    cfgDescDefault: 'You are using the sample/default JWT_SECRET. For safety, please change it to a strong random secret before registration/usage.',
    cfgDescTooShort: 'JWT_SECRET is shorter than 32 characters. For safety, use a random string with at least 32 characters.',
    cfgStepsTitle: 'How to set JWT_SECRET in Cloudflare',
  cfgSteps: 'Open Cloudflare Dashboard → Workers & Pages → select nodewarden → Settings → Variables and Secrets → Add variable.\nType: Secret\nName: JWT_SECRET\nValue: paste a random secret\nSave, and wait for redeploy to take effect.',
    cfgGenTitle: 'Random secret generator',
    cfgGenHint: 'Recommended length: 32+ characters (64+ preferred). Click refresh to generate a new one.',
    cfgCopy: 'Copy',
    cfgRefresh: 'Refresh',

    // Shared
    by: 'By',
    github: 'GitHub',
  };

  return (lang === 'zh' ? zh : en)[key] ?? key;
}

function baseStyles(): string {
  // Keep consistent with existing setup page look & feel.
  return `
    :root {
      color-scheme: light;
      --bg0: #0b0b0f;
      --bg1: #0f1020;
      --card: rgba(255, 255, 255, 0.08);
      --card2: rgba(255, 255, 255, 0.06);
      --border: rgba(255, 255, 255, 0.14);
      --text: rgba(255, 255, 255, 0.92);
      --muted: rgba(255, 255, 255, 0.62);
      --muted2: rgba(255, 255, 255, 0.52);
      --accent: #0a84ff;
      --accent2: #64d2ff;
      --danger: #ff453a;
      --ok: #32d74b;
      --shadow: 0 16px 60px rgba(0, 0, 0, 0.50);
      --radius: 18px;
      --radius2: 14px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background:
        radial-gradient(900px 600px at 15% 10%, rgba(100, 210, 255, 0.25), transparent 60%),
        radial-gradient(900px 600px at 85% 20%, rgba(10, 132, 255, 0.22), transparent 60%),
        radial-gradient(900px 600px at 50% 90%, rgba(50, 215, 75, 0.10), transparent 60%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .shell { width: max(500px); }
    .panel {
      padding: 22px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.06);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .top {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 14px;
    }
    .mark {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(10,132,255,0.85), rgba(100,210,255,0.55));
      border: 1px solid rgba(255,255,255,0.20);
      box-shadow: 0 10px 40px rgba(10, 132, 255, 0.30);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.96);
      text-transform: uppercase;
      user-select: none;
    }
    .title { display: flex; flex-direction: column; gap: 4px; }
    .title h1 { font-size: 22px; margin: 0; letter-spacing: -0.3px; }
    .title p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }

    h2 { font-size: 16px; margin: 14px 0 10px 0; letter-spacing: -0.2px; }
    .lead { font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.86); }

    .kv {
      border-radius: var(--radius2);
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.05);
      padding: 14px;
      margin-top: 12px;
    }
    .kv h3 { margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.86); }
    .kv p { margin: 0; font-size: 12px; line-height: 1.55; color: var(--muted); white-space: pre-line; }

    .server {
      margin-top: 10px;
      font-family: var(--mono);
      font-size: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.12);
      word-break: break-all;
      color: rgba(255,255,255,0.90);
    }

    .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .btn {
      height: 38px;
      padding: 0 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(0,0,0,0.18);
      color: rgba(255,255,255,0.92);
      font-weight: 700;
      cursor: pointer;
    }
    .btn.primary {
      background: linear-gradient(135deg, rgba(10,132,255,0.95), rgba(100,210,255,0.60));
    }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }

    a { color: rgba(100, 210, 255, 0.92); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .footer {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.10);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
    }
  `;
}

export type JwtSecretState = 'missing' | 'default' | 'too_short';

export function renderJwtSecretWarningPage(request: Request, state: JwtSecretState): string {
  const lang: Lang = isChineseFromRequest(request) ? 'zh' : 'en';

  const descKey = state === 'missing' ? 'cfgDescMissing' : state === 'default' ? 'cfgDescDefault' : 'cfgDescTooShort';

  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NodeWarden</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <div class="shell">
    <aside class="panel">
      <div class="top">
        <div class="mark" aria-label="NodeWarden">NW</div>
        <div class="title">
          <h1>${t(lang, 'app')}</h1>
          <p>${t(lang, 'tag')}</p>
        </div>
      </div>

      <h2>${t(lang, 'cfgTitle')}</h2>
      <div class="lead">${t(lang, descKey)}</div>

      <div class="kv">
        <h3>${t(lang, 'cfgStepsTitle')}</h3>
        <p>${t(lang, 'cfgSteps')
          .replace(/^类型：密钥/m, '<b>类型：密钥</b>')
          .replace(/^名称：JWT_SECRET/m, '<b>名称：JWT_SECRET</b>')
          .replace(/^Type: Secret/m, '<b>Type: Secret</b>')
          .replace(/^Name: JWT_SECRET/m, '<b>Name: JWT_SECRET</b>')
        }</p>
      </div>

      <div class="kv">
        <h3>${t(lang, 'cfgGenTitle')}</h3>
        <p>${t(lang, 'cfgGenHint')}</p>
        <div class="server" id="secret"></div>
        <div style="height: 10px"></div>
        <div class="row">
          <button class="btn primary" type="button" onclick="refreshSecret()">${t(lang, 'cfgRefresh')}</button>
          <button class="btn" type="button" onclick="copySecret()">${t(lang, 'cfgCopy')}</button>
        </div>
      </div>

      <div class="footer">
        <div>
          <span>${t(lang, 'by')} </span>
          <a href="https://shuai.plus" target="_blank" rel="noreferrer">shuaiplus</a>
        </div>
        <div>
          <a href="https://github.com/shuaiplus/nodewarden" target="_blank" rel="noreferrer">${t(lang, 'github')}</a>
        </div>
      </div>
    </aside>
  </div>

  <script>
    // Generate a URL-safe random secret (default length: 64)
    function genSecret(len) {
      len = len || 50;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      const bytes = new Uint8Array(len);
      crypto.getRandomValues(bytes);
      let out = '';
      for (let i = 0; i < bytes.length; i++) {
        out += chars[bytes[i] % chars.length];
      }
      return out;
    }

    function refreshSecret() {
      const s = genSecret(50);
      document.getElementById('secret').textContent = s;
    }

    async function copySecret() {
      const s = document.getElementById('secret').textContent || '';
      try {
        await navigator.clipboard.writeText(s);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = s;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    }

    refreshSecret();
  </script>
</body>
</html>`;
}
