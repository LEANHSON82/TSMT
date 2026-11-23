import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import CompanyCard from '@/components/CompanyCard';
import JsonLd from '@/components/JsonLd';
import SearchBox from '@/components/SearchBox';
import { AdvancedSearchLink } from '@/components/HeaderBar';
import SectionHeader from '@/components/SectionHeader';
import { getProvinces, listCompanies, searchCompanies } from '@/lib/api';
import { daysAgoVN, todayVN } from '@/lib/filters';
import { formatDate, formatNumber } from '@/lib/format';
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
  const dayGroups = groupByDay(newest);
  // Lối tắt «Xem theo tỉnh»: 6 tỉnh nhiều DN nhất → trang DN mới của tỉnh đó.
  const topProvinces = [...provinces]
    .sort((a, b) => (b.company_count || 0) - (a.company_count || 0))
    .slice(0, 6);
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
        <section aria-labelledby="home-title" className="hero-tint border-b border-line">
          <div className="site-wrap">
            <div className="mx-auto max-w-[820px] pt-6 pb-7 md:pt-12 md:pb-12">
              <h1
                id="home-title"
                className="text-[26px] leading-8 font-semibold tracking-[-0.01em] text-pretty text-title md:text-[34px] md:leading-[42px]"
              >
                {/* «thông tin» không bị tách đôi khi tiêu đề xuống dòng trên điện thoại. */}
                {M.home.title.replace('thông tin', 'thông\u00a0tin')}
              </h1>
              {/* Dòng số liệu: tổng DN và số tỉnh/thành (đã có sẵn từ danh mục tỉnh, không gọi thêm API). */}
              {provinces.length > 0 && (
                <p className="mt-2 text-base text-muted tabular-nums md:text-[18px] md:leading-7">
                  <span className="whitespace-nowrap">
                    {M.search.provinceCount(formatNumber(totalCompanies))}
                  </span>
                  <span aria-hidden="true" className="px-1.5 text-line-strong">
                    ·
                  </span>
                  <span className="whitespace-nowrap">
                    {provinces.length} {M.nav.provinces.toLowerCase()}
                  </span>
                </p>
              )}
              <div data-hero-search className="mt-6 md:mt-8">
                <SearchBox size="lg" autoFocusDesktop />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
                <p className="text-sm text-muted">{M.home.mstHint}</p>
                <AdvancedSearchLink className="text-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Phần dưới hero: cùng khung .site-wrap với header/hero → mép trái mọi khối x=120 ở 1440. Nhịp dọc hệ A:
            đầu trang 40 (điện thoại 24), giữa các khối 48 (điện thoại 40). Footer tự có mt-12 nên không đệm đáy. */}
        <div className="site-wrap flex flex-col gap-5 pt-5 pb-12 md:gap-6 md:pt-6 md:pb-16">
          <section aria-labelledby="prov-title" className="panel">
            {/* API lỗi / chưa có dữ liệu: nói rõ thay vì để khung trống (spec mục 3: trạng thái lỗi/rỗng). */}
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
            {sorted.length === 0 && <HomeEmpty text={M.home.emptyProvinces} />}
            <ul
              hidden={sorted.length === 0}
              className="prov-index px-4 pt-1 pb-3 md:px-[22px] md:pb-4"
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

          {/* Khối DN mới (spec 3.1 mục 4: 20 DN mới nhất, thẻ DN mục 3.3 + link xem tất cả). Cho người xem thấy ngay ý
              nghĩa: số DN mới trong 30 ngày, lối tắt theo tỉnh, và danh sách nhóm theo ngày hoạt động (ngày ở tiêu đề
              nhóm nên mỗi thẻ không lặp lại). Máy tính: mỗi DN một hàng dạng bảng (MST · đại diện · tình trạng). */}
          <section aria-labelledby="new-title" className="panel">
            <SectionHeader
              tier="secondary"
              id="new-title"
              title={M.home.newTitle}
              action={{ href: '/doanh-nghiep-moi-thanh-lap' }}
            />
            {newest.length === 0 && <HomeEmpty text={M.home.emptyNew} />}
            {newest.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line-soft px-4 py-3 md:px-5">
                {newTotal != null && (
                  <p className="text-body text-ink-2">
                    <span className="text-[20px] leading-7 font-semibold text-title tabular-nums">
                      {formatNumber(newTotal)}
                    </span>{' '}
                    {M.home.newCount}
                  </p>
                )}
                {topProvinces.length > 0 && (
                  // Điện thoại: một hàng cuộn ngang (không chiếm 3 dòng).
                  <nav
                    aria-label={M.home.newByProvince}
                    className="flex items-center gap-2 max-md:-mx-4 max-md:w-[calc(100%+2rem)] max-md:overflow-x-auto max-md:px-4 max-md:pb-1 md:flex-wrap"
                  >
                    <span className="flex-none text-sm text-muted">{M.home.newByProvince}</span>
                    {topProvinces.map((p) => (
                      <Link
                        key={p.code}
                        href={`/doanh-nghiep-moi-thanh-lap?tinh=${p.slug}`}
                        prefetch={false}
                        className="inline-flex min-h-8 flex-none items-center rounded-full border border-line-strong bg-white px-3 text-sm font-semibold whitespace-nowrap text-ink-2 no-underline hover:border-brand hover:text-brand"
                      >
                        {p.name}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>
            )}
            {dayGroups.map((g) => (
              <div key={g.date}>
                <h3 className="flex items-baseline justify-between gap-3 border-b border-line-soft bg-page px-4 py-1.5 text-sm font-semibold text-ink-2 md:px-5">
                  <span>{g.heading}</span>
                  <span className="font-normal text-muted tabular-nums">
                    {M.home.dayGroupCount(g.items.length)}
                  </span>
                </h3>
                <ol>
                  {g.items.map((c) => (
                    <li key={c.mst} className="border-b border-line-soft last:border-b-0">
                      <CompanyCard
                        company={c}
                        variant="row"
                        headingLevel={4}
                        showNew={false}
                        showDate={false}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}

/** 20 DN mới nhất → nhóm theo ngày hoạt động: [{ date, heading: «Hôm nay · 23/11/2026», items }]. */
function groupByDay(items) {
  const today = todayVN();
  const yesterday = daysAgoVN(1);
  const groups = [];
  for (const c of items) {
    const date = (c.founded_date || '').slice(0, 10);
    let g = groups[groups.length - 1];
    if (!g || g.date !== date) {
      const label = date === today ? M.home.today : date === yesterday ? M.home.yesterday : '';
      g = { date, heading: M.home.dayGroup(label, formatDate(date)), items: [] };
      groups.push(g);
    }
    g.items.push(c);
  }
  return groups;
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
