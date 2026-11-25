import Link from 'next/link';
import { formatDate, formatMoney, formatMoneyWords } from '@/lib/format';
import { M } from '@/lib/messages';
import CopyButton from './CopyButton';
import PhoneReveal from './PhoneReveal';
import { companyPath } from '@/lib/mst';
import {
  IconBanknote,
  IconBuilding,
  IconCalendar,
  IconLandmark,
  IconLayers,
  IconMail,
  IconMap,
  IconMapPin,
  IconPhone,
  IconUser,
} from './Icons';

const IconArrow = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className="flex-none transition-transform duration-150 group-hover:translate-x-0.5"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Hành động của một ô (Sao chép, Xem bản đồ, Đại diện của N DN): chữ xanh đậm 14px + icon, ở chân ô. Vùng bấm 44px
// bằng py-3 + margin âm -my-3 → không làm ô cao thêm.
const ACT =
  'group inline-flex items-center gap-1.5 py-3 -my-3 text-sm leading-5 font-medium text-ink-2 no-underline hover:text-brand';
const COPY_FIX = '-my-3! py-3 leading-5';

// Thông tin DN (spec mục 3.4 — đúng thứ tự trường; trường trống thì ẩn): mỗi trường một ô trắng viền mảnh, chỉ có
// nhãn chữ hoa nhỏ xám + giá trị; hành động (Xem bản đồ, Sao chép) là chữ nhỏ dạt phải cùng dòng giá trị nên các ô
// thấp và đều. 2 cột từ 768px (đọc trái → phải), 1 cột trên điện thoại. MST và tình trạng nằm ngay dưới tên DN.
// Ô chỉ gồm nhãn + giá trị (chủ dự án yêu cầu 25/11/2026: gọn như ảnh mẫu); prop icon ở lời gọi giữ lại để bật lại
// icon theo spec 3.4 khi cần.
function Row({ label, children, action, wide = false }) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-line bg-white px-4 py-3.5">
      <dt className="text-xs leading-5 tracking-[0.04em] text-muted uppercase">{label}</dt>
      <dd
        className={`mt-1 min-w-0 text-[15px] leading-6 break-words text-ink ${wide ? 'w-full' : ''}`}
      >
        {children}
      </dd>
      {/* Hành động (Sao chép, Xem bản đồ…) luôn một hàng riêng ngay dưới giá trị, căn trái — mọi ô cùng một chỗ. */}
      {action && <dd className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">{action}</dd>}
    </div>
  );
}

export default function CompanyInfoTable({ company: c, parent }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`;
  const repHref = `/tim-kiem?q=${encodeURIComponent(c.representative || '')}`;
  return (
    <dl className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-6 md:gap-y-4">
      {c.parent_mst && (
        <Row icon={IconBuilding} label={M.company.parent}>
          <Link href={parent ? companyPath(parent) : `/${c.parent_mst}`} className="font-semibold">
            {parent?.name || c.parent_mst}
          </Link>
          <span className="ml-1 text-sm text-muted">
            · MST <span className="tabular-nums">{c.parent_mst}</span>
          </span>
        </Row>
      )}

      {c.address && (
        <Row
          icon={IconMapPin}
          label={M.company.address}

          action={
            // Sao chép nhanh địa chỉ (dán vào hoá đơn, hợp đồng) + mở bản đồ.
            <>
              <CopyButton
                text={c.address}
                label={M.company.copyAddress}
                variant="text"
                className={COPY_FIX}
              />
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={ACT}>
                <IconMap size={18} className="flex-none" />
                {M.company.viewMap}
              </a>
            </>
          }
        >
          {c.address}
        </Row>
      )}

      {c.representative && (
        <Row
          icon={IconUser}
          label={M.company.representative}
          action={
            // Người này (cùng họ tên) đại diện thêm DN khác: link xem tất cả (API trả representative_company_count).
            c.representative_company_count > 1 ? (
              <Link
                href={`${repHref}&theo=dai-dien`}
                prefetch={false}
                rel="nofollow"
                className={ACT}
              >
                {M.company.repCompanies(c.representative_company_count)}
                <IconArrow />
              </Link>
            ) : null
          }
        >
          {/* Vùng bấm 44px (spec 7.3) bằng padding + margin âm — dòng không cao thêm. */}
          <Link
            href={repHref}
            prefetch={false}
            rel="nofollow"
            className="-my-2.5 inline-block py-2.5 font-semibold text-brand underline decoration-line-strong decoration-1 underline-offset-4 hover:decoration-brand"
          >
            {c.representative}
          </Link>
        </Row>
      )}

      <Row icon={IconPhone} label={M.company.phone} wide>
        <PhoneReveal
          mst={c.mst}
          hasPhone={c.has_phone}
          phoneHidden={c.phone_hidden}
          masked={c.phone_masked}
        />
      </Row>

      {/* Email: chờ owner chốt có áp luồng quảng cáo giống SĐT hay không (spec mục 9.4). */}
      {c.email && (
        <Row
          icon={IconMail}
          label={M.company.email}
          action={
            <CopyButton
              text={c.email}
              label={M.company.copyEmail}
              variant="text"
              className={COPY_FIX}
            />
          }
        >
          <a href={`mailto:${c.email}`} className="-my-3 inline-block py-3 break-all">
            {c.email}
          </a>
        </Row>
      )}
      {c.founded_date && (
        <Row icon={IconCalendar} label={M.company.foundedDate}>
          <span className="tabular-nums">{formatDate(c.founded_date)}</span>
        </Row>
      )}
      {c.tax_office && (
        <Row icon={IconLandmark} label={M.company.taxOffice}>
          {c.tax_office}
        </Row>
      )}
      {c.business_type && (
        <Row icon={IconLayers} label={M.company.businessType}>
          {c.business_type}
        </Row>
      )}
      {c.capital ? (
        <Row icon={IconBanknote} label={M.company.capital}>
          <span className="tabular-nums">{formatMoney(c.capital)}</span>{' '}
          <span className="text-sm text-muted">({formatMoneyWords(c.capital)})</span>
        </Row>
      ) : null}
    </dl>
  );
}
