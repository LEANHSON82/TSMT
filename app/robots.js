import { GATED_PATHS } from '@/lib/list-gate';
import { absoluteUrl } from '@/lib/site';

// Chặn /tim-kiem và /api; khai báo sitemap (spec mục 7.1). Thêm: danh sách sau cổng quảng cáo (lib/list-gate.js) và
// màn hình cổng — máy tìm kiếm chỉ thấy màn hình cổng, không có gì để lập chỉ mục.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/tim-kiem', '/api/', '/mo-khoa', ...GATED_PATHS],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
