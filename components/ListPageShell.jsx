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
  emptyActions,
  slotPrefix,
  highlight,
  showNew = true,
  showProvince = true,
}) {
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.page_size || 20)));
  return (
    <main className="flex w-full flex-col">
      {/* Dải tiêu đề trắng (breadcrumb, H1, mô tả, tổng số) tách khỏi phần danh sách trên nền xám. */}
      <div className="border-b border-line bg-white">
        <header className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
          {breadcrumb && <Breadcrumb items={breadcrumb} />}
          <h1 className="text-2xl leading-8 font-semibold text-pretty text-navy md:text-[32px] md:leading-10">
            {title}
            {data.page > 1 && (
              <span className="font-normal text-muted"> – {M.pagination.page(data.page)}</span>
            )}
          </h1>
          {description && <p className="max-w-3xl text-body leading-6 text-ink-2">{description}</p>}
          {totalLabel !== false && (
            <p className="text-sm text-muted">
              {totalLabel ?? (
                <>
                  <strong className="text-base font-semibold text-ink tabular-nums">
                    {formatNumber(data.total || 0)}
                  </strong>{' '}
                  {M.list.totalUnit}
                </>
              )}
            </p>
          )}
        </header>
      </div>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pt-5 pb-12 md:px-6 md:pt-6">
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
            <EmptyState title={emptyTitle} hints={emptyHints}>
              {emptyActions}
            </EmptyState>
          )}
        </div>
      </div>
    </main>
  );
}
