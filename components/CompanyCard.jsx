import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate, shortAddress } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';

// Dòng doanh nghiệp dùng chung (spec mục 3.3: tên · MST · địa chỉ rút gọn · người đại diện · ngày hoạt động · tình
// trạng). KHÔNG BAO GIỜ hiện SĐT. Một bộ phần tử, đổi bố cục bằng CSS grid:
//
//   Dạng gọn (điện thoại, khối DN mới trang chủ, DN cùng ngành) — 3 dòng, không nhãn lặp:
//     TÊN DOANH NGHIỆP (rộng hết hàng)
//     MST 0321352228 · Đại diện NGÔ MINH CƯỜNG          ✓ Đang hoạt động
//     Phường Hiệp Bình, TP Hồ Chí Minh · 11/11/2026
//
//   Dạng bảng (variant="row" từ 1024px — trang kết quả / tỉnh / ngành / DN mới; tiêu đề cột nằm MỘT lần ở đầu danh
//   sách, xem CompanyList): Tên DN + địa chỉ │ MST │ Người đại diện │ Ngày hoạt động │ Tình trạng.
//
// Không tải trước trang DN (prefetch={false}). MST nằm trên lớp phủ để vẫn bôi đen/chép được.
// variant: 'row' (CompanyList: bảng ≥ 1024px, gọn dưới đó) | 'card' (luôn dạng gọn).
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN, MST, người đại diện.
// showNew: nhãn «MỚI» cho DN thành lập trong 7 ngày (tắt ở khối/trang «DN mới thành lập»).
// showProvince=false: trang theo tỉnh — địa chỉ chỉ ghi phường/xã (tỉnh đã có ở tiêu đề trang).
const NEW_DAYS = 7;
function isNew(foundedDate) {
  const t = Date.parse(foundedDate || '');
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86400000 && t <= Date.now() + 86400000;
}

/** Lưới cột của dạng bảng — CompanyList dùng cùng giá trị cho hàng tiêu đề cột. */
export const TABLE_COLS = 'lg:grid-cols-[minmax(0,1fr)_116px_minmax(0,200px)_132px_150px]';

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
  // Dạng gọn: chỉ phường/xã + tỉnh (một dòng ngắn, còn chỗ cho ngày hoạt động).
  const area = areaAddress(c.address, c.province?.name, { withProvince: showProvince }) || addr;
  const date = formatDate(c.founded_date);
  const fresh = showNew && isNew(c.founded_date);
  const phone = c.matched === 'phone';
  // Chỉ tô sáng ở trường đã khớp (API trả matched). Không có matched (trang danh sách) → tô như trước.
  const hl = (field) => (!c.matched || c.matched === field ? highlight : undefined);
  const table = variant === 'row';
  const sep = (
    <span aria-hidden="true" className="px-1.5 text-line-strong">
      ·
    </span>
  );
  // Phần chỉ dùng cho dạng gọn (ẩn ở dạng bảng ≥ 1024px).
  const compactOnly = table ? 'lg:hidden' : '';

  return (
    <article
      // Rê chuột: tên DN đổi màu. Nền nhạt chỉ ở dạng bảng (hàng rộng hết khung); dạng gọn nằm trong ô có đệm nên
      // nền sẽ không phủ hết chiều ngang — không dùng.
      className={`group relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 py-3.5 transition-colors duration-150 ${
        table
          ? `card-row px-4 hover:bg-page/60 md:px-5 ${TABLE_COLS} lg:items-center lg:gap-x-6 lg:py-3`
          : ''
      }`}
    >
      {/* Cột 1: tên (dạng gọn: rộng hết hàng) + (dạng bảng) địa chỉ. */}
      <div className={`col-span-2 min-w-0 ${table ? 'lg:col-span-1' : ''}`}>
        <H className="text-[15px] leading-6 font-semibold text-pretty md:text-base">
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
        {table && addr && (
          <p
            className="mt-0.5 hidden truncate text-sm leading-5 text-muted lg:block"
            title={c.address}
          >
            <span className="sr-only">{M.company.address}: </span>
            {addr}
          </p>
        )}
      </div>

      {/* Tình trạng: dạng gọn ở cuối dòng MST (tên được rộng hết hàng); dạng bảng là cột cuối. */}
      <div
        className={`col-start-2 row-start-2 self-center justify-self-end ${table ? 'lg:col-start-5 lg:row-start-1' : ''}`}
      >
        <span className="sr-only">{M.company.status}: </span>
        <StatusBadge status={c.status} />
      </div>

      {/* Dạng gọn: MST và «Đại diện …» là hai cụm; hết chỗ thì cả cụm «Đại diện …» xuống dòng (không ngắt giữa). */}
      <p
        className={`col-start-1 row-start-2 flex min-w-0 flex-wrap gap-x-3 text-sm leading-5 text-ink-2 ${compactOnly}`}
      >
        <span className="whitespace-nowrap">
          MST{' '}
          <span className="relative z-10 font-semibold text-ink tabular-nums">
            <Highlight text={c.mst} query={hl('mst')} />
          </span>
        </span>
        {c.representative && (
          <span className="min-w-0">
            {M.company.repShort}{' '}
            <span className="font-semibold text-ink">
              <Highlight text={c.representative} query={hl('representative')} />
            </span>
          </span>
        )}
      </p>
      {(area || date) && (
        <p
          className={`col-span-2 truncate text-sm leading-5 text-muted ${compactOnly}`}
          title={c.address}
        >
          {area && (
            <>
              <span className="sr-only">{M.company.address}: </span>
              {area}
            </>
          )}
          {area && date && sep}
          {date && (
            <span className="tabular-nums">
              <span className="sr-only">{M.company.foundedDate}: </span>
              {date}
            </span>
          )}
        </p>
      )}

      {/* Dạng bảng: mỗi giá trị một cột (tiêu đề cột ở đầu danh sách). */}
      {table && (
        <>
          <p className="hidden text-sm font-semibold text-ink tabular-nums lg:col-start-2 lg:row-start-1 lg:block">
            <span className="sr-only">{M.company.mst}: </span>
            <span className="relative z-10">
              <Highlight text={c.mst} query={hl('mst')} />
            </span>
          </p>
          <p
            className="hidden truncate text-sm text-ink lg:col-start-3 lg:row-start-1 lg:block"
            title={c.representative}
          >
            <span className="sr-only">{M.company.representative}: </span>
            {c.representative ? (
              <Highlight text={c.representative} query={hl('representative')} />
            ) : (
              <span className="text-muted">—</span>
            )}
          </p>
          <p className="hidden text-sm text-ink-2 tabular-nums lg:col-start-4 lg:row-start-1 lg:block">
            <span className="sr-only">{M.company.foundedDate}: </span>
            {date || '—'}
          </p>
        </>
      )}
    </article>
  );
}
