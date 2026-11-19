import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import CompanyCard from '@/components/CompanyCard';
import JsonLd from '@/components/JsonLd';
import SearchBox from '@/components/SearchBox';
import { AdvancedSearchLink } from '@/components/HeaderBar';
import SectionHeader from '@/components/SectionHeader';
import { getProvinces, listCompanies } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { M } from '@/lib/messages';

// ISR, làm mới 10 phút (spec mục 2).
export const revalidate = 600;

export const metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [latest, provinces] = await Promise.all([
    listCompanies({ sort: 'founded_desc', page: 1 }).catch(() => ({ items: [] })),
    getProvinces().catch(() => []),
  ]);
  const newest = (latest.items || []).slice(0, 20);
  // Xếp A–Z theo tiếng Việt; bỏ tiền tố «TP »/«Thành phố » khi so → «TP Hồ Chí Minh» nằm ở vần H, chỗ người
  // dùng tìm (như bản mẫu A), không lạc xuống cuối vần T.
  const sortKey = (name = '') => name.replace(/^(TP\.?|Thành phố)\s+/i, '');
  const sorted = [...provinces].sort((a, b) =>
    sortKey(a.name).localeCompare(sortKey(b.name), 'vi'),
  );
  const totalCompanies = provinces.reduce((sum, p) => sum + (p.company_count || 0), 0);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: absoluteUrl('/'),
          potentialAction: {
            '@type': 'SearchAction',
            target: `${absoluteUrl('/tim-kiem')}?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      {/* Mọi trang có BreadcrumbList (spec mục 7.1); trang chủ chỉ có một mục. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: M.nav.home, item: absoluteUrl('/') },
          ],
        }}
      />
      {/* Thứ tự theo yêu cầu: tỉnh/thành → ô quảng cáo → DN mới thành lập. Spec 3.1 liệt kê
          DN mới (mục 4) trước tỉnh/thành (mục 5); ô quảng cáo vẫn nằm giữa hai khối (mục 6). */}
      <main className="flex w-full flex-col">
        {/* Hero = «hàng 2» của header trên trang chủ: cùng khung .site-wrap và lưới .find-grid với hàng ô tìm
            của header (components/HeaderBar.jsx) → ô tìm trùng khít vị trí ngang, bề rộng, chiều cao với ô tìm
            header ở mọi trang khác. Viền dưới đậm như viền dưới header. */}
        <section aria-labelledby="home-title" className="border-b border-line-strong bg-white">
          <div className="site-wrap find-grid pt-4 pb-4 md:pt-8 md:pb-10">
            <div className="min-w-0">
              <h1 id="home-title" className="text-h1-m font-semibold text-ink md:text-h1">
                {M.home.title}
              </h1>
              {/* Dòng số liệu: tổng DN và số tỉnh/thành (đã có sẵn từ danh mục tỉnh, không gọi thêm API). */}
              {provinces.length > 0 && (
                <p className="mt-1 mb-3 text-sm text-muted tabular-nums md:mb-5">
                  <span className="whitespace-nowrap">
                    {M.search.provinceCount(formatNumber(totalCompanies))}
                  </span>
                  <span aria-hidden="true" className="px-1 text-line-strong">
                    ·
                  </span>
                  <span className="whitespace-nowrap">
                    {provinces.length} {M.nav.provinces.toLowerCase()}
                  </span>
                </p>
              )}
              <div data-hero-search className={provinces.length > 0 ? '' : 'mt-5'}>
                <SearchBox size="lg" autoFocusDesktop />
              </div>
            </div>
            <div className="mt-1 flex items-center md:mt-0 md:h-[52px]">
              <AdvancedSearchLink />
            </div>
          </div>
        </section>

        {/* Phần dưới hero: cùng khung .site-wrap với header/hero → mép trái mọi khối x=120 ở 1440. Nhịp dọc hệ A:
            đầu trang 40 (điện thoại 24), giữa các khối 48 (điện thoại 40). Footer tự có mt-12 nên không đệm đáy. */}
        <div className="site-wrap flex flex-col gap-10 pt-6 md:gap-12 md:pt-10">
          <section aria-labelledby="prov-title">
            <SectionHeader
              id="prov-title"
              title={M.home.provincesTitle}
              meta={`${provinces.length} ${M.nav.provinces.toLowerCase()}`}
            />
            {/* Bảng kê A–Z rộng hết khung như bản mẫu A (không bản đồ): ≥ 1024px 4 cột, 768–1023 3 cột đọc dọc từng
                cột như mục lục sổ đăng ký (số hàng mỗi cột đặt qua biến CSS); điện thoại 2 cột đọc theo HÀNG
                (An Giang | Bắc Ninh / Cà Mau | …) — đọc dọc 17 hàng thì mắt phải nhảy từ đáy cột trái lên đầu cột phải,
                vần A–Z bị đứt. Xem .prov-index trong globals.css. Tỉnh chưa có DN: chữ xám, không làm link (bấm vào
                chỉ ra trang rỗng). */}
            <ul
              className="prov-index"
              style={{
                '--rows-3': Math.ceil(sorted.length / 3),
                '--rows-4': Math.ceil(sorted.length / 4),
              }}
            >
              {sorted.map((p) => {
                const count = (
                  <span className="flex-none text-sm text-muted tabular-nums">
                    {formatNumber(p.company_count || 0)}
                    <span className="sr-only">{M.home.companiesSr}</span>
                  </span>
                );
                return (
                  <li key={p.code} className="min-w-0">
                    {p.company_count > 0 ? (
                      <Link href={`/tinh/${p.slug}`} prefetch={false} className="prov-link">
                        <span className="prov-name">{p.name}</span>
                        {count}
                      </Link>
                    ) : (
                      <span className="prov-link is-empty">
                        <span className="prov-name">{p.name}</span>
                        {count}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <AdSlot slotId="home-mid" />

          <section aria-labelledby="new-title">
            <SectionHeader
              id="new-title"
              title={M.home.newTitle}
              action={{ href: '/doanh-nghiep-moi-thanh-lap' }}
            />
            {/* 20 DN (spec 3.1) như bản mẫu A: ≥ 640px 2 cột (10 hàng đủ, 20 chia hết cho 2), điện thoại 1 cột.
                Lưới 4 cột thành «bức tường» 20 tên in hoa san sát; 2 cột thoáng, thẻ đủ rộng để hiện dạng thẻ A
                (nhãn tình trạng cùng hàng tên, hàng Mã số thuế · Ngày · Đại diện có nhãn — xem CompanyCard). Thẻ
                không hộp, ngăn nhau bằng kẻ mảnh dưới; khe ngang 48 như khe cột chính – cột phải (tablet 24). */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 lg:gap-x-12">
              {newest.map((c) => (
                <li key={c.mst} className="min-w-0">
                  <CompanyCard company={c} variant="card" showNew={false} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
