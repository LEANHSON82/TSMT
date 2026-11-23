import PageHero, { PAGE_H1 } from './PageHero';
import { IconChevronDown } from './Icons';
import { M } from '@/lib/messages';

const SHOW_DRAFT_NOTE = process.env.NEXT_PUBLIC_SHOW_DRAFT_NOTE === '1';

/**
 * Mẫu trang tĩnh (văn bản dài, có mục lục). sections: [{ id, title, body: ReactNode }]
 * Nội dung chính thức do owner gửi sau (spec mục 2) — hiện là BẢN NHÁP.
 *
 * Hệ A: H1 cùng chỗ với mọi trang (mép trái khung, breadcrumb trên 20 / dưới 16). Lưới cột chính + cột phải
 * (.rail-grid, từ 1280px) bắt đầu ngay dưới breadcrumb: H1 nằm trong cột bài, mục lục ở cột phải 300 cùng đỉnh
 * với H1 (dính khi cuộn) — không có dải trống trên mục lục. Dòng chữ giới hạn ~75 ký tự cho dễ đọc. Không hình
 * minh hoạ, không hộp: mở bài bằng vạch 2px, các mục ngăn bằng kẻ mảnh như văn bản đăng ký.
 */
// Bề rộng dòng chữ: 680px ≈ 75–80 ký tự tiếng Việt cỡ 16 (đo bằng Playwright); ở 1440 còn 172px tới khe cột
// phải (852 − 680) thay vì 212 như bản 640.
const MEASURE = 'max-w-[680px]';

export default function StaticPage({ title, intro, sections, updated = '15/11/2026' }) {
  const hasToc = sections.length > 2;
  const hasHeader = Boolean(SHOW_DRAFT_NOTE || intro); // H1 + ngày cập nhật đã ở dải đầu trang
  const tocItems = sections.map((s, i) => (
    <li key={s.id}>
      <a
        href={`#${s.id}`}
        className="flex min-h-11 items-start gap-2 py-2.5 text-body leading-6 no-underline hover:text-brand-hover"
      >
        <span className="w-5 flex-none text-muted tabular-nums">{i + 1}.</span>
        {s.title}
      </a>
    </li>
  ));
  return (
    <main className="pb-12 md:pb-16">
      {/* Dải đầu trang dùng chung (PageHero): breadcrumb, H1, ngày cập nhật. */}
      <PageHero breadcrumb={[{ name: title }]}>
        <h1 className={PAGE_H1}>{title}</h1>
        <p className="mt-2 text-sm text-ink-2 tabular-nums">{M.staticPage.updated(updated)}</p>
      </PageHero>
      <div className="site-wrap rail-grid mt-5 md:mt-8">
        <article className="card min-w-0 px-5 py-6 md:px-10 md:py-9">
          {hasHeader && (
            <header className={`flex flex-col gap-2 ${MEASURE}`}>
              {/* Ghi chú bản nháp: chỉ hiện ở môi trường duyệt nội dung (NEXT_PUBLIC_SHOW_DRAFT_NOTE=1), không hiện cho
                người dùng thật. */}
              {SHOW_DRAFT_NOTE && (
                <p className="mt-2 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
                  {M.staticPage.draftNote}
                </p>
              )}
              {intro && <p className="mt-2 text-body leading-7 text-ink-2">{intro}</p>}
            </header>
          )}

          {/* Dưới 1280px: mục lục thu gọn ngay trên bài (chưa có cột phải); vạch 2px của bài khép đáy hàng
              «Mục lục» nên không thành hai đường kẻ chồng nhau. */}
          {hasToc && (
            <nav
              aria-label={M.staticPage.toc}
              className={`xl:hidden ${hasHeader ? 'mt-5 md:mt-8' : ''} ${MEASURE}`}
            >
              <details className="group border-t border-line">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 font-semibold text-ink">
                  {M.staticPage.toc}
                  <span className="flex items-center gap-2 text-sm font-normal text-muted tabular-nums">
                    {M.staticPage.tocCount(sections.length)}
                    <IconChevronDown
                      size={18}
                      className="transition-transform group-open:rotate-180"
                    />
                  </span>
                </summary>
                <ol className="pb-2">{tocItems}</ol>
              </details>
            </nav>
          )}
          <div
            className={`${MEASURE} ${
              hasHeader
                ? `border-t border-line ${hasToc ? 'xl:mt-8' : 'mt-5 md:mt-8'}`
                : hasToc
                  ? 'border-t border-line xl:border-t-0'
                  : ''
            } [&>section:first-child]:pt-0`}
          >
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-t`}
                className="border-b border-line py-6 last:border-b-0"
              >
                <h2
                  id={`${s.id}-t`}
                  className="text-h2-m font-semibold text-pretty text-ink md:text-h2"
                >
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-3 flex flex-col gap-3 text-body leading-7 text-ink [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </article>

        {hasToc && (
          <aside className="card hidden px-4 pt-1 pb-2 xl:sticky xl:top-24 xl:block">
            <nav aria-labelledby="toc-title">
              <p id="toc-title" className="pt-3 pb-2 text-body font-semibold text-ink">
                {M.staticPage.toc}
              </p>
              <ol className="border-t border-line pt-1">{tocItems}</ol>
            </nav>
          </aside>
        )}
      </div>
    </main>
  );
}
