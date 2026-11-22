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
    <>
      <JsonLd data={orgLd} />
      <TrackOnMount name="view_company" params={{ mst: c.mst, province: c.province?.slug }} />
      {/* Kiểu Pappers: dải xanh dưới header; breadcrumb chữ trắng trên dải; khối đầu trang (thẻ trắng bóng mềm)
          nằm trên dải, gồm H1 + dòng phụ (bên trái từ 1280px, căn giữa) và bảng thông tin (spec 3.4 mục 1–3,
          không chèn khối nào giữa H1 và bảng). Dải xanh dài quá đáy thẻ 48px. */}
      <div className="bg-band pb-8 md:pb-12">
        <div className="site-wrap">
          <div className="on-dark py-3 md:py-4 [&_a]:text-white [&_li]:text-[#d5e0f5] [&_span[aria-current]]:text-[#d5e0f5]">
            <Breadcrumb
              items={[
                ...(c.province
                  ? [{ name: c.province.name, href: `/tinh/${c.province.slug}` }]
                  : []),
                { name: c.name },
              ]}
            />
          </div>
          <section
            aria-labelledby="company-name"
            className="card-hero px-5 pt-6 pb-3 md:px-10 md:pt-8 md:pb-6 xl:flex xl:items-center xl:gap-12"
          >
            <div className="flex flex-col items-center gap-2 text-center xl:w-[340px] xl:flex-none">
              <h1
                id="company-name"
                className="text-[26px] leading-8 font-semibold tracking-[-0.01em] text-balance break-words text-ink md:text-[32px] md:leading-10"
              >
                {c.name}
              </h1>
              {(c.name_en || c.name_short) && (
                <dl className="flex flex-col items-center gap-0.5 text-body text-muted md:text-base">
                  {c.name_en && (
                    <div>
                      <dt className="sr-only">{M.company.nameEn}</dt>
                      <dd className="text-balance">{c.name_en}</dd>
                    </div>
                  )}
                  {c.name_short && (
                    <div>
                      <dt className="mr-1 inline">{M.company.nameShort}:</dt>
                      <dd className="inline">{c.name_short}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
            <div className="mt-5 min-w-0 flex-1 border-t border-line pt-2 xl:mt-0 xl:border-t-0 xl:pt-0">
              <h2 className="sr-only">{M.company.info}</h2>
              <CompanyInfoTable company={c} parent={parent} />
            </div>
          </section>
        </div>
      </div>

      <div className="site-wrap pb-12 md:pb-16">
        <AdSlot slotId="detail-below-info" className="mt-6 md:mt-8" />

        {/* Cột chính + cột phải 300 quảng cáo (.rail-grid, từ 1280px). Cột phải kéo cao bằng hàng (self-stretch) để
            ô 300×600 bên trong dính khi cuộn. Chưa có nguồn banner: bỏ cột phải, cột chính rộng hết khung. */}
        <div className={`mt-6 md:mt-8 ${BANNERS_ON ? 'rail-grid' : ''}`}>
          <main className="flex min-w-0 flex-col gap-6">
            {c.industries?.length > 0 && (
              <section aria-labelledby="ind-title" className="card px-4 pt-4 pb-3">
                <SectionHeader
                  id="ind-title"
                  divider
                  title={M.company.industries}
                  meta={M.company.industryCount(c.industries.length)}
                />
                <IndustryTable industries={c.industries} />
              </section>
            )}

            <p className="-mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 px-1 text-sm text-muted">
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
              <section aria-labelledby="rel-title" className="card px-4 pt-4 pb-1">
                <SectionHeader
                  id="rel-title"
                  divider
                  title={M.company.related(c.province?.name || '')}
                  meta={M.company.relatedCount(related.length)}
                />
                <ul>
                  {related.map((r) => (
                    <li key={r.mst}>
                      <CompanyCard company={r} variant="card" bare />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>

          {BANNERS_ON && (
            <div className="hidden self-stretch xl:block">
              <AdSlot slotId="detail-rail" variant="rail" className="h-full" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
