import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate, shortAddress } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';

// Thẻ doanh nghiệp dùng chung (spec mục 3.3). KHÔNG BAO GIỜ hiện SĐT.
// Không tải trước trang DN (prefetch={false}): một trang danh sách có 20 thẻ → tải trước 20 trang mà
// người dùng không mở (hàng trăm KB dữ liệu di động + render ISR ở máy chủ). Bấm vào vẫn có khung chờ.
// Cả thẻ bấm được (link tên DN phủ cả thẻ bằng ::after); MST nằm trên lớp phủ để vẫn bôi đen/chép được.
// Tên DN luôn màu xanh link — nhìn là biết bấm được.
//
// Hệ A, một bộ khung cho mọi chỗ. MỘT quy tắc cho nhãn tình trạng ở mọi dạng thẻ: nằm bên phải, cùng hàng
// tên DN (lưới "name status" như bản mẫu A); nhãn «Mới» / «Khớp SĐT» đứng cạnh nhãn tình trạng.
//   variant="row"  (CompanyList): từ 1024px là một dòng bảng, cột thẳng với hàng tiêu đề cột của CompanyList
//                   (ROW_COLS) — tình trạng có cột riêng, «Mới» đứng sau tên; dưới 1024px là thẻ gọn.
//   variant="card" (lưới trang chủ, DN cùng ngành): co giãn theo bề rộng CHÍNH thẻ (container query):
//                   thẻ < 440px = thẻ gọn; thẻ ≥ 440px = thẻ A: tên + nhãn, địa chỉ, hàng 3 cột có nhãn
//                   (Mã số thuế · Ngày hoạt động · Người đại diện).
// Thẻ gọn (~112–136px): tên (tối đa 2 dòng) + nhãn · «MST … · ngày» · địa chỉ 1 dòng · «Đại diện …».
// Không hộp, không bóng: thẻ ngăn nhau bằng đường kẻ mảnh (như dòng sổ đăng ký). Thẻ trong lưới cao bằng hàng
// (h-full, kẻ dưới thẳng nhau) nhưng nội dung dồn lên trên (content-start) — không chia phần dư vào giữa các dòng.
//
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN, MST, người đại diện.
// showNew: hiện nhãn «Mới» cho DN thành lập trong 7 ngày gần nhất (tắt ở khối/trang «DN mới thành lập»).
// showProvince=false: trang theo tỉnh — địa chỉ chỉ ghi phường/xã (tỉnh đã có ở tiêu đề trang).
const NEW_DAYS = 7;
function isNew(foundedDate) {
  const t = Date.parse(foundedDate || '');
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86400000 && t <= Date.now() + 86400000;
}

// Cột bảng từ 1024px: Tên + địa chỉ (giãn) · MST · Đại diện · Ngày · Tình trạng 140 (vừa nhãn 14px «Ngừng hoạt
// động»). 1024–1279: MST 136 (vừa MST chi nhánh «0327040928-003») / đại diện 152 / ngày 112 (vừa tiêu đề 14px «Ngày
// hoạt động»), khe 12 → cột tên 388px (trước 340), tên DN ít gãy dòng, dòng bảng cao đều hơn; ≥ 1280: MST 152 /
// đại diện 192 / ngày 112, khe 16. Tên người đại diện dài hơn cột thì xuống 2 dòng (không cắt «…» — tên người
// phải đọc đủ). CompanyList dùng đúng chuỗi này cho hàng tiêu đề cột → cột thẳng tuyệt đối, kể cả qua ô quảng cáo.
export const ROW_COLS =
  'lg:grid-cols-[minmax(0,1fr)_136px_152px_112px_140px] lg:gap-x-3 xl:grid-cols-[minmax(0,1fr)_152px_192px_112px_140px] xl:gap-x-4';

// Thẻ gọn: hàng 1 tên + nhãn; hàng 2 «MST» (vừa chữ) + ngày (phần còn lại); địa chỉ; đại diện.
const COMPACT =
  'grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-1.5 py-3 [grid-template-areas:"name_name_status"_"mst_date_date"_"addr_addr_addr"_"rep_rep_rep"]';
const ROW_LG =
  'lg:[grid-template-areas:"name_mst_rep_date_status"_"addr_mst_rep_date_status"] lg:items-start lg:py-4';
// Thẻ A (thẻ ≥ 440px): cột 128 · 128 · phần còn lại như .entry-kv của bản mẫu A.
const CARD_WIDE =
  'h-full content-start @min-[440px]:grid-cols-[128px_128px_minmax(0,1fr)_auto] @min-[440px]:gap-x-6 @min-[440px]:py-4 @min-[440px]:[grid-template-areas:"name_name_name_status"_"addr_addr_addr_addr"_"mst_date_rep_rep"]';

// Nhãn phụ: khớp theo số điện thoại (chỉ ghi nhãn, KHÔNG hiện số — số chỉ mở sau khi xem quảng cáo) và «Mới».
function Badges({ phone, fresh, className = '' }) {
  if (!phone && !fresh) return null;
  return (
    <span className={`flex-none gap-1 ${className}`}>
      {phone && <span className="tag tag-brand">{M.search.matchedPhoneBadge}</span>}
      {fresh && <span className="tag tag-brand">{M.list.newBadge}</span>}
    </span>
  );
}

