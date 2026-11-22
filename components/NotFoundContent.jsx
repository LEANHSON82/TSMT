'use client';

// Nội dung trang 404 (spec mục 2, 3.4: trả đúng 404, CÓ Ô TÌM KIẾM). Ô tìm đặt ngay trong nội dung, dưới câu
// giải thích — người dùng đang cần tìm lại thì ô phải ở chỗ mắt đang đọc, không chỉ ở hàng 2 header. Đường dẫn là
// MST đúng định dạng mà chưa có dữ liệu → nói rõ «Không tìm thấy MST …» và điền sẵn MST đó vào ô (sửa từng chữ số
// rồi tìm lại). Ô tự focus trên máy tính (không trên điện thoại — bàn phím che màn hình), như trang chủ; chữ điền
// sẵn không tự lấy gợi ý (suggestPrefilled={false}) nên không bung hộp «Không có gợi ý…» đè lên lối đi tiếp.
// Hệ A: «Lỗi 404» nằm đúng chỗ breadcrumb ở các trang khác → H1 cùng vị trí dọc; ô tìm và danh sách lối đi tiếp
// rộng đúng cột chính (852, thẳng mép với ô tìm header); câu chữ giữ ~75 ký tự/dòng. Không hình minh hoạ.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconChevronRight } from './Icons';
import SearchBox from './SearchBox';
import { M } from '@/lib/messages';
import { parseMstSlug } from '@/lib/mst';

const LINKS = [
  { href: '/', label: M.notFound.home },
  { href: '/doanh-nghiep-moi-thanh-lap', label: M.home.newTitle },
  { href: '/tim-kiem', label: M.list.advancedFilter },
];

export default function NotFoundContent() {
  // HTML trang 404 được dựng sẵn một lần (không biết đường dẫn) → đọc đường dẫn sau khi chạy ở trình duyệt.
  // undefined: chưa đọc đường dẫn (HTML dựng sẵn) · null: không phải MST · chuỗi: MST đúng định dạng.
  const [mst, setMst] = useState(undefined);
  useEffect(() => {
    setMst(parseMstSlug(window.location.pathname.replace(/^\//, ''))?.mst || null);
  }, []);
  return (
    <main className="site-wrap">
      <p className="pt-3 pb-3 text-sm text-muted md:pt-5 md:pb-4">{M.notFound.code}</p>
      <div className="max-w-[852px]">
        <h1 className="text-h1-m font-semibold break-words text-pretty text-ink md:text-h1">
          {mst ? M.notFound.mstTitle(mst) : M.notFound.title}
        </h1>
        <p className="mt-2 max-w-[680px] text-body leading-7 text-pretty text-ink-2">
          {mst ? M.notFound.mstBody : M.notFound.body}
        </p>
        {/* key: biết MST (sau khi chạy ở trình duyệt) thì dựng lại ô với MST điền sẵn. */}
        <SearchBox
          key={mst || ''}
          defaultValue={mst || ''}
          autoFocusDesktop={mst !== undefined}
          suggestPrefilled={false}
          className="mt-5"
        />
        <nav aria-label={M.notFound.linksLabel} className="mt-8 border-t-2 border-ink md:mt-10">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-line">
                <Link
                  href={l.href}
                  className="flex min-h-12 items-center justify-between gap-3 py-2 font-semibold no-underline hover:underline hover:underline-offset-[3px]"
                >
                  {l.label}
                  <IconChevronRight size={18} className="flex-none text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
