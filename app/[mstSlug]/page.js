// Trang chi tiết doanh nghiệp /{mst}-{slug} và chi nhánh /{mst}-{sss}-{slug} (spec mục 2, 3.4).
// ISR 24 giờ. /{mst} hoặc slug sai → redirect vĩnh viễn về URL chuẩn.
// MST sai định dạng → 404 luôn, không gọi API. MST không tồn tại → 404.
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import AdSlot from '@/components/AdSlot';
import Breadcrumb from '@/components/Breadcrumb';
import CompanyCard from '@/components/CompanyCard';
import CompanyInfoTable from '@/components/CompanyInfoTable';
import IndustryTable from '@/components/IndustryTable';
import JsonLd from '@/components/JsonLd';
import StatusBadge from '@/components/StatusBadge';
import TrackOnMount from '@/components/TrackOnMount';
import { IconEyeOff } from '@/components/Icons';
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
    <div className="flex w-full flex-col">
      <JsonLd data={orgLd} />
      <TrackOnMount name="view_company" params={{ mst: c.mst, province: c.province?.slug }} />
      {/* Dải tiêu đề trắng: breadcrumb, tên DN, tên khác, một dòng tóm tắt để nắm nhanh trước khi đọc bảng. */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
          <Breadcrumb
            items={[
              ...(c.province ? [{ name: c.province.name, href: `/tinh/${c.province.slug}` }] : []),
              { name: c.name },
            ]}
          />
          <h1 className="text-2xl leading-[30px] font-semibold text-pretty break-words text-navy md:text-[32px] md:leading-10">
            {c.name}
          </h1>
          {(c.name_en || c.name_short) && (
            <dl className="-mt-1 flex flex-col gap-0.5 text-sm text-ink-2 md:text-body">
              {c.name_en && (
                <div>
                  <dt className="inline text-muted">{M.company.nameEn}: </dt>
                  <dd className="inline">{c.name_en}</dd>
                </div>
              )}
              {c.name_short && (
                <div>
                  <dt className="inline text-muted">{M.company.nameShort}: </dt>
                  <dd className="inline">{c.name_short}</dd>
                </div>
              )}
            </dl>
          )}
          {/* Không dùng vạch ngăn: xuống dòng trên điện thoại sẽ để vạch thừa ở cuối dòng. */}
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            <StatusBadge status={c.status} className="font-semibold" />
            <span>
              MST <span className="font-semibold text-ink tabular-nums">{c.mst}</span>
            </span>
            {c.founded_date && (
              <>
                <span>{M.company.foundedShort(formatDate(c.founded_date))}</span>
              </>
            )}
            {c.province && (
              <>
                <Link href={`/tinh/${c.province.slug}`} className="font-semibold">
                  {c.province.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pt-6 pb-12 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="info-title">
            {/* Tiêu đề cho trình đọc màn hình; mắt thường đã thấy bảng ngay dưới tên DN. */}
            <h2 id="info-title" className="sr-only">
              {M.company.info}
            </h2>
            <CompanyInfoTable company={c} parent={parent} />
          </section>

          <AdSlot slotId="detail-below-info" className="pt-2" />

          {c.industries?.length > 0 && (
            <section aria-labelledby="ind-title" className="flex flex-col gap-3">
              <h2
                id="ind-title"
                className="text-xl leading-7 font-semibold text-navy md:text-2xl md:leading-8"
              >
                {M.company.industries}
              </h2>
              <IndustryTable industries={c.industries} />
            </section>
          )}

          <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm text-muted">
            <span>
              {M.company.updatedAt}:{' '}
              <span className="text-ink-2 tabular-nums">{formatDateTime(c.updated_at)}</span>
            </span>
            <Link
              href={`/yeu-cau-cap-nhat?mst=${encodeURIComponent(c.mst)}`}
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold"
            >
              <IconEyeOff size={18} />
              {M.company.requestUpdate}
            </Link>
          </p>

          {related.length > 0 && (
            <section aria-labelledby="rel-title" className="flex flex-col gap-3">
              <h2
                id="rel-title"
                className="text-xl leading-7 font-semibold text-navy md:text-2xl md:leading-8"
              >
                {M.company.related(c.province?.name || '')}
              </h2>
              <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(10,42,94,0.05)]">
                <ul className="-mr-px -mb-px grid grid-cols-1 sm:grid-cols-2">
                  {related.map((r) => (
                    <li key={r.mst} className="border-r border-b border-line">
                      <CompanyCard company={r} variant="cell" />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </main>

        <AdSlot slotId="detail-rail" variant="rail" />
      </div>
    </div>
  );
}
