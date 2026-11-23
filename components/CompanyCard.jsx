import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate, shortAddress } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';

// Dòng doanh nghiệp dùng chung (spec mục 3.3), kiểu danh sách CafeF. KHÔNG BAO GIỜ hiện SĐT.
// Luôn nằm trong một khung .panel (danh sách kết quả / tỉnh / ngành / DN mới, khối DN mới trang chủ, DN cùng
// ngành trang DN); các dòng ngăn nhau bằng vạch mảnh (do danh sách bao ngoài vẽ).
//   Hàng 1: tên DN (link navy đậm, cả dòng bấm được) + nhãn «MỚI» · tình trạng bên phải (máy tính).
//   Hàng 2: «MST … · Hoạt động từ … · Đại diện: …» (điện thoại: thêm tình trạng ở cuối).
//   Hàng 3: địa chỉ một dòng.
// Không tải trước trang DN (prefetch={false}). MST nằm trên lớp phủ để vẫn bôi đen/chép được.
//
// variant: 'row' (CompanyList, đệm ngang theo khung) | 'card' (lưới/khối, khung cha tự đệm). Giữ để tương thích.
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN, MST, người đại diện.
// showNew: hiện nhãn «MỚI» cho DN thành lập trong 7 ngày gần nhất (tắt ở khối/trang «DN mới thành lập»).
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
  // Dấu «·» ngăn các mục, có dấu cách hai bên để dòng được ngắt giữa các mục (không tràn khung trên điện thoại).
  const sep = (
    <>
      {' '}
      <span aria-hidden="true" className="px-0.5 text-line-strong">
        ·
      </span>{' '}
    </>
  );

  return (
    <article
      className={`group relative py-3.5 transition-colors duration-150 hover:bg-[#fafafa] ${variant === 'row' ? 'px-4 md:px-5' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <H className="min-w-0 text-[15px] leading-6 font-semibold md:text-base">
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
        <StatusBadge status={c.status} className="flex-none pt-0.5 max-md:hidden" />
      </div>
      <p className="mt-1 text-sm leading-5 text-ink-2">
        <span className="whitespace-nowrap">
          MST{' '}
          <span className="relative z-10 font-semibold text-ink">
            <span className="sr-only">{M.company.mst}: </span>
            <Highlight text={c.mst} query={hl('mst')} />
          </span>
        </span>
        {date && (
          <>
            {sep}
            <span className="whitespace-nowrap tabular-nums">
              <span className="sr-only">{M.company.foundedDate}: </span>
              {M.list.activeSince(date)}
            </span>
          </>
        )}
        {c.representative && (
          <>
            {sep}
            <span>
              {M.company.repShort}:{' '}
              <Highlight text={c.representative} query={hl('representative')} />
            </span>
          </>
        )}
        <span className="md:hidden">
          {sep}
          <StatusBadge status={c.status} />
        </span>
      </p>
      {addr && (
        <p className="mt-0.5 truncate text-sm leading-5 text-muted" title={c.address}>
          <span className="sr-only">{M.company.address}: </span>
          {addr}
        </p>
      )}
    </article>
  );
}
