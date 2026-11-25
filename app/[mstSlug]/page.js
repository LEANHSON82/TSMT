// Trang chi tiết doanh nghiệp /{mst}-{slug} và chi nhánh /{mst}-{sss}-{slug} (spec mục 2, 3.4).
// ISR 24 giờ. /{mst} hoặc slug sai → redirect vĩnh viễn về URL chuẩn.
// MST sai định dạng → 404 luôn, không gọi API. MST không tồn tại → 404.
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import AdSlot, { BANNERS_ON } from '@/components/AdSlot';
import CompanyInfoTable from '@/components/CompanyInfoTable';
import IndustryTable from '@/components/IndustryTable';
import JsonLd from '@/components/JsonLd';
import PageHero, { PAGE_H1 } from '@/components/PageHero';
import SectionHeader from '@/components/SectionHeader';
import CopyButton from '@/components/CopyButton';
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
    <main className="pb-12 md:pb-16">
      <JsonLd data={orgLd} />
      <TrackOnMount name="view_company" params={{ mst: c.mst, province: c.province?.slug }} />

      {/* Spec 3.4, đúng thứ tự: tên DN (H1 + tên quốc tế / viết tắt + tình trạng) → khung «Thông tin doanh
          nghiệp» (bảng thông tin) rộng hết khung → quảng cáo dưới bảng → cột chính (ngành nghề + dòng cập
          nhật, DN cùng ngành) cạnh cột phải 300×600. Cột phải bắt đầu dưới bảng thông tin để ô quảng cáo không nằm
          sát nút «Xem số điện thoại». */}
      {/* Đầu trang: dải đầu trang dùng chung (PageHero) — breadcrumb, tên DN, tên quốc tế / viết tắt, tình trạng. */}
      <PageHero
        breadcrumb={[
          ...(c.province ? [{ name: c.province.name, href: `/tinh/${c.province.slug}` }] : []),
          { name: c.name },
        ]}
      >
        <h1 className={PAGE_H1}>{c.name}</h1>
        {/* Ngay dưới tên DN: mã số thuế (nút sao chép) + tình trạng — hai thứ người tra cần nhất. */}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[17px] font-semibold tracking-[0.02em] text-ink-2 tabular-nums">
            <span className="sr-only">{M.company.mst}: </span>
            {c.mst}
          </span>
          <CopyButton text={c.mst} label={M.company.copyMst} className="-mx-2.5 -my-2.5" />
          {c.status && (
            <span>
              <span className="sr-only">{M.company.status}: </span>
              <StatusBadge status={c.status} />
            </span>
          )}
        </p>
        {(c.name_en || c.name_short) && (
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-0.5 text-sm text-muted">
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
      </PageHero>

      <div className="site-wrap">
        {/* Thông tin DN: lưới ô trắng ngay trên nền trang (không khung bao, tiêu đề chỉ cho trình đọc màn hình). */}
        <section aria-labelledby="info-title" className="mt-5 md:mt-6">
          <h2 id="info-title" className="sr-only">
            {M.company.info}
          </h2>
          <CompanyInfoTable company={c} parent={parent} />
        </section>

        <AdSlot slotId="detail-below-info" className="mt-5 md:mt-6" />

        {/* Khối sau: tiêu đề đặt ngoài khung (như «Officers» của BizLookup), khung trắng bên dưới. */}
        <div className={`mt-6 md:mt-8 ${BANNERS_ON ? 'rail-grid-lg' : ''}`}>
          <div className="flex min-w-0 flex-col gap-6 md:gap-8">
            {c.industries?.length > 0 ? (
              <section aria-labelledby="ind-title">
                <SectionHeader
                  tab={false}
                  id="ind-title"
                  title={M.company.industries}
                  meta={M.company.industryCount(c.industries.length)}
                />
                <div className="panel">
                  <IndustryTable industries={c.industries} />
                  <UpdatedLine c={c} />
                </div>
              </section>
            ) : (
              <div className="card">
                <UpdatedLine c={c} first />
              </div>
            )}
          </div>

          {BANNERS_ON && (
            <div className="hidden self-stretch lg:block">
              <AdSlot slotId="detail-rail" variant="rail" className="h-full" />
            </div>
          )}
        </div>

        {/* Rộng hết khung (dưới cột chính + cột quảng cáo) để mỗi DN đủ chỗ trên một hàng. */}
        {related.length > 0 && (
          <section aria-labelledby="rel-title" className="mt-6 md:mt-8">
            <SectionHeader
              tab={false}
              id="rel-title"
              title={M.company.related(c.province?.name || '')}
            />
            {/* Mỗi DN một hàng ngang (không nhãn, xem RelatedRow). Chỉ hiện RELATED_SHOWN DN; còn nữa thì nút sang trang tỉnh. */}
            <ul className="panel">
              {related.slice(0, RELATED_SHOWN).map((r) => (
                <RelatedRow key={r.mst} r={r} />
              ))}
            </ul>
            {related.length > RELATED_SHOWN && c.province?.slug && (
              <p className="mt-3">
                <Link
                  href={`/tinh/${c.province.slug}`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand no-underline hover:border-brand"
                >
                  {M.company.relatedMore(c.province.name)} <span aria-hidden="true">→</span>
                </Link>
              </p>
            )}
          </section>
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
        className="inline-flex min-h-11 items-center font-semibold no-underline hover:text-brand-hover"
      >
        {M.company.requestUpdate} ›
      </Link>
    </p>
  );
}

const RELATED_SHOWN = 5;

/**
 * Một DN trong khối «cùng ngành tại tỉnh», mọi thông tin trên MỘT hàng ngang, không ghi nhãn (tiết kiệm chỗ):
 *   ≥ 1024px: các cột tên · MST · người đại diện · phường/xã · ngày hoạt động · tình trạng.
 *   < 1024px: tên một dòng, rồi các giá trị nối nhau bằng «·». Cả hàng bấm được (lớp phủ của link tên). Đủ trường
 *   thẻ DN (spec 3.3).
 */
function RelatedRow({ r }) {
  const area = areaAddress(r.address, r.province?.name, { withProvince: false });
  // Dấu «·» trước mỗi giá trị (chỉ dạng nối dòng < 1024px).
  const dot = "max-lg:before:mr-2 max-lg:before:text-line-strong max-lg:before:content-['·']";
  return (
    <li className="relative border-b border-line-soft px-4 py-2.5 last:border-b-0 hover:bg-thead md:px-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-6 text-ink-2 lg:grid lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,140px)_minmax(0,170px)_88px_124px] lg:gap-x-4">
        <h3 className="w-full min-w-0 text-[15px] font-semibold text-pretty lg:line-clamp-2 lg:w-auto lg:text-sm">
          <Link
            href={companyPath(r)}
            prefetch={false}
            title={r.name}
            className="text-title no-underline after:absolute after:inset-0 hover:text-brand"
          >
            {r.name}
          </Link>
        </h3>
        <span className="font-semibold text-ink tabular-nums">{r.mst}</span>
        {r.representative && (
          <span className={`min-w-0 lg:truncate ${dot}`} title={r.representative}>
            {r.representative}
          </span>
        )}
        {area && (
          <span className={`min-w-0 lg:truncate ${dot}`} title={r.address}>
            {area}
          </span>
        )}
        <span className={`tabular-nums ${dot}`}>{formatDate(r.founded_date) || '—'}</span>
        <span className={`lg:justify-self-end ${dot}`}>
          <StatusBadge status={r.status} plain />
        </span>
      </div>
    </li>
  );
}
