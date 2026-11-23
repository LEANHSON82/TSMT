import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate, shortAddress } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';

// Dòng doanh nghiệp dùng chung (spec mục 3.3). KHÔNG BAO GIỜ hiện SĐT. Luôn nằm trong một khung .panel; các dòng
// ngăn nhau bằng vạch mảnh (do danh sách bao ngoài vẽ). Một bộ phần tử duy nhất, đổi bố cục bằng CSS grid:
//
//   Dạng «nhãn – giá trị» (điện thoại, khối DN mới trang chủ, DN cùng ngành):
//     TÊN DOANH NGHIỆP (+ MỚI)
//     MST          0321352228              ✓ Đang hoạt động      ← tình trạng luôn ở góc phải, cùng hàng MST
//     Đại diện     NGÔ MINH CƯỜNG
//     Hoạt động    11/11/2026
//     Địa chỉ      Số 123 Đường Lê Duẩn, …
//   Nhãn xám cột cố định 84px, giá trị chữ đậm màu chính → mắt lướt dọc theo cột giá trị.
//
//   Dạng bảng (variant="row" từ 1024px — trang kết quả / tỉnh / ngành / DN mới):
//     TÊN DOANH NGHIỆP              │ MST        │ Người đại diện │ Hoạt động từ │ ✓ Đang hoạt động
//     địa chỉ (xám)                 │ 0321352228 │ NGÔ MINH CƯỜNG │ 11/11/2026   │
//   Mỗi trường một cột thẳng hàng giữa các dòng (như bảng), nhãn nhỏ trên giá trị.
//
// Không tải trước trang DN (prefetch={false}). MST nằm trên lớp phủ để vẫn bôi đen/chép được.
// variant: 'row' (CompanyList) | 'card' (khối/lưới hẹp — luôn dạng nhãn – giá trị).
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN, MST, người đại diện.
// showNew: nhãn «MỚI» cho DN thành lập trong 7 ngày (tắt ở khối/trang «DN mới thành lập»).
// showProvince=false: trang theo tỉnh — địa chỉ chỉ ghi phường/xã (tỉnh đã có ở tiêu đề trang).
const NEW_DAYS = 7;
function isNew(foundedDate) {
  const t = Date.parse(foundedDate || '');
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86400000 && t <= Date.now() + 86400000;
}

export default function CompanyCard({
  company: c,
  variant = 'card',
  headingLevel = 3,
  highlight,
  showNew = true,
  showProvince = true,
}) {
  const H = `h${headingLevel}`;
  const href = companyPath(c);
  const addr = showProvince
    ? shortAddress(c.address) || areaAddress(c.address, c.province?.name)
    : areaAddress(c.address, c.province?.name, { withProvince: false });
  const date = formatDate(c.founded_date);
  const fresh = showNew && isNew(c.founded_date);
  const phone = c.matched === 'phone';
  // Chỉ tô sáng ở trường đã khớp (API trả matched). Không có matched (trang danh sách) → tô như trước.
  const hl = (field) => (!c.matched || c.matched === field ? highlight : undefined);
  const table = variant === 'row';

  // Một trường: nhãn + giá trị. Dạng nhãn – giá trị: 2 cột (nhãn 84px). Dạng bảng: nhãn nhỏ nằm trên giá trị.
  const field = table
    ? 'grid grid-cols-[84px_minmax(0,1fr)] items-baseline gap-x-2 lg:flex lg:flex-col lg:gap-0.5'
    : 'grid grid-cols-[84px_minmax(0,1fr)] items-baseline gap-x-2';
  const label = `text-[13px] leading-5 text-muted ${table ? 'lg:text-xs lg:leading-4' : ''}`;
  const value = 'min-w-0 text-sm leading-5 text-ink';

  return (
    <article
      className={`group relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-4 transition-colors duration-150 hover:bg-page/60 ${
        table
          ? 'px-4 md:px-5 lg:grid-cols-[minmax(0,1fr)_112px_minmax(0,190px)_104px_148px] lg:items-center lg:gap-x-6 lg:gap-y-0.5'
          : ''
      }`}
    >
      <H
        className={`col-span-2 mb-1 text-[15px] leading-6 font-semibold text-pretty md:text-base ${
          table ? 'lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:mb-0' : ''
        }`}
      >
        <Link
          href={href}
          prefetch={false}
          title={c.name}
          className="text-brand no-underline decoration-1 underline-offset-[3px] group-hover:underline after:absolute after:inset-0"
        >
          <Highlight text={c.name} query={hl('name')} />
        </Link>
        {fresh && <span className="tag tag-new ml-2 align-[2px]">{M.list.newBadge}</span>}
        {phone && (
          <span className="tag tag-brand ml-2 align-[1px]">{M.search.matchedPhoneBadge}</span>
        )}
      </H>

      <dl className="contents">
        <div className={`${field} ${table ? 'lg:col-start-2 lg:row-span-2 lg:row-start-1' : ''}`}>
          <dt className={label}>MST</dt>
          <dd className={`${value} relative z-10 font-semibold tracking-[0.01em] tabular-nums`}>
            <Highlight text={c.mst} query={hl('mst')} />
          </dd>
        </div>

        {/* Tình trạng: dạng nhãn – giá trị nằm góc phải hàng MST; dạng bảng là cột cuối. */}
        <div
          className={`col-start-2 row-start-2 self-baseline justify-self-end ${
            table ? 'lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:self-center' : ''
          }`}
        >
          <dt className="sr-only">{M.company.status}</dt>
          <dd>
            <StatusBadge status={c.status} />
          </dd>
        </div>

        {c.representative && (
          <div
            className={`${field} col-span-2 ${table ? 'lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1' : ''}`}
          >
            <dt className={label}>
              {table ? (
                <>
                  <span className="lg:hidden">{M.company.repShort}</span>
                  <span className="max-lg:hidden">{M.company.representative}</span>
                </>
              ) : (
                M.company.repShort
              )}
            </dt>
            <dd className={`${value} truncate font-semibold`} title={c.representative}>
              <Highlight text={c.representative} query={hl('representative')} />
            </dd>
          </div>
        )}

        {date && (
          <div
            className={`${field} col-span-2 ${table ? 'lg:col-span-1 lg:col-start-4 lg:row-span-2 lg:row-start-1' : ''}`}
          >
            <dt className={label}>
              {table ? (
                <>
                  <span className="lg:hidden">{M.list.activeLabelShort}</span>
                  <span className="max-lg:hidden">{M.list.activeLabel}</span>
                </>
              ) : (
                M.list.activeLabelShort
              )}
            </dt>
            <dd className={`${value} tabular-nums`}>{date}</dd>
          </div>
        )}

        {addr && (
          <div
            className={`${field} col-span-2 ${table ? 'lg:col-span-1 lg:col-start-1 lg:row-start-2' : ''}`}
          >
            <dt className={`${label} ${table ? 'lg:sr-only' : ''}`}>{M.company.addressShort}</dt>
            <dd
              className={`min-w-0 truncate text-sm leading-5 text-ink-2 ${table ? 'lg:text-muted' : ''}`}
              title={c.address}
            >
              {addr}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
