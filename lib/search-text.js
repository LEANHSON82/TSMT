// Tách từ cho tìm kiếm — dùng chung cho bộ tìm mẫu (mocks/search.js, làm mẫu cho API Go) và phần tô sáng
// từ khoá (lib/highlight.js), để chỗ được tô sáng đúng là chỗ đã khớp.
//   tokenize('Bùi Đức Sơn') → [{ n: 'bui', a: 'bùi' }, { n: 'duc', a: 'đức' }, { n: 'son', a: 'sơn' }]
//   n: bỏ dấu, chữ thường (so khớp); a: giữ dấu, chữ thường (ưu tiên kết quả đúng dấu).
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((a) => ({ n: strip(a), a }));
}

/** Từ khoá có gõ dấu không (gõ dấu thì ưu tiên kết quả đúng dấu). */
export const hasAccent = (t) => t.n !== t.a;

// Cụm chữ chung trong tên DN — bỏ khỏi từ khoá khi xếp hạng (vẫn giữ nếu từ khoá chỉ có chúng):
// «công ty sơn hà» chỉ cần khớp «sơn hà».
const STOP_PHRASES = [
  'cong ty',
  'tnhh',
  'co phan',
  'mot thanh vien',
  'mtv',
  'doanh nghiep tu nhan',
  'dntn',
  'chi nhanh',
  'tap doan',
  'hop tac xa',
  'van phong dai dien',
].map((p) => p.split(' '));

/** Từ khoá đã bỏ cụm chữ chung; có thể rỗng (từ khoá chỉ gồm «công ty», «TNHH»…). */
export function meaningfulTokens(q) {
  const all = tokenize(q);
  const kept = [];
  for (let i = 0; i < all.length;) {
    const stop = STOP_PHRASES.find((p) => p.every((w, k) => all[i + k]?.n === w));
    if (stop) i += stop.length;
    else kept.push(all[i++]);
  }
  return kept;
}

/** Tách từ khoá người dùng gõ, bỏ cụm chữ chung (nếu còn từ khác). */
export function queryTokens(q) {
  const kept = meaningfulTokens(q);
  return kept.length ? kept : tokenize(q);
}

/**
 * Mức khớp của một từ khoá với một từ: 3 = trùng nguyên chữ, 1 = khớp phần đầu (chỉ khi cho phép), 0 = không.
 * Gõ có dấu mà đúng dấu thì cộng thêm 1 (nguyên chữ) / 0,5 (phần đầu).
 */
export function wordScore(token, word, allowPrefix) {
  if (word.n === token.n) return 3 + (hasAccent(token) && word.a === token.a ? 1 : 0);
  if (allowPrefix && token.n.length >= 2 && word.n.startsWith(token.n))
    return 1 + (hasAccent(token) && word.a.startsWith(token.a) ? 0.5 : 0);
  return 0;
}
