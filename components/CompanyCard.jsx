import Link from 'next/link';
import { companyPath } from '@/lib/mst';
import { areaAddress, formatDate, shortAddress } from '@/lib/format';
import { M } from '@/lib/messages';
import StatusBadge from './StatusBadge';
import Highlight from './Highlight';

// Thẻ doanh nghiệp dùng chung (spec mục 3.3), kiểu Pappers. KHÔNG BAO GIỜ hiện SĐT.
// Không tải trước trang DN (prefetch={false}): một trang danh sách có 20 thẻ → tải trước 20 trang mà
// người dùng không mở. Cả thẻ bấm được (link tên DN phủ cả thẻ bằng ::after); MST nằm trên lớp phủ để vẫn
// bôi đen/chép được.
//
//   variant="row"  (CompanyList: kết quả tìm, trang tỉnh / ngành / DN mới): thẻ trắng rộng hết khung.
//                   Từ 768px: hàng đầu «Tên DN | MST» (xanh) + tình trạng bên phải, vạch chia, rồi 3 ô có nhãn
//                   Địa chỉ · Người đại diện · Ngày hoạt động — các ô cùng vị trí trên mọi thẻ nên dễ so.
//                   Dưới 768px: thẻ gọn (tên, MST + tình trạng, địa chỉ 1 dòng, «đại diện · từ ngày»).
//   variant="card" (lưới trang chủ, DN cùng ngành): luôn là thẻ gọn.
//
// highlight: từ khoá tìm kiếm để tô sáng trong tên DN, MST, người đại diện.
// showNew: hiện nhãn «Mới» cho DN thành lập trong 7 ngày gần nhất (tắt ở khối/trang «DN mới thành lập»).
// showProvince=false: trang theo tỉnh — địa chỉ chỉ ghi phường/xã (tỉnh đã có ở tiêu đề trang).
// bare: thẻ nằm trong một thẻ trắng lớn (DN cùng ngành trang DN) → không vẽ khung riêng, chia nhau bằng vạch mảnh.
const NEW_DAYS = 7;
function isNew(foundedDate) {
  const t = Date.parse(foundedDate || '');
  return Number.isFinite(t) && Date.now() - t < NEW_DAYS * 86400000 && t <= Date.now() + 86400000;
}

// Nhãn phụ: khớp theo số điện thoại (chỉ ghi nhãn, KHÔNG hiện số) và «Mới».
function Badges({ phone, fresh }) {
  if (!phone && !fresh) return null;
  return (
    <>
      {phone && <span className="tag tag-brand">{M.search.matchedPhoneBadge}</span>}
      {fresh && <span className="tag tag-new">{M.list.newBadge}</span>}
    </>
  );
}

export default function CompanyCard({
  company: c,
  variant = 'card',
  headingLevel = 3,
  highlight,
  showNew = true,
  showProvince = true,
  bare = false,
}) {
  const row = variant === 'row';
  const H = `h${headingLevel}`;
  const href = companyPath(c);
  const addr = areaAddress(c.address, c.province?.name, { withProvince: showProvince });
  const date = formatDate(c.founded_date);
  const fresh = showNew && isNew(c.founded_date);
  const phone = c.matched === 'phone';
  // Chỉ tô sáng ở trường đã khớp (API trả matched). Không có matched (trang danh sách) → tô như trước.
  const hl = (field) => (!c.matched || c.matched === field ? highlight : undefined);

  const nameLink = (
    <Link
      href={href}
      prefetch={false}
      title={c.name}
      className="text-brand no-underline decoration-1 underline-offset-[3px] group-hover:underline after:absolute after:inset-0 after:rounded-[inherit]"
    >
      <Highlight text={c.name} query={hl('name')} />
    </Link>
  );
  const mst = (
    <span className="relative z-10 whitespace-nowrap text-brand">
      <span className="sr-only">{M.company.mst}: </span>
      <Highlight text={c.mst} query={hl('mst')} />
    </span>
  );
  const rep = <Highlight text={c.representative} query={hl('representative')} />;

  // Thẻ gọn: dùng cho variant="card" ở mọi cỡ và cho variant="row" dưới 768px.
  const compact = (
    <div className={row ? 'md:hidden' : ''}>
      <H className="line-clamp-2 text-body leading-[22px] font-semibold">{nameLink}</H>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-body leading-5">{mst}</span>
        <StatusBadge status={c.status} />
        <Badges phone={phone} fresh={fresh} />
      </div>
      {addr && (
        <p className="mt-1 truncate text-sm leading-5 text-muted" title={c.address}>
          <span className="sr-only">{M.company.address}: </span>
          {addr}
        </p>
      )}
      <p className="mt-0.5 truncate text-sm leading-5 text-muted">
        {c.representative && (
          <>
            <span className="sr-only">{M.company.representative}: </span>
            {rep}
          </>
        )}
        {date && (
          <span className="tabular-nums">
            {c.representative ? ' · ' : ''}
            <span className="sr-only">{M.company.foundedDate}: </span>
            {M.list.since(date)}
          </span>
        )}
      </p>
    </div>
  );

  const frame = bare
    ? 'border-b border-line-soft py-3.5 last:border-b-0'
    : `card ${row ? 'px-4 py-3.5 md:py-0' : 'px-4 py-3.5 md:px-5'}`;

  return (
    <article className={`group relative h-full ${frame}`}>
      {compact}
      {row && (
        <div className="hidden md:block">
          <div className="flex items-start justify-between gap-6 border-b border-line pt-3.5 pb-3">
            <H className="min-w-0 text-[18px] leading-7 font-semibold">
              {nameLink}
              <span aria-hidden="true" className="mx-2.5 font-normal text-line">
                |
              </span>
              <span className="text-body font-normal">{mst}</span>
            </H>
            <div className="flex flex-none items-center gap-2.5 pt-1">
              <Badges phone={phone} fresh={fresh} />
              <StatusBadge status={c.status} />
            </div>
          </div>
          <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-8 pt-3 pb-4">
            <div className="min-w-0">
              <dt className="text-sm leading-5 text-muted">{M.company.address}</dt>
              <dd className="mt-0.5 truncate" title={c.address}>
                {shortAddress(c.address) || addr || '—'}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sm leading-5 text-muted">{M.company.representative}</dt>
              <dd className="mt-0.5 truncate">{c.representative ? rep : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm leading-5 text-muted">{M.company.foundedDate}</dt>
              <dd className="mt-0.5 tabular-nums">{date || '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </article>
  );
}
