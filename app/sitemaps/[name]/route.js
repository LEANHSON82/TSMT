// File sitemap con: pages.xml (trang chủ, danh sách, trang tĩnh) và companies-{n}.xml (lastmod = updated_at).
import { getProvinces, getSitemapCompanies } from '@/lib/api';
import { POPULAR_INDUSTRIES } from '@/lib/popular-industries';
import { absoluteUrl } from '@/lib/site';
import { urlSet, xmlResponse } from '@/lib/sitemap';
import { companyPath } from '@/lib/mst';

export const revalidate = 3600;

export async function GET(_request, { params }) {
  const { name } = await params;

  if (name === 'pages.xml') {
    const provinces = await getProvinces().catch(() => []);
    const paths = [
      '/',
      '/doanh-nghiep-moi-thanh-lap',
      ...provinces.map((p) => `/tinh/${p.slug}`),
      ...POPULAR_INDUSTRIES.map((n) => n.href),
      '/gioi-thieu',
      '/lien-he',
      '/dieu-khoan',
      '/chinh-sach-bao-mat',
      '/yeu-cau-cap-nhat',
    ];
    return xmlResponse(urlSet(paths.map((p) => ({ loc: absoluteUrl(p) }))));
  }

  const m = /^companies-(\d+)\.xml$/.exec(name);
  if (!m) return new Response('Not found', { status: 404 });
  const data = await getSitemapCompanies(Number(m[1])).catch(() => null);
  if (!data?.items?.length) return new Response('Not found', { status: 404 });
  return xmlResponse(
    urlSet(data.items.map((c) => ({ loc: absoluteUrl(companyPath(c)), lastmod: c.updated_at }))),
  );
}
