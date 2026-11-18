import Breadcrumb from './Breadcrumb';
import { IconAlert } from './Icons';
import { M } from '@/lib/messages';

/**
 * Mẫu trang tĩnh (văn bản dài, có mục lục). sections: [{ id, title, body: ReactNode }]
 * Nội dung chính thức do owner gửi sau (spec mục 2) — hiện là BẢN NHÁP.
 */
export default function StaticPage({
  title,
  intro,
  sections,
  updated = '15/11/2026',
  illustration,
}) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pt-4 pb-14 md:px-6 md:pt-6">
      <Breadcrumb items={[{ name: title }]} />
      <div className="mt-4 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        {sections.length > 2 && (
          <nav aria-label={M.staticPage.toc} className="lg:sticky lg:top-[96px] lg:self-start">
            <details
              open
              className="rounded-xl border border-line bg-white lg:border-0 lg:bg-transparent"
            >
              <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-navy lg:px-0">
                {M.staticPage.toc}
              </summary>
              <ol className="flex flex-col border-t border-line-soft px-4 py-2 lg:border-0 lg:px-0">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex min-h-11 items-center text-body no-underline"
                    >
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          </nav>
        )}
        <article className="flex max-w-[760px] flex-col gap-6 lg:col-start-2">
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 flex-col gap-2">
                <h1 className="text-2xl leading-8 font-semibold text-navy md:text-3xl md:leading-[38px]">
                  {title}
                </h1>
                <p className="text-sm text-muted">{M.staticPage.updated(updated)}</p>
              </div>
              {illustration && <div className="hidden flex-none sm:block">{illustration}</div>}
            </div>
            <p className="flex gap-2 rounded-lg border border-[#F6D58E] bg-warn-bg px-3.5 py-2.5 text-sm text-[#7A3E06]">
              <IconAlert size={18} className="mt-px flex-none" />
              {M.staticPage.draftNote}
            </p>
            {intro && <p className="text-base leading-7 text-ink-2">{intro}</p>}
          </header>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-6">
              <h2 id={`${s.id}-t`} className="mb-2 text-xl leading-7 font-semibold text-navy">
                {i + 1}. {s.title}
              </h2>
              <div className="flex flex-col gap-3 text-base leading-7 text-ink [&_li]:ml-5 [&_ul]:list-disc">
                {s.body}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
