import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate, shortAddress } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';

// Doanh nghiệp trong danh sách (spec mục 3.3: tên · MST · địa chỉ rút gọn · người đại diện · ngày hoạt động · tình
// trạng). KHÔNG BAO GIỜ hiện SĐT. Mỗi dạng chỉ đọc theo MỘT hướng:
//
//   Dạng bảng (variant="row" từ 1024px): MỘT hàng ngang, mỗi trường một cột thẳng hàng giữa các dòng (tiêu đề cột ở
//   đầu danh sách — CompanyList). Mắt đọc trái → phải.
//     Tên DN │ Mã số thuế │ Người đại diện │ Địa chỉ │ Ngày hoạt động │ Tình trạng
//
//   Dạng thẻ (điện thoại, khối hẹp như DN cùng ngành): tên DN, rồi mỗi trường một dòng «Nhãn │ Giá trị» thẳng cột
//   (nhãn 96px). Mắt đọc trên → dưới.
//     CÔNG TY TNHH …
//     Mã số thuế    0321352228
//     Đại diện      NGÔ MINH CƯỜNG
//     Địa chỉ       Phường Hiệp Bình, TP Hồ Chí Minh
//     Hoạt động     11/11/2026
//     Tình trạng    ✓ Đang hoạt động
//
// Một bộ phần tử (dl), đổi bố cục bằng CSS grid. Không tải trước trang DN (prefetch={false}). MST nằm trên lớp phủ
// link để vẫn bôi đen / chép được.
// variant: 'row' (CompanyList: bảng ≥ 1024px, thẻ dưới đó) | 'card' (luôn dạng thẻ).
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN, MST, người đại diện.
// showNew: nhãn «MỚI» cho DN thành lập trong 7 ngày (tắt ở khối/trang «DN mới thành lập»).
// showProvince=false: trang theo tỉnh — địa chỉ chỉ ghi phường/xã (tỉnh đã có ở tiêu đề trang).
const NEW_DAYS = 7;
function isNew(foundedDate) {
  const t = Date.parse(foundedDate || '');
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86400000 && t <= Date.now() + 86400000;
}

/** Cột của dạng bảng — CompanyList dùng cùng giá trị cho hàng tiêu đề cột. */
// Cột tên rộng nhất (~430px ở khung 1160; cột thứ 4 chỉ ghi tỉnh/thành nên hẹp): đo trên dữ liệu mẫu, tên chữ hoa 14px vừa một dòng ~80% (trước 286px/15px:
// ~20%). MST 120 (đủ MST chi nhánh 14 ký tự), tình trạng 124 (đủ «Ngừng hoạt động»).
export const TABLE_COLS =
  'lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,150px)_minmax(0,130px)_88px_124px]';

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
  // Địa chỉ rút gọn: phường/xã + tỉnh (trang tỉnh: chỉ phường/xã).
  // Địa chỉ rút gọn = phường/xã + tỉnh. Dạng bảng thiếu chỗ thì cắt phần phường/xã, KHÔNG cắt tên tỉnh.
  const ward = areaAddress(c.address, c.province?.name, { withProvince: false });
  const provinceName = showProvince ? c.province?.name || '' : '';
  const area =
    areaAddress(c.address, c.province?.name, { withProvince: showProvince }) ||
    shortAddress(c.address);
  const date = formatDate(c.founded_date);
  const fresh = showNew && isNew(c.founded_date);
  const phone = c.matched === 'phone';
  // Chỉ tô sáng ở trường đã khớp (API trả matched). Không có matched (trang danh sách) → tô như trước.
  const hl = (field) => (!c.matched || c.matched === field ? highlight : undefined);
  const table = variant === 'row';

  // Một trường: thẻ = hàng «nhãn 96px │ giá trị»; bảng = ô của cột (nhãn chỉ cho trình đọc màn hình).
  const field = (col) =>
    `grid min-w-0 grid-cols-[96px_minmax(0,1fr)] items-baseline gap-x-3 ${
      table ? `lg:block lg:row-start-1 ${col}` : ''
    }`;
  const label = `text-sm leading-6 text-muted ${table ? 'lg:sr-only' : ''}`;
  const value = `min-w-0 text-sm leading-6 text-ink ${table ? 'lg:truncate' : ''}`;

  return (
    <article
      className={`group relative grid grid-cols-1 gap-y-0.5 py-3.5 ${
        table
          ? `card-row px-4 transition-colors duration-150 hover:bg-page/60 md:px-5 ${TABLE_COLS} lg:items-center lg:gap-x-4 lg:py-3`
          : ''
      }`}
    >
      <H
        className={`mb-1 min-w-0 text-base leading-6 font-semibold text-pretty ${
          table
            ? 'lg:col-start-1 lg:row-start-1 lg:mb-0 lg:line-clamp-2 lg:text-[15px] lg:leading-6'
            : ''
        }`}
      >
        <Link
          href={href}
          prefetch={false}
          className="text-title no-underline group-hover:text-brand after:absolute after:inset-0"
        >
          <Highlight text={c.name} query={hl('name')} />
        </Link>
        {fresh && <span className="tag tag-new ml-2 align-[2px]">{M.list.newBadge}</span>}
        {phone && (
          <span className="tag tag-brand ml-2 align-[1px]">{M.search.matchedPhoneBadge}</span>
        )}
      </H>

      <dl className="contents">
        <div className={field('lg:col-start-2')}>
          <dt className={label}>{M.company.mst}</dt>
          {/* MST không bao giờ cắt (MST chi nhánh 14 ký tự vừa cột 132px). */}
          <dd className="relative z-10 min-w-0 text-sm leading-6 font-semibold whitespace-nowrap text-ink tabular-nums">
            <Highlight text={c.mst} query={hl('mst')} />
          </dd>
        </div>
        <div className={field('lg:col-start-3')}>
          <dt className={label}>{M.company.repShort}</dt>
          <dd className={value} title={table ? c.representative : undefined}>
            {c.representative ? (
              <Highlight text={c.representative} query={hl('representative')} />
            ) : (
              <span className="text-muted">—</span>
            )}
          </dd>
        </div>
        {/* Địa chỉ rút gọn một dòng (spec 3.3): chỉ tỉnh/thành (đủ để lọc nhanh, cần thì bấm xem chi tiết). Trang theo
            tỉnh (tỉnh đã ở tiêu đề): ghi phường/xã. Địa chỉ đầy đủ ở tooltip. */}
        <div className={field('lg:col-start-4')}>
          <dt className={label}>{showProvince ? M.company.provinceShort : M.company.wardShort}</dt>
          <dd className={`${value} text-ink-2`} title={table ? c.address : undefined}>
            {(showProvince ? provinceName : ward) || area || <span className="text-muted">—</span>}
          </dd>
        </div>
        <div className={field('lg:col-start-5')}>
          <dt className={label}>{M.list.activeLabelShort}</dt>
          <dd className={`${value} text-ink-2 tabular-nums`}>{date || '—'}</dd>
        </div>
        <div className={`${field('lg:col-start-6')} ${table ? 'lg:justify-self-end' : ''}`}>
          <dt className={label}>{M.company.status}</dt>
          <dd className="min-w-0">
            <StatusBadge status={c.status} plain={table} />
          </dd>
        </div>
      </dl>
    </article>
  );
}
