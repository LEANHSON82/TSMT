// Chống crawl trang danh sách (chủ dự án yêu cầu 25/11/2026). Ba lớp, đều kiểm ở middleware.js:
//
//   1. Cổng quảng cáo — trang «Doanh nghiệp mới thành lập» (GATED_PATHS): phải xem một quảng cáo (video có thưởng /
//      quảng cáo dự phòng) và qua Cloudflare Turnstile mới thấy danh sách. Vé loại 'ad' (cookie list_pass), mỗi vé
//      xem tối đa AD_PASS_PAGES trang.
//   2. Đếm lượt xem theo IP — mọi trang danh sách (tỉnh, ngành, DN mới, kết quả tìm). Trong THROTTLE_WINDOW_MS:
//      quá THROTTLE_SOFT trang → phải qua Turnstile (vé loại 'human', cookie list_human, mỗi vé HUMAN_PASS_PAGES
//      trang); quá THROTTLE_HARD trang → chặn tạm (429), có vé cũng vậy.
//   3. Giới hạn độ sâu — mọi danh sách chỉ lật tới trang MAX_LIST_PAGE; sâu hơn phải lọc / tìm.
//
// Không có vé hợp lệ → middleware rewrite sang màn hình /mo-khoa (URL giữ nguyên, không có dữ liệu DN trong HTML).
// Màn hình đó (components/ListGate.jsx) lấy token Turnstile (+ quảng cáo nếu là cổng quảng cáo) rồi POST
// /api/list-pass để nhận vé: cookie HttpOnly có chữ ký HMAC, hạn PASS_TTL_S.
// Chỉ chạy ở máy chủ (node:crypto). Bộ đếm nằm trong bộ nhớ tiến trình (một máy chủ Railway); chạy nhiều máy chủ thì
// chuyển sang kho chung (Redis) hoặc để API Go làm.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const envInt = (name, fallback) => Number.parseInt(process.env[name], 10) || fallback;

export const PASS_TTL_S = 30 * 60;
export const PASS_KINDS = {
  ad: { cookie: 'list_pass', pages: 40 },
  human: { cookie: 'list_human', pages: 60 },
};
export const AD_PASS_PAGES = PASS_KINDS.ad.pages;
export const HUMAN_PASS_PAGES = PASS_KINDS.human.pages;
/** Số vé tối đa mỗi IP được cấp trong một giờ (chặn máy xin vé hàng loạt). */
export const PASS_PER_IP_PER_HOUR = envInt('LIST_GATE_PER_IP', 12);

export const MAX_LIST_PAGE = 25;
export const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
export const THROTTLE_SOFT = envInt('LIST_THROTTLE_SOFT', 20);
export const THROTTLE_HARD = envInt('LIST_THROTTLE_HARD', 150);

/** Trang phải xem quảng cáo (đường dẫn công khai, kể cả ?page= / ?tinh=). */
export const GATED_PATHS = ['/doanh-nghiep-moi-thanh-lap'];

export function isGatedPath(pathname) {
  return GATED_PATHS.includes(pathname);
}

/** Trang danh sách (đếm theo IP + giới hạn độ sâu): DN mới, /tinh/{slug}, /nganh/{mã-slug}, /tim-kiem. */
export function isListPath(pathname) {
  return (
    isGatedPath(pathname) || pathname === '/tim-kiem' || /^\/(tinh|nganh)\/[^/]+$/.test(pathname)
  );
}

// Khoá ký vé: LIST_GATE_SECRET (đặt trên máy chủ, ≥ 32 ký tự ngẫu nhiên). Không đặt → khoá ngẫu nhiên theo tiến
// trình (khởi động lại máy chủ thì vé cũ hết hiệu lực; chạy nhiều máy chủ thì BẮT BUỘC đặt biến này). Giữ trên
// globalThis để middleware và route handler (hai bundle khác nhau trong cùng tiến trình) dùng chung một khoá.
function secret() {
  if (process.env.LIST_GATE_SECRET) return process.env.LIST_GATE_SECRET;
  globalThis.__listGateSecret ||= randomBytes(32).toString('hex');
  return globalThis.__listGateSecret;
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const sign = (data) => createHmac('sha256', secret()).update(data).digest('base64url');

/** Tạo vé mới loại kind ('ad' | 'human'): { value (giá trị cookie), id, exp (giây), kind }. */
export function createPass(kind = 'ad', now = Date.now()) {
  const id = randomBytes(9).toString('base64url');
  const exp = Math.floor(now / 1000) + PASS_TTL_S;
  const data = b64url(JSON.stringify({ id, exp, k: kind }));
  return { value: `${data}.${sign(data)}`, id, exp, kind };
}

/** Kiểm vé: trả { id, exp, kind } nếu chữ ký đúng, còn hạn và đúng loại kind; ngược lại null. */
export function verifyPass(value, kind = 'ad', now = Date.now()) {
  if (typeof value !== 'string' || value.length > 300) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  const data = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(data));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { id, exp, k } = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (typeof id !== 'string' || !(exp * 1000 > now) || (k || 'ad') !== kind) return null;
    return { id, exp, kind };
  } catch {
    return null;
  }
}

