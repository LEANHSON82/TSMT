import Link from 'next/link';
import Breadcrumb from './Breadcrumb';
import CompanyList from './CompanyList';
import Pagination from './Pagination';
import { EmptyState } from './States';
import { M } from '@/lib/messages';
import { formatNumber } from '@/lib/format';

/**
 * Bố cục chung cho kết quả tìm kiếm và trang danh sách tỉnh / ngành / DN mới (spec mục 3.2, 3.5), hệ A:
 *   breadcrumb · H1 · mô tả ngắn (SEO)
 *   [intro]   — khối riêng của trang (trang tìm kiếm: gợi ý tỉnh, tab «Tìm theo», bộ lọc nâng cao, người đại diện)
 *   thanh công cụ: «29 doanh nghiệp · Hiển thị 1–20» bên trái, [filters] (ô chọn gọn) bên phải — cùng một khung cao
 *     44px ở mọi trang (trang tỉnh không có bộ lọc theo spec 3.5 → bên phải trống, bảng vẫn bắt đầu cùng y như
 *     trang ngành / DN mới; «Lọc nâng cao» đã có ở hàng ô tìm trên header nên không lặp lại ở đây)
 *   bảng 20 DN/trang (vạch 2px), banner sau dòng 5 và 15 · phân trang số
 * Mép trái mọi khối = mép logo (.site-wrap). Footer đã có khoảng cách trên → trang không cần đệm đáy.
 */
export default function ListPageShell({
  breadcrumb,
  title,
  description,
  intro,
  filters,
  data,
  basePath,
  params,
  emptyTitle = M.list.emptyTitle,
  emptyHints,
  slotPrefix,
  highlight,
  showNew = true,
  showProvince = true,
}) {
  const size = data.page_size || 20;
  const total = data.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const count = data.items?.length || 0;
  const from = (Math.max(1, data.page || 1) - 1) * size + 1;
  // Gợi ý khi rỗng: chỉ nhắc «bỏ bộ lọc» khi đang có bộ lọc bật; trang không bộ lọc (tỉnh) hoặc chưa lọc gì thì
  // chỉ đường sang tỉnh/thành khác (bảng tỉnh/thành ở trang chủ).
  const filtered = Object.values(params || {}).some(Boolean);
  const hints = emptyHints ?? (filters && filtered ? [M.list.emptyHint] : []);
  const showOther = !emptyHints && !(filters && filtered);
  return (
    <main className="site-wrap">
      {breadcrumb && (
        <div className="pt-3 md:pt-5">
          <Breadcrumb items={breadcrumb} />
        </div>
      )}
      <header className={breadcrumb ? 'mt-3 md:mt-4' : 'pt-4 md:pt-6'}>
        <h1 className="text-h1-m font-semibold text-pretty text-ink md:text-h1">
          {title}
          {data.page > 1 && (
            <span className="font-normal text-muted"> – {M.pagination.page(data.page)}</span>
          )}
        </h1>
        {/* Rộng tối đa 852 = cột chính: mép phải trùng mép phải nút «Tìm» trên header. */}
        {description && (
          <p className="mt-2 max-w-[852px] text-body text-pretty text-ink-2">{description}</p>
        )}
      </header>
      {intro && <div className="mt-5 flex flex-col gap-4 md:mt-6">{intro}</div>}
      {/* data-list-content: mờ đi khi đang chuyển trang / đổi bộ lọc (NavigationProgress). */}
      <div data-list-content className="mt-5 md:mt-8">
        {/* Thanh công cụ: khung cao 44px cố định (= ô chọn) ở mọi trang, chữ canh giữa dọc → chữ số đếm và chữ trong
            ô chọn cùng đường chân chữ (dòng chữ cao 44px như ô chọn); bảng bắt đầu cùng y dù trang có bộ lọc hay không. Không có DN nào: bỏ dòng
            «0 doanh nghiệp» (thông báo rỗng ngay dưới đã nói), vẫn giữ ô lọc để đổi lựa chọn. */}
        {(total > 0 || filters) && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-4">
            {total > 0 && (
              <p className="text-body leading-11 text-ink-2">
                <span className="text-h2 leading-none font-semibold text-ink tabular-nums">
                  {formatNumber(total)}
                </span>{' '}
                {M.list.countUnit}
                {count > 0 && (
                  <>
                    <span aria-hidden="true" className="px-2 text-line-strong">
                      ·
                    </span>
                    <span className="tabular-nums">
                      {M.list.showing(formatNumber(from), formatNumber(from + count - 1))}
                    </span>
                  </>
                )}
              </p>
            )}
            {filters && <div className="ml-auto flex min-w-0 gap-2 max-md:w-full">{filters}</div>}
          </div>
        )}
        {count ? (
          <>
            <CompanyList
              items={data.items}
              slotPrefix={slotPrefix}
              highlight={highlight}
              showNew={showNew}
              showProvince={showProvince}
            />
            <Pagination
              page={data.page}
              totalPages={totalPages}
              basePath={basePath}
              params={params}
            />
          </>
        ) : (
          <EmptyState title={emptyTitle} hints={hints}>
            {showOther && (
              <p className="text-body text-ink-2">
                <Link
                  href="/#prov-title"
                  className="inline-flex min-h-11 items-center font-semibold"
                >
                  {M.list.otherProvinces}
                </Link>
              </p>
            )}
          </EmptyState>
        )}
      </div>
    </main>
  );
}
