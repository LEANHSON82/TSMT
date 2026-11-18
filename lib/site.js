// Tên site và domain chưa chốt (spec mục 9.4) — đổi qua biến môi trường.
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'TMST';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Email liên hệ công khai (owner cung cấp). Trống → trang Liên hệ chỉ hướng dẫn dùng form. */
export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || '').trim();
