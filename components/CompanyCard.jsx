import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';
import { IconMapPin } from './Icons';

// Thẻ doanh nghiệp dùng chung (spec mục 3.3). KHÔNG BAO GIỜ hiện SĐT.
// Không tải trước trang DN (prefetch={false}): một trang danh sách có 20 thẻ → tải trước 20 trang mà
// người dùng không mở (hàng trăm KB dữ liệu di động + render ISR ở máy chủ). Bấm vào vẫn có khung chờ.
// Cả thẻ bấm được (link tên DN phủ cả thẻ bằng ::after); MST nằm trên lớp phủ để vẫn bôi đen/chép được.
// variant="card": lưới (trang chủ, DN cùng ngành). variant="row": danh sách (dòng ngang trên máy tính).
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN và MST.
// showNew: hiện nhãn «Mới» cho DN thành lập trong 7 ngày gần nhất (tắt ở khối/trang «DN mới thành lập»).
// showProvince=false: trang theo tỉnh — địa chỉ chỉ ghi phường/xã (tỉnh đã có ở tiêu đề trang).
const NEW_DAYS = 7;
function isNew(foundedDate) {
  const t = Date.parse(foundedDate || '');
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86400000 && t <= Date.now() + 86400000;
}

// Kết quả tìm khớp theo số điện thoại: chỉ ghi nhãn, KHÔNG hiện số (số chỉ mở sau khi xem quảng cáo).
function PhoneMatchBadge() {
  return (
    <span className="relative z-10 inline-flex h-5 flex-none items-center rounded bg-brand-50 px-1.5 text-xs font-semibold tracking-wide whitespace-nowrap text-brand-hover uppercase">
      {M.search.matchedPhoneBadge}
    </span>
  );
}

function NewBadge() {
  return (
    <span className="relative z-10 inline-flex h-5 flex-none items-center rounded bg-cta-50 px-1.5 text-xs font-semibold tracking-wide text-cta uppercase">
      {M.list.newBadge}
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
  // variant="cell": thẻ không viền riêng, nằm trong khung lưới có đường kẻ (trang chủ, DN cùng ngành).
  const cell = variant === 'cell';
  const H = `h${headingLevel}`;
  const href = companyPath(c);
  const addr = areaAddress(c.address, c.province?.name, { withProvince: showProvince });
  const date = formatDate(c.founded_date);
  const fresh = showNew && isNew(c.founded_date);
  // Chỉ tô sáng ở trường đã khớp (API trả matched): tìm «Đỗ Đức Lan» khớp người đại diện thì không tô «DO» trong
  // «DOANH NGHIỆP». Không có matched (trang danh sách, API cũ) → tô như trước.
  const hl = (field) => (!c.matched || c.matched === field ? highlight : undefined);

  if (variant === 'row') {
    return (
      <article className="group relative grid gap-x-5 gap-y-1.5 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_144px_200px_168px] lg:items-center lg:gap-y-2.5 lg:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <H className="line-clamp-2 text-body leading-6 font-semibold">
              <Link
                href={href}
                prefetch={false}
                title={c.name}
                className="text-ink no-underline group-hover:text-brand after:absolute after:inset-0"
              >
                <Highlight text={c.name} query={hl('name')} />
              </Link>
            </H>
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink-2">
              <IconMapPin size={16} className="flex-none text-muted" />
              <span className="sr-only">{M.company.address}: </span>
              <span className="truncate" title={c.address}>
                {addr}
              </span>
            </span>
          </div>
          {c.matched === 'phone' && <PhoneMatchBadge />}
          {fresh && <NewBadge />}
        </div>
        {/* Điện thoại, máy tính bảng: «MST …» và «Đại diện …» mỗi thứ một dòng (tên người đủ chỗ, không bị
            cắt); từ 1024px (lg:contents): 2 cột riêng. */}
        <div className="flex min-w-0 flex-col gap-0.5 text-sm lg:contents">
          <div className="flex flex-none items-baseline gap-1.5 lg:flex-col lg:gap-0.5">
            <span className="text-muted lg:text-xs">MST</span>
            <span className="relative z-10 font-semibold tracking-[0.02em] whitespace-nowrap tabular-nums lg:text-body">
              <Highlight text={c.mst} query={hl('mst')} />
            </span>
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5 lg:flex-col lg:gap-0.5">
            <span className="flex-none text-muted lg:text-xs">
              <span className="lg:hidden">{M.company.repShort}</span>
              <span className="hidden lg:inline">{M.company.representative}</span>
            </span>
            <span className="truncate">
              <Highlight text={c.representative} query={hl('representative')} />
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 lg:flex-col lg:items-start lg:gap-1">
          <StatusBadge status={c.status} className="text-sm" />
          {date && (
            <span className="text-meta text-muted lg:text-xs">
              <span className="lg:hidden">· {M.list.since(date)}</span>
              <span className="hidden lg:inline">
                {M.list.activeFrom} {date}
              </span>
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative flex h-full flex-col gap-2.5 bg-white p-4 ${
        cell
          ? 'transition-colors duration-150 hover:bg-brand-50'
          : 'rounded-xl border border-line transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-[0_4px_16px_rgba(10,42,94,0.08)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <H className="line-clamp-2 flex-1 text-body leading-6 font-semibold sm:min-h-12">
          <Link
            href={href}
            prefetch={false}
            title={c.name}
            className="text-ink no-underline group-hover:text-brand after:absolute after:inset-0"
          >
            <Highlight text={c.name} query={hl('name')} />
          </Link>
        </H>
        {c.matched === 'phone' && <PhoneMatchBadge />}
        {fresh && <NewBadge />}
      </div>
      <dl className="flex min-w-0 flex-col gap-1 text-sm">
        <div className="flex min-w-0 gap-2">
          <dt className="w-16 flex-none text-muted">MST</dt>
          <dd className="relative z-10 font-semibold tracking-[0.02em] tabular-nums">{c.mst}</dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="w-16 flex-none text-muted">{M.company.address}</dt>
          <dd className="min-w-0 flex-1 truncate" title={c.address}>
            {addr}
          </dd>
        </div>
        <div className="flex min-w-0 gap-2">
          <dt className="w-16 flex-none text-muted">{M.company.repShort}</dt>
          <dd className="min-w-0 flex-1 truncate">
            <Highlight text={c.representative} query={hl('representative')} />
          </dd>
        </div>
      </dl>
      <p className="mt-auto flex flex-wrap items-baseline gap-x-1.5 border-t border-line-soft pt-2.5 text-sm">
        <StatusBadge status={c.status} />
        {date && <span className="text-meta text-muted">· {M.list.since(date)}</span>}
      </p>
    </article>
  );
}
