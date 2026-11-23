'use client';

// Nội dung trang 404 (spec mục 2, 3.4: trả đúng 404, CÓ Ô TÌM KIẾM). Ô tìm đặt ngay trong nội dung, dưới câu
// giải thích — người dùng đang cần tìm lại thì ô phải ở chỗ mắt đang đọc, không chỉ ở hàng 2 header. Đường dẫn là
// MST đúng định dạng mà chưa có dữ liệu → nói rõ «Không tìm thấy MST …» và điền sẵn MST đó vào ô (sửa từng chữ số
// rồi tìm lại). Ô tự focus trên máy tính (không trên điện thoại — bàn phím che màn hình), như trang chủ; chữ điền
// sẵn không tự lấy gợi ý (suggestPrefilled={false}) nên không bung hộp «Không có gợi ý…» đè lên lối đi tiếp.
// Hệ A: «Lỗi 404» nằm đúng chỗ breadcrumb ở các trang khác → H1 cùng vị trí dọc; ô tìm và danh sách lối đi tiếp
// rộng đúng cột chính (852, thẳng mép với ô tìm header); câu chữ giữ ~75 ký tự/dòng. Không hình minh hoạ.
import { useEffect, useState } from 'react';
import PageHero, { PAGE_H1 } from './PageHero';
import SearchBox from './SearchBox';
import { LinkList } from './States';
import { suggestCompanies } from '@/lib/api';
import { M } from '@/lib/messages';
import { companyPath, parseMstSlug } from '@/lib/mst';

const LINKS = [
  { href: '/', label: M.notFound.home },
  { href: '/doanh-nghiep-moi-thanh-lap', label: M.home.newTitle },
  { href: '/tim-kiem', label: M.list.advancedFilter },
];

export default function NotFoundContent() {
  // HTML trang 404 được dựng sẵn một lần (không biết đường dẫn) → đọc đường dẫn sau khi chạy ở trình duyệt.
  // undefined: chưa đọc đường dẫn (HTML dựng sẵn) · null: không phải MST · chuỗi: MST đúng định dạng.
  const [mst, setMst] = useState(undefined);
  // MST gõ sai một chữ số: gợi ý các MST cùng 8 số đầu (lấy từ API gợi ý có sẵn).
  const [near, setNear] = useState([]);
  useEffect(() => {
    setMst(parseMstSlug(window.location.pathname.replace(/^\//, ''))?.mst || null);
  }, []);
  useEffect(() => {
    if (!mst) return undefined;
    document.title = `${M.notFound.mstTitle(mst)} | ${document.title.split(' | ').pop()}`;
    const ctrl = new AbortController();
    suggestCompanies(mst.slice(0, 8), { signal: ctrl.signal })
      .then(({ items }) => setNear(items.filter((i) => i.mst !== mst).slice(0, 5)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [mst]);
  return (
    // Dải đầu trang dùng chung (PageHero): «Lỗi 404» thay breadcrumb, H1, câu giải thích, ô tìm. Lối đi tiếp bên dưới.
    <main className="pb-12 md:pb-16">
      <PageHero eyebrow={M.notFound.code}>
        <h1 className={PAGE_H1}>{mst ? M.notFound.mstTitle(mst) : M.notFound.title}</h1>
        <p className="mt-2 max-w-[680px] text-sm text-pretty text-ink-2 md:text-[15px]">
          {mst ? M.notFound.mstBody : M.notFound.body}
        </p>
        {/* key: biết MST (sau khi chạy ở trình duyệt) thì dựng lại ô với MST điền sẵn. */}
        <SearchBox
          key={mst || ''}
          defaultValue={mst || ''}
          autoFocusDesktop={mst !== undefined}
          suggestPrefilled={false}
          className="mt-5 max-w-[820px]"
        />
      </PageHero>
      <div className="site-wrap mt-6 md:mt-8">
        <div className="max-w-[820px]">
          {near.length > 0 && (
            <section aria-labelledby="near-mst" className="mb-6 md:mb-8">
              <h2 id="near-mst" className="pb-2 text-base font-semibold text-ink">
                {M.notFound.nearTitle(mst.slice(0, 8))}
              </h2>
              <LinkList
                label={M.notFound.nearTitle(mst.slice(0, 8))}
                links={near.map((c) => ({
                  href: companyPath(c),
                  label: c.name,
                  note: `MST ${c.mst}`,
                }))}
              />
            </section>
          )}
          <LinkList label={M.notFound.linksLabel} links={LINKS} />
        </div>
      </div>
    </main>
  );
}
