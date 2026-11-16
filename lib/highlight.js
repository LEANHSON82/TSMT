// Tìm vị trí từ khoá trong chữ để tô sáng (kết quả tìm kiếm, gợi ý). Không phân biệt hoa/thường và dấu:
// gõ «xay dung» vẫn khớp «XÂY DỰNG». Trả về các đoạn [{ text, hit }].
const base = (ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

export function highlightParts(text, query) {
  const src = String(text || '');
  const q = base(String(query || '').trim()).replace(/\s+/g, ' ');
  if (q.length < 2) return [{ text: src, hit: false }];

  // Chuỗi đã bỏ dấu + bảng ánh xạ vị trí về chuỗi gốc (một ký tự gốc có thể thành 0 hoặc 1 ký tự).
  const chars = [...src];
  let flat = '';
  const origin = [];
  chars.forEach((ch, i) => {
    const b = base(ch);
    for (const c of b) {
      flat += c;
      origin.push(i);
    }
  });

  const parts = [];
  let cursor = 0;
  let from = 0;
  while (from <= flat.length - q.length) {
    const at = flat.indexOf(q, from);
    if (at < 0) break;
    const start = origin[at];
    let end = origin[at + q.length - 1] + 1;
    while (end < chars.length && base(chars[end]) === '') end += 1; // kèm dấu rời phía sau (nếu có)
    if (start > cursor) parts.push({ text: chars.slice(cursor, start).join(''), hit: false });
    parts.push({ text: chars.slice(start, end).join(''), hit: true });
    cursor = end;
    from = at + q.length;
  }
  if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join(''), hit: false });
  return parts.length ? parts : [{ text: src, hit: false }];
}
