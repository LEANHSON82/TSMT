// Trang chi tiết doanh nghiệp /{mst}-{slug} và chi nhánh /{mst}-{sss}-{slug} (spec mục 2, 3.4).
// ISR 24 giờ. /{mst} hoặc slug sai → redirect vĩnh viễn về URL chuẩn.
// MST sai định dạng → 404 luôn, không gọi API. MST không tồn tại → 404.
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import AdSlot, { BANNERS_ON } from '@/components/AdSlot';
import Breadcrumb from '@/components/Breadcrumb';
import CompanyCard from '@/components/CompanyCard';
import CompanyInfoTable from '@/components/CompanyInfoTable';
import IndustryTable from '@/components/IndustryTable';
import JsonLd from '@/components/JsonLd';
import SectionHeader from '@/components/SectionHeader';
import TrackOnMount from '@/components/TrackOnMount';
import { getCompany, getRelatedCompanies } from '@/lib/api';
import { areaAddress, formatDate, formatDateTime, truncate } from '@/lib/format';
import { M } from '@/lib/messages';
import { companyPath, parseMstSlug } from '@/lib/mst';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() {
  return []; // render khi có lượt truy cập đầu tiên rồi cache (ISR)
}

const loadCompany = cache(async (mst) => getCompany(mst));

async function resolve(params) {
  const { mstSlug } = await params;
  const parsed = parseMstSlug(mstSlug);
  if (!parsed) notFound();
  const company = await loadCompany(parsed.mst);
  if (!company) notFound();
  return { parsed, company };
}

/** <title>: «{Tên DN} - MST {mst} | [TênSite]», khoảng 65 ký tự (dư ~5 để không cắt tên chỉ vì vài ký tự). */
function pageTitle(c) {
  const suffix = ` - MST ${c.mst} | ${SITE_NAME}`;
  return `${truncate(c.name, Math.max(20, 70 - suffix.length))}${suffix}`;
}

function pageDescription(c) {
  const address = areaAddress(c.address, c.province?.name);
  return truncate(M.company.metaDescription(c, formatDate(c.founded_date), address), 155);
}

