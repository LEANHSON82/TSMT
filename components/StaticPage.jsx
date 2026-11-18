import Breadcrumb from './Breadcrumb';
import { M } from '@/lib/messages';

/**
 * Mẫu trang tĩnh (văn bản dài, có mục lục). sections: [{ id, title, body: ReactNode }]
 * Nội dung chính thức do owner gửi sau (spec mục 2) — văn bản hiện tại là bản nháp (README «Để sau»), không hiện
 * hộp «Bản nháp» cho người dùng.
 */
export default function StaticPage({ title, intro, sections, updated = '15/11/2026' }) {
  return (
    <main className="flex w-full flex-col">
      <div className="border-b border-line bg-white">
        <header className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
          <Breadcrumb items={[{ name: title }]} />
          <h1 className="text-2xl leading-8 font-semibold text-navy md:text-[32px] md:leading-10">
            {title}
          </h1>
          <p className="text-sm text-muted">{M.staticPage.updated(updated)}</p>
        </header>
      </div>
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pt-6 pb-14 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
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
          {intro && <p className="text-base leading-7 text-ink-2">{intro}</p>}
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
