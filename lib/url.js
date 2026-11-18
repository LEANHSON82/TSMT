/** Ghép URL với query, bỏ tham số rỗng và page=1. */
export function buildHref(path, params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (k === 'page' && Number(v) <= 1) continue;
    sp.set(k, String(v));
  }
  // Dấu phẩy (danh sách nhiều tỉnh/ngành: ?tinh=ha-noi,ho-chi-minh) để nguyên cho link dễ đọc khi chia sẻ —
  // dấu phẩy hợp lệ trong query, không cần mã hoá thành %2C.
  const s = sp.toString().replace(/%2C/gi, ',');
  return s ? `${path}?${s}` : path;
}

export function pageNumber(raw) {
  const n = Number.parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function firstParam(raw) {
  return (Array.isArray(raw) ? raw[0] : raw) || '';
}

/**
 * Tham số của route nội bộ /…/q/[tinh]/[page] (rewrites() trong next.config.mjs chuyển ?tinh=&page= vào đây để trang
 * danh sách vẫn ISR được). tinh = '_' nghĩa là không lọc. Sai dạng → null (trang trả 404).
 */
export function internalListQuery({ tinh = '_', page }) {
  if (!/^\d{1,6}$/.test(page || '') || Number(page) < 1) return null;
  if (tinh !== '_' && !/^[a-z0-9-]{1,80}$/.test(tinh)) return null;
  return { tinh: tinh === '_' ? '' : tinh, page };
}
