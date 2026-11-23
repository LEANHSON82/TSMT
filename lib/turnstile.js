// Cloudflare Turnstile (chống spam/bot — spec 3.6, 4.1 bước 4). Có NEXT_PUBLIC_TURNSTILE_SITE_KEY thì nạp script
// của Cloudflare (chỉ khi cần: lúc gửi form / lấy số điện thoại), dựng widget kiểu «chỉ hiện khi cần tương tác» ở góc
// màn hình và lấy token thật. Không có site key (dev, mock) → token giả lập như trước.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TIMEOUT_MS = 30000;

let scriptPromise = null;

function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('turnstile_ssr'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      s.defer = true;
      s.onload = () =>
        window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile_load'));
      s.onerror = () => {
        scriptPromise = null;
        s.remove();
        reject(new Error('turnstile_load'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/** Token Turnstile dùng một lần. Lỗi (không tải được, hết giờ) → reject; nơi gọi xử lý như lỗi mạng. */
export async function getTurnstileToken() {
  if (!TURNSTILE_SITE_KEY) return 'mock-turnstile-token';
  const ts = await loadTurnstile();
  return new Promise((resolve, reject) => {
    const el = document.createElement('div');
    el.setAttribute('data-turnstile', '');
    el.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483000';
    document.body.appendChild(el);
    let id;
    const finish = (fn, v) => {
      clearTimeout(timer);
      try {
        if (id !== undefined) ts.remove(id);
      } catch {
        /* bỏ qua */
      }
      el.remove();
      fn(v);
    };
    const timer = setTimeout(() => finish(reject, new Error('turnstile_timeout')), TIMEOUT_MS);
    id = ts.render(el, {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: 'interaction-only',
      language: 'vi',
      callback: (token) => finish(resolve, token),
      'error-callback': () => finish(reject, new Error('turnstile_error')),
      'expired-callback': () => finish(reject, new Error('turnstile_expired')),
    });
  });
}
