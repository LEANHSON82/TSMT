// /sitemap.xml là sitemap index (spec mục 7.1): 1 file trang tĩnh/danh sách + các file DN, 50.000 URL/file.
import { getSitemapCompanies } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';
import { URLS_PER_SITEMAP, sitemapIndex, xmlResponse } from '@/lib/sitemap';

export const revalidate = 3600;

export async function GET() {
  const first = await getSitemapCompanies(1).catch(() => ({ total: 0 }));
  const files = Math.max(1, Math.ceil((first.total || 0) / (first.page_size || URLS_PER_SITEMAP)));
  const entries = [{ loc: absoluteUrl('/sitemaps/pages.xml') }];
  for (let i = 1; i <= files; i++)
    entries.push({ loc: absoluteUrl(`/sitemaps/companies-${i}.xml`) });
  return xmlResponse(sitemapIndex(entries));
}
