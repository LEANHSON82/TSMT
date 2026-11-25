import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import CompanyList from '@/components/CompanyList';
import MobileMore from '@/components/MobileMore';
import JsonLd from '@/components/JsonLd';
import SearchBox from '@/components/SearchBox';
import { AdvancedSearchLink } from '@/components/HeaderBar';
import SectionHeader from '@/components/SectionHeader';
import { getProvinces, listCompanies, searchCompanies } from '@/lib/api';
import { POPULAR_INDUSTRIES } from '@/lib/popular-industries';
import { daysAgoVN } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { M, NEW_WINDOW_DAYS } from '@/lib/messages';

// ISR, làm mới 10 phút (spec mục 2).
export const revalidate = 600;

export const metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  // Lỗi API thì ném lỗi: Next giữ bản trang chủ cũ đã cache thay vì cache 10 phút một trang trống.
  const [latest, provinces] = await Promise.all([
    listCompanies({ sort: 'founded_desc', page: 1 }),
    getProvinces(),
  ]);
  const newest = (latest.items || []).slice(0, 20);
  // Số DN mới (hoạt động trong 30 ngày gần nhất) cho tiêu đề khối; không lấy được thì ẩn con số.
  const newTotal = await searchCompanies({ foundedFrom: daysAgoVN(NEW_WINDOW_DAYS) })
    .then((d) => d.total ?? null)
    .catch(() => null);

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
      {/* Thứ tự đúng spec 3.1: ô tìm → DN mới thành lập (mục 4) → ô quảng cáo (mục 6) → tỉnh/thành (mục 5) → ngành
          nghề. */}
      <main className="flex w-full flex-col">
        {/* Hero: nền trắng, tiêu đề + dòng số liệu + ô tìm lớn (viên tròn, nút «Tìm» navy). Từ 1024px ô tìm của header
            ẩn cho tới khi ô tìm này cuộn khuất (data-hero-search). */}
        {/* Nền xanh xám nhạt chuyển dần (như hero BizLookup) — header trắng phía trên nổi rõ, không hoà vào nền. */}
        <section aria-labelledby="home-title" className="hero-tint">
          <div className="site-wrap">
            <div className="mx-auto max-w-[820px] pt-6 pb-7 md:pt-12 md:pb-12">
              <h1
                id="home-title"
                className="text-center text-[26px] leading-8 font-semibold tracking-[-0.01em] text-pretty text-title md:text-[34px] md:leading-[42px]"
              >
                {/* «thông tin» không bị tách đôi khi tiêu đề xuống dòng trên điện thoại. */}
                {M.home.title.replace('thông tin', 'thông\u00a0tin')}
              </h1>
              {/* Dòng số liệu: tổng DN và số tỉnh/thành (đã có sẵn từ danh mục tỉnh, không gọi thêm API). */}
              {provinces.length > 0 && (
                // Số liệu là thứ đáng khoe nhất của trang dữ liệu: số to, đậm, màu tiêu đề; nhãn nhỏ xám.
                <p className="mt-3 flex items-baseline justify-center gap-x-6 text-base text-muted tabular-nums md:gap-x-8 md:text-[17px]">
                  <span className="whitespace-nowrap">
                    <span className="mr-1.5 text-[24px] leading-8 font-bold text-title md:text-[28px]">
                      {formatNumber(totalCompanies)}
                    </span>
                    {M.home.statCompanies}
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="mr-1.5 text-[24px] leading-8 font-bold text-title md:text-[28px]">
                      {provinces.length}
                    </span>
                    {M.nav.provinces.toLowerCase()}
                  </span>
                </p>
              )}
              <div data-hero-search className="mt-6 md:mt-8">
                <SearchBox size="lg" autoFocusDesktop />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                <AdvancedSearchLink className="text-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Phần dưới hero: cùng khung .site-wrap với header/hero → mép trái mọi khối x=120 ở 1440. Nhịp dọc: đầu trang
            48 (điện thoại 32), giữa các khối 48 (điện thoại 40). */}
        <div className="site-wrap flex flex-col gap-10 pt-8 pb-12 md:gap-12 md:pt-12 md:pb-16">
          {/* Khối DN mới (spec 3.1 mục 4: 20 DN mới nhất, thẻ DN mục 3.3; không phân trang, không link «Xem tất cả»):
              tiêu đề căn trái, dòng tóm tắt. */}
          <section aria-labelledby="new-title">
            <h2 id="new-title" className="block-title mb-1!">
              {M.home.newTitle}
            </h2>
            {/* Dòng tóm tắt dưới tiêu đề. Không có link «Xem tất cả» sang danh sách phân trang (chủ dự án yêu cầu
                25/11/2026: trang chủ không dẫn vào phân trang; trang DN mới vẫn vào được từ menu header). */}
            {newest.length > 0 && newTotal != null && (
              <p className="mb-3 text-sm leading-11 text-ink-2 md:mb-4 md:text-[15px]">
                <span className="font-semibold text-title tabular-nums">
                  {formatNumber(newTotal)}
                </span>{' '}
                {M.home.newCount}
              </p>
            )}
            {newest.length === 0 && <HomeEmpty text={M.home.emptyNew} />}
            {/* Cùng kiểu danh sách với trang DN mới / tỉnh / ngành: máy tính mỗi DN một hàng ngang (bảng), điện thoại
                mỗi DN một thẻ «Nhãn │ Giá trị». Không chèn quảng cáo (ô quảng cáo trang chủ nằm giữa các khối). */}
            {newest.length > 0 && (
              <MobileMore moreLabel={M.home.moreNew(Math.max(0, newest.length - 8))}>
                <CompanyList
                  items={newest}
                  ads={false}
                  headingLevel={3}
                  showNew={false}
                  mobileLimit={8}
                />
              </MobileMore>
            )}
          </section>

          {/* Ô quảng cáo giữa khối DN mới và khối tỉnh/thành (spec 3.1 mục 6, 5.4). */}
          <AdSlot slotId="home-mid" />

          {/* Tỉnh/thành, ngành nghề nằm cuối trang (chủ dự án yêu cầu 24/11/2026): trên nền trang, tiêu đề và chữ
              trong ô căn giữa. */}
          <section aria-labelledby="prov-title">
            <h2 id="prov-title" className="block-title text-center">
              {M.home.provincesTitle}
            </h2>
            {sorted.length === 0 && <HomeEmpty text={M.home.emptyProvinces} />}
            {sorted.length > 0 && (
              <MobileMore moreLabel={M.home.moreProvinces(sorted.length)}>
                <ul className="browse-grid is-dense">
                  {sorted.map((p, i) => (
                    // Tỉnh nào cũng là link (tỉnh chưa có DN mở trang báo «chưa có doanh nghiệp»), không có ô xám.
                    <li key={p.code} className={`min-w-0 ${i >= 12 ? 'mobile-extra' : ''}`}>
                      <Link
                        href={`/tinh/${p.slug}`}
                        prefetch={false}
                        className="browse-tile is-row"
                      >
                        <span className="browse-name">{p.name}</span>
                        <span className="browse-count">
                          {formatNumber(p.company_count || 0)}
                          <span className="sr-only">{M.home.companiesSr}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </MobileMore>
            )}
          </section>

          {/* Ngành nghề: tên gọn (tên VSIC đầy đủ ở tooltip và trên trang ngành) để mọi ô hiện đủ chữ. */}
          <section aria-labelledby="ind-title">
            <h2 id="ind-title" className="block-title text-center">
              {M.home.industriesTitle}
            </h2>
            <MobileMore moreLabel={M.home.moreIndustries}>
              <ul className="browse-grid">
                {POPULAR_INDUSTRIES.map((n, i) => (
                  <li key={n.code} className={`min-w-0 ${i >= 8 ? 'mobile-extra' : ''}`}>
                    <Link href={n.href} prefetch={false} className="browse-tile" title={n.name}>
                      <span className="browse-name">{n.short || n.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </MobileMore>
          </section>
        </div>
      </main>
    </>
  );
}

// Khối trống khi API lỗi: câu thông báo + link tải lại (trang chủ là ISR — lần sau tải sẽ lấy bản mới).
function HomeEmpty({ text }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 px-4 py-4 text-body text-ink-2 md:px-[22px]">
      {text}
      <a href="" className="inline-flex min-h-11 items-center font-semibold">
        {M.home.retry}
      </a>
    </p>
  );
}
