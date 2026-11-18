// Tìm vị trí từ khoá trong chữ để tô sáng (kết quả tìm kiếm, gợi ý). Không phân biệt hoa/thường và dấu:
// gõ «xay dung» vẫn khớp «XÂY DỰNG». Tô từng từ khoá ở ĐẦU chữ (giống cách bộ tìm khớp — lib/search-text.js):
// «bùi sơn» tô cả «BÙI» và «SƠN» trong «BÙI ĐỨC SƠN»; «son» không tô giữa chữ «NELSON». Các từ được tô
// liền nhau (chỉ cách dấu cách) gộp thành một đoạn. Trả về các đoạn [{ text, hit }].
import { queryTokens } from './search-text.js';

const base = (ch) =>
  ch
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
const isWordChar = (c) => /[a-z0-9]/.test(c || '');

export function highlightParts(text, query) {
  const src = String(text || '');
  const tokens = queryTokens(query).filter((t) => t.n.length >= 2);
  if (!tokens.length) return [{ text: src, hit: false }];

  // Chuỗi đã bỏ dấu + bảng ánh xạ vị trí về chuỗi gốc (một ký tự gốc có thể thành 0 hoặc 1 ký tự).
  const chars = [...src];
  let flat = '';
  const origin = [];
  chars.forEach((ch, i) => {
    for (const c of base(ch)) {
      flat += c;
      origin.push(i);
    }
  });

  // Đoạn khớp [start, end) theo vị trí ký tự gốc.
  const ranges = [];
  for (const { n } of tokens) {
    for (let at = flat.indexOf(n); at >= 0; at = flat.indexOf(n, at + 1)) {
      if (isWordChar(flat[at - 1])) continue; // chỉ khớp ở đầu chữ
      let end = origin[at + n.length - 1] + 1;
      while (end < chars.length && base(chars[end]) === '') end += 1; // kèm dấu rời phía sau (nếu có)
      ranges.push([origin[at], end]);
    }
  }
  if (!ranges.length) return [{ text: src, hit: false }];
  ranges.sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && (r[0] <= last[1] || /^\s+$/.test(chars.slice(last[1], r[0]).join(''))))
      last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }

  const parts = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: chars.slice(cursor, start).join(''), hit: false });
    parts.push({ text: chars.slice(start, end).join(''), hit: true });
    cursor = end;
  }
  if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join(''), hit: false });
  return parts;
}
