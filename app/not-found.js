import Link from 'next/link';
import SearchBox from '@/components/SearchBox';
import { IllusNotFound } from '@/components/Illustrations';
import { M } from '@/lib/messages';

export const metadata = {
  title: M.notFound.title,
  robots: { index: false },
};

// Trả đúng HTTP 404 (spec mục 2). Có ô tìm kiếm để người dùng tìm lại (spec mục 3.4).
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 px-4 py-12 text-center md:py-20">
      <IllusNotFound className="w-[160px]" />
      <p className="text-sm font-semibold tracking-wide text-muted">{M.notFound.code}</p>
      <h1 className="text-2xl leading-8 font-semibold text-navy md:text-[28px] md:leading-9">
        {M.notFound.title}
      </h1>
      <p className="text-[15px] leading-6 text-ink-2">{M.notFound.body}</p>
      {/* data-hero-search: ô tìm trên header ẩn khi ô này còn trong màn hình (tránh 2 ô tìm). */}
      <div data-hero-search className="mt-2 w-full">
        <SearchBox size="lg" />
      </div>
      <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
        {M.notFound.home}
      </Link>
    </main>
  );
}
