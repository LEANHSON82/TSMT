import Breadcrumb from './Breadcrumb';
import CompanyList from './CompanyList';
import Pagination from './Pagination';
import { EmptyState } from './States';
import { M } from '@/lib/messages';
import { formatNumber } from '@/lib/format';

/**
 * Bố cục chung cho kết quả tìm kiếm và trang danh sách tỉnh / ngành / DN mới (spec mục 3.2, 3.5):
 * H1, đoạn mô tả ngắn (SEO), tổng số DN, bộ lọc, 20 thẻ DN/trang, banner sau dòng 5 và 15, phân trang số.
 */
export default function ListPageShell({
  breadcrumb,
  title,
  description,
  totalLabel,
  filters,
  data,
  basePath,
  params,
  emptyTitle = M.list.emptyTitle,
  emptyHints = [M.list.emptyHint],
  slotPrefix,
  highlight,
  showNew = true,
  showProvince = true,
  aside,
}) {
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.page_size || 20)));
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pt-4 pb-12 md:px-6 md:pt-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      {/* aside: hình trang trí bên phải tiêu đề (≥ 768px), không chiếm chỗ trên điện thoại. */}
      <header className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-2xl leading-8 font-semibold text-pretty text-navy md:text-3xl md:leading-9">
            {title}
            {data.page > 1 && (
              <span className="font-normal text-muted"> – {M.pagination.page(data.page)}</span>
            )}
          </h1>
          {description && <p className="max-w-3xl text-body leading-6 text-ink-2">{description}</p>}
          {totalLabel !== false && (
            <p className="text-sm font-semibold text-muted">
              {totalLabel ?? M.list.total(formatNumber(data.total || 0))}
            </p>
          )}
        </div>
        {aside && <div className="hidden flex-none md:block">{aside}</div>}
      </header>
      {filters}
      {/* data-list-content: mờ đi khi đang chuyển trang / đổi bộ lọc (NavigationProgress). */}
      <div data-list-content className="flex flex-col gap-5">
        {data.items?.length ? (
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
          <EmptyState title={emptyTitle} hints={emptyHints} />
        )}
      </div>
    </main>
  );
}
