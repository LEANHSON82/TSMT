// Nhóm ngành cấp 1 của VSIC (21 nhóm A–U) theo 2 số đầu mã ngành, và màu riêng cho từng nhóm.
// Màu dùng cho nhãn mã ngành — mỗi cặp nền/chữ đạt tương phản
// WCAG AA (spec mục 7.3).
const SECTIONS = [
  ['A', 1, 3],
  ['B', 5, 9],
  ['C', 10, 33],
  ['D', 35, 35],
  ['E', 36, 39],
  ['F', 41, 43],
  ['G', 45, 47],
  ['H', 49, 53],
  ['I', 55, 56],
  ['J', 58, 63],
  ['K', 64, 66],
  ['L', 68, 68],
  ['M', 69, 75],
  ['N', 77, 82],
  ['O', 84, 84],
  ['P', 85, 85],
  ['Q', 86, 88],
  ['R', 90, 93],
  ['S', 94, 96],
  ['T', 97, 98],
  ['U', 99, 99],
];

export const SECTION_COLORS = {
  A: { bg: '#dcfce7', fg: '#166534' }, // nông, lâm nghiệp, thuỷ sản
  B: { bg: '#e7e5e4', fg: '#44403c' }, // khai khoáng
  C: { bg: '#e0e7ff', fg: '#3730a3' }, // công nghiệp chế biến, chế tạo
  D: { bg: '#fef9c3', fg: '#854d0e' }, // điện, khí đốt
  E: { bg: '#cffafe', fg: '#155e75' }, // cấp nước, xử lý rác thải
  F: { bg: '#ffedd5', fg: '#9a3412' }, // xây dựng
  G: { bg: '#dbeafe', fg: '#1e40af' }, // bán buôn, bán lẻ
  H: { bg: '#e0f2fe', fg: '#075985' }, // vận tải, kho bãi
  I: { bg: '#ffe4e6', fg: '#9f1239' }, // lưu trú, ăn uống
  J: { bg: '#ede9fe', fg: '#5b21b6' }, // thông tin, truyền thông
  K: { bg: '#d1fae5', fg: '#065f46' }, // tài chính, ngân hàng
  L: { bg: '#fef3c7', fg: '#92400e' }, // bất động sản
  M: { bg: '#ccfbf1', fg: '#115e59' }, // chuyên môn, khoa học, công nghệ
  N: { bg: '#f1f5f9', fg: '#334155' }, // hành chính, hỗ trợ
  O: { bg: '#e2e8f0', fg: '#1e293b' }, // quản lý nhà nước
  P: { bg: '#fae8ff', fg: '#86198f' }, // giáo dục
  Q: { bg: '#fee2e2', fg: '#991b1b' }, // y tế
  R: { bg: '#fce7f3', fg: '#9d174d' }, // nghệ thuật, giải trí
  S: { bg: '#ecfccb', fg: '#3f6212' }, // dịch vụ khác
  T: { bg: '#f5f5f4', fg: '#44403c' }, // hộ gia đình
  U: { bg: '#e0e7ff', fg: '#312e81' }, // tổ chức quốc tế
};
const FALLBACK = { bg: '#eef3fc', fg: '#0f3680' };

/** "4330" → "F" (null nếu mã sai). */
export function vsicSection(code) {
  const n = Number.parseInt(String(code || '').slice(0, 2), 10);
  if (!Number.isFinite(n)) return null;
  return SECTIONS.find(([, from, to]) => n >= from && n <= to)?.[0] || null;
}

/** Màu {bg, fg} theo mã ngành; không có mã thì màu mặc định của thương hiệu. */
export function industryColor(code) {
  return SECTION_COLORS[vsicSection(code)] || FALLBACK;
}
