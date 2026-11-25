// Cổng xem danh sách (chủ dự án yêu cầu 25/11/2026): trang «Doanh nghiệp mới thành lập» có phân trang nên dễ bị
// crawl → phải xem một quảng cáo (video có thưởng / quảng cáo dự phòng) và qua Cloudflare Turnstile mới thấy danh sách.
//
//   1. middleware.js: đường dẫn trong GATED_PATHS mà không có «vé» hợp lệ → rewrite sang /mo-khoa (màn hình cổng,
//      không có dữ liệu DN trong HTML). URL người dùng thấy giữ nguyên.
//   2. Màn hình cổng (components/ListGate.jsx): quảng cáo → token Turnstile → POST /api/list-pass.
//   3. /api/list-pass kiểm Turnstile ở máy chủ (khi có TURNSTILE_SECRET_KEY), cấp vé = cookie HttpOnly có chữ ký HMAC,
//      hạn PASS_TTL_S. Mỗi vé xem tối đa PASS_PAGE_BUDGET trang (đếm ở middleware) → crawl được ít trang mỗi lần
//      xem quảng cáo.
// Chỉ chạy ở máy chủ (node:crypto). Muốn chặn thêm trang tỉnh / ngành: thêm đường dẫn vào GATED_PATHS.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const PASS_COOKIE = 'list_pass';
export const PASS_TTL_S = 30 * 60;
export const PASS_PAGE_BUDGET = 40;
/** Số vé tối đa mỗi IP được cấp trong một giờ (chặn máy xem quảng cáo hàng loạt để lấy vé). */
export const PASS_PER_IP_PER_HOUR = Number(process.env.LIST_GATE_PER_IP) || 12; // e2e đặt cao (mọi test cùng IP)

/** Trang bị chặn (đường dẫn công khai, kể cả ?page= / ?tinh=). */
export const GATED_PATHS = ['/doanh-nghiep-moi-thanh-lap'];

export function isGatedPath(pathname) {
  return GATED_PATHS.includes(pathname);
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

/** Tạo vé mới: { value (giá trị cookie), id, exp (giây) }. */
export function createPass(now = Date.now()) {
  const id = randomBytes(9).toString('base64url');
  const exp = Math.floor(now / 1000) + PASS_TTL_S;
  const data = b64url(JSON.stringify({ id, exp }));
  return { value: `${data}.${sign(data)}`, id, exp };
}

/** Kiểm vé: trả { id, exp } nếu chữ ký đúng và còn hạn, ngược lại null. */
export function verifyPass(value, now = Date.now()) {
  if (typeof value !== 'string' || value.length > 300) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  const data = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(data));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { id, exp } = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (typeof id !== 'string' || !(exp * 1000 > now)) return null;
    return { id, exp };
  } catch {
    return null;
  }
}

// Bộ đếm trong bộ nhớ tiến trình (một máy chủ Railway). Nhiều máy chủ thì cần kho chung (Redis) hoặc để API Go lo.
const store = (globalThis.__listGateStore ||= { pages: new Map(), ips: new Map() });
const MAX_ENTRIES = 20000;

function prune(map, now) {
  if (map.size < MAX_ENTRIES) return;
  for (const [k, v] of map) if (v.until <= now) map.delete(k);
  while (map.size >= MAX_ENTRIES) map.delete(map.keys().next().value);
}

/** Đếm một lượt xem trang bằng vé; trả false khi vé đã dùng hết PASS_PAGE_BUDGET trang. */
export function spendPassPage(pass, now = Date.now()) {
  const hit = store.pages.get(pass.id);
  const used = (hit?.used || 0) + 1;
  if (used > PASS_PAGE_BUDGET) return false;
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

/** IP người dùng sau proxy (Railway / Cloudflare đặt X-Forwarded-For / CF-Connecting-IP). */
export function clientIp(headers) {
  return (
    headers.get('cf-connecting-ip') ||
    (headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    ''
  );
}

/** Dùng trong test. */
export function _resetListGate() {
  store.pages.clear();
  store.ips.clear();
}