const store = (globalThis.__listGateStore ||= {
  pages: new Map(),
  ips: new Map(),
  views: new Map(),
});
const MAX_ENTRIES = 20000;

function prune(map, now) {
  if (map.size < MAX_ENTRIES) return;
  for (const [k, v] of map) if (v.until <= now) map.delete(k);
  while (map.size >= MAX_ENTRIES) map.delete(map.keys().next().value);
}

/** Đếm một lượt xem trang bằng vé; trả false khi vé đã dùng hết số trang của loại vé đó. */
export function spendPassPage(pass, now = Date.now()) {
  const hit = store.pages.get(pass.id);
  const used = (hit?.used || 0) + 1;
  if (used > PASS_KINDS[pass.kind].pages) return false;
  if (!hit) prune(store.pages, now);
  store.pages.set(pass.id, { used, until: pass.exp * 1000 });
  return true;
}

/** Ghi một lần cấp vé cho IP; trả số giây phải chờ nếu IP đã vượt PASS_PER_IP_PER_HOUR, ngược lại 0. */
export function takeIpQuota(ip, now = Date.now()) {
  const key = ip || 'unknown';
  let hit = store.ips.get(key);
  if (!hit || hit.until <= now) {
    prune(store.ips, now);
    hit = { count: 0, until: now + 3600 * 1000 };
  }
  if (hit.count >= PASS_PER_IP_PER_HOUR) return Math.ceil((hit.until - now) / 1000);
  hit.count += 1;
  store.ips.set(key, hit);
  return 0;
}

/**
 * Đếm một lượt xem trang danh sách của IP trong cửa sổ THROTTLE_WINDOW_MS.
 * Trả { count, retryAfter (giây tới khi cửa sổ mới bắt đầu) }. Không biết IP → không đếm (count 0): thà để lọt còn
 * hơn gộp mọi người vào một IP rồi chặn nhầm tất cả.
 */
export function countListView(ip, now = Date.now()) {
  if (!ip) return { count: 0, retryAfter: 0 };
  let hit = store.views.get(ip);
  if (!hit || hit.until <= now) {
    prune(store.views, now);
    hit = { count: 0, until: now + THROTTLE_WINDOW_MS };
  }
  hit.count += 1;
  store.views.set(ip, hit);
  return { count: hit.count, retryAfter: Math.ceil((hit.until - now) / 1000) };
}

/**
 * IP người dùng. Chỉ tin header do proxy của mình đặt, không tin header khách tự gửi:
 *   - TRUST_CF_IP=1 (domain đi qua Cloudflare): CF-Connecting-IP.
 *   - Còn lại (Railway): X-Real-IP do proxy Railway đặt; không có thì phần tử CUỐI của X-Forwarded-For (phần proxy
 *     nối thêm — phần đầu khách tự ghi được).
 *   - E2E_TRUST_TEST_IP=1 (chỉ bộ test e2e): X-E2E-IP, để mỗi test một IP riêng.
 */
export function clientIp(headers) {
  if (process.env.E2E_TRUST_TEST_IP === '1' && headers.get('x-e2e-ip')) {
    return headers.get('x-e2e-ip');
  }
  if (process.env.TRUST_CF_IP === '1' && headers.get('cf-connecting-ip')) {
    return headers.get('cf-connecting-ip').trim();
  }
  const real = (headers.get('x-real-ip') || '').trim();
  if (real) return real;
  const xff = (headers.get('x-forwarded-for') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return xff[xff.length - 1] || '';
}

/** Dùng trong test. */
export function _resetListGate() {
  store.pages.clear();
  store.ips.clear();
  store.views.clear();
}
