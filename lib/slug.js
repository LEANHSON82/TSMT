// Quy tắc slug (spec mục 2): bỏ dấu tiếng Việt, đ → d, chữ thường,
// ký tự khác chữ/số thành "-", gộp nhiều "-" liền nhau, cắt tối đa 80 ký tự.
// API trả sẵn slug thì ưu tiên dùng slug của API.
export const SLUG_MAX_LENGTH = 80;

export function toSlug(input) {
  if (input == null) return '';
  const slug = String(input)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, '');
}
