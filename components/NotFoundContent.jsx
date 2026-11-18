'use client';

// Nội dung trang 404 (spec mục 2, 3.4: trả đúng 404, có ô tìm kiếm). Đường dẫn là MST đúng định dạng mà chưa có
// dữ liệu → nói rõ «Không tìm thấy MST …» và điền sẵn MST vào ô tìm, thay vì báo lỗi chung chung.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SearchBox from './SearchBox';
import { IllusNotFound } from './Illustrations';
import { M } from '@/lib/messages';
import { parseMstSlug } from '@/lib/mst';

export default function NotFoundContent() {
  // HTML trang 404 được dựng sẵn một lần (không biết đường dẫn) → đọc đường dẫn sau khi chạy ở trình duyệt.
  const [mst, setMst] = useState(null);
  useEffect(() => {
    setMst(parseMstSlug(window.location.pathname.replace(/^\//, ''))?.mst || null);
  }, []);
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4 px-4 py-12 text-center md:py-20">
      <IllusNotFound className="w-[160px]" />
      {!mst && <p className="text-sm font-semibold tracking-wide text-muted">{M.notFound.code}</p>}
      <h1 className="text-2xl leading-8 font-semibold text-pretty text-navy md:text-3xl md:leading-9">
        {mst ? M.notFound.mstTitle(mst) : M.notFound.title}
      </h1>
      <p className="text-body leading-6 text-pretty text-ink-2">
        {mst ? M.notFound.mstBody : M.notFound.body}
      </p>
      {/* data-hero-search: ô tìm trên header ẩn khi ô này còn trong màn hình (tránh 2 ô tìm).
          key: điền lại MST khi đọc được đường dẫn (defaultValue chỉ dùng lúc tạo ô). */}
      <div data-hero-search className="mt-2 w-full">
        <SearchBox key={mst || ''} size="lg" defaultValue={mst || ''} />
      </div>
      <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
        {M.notFound.home}
      </Link>
    </main>
  );
}
