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
  'cty',
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
  'vpdd',
  'ho kinh doanh',
  'hkd',
  'ctcp',
  'cp',
].map((p) => p.split(' '));

// Viết tắt hay gõ trong tên DN → chữ đầy đủ đã bỏ dấu (khớp với tên trên giấy tờ): «TMDV tân thịnh» tìm ra
// «Thương mại dịch vụ Tân Thịnh».
const ABBREVIATIONS = {
  tm: 'thuong mai',
  dv: 'dich vu',
  tmdv: 'thuong mai dich vu',
  xnk: 'xuat nhap khau',
  sx: 'san xuat',
  xd: 'xay dung',
  sxtm: 'san xuat thuong mai',
  tmsx: 'thuong mai san xuat',
  ptcn: 'phat trien cong nghe',
  cn: 'cong nghe',
  dt: 'dau tu',
  vt: 'van tai',
};
const expand = (t) =>
  (ABBREVIATIONS[t.n] || t.n).split(' ').map((n) => ({ n, a: n === t.n ? t.a : n }));

/** Tách từ khoá người dùng gõ, bỏ cụm chữ chung (nếu còn từ khác). */
export function queryTokens(q) {
  const all = tokenize(q).flatMap(expand);
  const kept = [];
  for (let i = 0; i < all.length;) {
    const stop = STOP_PHRASES.find((p) => p.every((w, k) => all[i + k]?.n === w));
    if (stop) i += stop.length;
    else kept.push(all[i++]);
  }
  return kept.length ? kept : all;
}

/**
 * Mức khớp của một từ khoá với một từ: 3 = trùng nguyên chữ, 1 = khớp phần đầu (chỉ khi cho phép), 0 = không.
 * Gõ có dấu: đúng dấu 4, SAI dấu chỉ 2 — để «NGUYỄN» (người đại diện) xếp trên «NGUYÊN» (tên DN) dù tên DN được
 * cộng điểm ưu tiên. Phần đầu đúng dấu cộng 0,5.
 */
export function wordScore(token, word, allowPrefix) {
  if (word.n === token.n) {
    if (!hasAccent(token)) return 3;
    return word.a === token.a ? 4 : 2;
  }
  if (allowPrefix && token.n.length >= 2 && word.n.startsWith(token.n))
    return 1 + (hasAccent(token) && word.a.startsWith(token.a) ? 0.5 : 0);
  return 0;
}
