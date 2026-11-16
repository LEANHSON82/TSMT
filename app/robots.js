import { absoluteUrl } from '@/lib/site';

// Chặn /tim-kiem và /api; khai báo sitemap (spec mục 7.1).
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/tim-kiem', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
