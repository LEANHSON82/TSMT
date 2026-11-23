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
import StatusBadge from '@/components/StatusBadge';
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
  const founded = formatDate(c.founded_date);
  const full = M.company.metaDescription(c, founded, c.address);
  if (full.length <= 155) return full;
  const address = areaAddress(c.address, c.province?.name);
  return truncate(M.company.metaDescription(c, founded, address), 155);
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
    // <main> bọc toàn bộ nội dung (H1, bảng thông tin…) — landmark «nội dung chính» không bỏ sót phần quan trọng nhất.
    <main className="site-wrap pb-12 md:pb-16">
      <JsonLd data={orgLd} />
      <TrackOnMount name="view_company" params={{ mst: c.mst, province: c.province?.slug }} />
      <div className="pt-3 md:pt-4">
        <Breadcrumb
          items={[
            ...(c.province ? [{ name: c.province.name, href: `/tinh/${c.province.slug}` }] : []),
            { name: c.name },
          ]}
        />
      </div>

      {/* Kiểu CafeF (spec 3.4, đúng thứ tự): khung tên DN (H1 đỏ + tên quốc tế / viết tắt) → khung «Thông tin doanh
          nghiệp» (tab navy, bảng thông tin) rộng hết khung → quảng cáo dưới bảng → cột chính (ngành nghề + dòng cập
          nhật, DN cùng ngành) cạnh cột phải 300×600. Cột phải bắt đầu dưới bảng thông tin để ô quảng cáo không nằm
          sát nút «Xem số điện thoại». */}
      <div className="card mt-2 px-4 py-3.5 md:mt-3 md:px-6 md:py-5">
        <h1 className="text-[22px] leading-7 font-semibold text-pretty break-words text-title md:text-[28px] md:leading-[34px]">
          {c.name}
        </h1>
        {(c.name_en || c.name_short) && (
          <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-0.5 text-sm text-muted md:text-[15px]">
            {c.name_en && (
              <div>
                <dt className="mr-1 inline">{M.company.nameEn}:</dt>
                <dd className="inline text-ink">{c.name_en}</dd>
              </div>
            )}
            {c.name_short && (
              <div>
                <dt className="mr-1 inline">{M.company.nameShort}:</dt>
                <dd className="inline text-ink">{c.name_short}</dd>
              </div>
            )}
          </dl>
        )}
        {/* Điện thoại: tình trạng ngay dưới tên DN (hàng «Tình trạng» trong bảng nằm dưới màn hình đầu) — việc chính
            khi kiểm tra đối tác. Máy tính đã thấy cả bảng nên không lặp lại. */}
        {c.status && (
          <p className="mt-2 md:hidden">
            <span className="sr-only">{M.company.status}: </span>
            <StatusBadge status={c.status} />
          </p>
        )}
      </div>

      <section aria-labelledby="info-title" className="panel mt-3 md:mt-4">
        <SectionHeader id="info-title" title={M.company.info} />
        <div className="px-4 md:px-[22px]">
          <CompanyInfoTable company={c} parent={parent} />
        </div>
      </section>

      <AdSlot slotId="detail-below-info" className="mt-4 md:mt-5" />

      <div className={`mt-4 md:mt-5 ${BANNERS_ON ? 'rail-grid' : ''}`}>
        <div className="flex min-w-0 flex-col gap-4 md:gap-5">
          {c.industries?.length > 0 ? (
            <section aria-labelledby="ind-title" className="panel">
              <SectionHeader
                tier="secondary"
                id="ind-title"
                title={M.company.industries}
                meta={M.company.industryCount(c.industries.length)}
              />
              <IndustryTable industries={c.industries} />
              <UpdatedLine c={c} />
            </section>
          ) : (
            <div className="card">
              <UpdatedLine c={c} first />
            </div>
          )}

          {related.length > 0 && (
            <section aria-labelledby="rel-title" className="panel">
              <SectionHeader
                tier="secondary"
                id="rel-title"
                title={M.company.related(c.province?.name || '')}
                meta={M.company.relatedCount(related.length)}
              />
              <ul className="px-4 md:px-[22px]">
                {related.map((r) => (
                  <li key={r.mst} className="border-b border-line-soft last:border-b-0">
                    <CompanyCard company={r} variant="card" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {BANNERS_ON && (
          <div className="hidden self-stretch xl:block">
            <AdSlot slotId="detail-rail" variant="rail" className="h-full" />
          </div>
        )}
      </div>
    </main>
  );
}

// Dòng «Cập nhật lần cuối … · Yêu cầu ẩn/sửa thông tin» (spec 3.4 mục 5) ở chân khung ngành nghề.
function UpdatedLine({ c, first = false }) {
  return (
    <p
      className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-0 px-4 py-1.5 text-[13px] text-muted md:px-[22px] ${first ? '' : 'border-t border-line-soft'}`}
    >
      <span className="tabular-nums">
        {M.company.updatedAt}: {formatDateTime(c.updated_at)}
      </span>
      <Link
        href={`/yeu-cau-cap-nhat?mst=${encodeURIComponent(c.mst)}`}
        className="inline-flex min-h-11 items-center font-semibold no-underline hover:underline hover:underline-offset-[3px]"
      >
        {M.company.requestUpdate} ›
      </Link>
    </p>
  );
}
