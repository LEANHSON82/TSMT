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
      {/* Thứ tự theo yêu cầu: tỉnh/thành → ô quảng cáo → DN mới thành lập. Spec 3.1 liệt kê
          DN mới (mục 4) trước tỉnh/thành (mục 5); ô quảng cáo vẫn nằm giữa hai khối (mục 6). */}
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

        {/* Phần dưới hero: cùng khung .site-wrap với header/hero → mép trái mọi khối x=120 ở 1440. Nhịp dọc hệ A:
            đầu trang 40 (điện thoại 24), giữa các khối 48 (điện thoại 40). Footer tự có mt-12 nên không đệm đáy. */}
        {/* Tỉnh/thành, ngành nghề: trên nền trang, tiêu đề và chữ trong ô căn giữa (theo yêu cầu). DN mới: tiêu đề căn
            trái, link «Xem tất cả» cùng hàng dòng tóm tắt. */}
        <div>
          <div className="site-wrap flex flex-col gap-10 pt-8 md:gap-12 md:pt-12">
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
        </div>

        <div className="site-wrap flex flex-col gap-8 pt-8 pb-12 md:gap-10 md:pt-10 md:pb-16">
          <AdSlot slotId="home-mid" />

          {/* Khối DN mới (spec 3.1 mục 4: 20 DN mới nhất, thẻ DN mục 3.3 + link xem tất cả), cùng kiểu hai khối duyệt ở
              trên: tiêu đề giữa, dòng tóm tắt, rồi danh sách liệt kê gọn. */}
          <section aria-labelledby="new-title">
            <h2 id="new-title" className="block-title mb-1!">
              {M.home.newTitle}
            </h2>
            {/* Dòng tóm tắt + «Xem tất cả» cùng một hàng dưới tiêu đề (điện thoại không đẩy tiêu đề xuống 2 dòng). */}
            {newest.length > 0 && (
              <div className="mb-3 flex items-center justify-between gap-x-4 md:mb-4">
                <p className="min-w-0 text-sm text-ink-2 md:text-[15px]">
                  {newTotal != null && (
                    <>
                      <span className="font-semibold text-title tabular-nums">
                        {formatNumber(newTotal)}
                      </span>{' '}
                      {M.home.newCount}
                    </>
                  )}
                </p>
                <Link
                  href="/doanh-nghiep-moi-thanh-lap"
                  className="inline-flex min-h-11 flex-none items-center gap-1 text-sm font-semibold whitespace-nowrap text-brand no-underline hover:text-brand-hover md:text-[15px]"
                >
                  {M.home.seeAll} <span aria-hidden="true">→</span>
                  <span className="sr-only">{M.home.newTitle.toLowerCase()}</span>
                </Link>
              </div>
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
