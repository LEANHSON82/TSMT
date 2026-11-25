// Hà Nội và TP Hồ Chí Minh đứng đầu (nhiều người tra nhất), còn lại A–Z tiếng Việt, bỏ tiền tố «TP »/«Thành phố » khi
// so (để «TP Cần Thơ» nằm ở vần C). Dùng chung cho trang chủ, menu tỉnh/thành và ô chọn tỉnh.
const PINNED = ['ha-noi', 'ho-chi-minh'];
const sortKey = (name = '') => name.replace(/^(TP\.?|Thành phố)\s+/i, '');
export function sortProvinces(list = []) {
  const pinned = PINNED.map((slug) => list.find((p) => p.slug === slug)).filter(Boolean);
  const rest = list
    .filter((p) => !PINNED.includes(p.slug))
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), 'vi'));
  return [...pinned, ...rest];
}