export async function generateMetadata({ params }) {
  const { company: c } = await resolve(params);
  const path = companyPath(c);
  return {
    title: { absolute: pageTitle(c) },
    description: pageDescription(c),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title: c.name,
      description: pageDescription(c),
      url: path,
      siteName: SITE_NAME,
      locale: 'vi_VN',
      // Khai openGraph ở trang thì Next thay cả khối → ghi lại ảnh chung (app/opengraph-image.png).
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function CompanyPage({ params }) {
  const { parsed, company: c } = await resolve(params);
  const canonical = companyPath(c);
  if (parsed.slug !== c.slug) permanentRedirect(canonical);

  const [related, parent] = await Promise.all([
    getRelatedCompanies(c.mst, 10),
    c.parent_mst ? loadCompany(c.parent_mst).catch(() => null) : null,
  ]);

  // JSON-LD Organization — KHÔNG có telephone (spec mục 7.1).
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: c.name,
    ...(c.name_en || c.name_short
      ? { alternateName: [c.name_en, c.name_short].filter(Boolean) }
      : {}),
    taxID: c.mst,
    ...(c.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: c.address,
            addressRegion: c.province?.name,
            addressCountry: 'VN',
          },
        }
      : {}),
    ...(c.founded_date ? { foundingDate: c.founded_date } : {}),
    url: absoluteUrl(canonical),
    ...(parent
      ? { parentOrganization: { '@type': 'Organization', name: parent.name, taxID: parent.mst } }
      : {}),
  };

  return (
    <div className="site-wrap">
      <JsonLd data={orgLd} />
      <TrackOnMount name="view_company" params={{ mst: c.mst, province: c.province?.slug }} />
      {/* Hệ A: breadcrumb cách header 20px (điện thoại 12), tới H1 16px (12). */}
      <div className="pt-3 md:pt-5">
        <Breadcrumb
          items={[
            ...(c.province ? [{ name: c.province.name, href: `/tinh/${c.province.slug}` }] : []),
            { name: c.name },
          ]}
        />
      </div>

      {/* Cột chính 852 + cột phải 300 quảng cáo (.rail-grid, từ 1280px — ở 1024 cột chính chỉ còn ~628 nên
          dưới 1280 không có cột phải, ô cột phải ẩn hẳn; vẫn còn ô trong bài dưới bảng thông tin). Cột phải kéo
          cao bằng hàng (self-stretch) để ô 300×600 bên trong dính khi cuộn; cột chính canh đầu (không bị kéo
          giãn). Chưa có nguồn banner: bỏ cột phải, cột chính rộng hết khung (không để cột trống). */}
      <div className={`mt-3 md:mt-4 ${BANNERS_ON ? 'rail-grid' : ''}`}>
        <main className="min-w-0">
          <div className="mb-5 md:mb-8">
            <h1 className="text-h1-m font-semibold text-pretty break-words text-ink md:text-h1">
              {c.name}
            </h1>
            {(c.name_en || c.name_short) && (
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
                {c.name_en && (
                  <div>
                    <dt className="mr-1 inline text-muted">{M.company.nameEn}</dt>
                    <dd className="inline">{c.name_en}</dd>
                  </div>
                )}
                {c.name_short && (
                  <div>
                    <dt className="mr-1 inline text-muted">{M.company.nameShort}</dt>
                    <dd className="inline">{c.name_short}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <section aria-labelledby="info-title">
            <SectionHeader id="info-title" title={M.company.info} />
            <CompanyInfoTable company={c} parent={parent} />
          </section>

          <AdSlot slotId="detail-below-info" className="mt-10 md:mt-12" />

          {c.industries?.length > 0 && (
            <section aria-labelledby="ind-title" className="mt-10 md:mt-12">
              <SectionHeader
                id="ind-title"
                title={M.company.industries}
                meta={M.company.industryCount(c.industries.length)}
              />
              <IndustryTable industries={c.industries} />
            </section>
          )}

          {/* Ngay dưới bảng ngành (thuộc cùng khối như bản mẫu A); DN không có ngành thì đứng riêng. */}
          <p
            className={`flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted ${c.industries?.length > 0 ? 'mt-4' : 'mt-10 md:mt-12'}`}
          >
            <span className="tabular-nums">
              {M.company.updatedAt}: {formatDateTime(c.updated_at)}
            </span>
            <Link
              href={`/yeu-cau-cap-nhat?mst=${encodeURIComponent(c.mst)}`}
              className="-my-3 inline-flex min-h-11 items-center font-semibold no-underline hover:underline hover:underline-offset-[3px]"
            >
              {M.company.requestUpdate}
            </Link>
          </p>

          {related.length > 0 && (
            <section aria-labelledby="rel-title" className="mt-10 md:mt-12">
              <SectionHeader
                id="rel-title"
                title={M.company.related(c.province?.name || '')}
                meta={M.company.relatedCount(related.length)}
              />
              {/* Đúng số DN API trả về (1 DN = 1 thẻ), lưới 2 cột từ 640px (thẻ ~410px như lưới trang chủ) — một
                  cột trong khung 852 bỏ trống quá nửa bề ngang. Không chèn ô giữ chỗ: số lẻ thì ô cuối để trống. */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
                {related.map((r) => (
                  <li key={r.mst}>
                    <CompanyCard company={r} variant="card" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        {/* AdSlot rail tự ẩn dưới 1024 (hidden lg:block); bọc thêm để ẩn cả 1024–1279 (chưa có cột phải). */}
        {BANNERS_ON && (
          <div className="hidden self-stretch xl:block">
            <AdSlot slotId="detail-rail" variant="rail" className="h-full" />
          </div>
        )}
      </div>
    </div>
  );
}