export default function CompanyCard({
  company: c,
  variant = 'card',
  headingLevel = 3,
  highlight,
  showNew = true,
  showProvince = true,
}) {
  const row = variant === 'row';
  const H = `h${headingLevel}`;
  const href = companyPath(c);
  const addr = areaAddress(c.address, c.province?.name, { withProvince: showProvince });
  const date = formatDate(c.founded_date);
  const fresh = showNew && isNew(c.founded_date);
  const phone = c.matched === 'phone';
  // Chỉ tô sáng ở trường đã khớp (API trả matched): tìm «Đỗ Đức Lan» khớp người đại diện thì không tô «DO» trong
  // «DOANH NGHIỆP». Không có matched (trang danh sách, API cũ) → tô như trước.
  const hl = (field) => (!c.matched || c.matched === field ? highlight : undefined);
  // Class chỉ áp cho dạng danh sách (R) hoặc chỉ cho dạng thẻ lưới (C).
  const R = (cls) => (row ? cls : '');
  const C = (cls) => (row ? '' : cls);
  // Tiền tố chữ của thẻ gọn («MST», «·», «Đại diện»): ẩn ở dòng bảng (đã có hàng tiêu đề cột) và thẻ A (có nhãn).
  const prefix = `text-muted ${R('lg:hidden')} ${C('@min-[440px]:hidden')}`;
  // Nhãn trên giá trị của thẻ A (13px xám, như dt của bản mẫu A). Chỉ để nhìn — đã có nhãn sr-only.
  const label = (text) =>
    row ? null : (
      <span aria-hidden="true" className="hidden text-meta text-muted @min-[440px]:block">
        {text}
      </span>
    );
  // Hàng 3 cột của thẻ A cách địa chỉ 12px.
  const kv = C('@min-[440px]:mt-3');

  return (
    <article className={`group relative ${row ? '' : 'h-full border-b border-line @container'}`}>
      <div className={`${COMPACT} ${row ? `${ROW_COLS} ${ROW_LG}` : CARD_WIDE}`}>
        <div
          className={`flex min-w-0 items-start gap-2 pr-1.5 [grid-area:name] ${R('lg:pr-0')} ${C('@min-[440px]:pr-0')}`}
        >
          <H className="line-clamp-2 min-w-0 text-body leading-6 font-semibold">
            <Link
              href={href}
              prefetch={false}
              title={c.name}
              className="text-brand no-underline decoration-1 underline-offset-[3px] group-hover:underline after:absolute after:inset-0"
            >
              <Highlight text={c.name} query={hl('name')} />
            </Link>
          </H>
          {/* Dòng bảng máy tính: «Mới» đứng ngay sau tên (cột Tình trạng chỉ có nhãn tình trạng). */}
          {row && <Badges phone={phone} fresh={fresh} className="hidden lg:flex" />}
        </div>

        {/* Nhãn tình trạng: phải, cùng hàng tên. Thẻ gọn: «Mới» xếp dưới nhãn tình trạng (để tên còn chỗ trên
            điện thoại); thẻ A: «Mới» bên trái nhãn tình trạng. Dòng bảng: cột riêng, canh trái. */}
        <div
          className={`flex flex-col items-end gap-1 [grid-area:status] ${R('lg:items-start')} ${C('@min-[440px]:flex-row-reverse @min-[440px]:items-start')}`}
        >
          <StatusBadge status={c.status} />
          <Badges phone={phone} fresh={fresh} className={`flex ${R('lg:hidden')}`} />
        </div>

        <p
          className={`mt-1 text-sm leading-5 whitespace-nowrap text-ink [grid-area:mst] ${R('lg:mt-0 lg:text-body lg:leading-6')} ${kv}`}
        >
          <span className="sr-only">{M.company.mst}: </span>
          {label(M.company.mst)}
          <span aria-hidden="true" className={prefix}>
            MST{' '}
          </span>
          {/* Không tabular-nums: chữ số Inter dạng bảng làm số 1 hẹp → «0195 279394» trông như 2 cụm. */}
          <span className="relative z-10">
            <Highlight text={c.mst} query={hl('mst')} />
          </span>
        </p>

        <p
          className={`mt-1 min-w-0 truncate text-sm leading-5 text-ink-2 tabular-nums [grid-area:date] ${R('lg:mt-0 lg:text-body lg:leading-6 lg:text-ink')} ${C('@min-[440px]:text-ink')} ${kv}`}
        >
          {date && (
            <>
              <span className="sr-only">{M.company.foundedDate}: </span>
              {label(M.company.foundedDate)}
              <span aria-hidden="true" className={prefix}>
                ·{' '}
              </span>
              {date}
            </>
          )}
        </p>

        <p
          className={`mt-0.5 min-w-0 truncate text-sm leading-5 text-ink-2 [grid-area:addr] ${C('@min-[440px]:mt-1')}`}
          title={c.address}
        >
          <span className="sr-only">{M.company.address}: </span>
          {/* Dòng bảng máy tính và thẻ A đủ rộng → địa chỉ đầy đủ như bản mẫu A; thẻ gọn chỉ phường/xã (+ tỉnh) —
              số nhà, tên đường dài sẽ đẩy phần phường bị cắt mất. */}
          <span className={row ? 'lg:hidden' : '@min-[440px]:hidden'}>{addr}</span>
          <span className={row ? 'hidden lg:inline' : 'hidden @min-[440px]:inline'}>
            {shortAddress(c.address)}
          </span>
        </p>

        <p
          className={`mt-0.5 min-w-0 truncate text-sm leading-5 text-ink [grid-area:rep] ${R('lg:mt-0 lg:text-body lg:leading-6 lg:whitespace-normal')} ${kv}`}
        >
          <span className="sr-only">{M.company.representative}: </span>
          {label(M.company.representative)}
          <span aria-hidden="true" className={prefix}>
            {M.company.repShort}{' '}
          </span>
          <Highlight text={c.representative} query={hl('representative')} />
        </p>
      </div>
    </article>
  );
}
