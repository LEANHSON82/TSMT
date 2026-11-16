// Định dạng hiển thị: ngày dd/mm/yyyy, tiền 1.000.000.000 đ (spec mục 9.1).
const pad = (n) => String(n).padStart(2, '0');

export function formatNumber(n) {
  if (n == null || Number.isNaN(Number(n))) return '';
  return String(Math.trunc(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatMoney(vnd) {
  if (vnd == null || vnd === '') return '';
  return `${formatNumber(vnd)} đ`;
}

/** 10_000_000_000 → "10 tỷ đồng"; 500_000_000 → "500 triệu đồng". */
export function formatMoneyWords(vnd) {
  const n = Number(vnd);
  if (!n) return '';
  const fmt = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
  if (n >= 1e9) return `${fmt(n / 1e9)} tỷ đồng`;
  if (n >= 1e6) return `${fmt(n / 1e6)} triệu đồng`;
  return `${formatNumber(n)} đồng`;
}

/** "2026-11-12" → "12/11/2026" (không đổi múi giờ). */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Thời điểm ISO 8601 → "dd/mm/yyyy hh:mm" theo giờ Việt Nam. */
export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}`;
}

/** Rút gọn địa chỉ cho thẻ DN: bỏ ", Việt Nam" ở cuối. */
export function shortAddress(address) {
  return String(address || '').replace(/,\s*Việt Nam\s*$/i, '');
}

// Địa chỉ rút gọn cho thẻ DN (spec 3.3): bỏ số nhà/đường, giữ phường/xã (và quận/huyện nếu địa chỉ
// còn theo đơn vị cũ) + tỉnh/thành. Tên tỉnh lấy từ danh mục (provinceName, «TP Hồ Chí Minh») cho gọn;
// withProvince=false: trang theo tỉnh, mọi DN cùng tỉnh nên bỏ cho khỏi lặp.
//   «Số 299 Đường Quang Trung, Phường Hồng Hải, Thành phố Hà Nội, Việt Nam» → «Phường Hồng Hải, Hà Nội»
// Không dùng \b: regex JS (không cờ u) không coi «ã», «ư»… là chữ cái nên «Xã» không khớp.
const AREA_START = /^(Phường|Xã|Thị trấn|Đặc khu)(\s|$)/i;
export function areaAddress(address, provinceName, { withProvince = true } = {}) {
  const parts = shortAddress(address)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const start = parts.findIndex((p) => AREA_START.test(p));
  if (start < 0 || start >= parts.length - 1) return shortAddress(address);
  const area = parts.slice(start, -1);
  const province = provinceName || parts[parts.length - 1];
  return (withProvince ? [...area, province] : area).join(', ');
}

export function truncate(text, max) {
  const s = String(text || '');
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
