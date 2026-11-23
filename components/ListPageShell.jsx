import Link from 'next/link';
import Breadcrumb from './Breadcrumb';
import CompanyList from './CompanyList';
import Pagination from './Pagination';
import { EmptyState, LinkList } from './States';
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
  emptyActions, // [{ href, label }] — lối đi tiếp bấm được khi không có kết quả
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
  const range =
    count > 0 ? M.list.showing(formatNumber(from), formatNumber(from + count - 1)) : null;
  return (
    <main className="flex flex-col">
      {/* Kiểu CafeF: breadcrumb, rồi khung trắng chứa H1 (đỏ), mô tả và phần đầu riêng của trang (tab, bộ lọc…);
          bên dưới là thanh số đếm + khung danh sách. */}
      <div className="site-wrap">
        {breadcrumb && (
          <div className="pt-3 md:pt-4">
            <Breadcrumb items={breadcrumb} />
          </div>
        )}
        <div
          className={`card px-4 py-3.5 md:px-6 md:py-5 ${breadcrumb ? 'mt-2 md:mt-3' : 'mt-4 md:mt-6'}`}
        >
          <header>
            <h1 className="text-[22px] leading-7 font-semibold text-pretty text-title md:text-[28px] md:leading-[34px]">
              {title}
              {data.page > 1 && (
                <span className="font-normal text-muted"> – {M.pagination.page(data.page)}</span>
              )}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-[760px] text-sm text-pretty text-muted md:text-[15px]">
                {description}
              </p>
            )}
          </header>
          {intro && <div className="mt-4 flex flex-col gap-4 md:mt-5">{intro}</div>}
        </div>
      </div>
      <div className="site-wrap pb-12 md:pb-16">
        {/* data-list-content: mờ đi khi đang chuyển trang / đổi bộ lọc (NavigationProgress). */}
        <div data-list-content className="mt-3 md:mt-4">
          {/* Thanh công cụ: khung cao 44px cố định (= ô chọn) ở mọi trang, chữ canh giữa dọc → chữ số đếm và chữ trong
            ô chọn cùng đường chân chữ (dòng chữ cao 44px như ô chọn); bảng bắt đầu cùng y dù trang có bộ lọc hay không. Không có DN nào: bỏ dòng
            «0 doanh nghiệp» (thông báo rỗng ngay dưới đã nói), vẫn giữ ô lọc để đổi lựa chọn. */}
          {/* role="status": đổi bộ lọc / trang thì trình đọc màn hình đọc số kết quả mới (WCAG 4.1.3). Điện thoại:
              «Sắp xếp» cùng hàng với số đếm. Khoảng «Hiển thị 1–20» nằm ở tiêu đề khung danh sách. */}
          {(total > 0 || filters) && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-3 md:gap-x-6 md:pb-4">
              <p role="status" className="text-sm leading-11 text-muted">
                {total > 0 && (
                  <>
                    <span className="font-semibold text-ink tabular-nums">
                      {formatNumber(total)}
                    </span>{' '}
                    {M.list.countUnit}
                  </>
                )}
              </p>
              {filters && <div className="ml-auto flex min-w-0 gap-2">{filters}</div>}
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
                title={M.list.listTitle}
                meta={range}
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
              <LinkList
                label={M.search.emptyActionsLabel}
                links={emptyActions}
                className="mt-2 max-w-[640px]"
              />
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
      </div>
    </main>
  );
}
