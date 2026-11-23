import Link from 'next/link';
import { formatDate, formatMoney, formatMoneyWords } from '@/lib/format';
import { M } from '@/lib/messages';
import CopyButton from './CopyButton';
import PhoneReveal from './PhoneReveal';
import StatusBadge from './StatusBadge';
import { companyPath } from '@/lib/mst';
import {
  IconBanknote,
  IconBuilding,
  IconCalendar,
  IconCheckCircle,
  IconLandmark,
  IconLayers,
  IconMail,
  IconMap,
  IconMapPin,
  IconPhone,
  IconUser,
} from './Icons';

// Icon «#» cho dòng Mã số thuế (như bản mẫu A) — chỉ dùng ở đây nên khai tại chỗ.
const IconHash = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
  </svg>
);

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

// Hành động của một dòng (Sao chép, Xem bản đồ, Đại diện của N DN): chữ xanh đậm 14px + icon. Máy tính: cột riêng
// sát mép phải bảng — mọi hành động (kể cả nút «Xem số điện thoại») thẳng một cột như cột nút của Pappers.
// Điện thoại: ngay bên phải giá trị (MST) hoặc xuống dưới giá trị (địa chỉ, layout="stack").
// Vùng bấm 44px bằng py-3 + margin âm -my-3 → không làm dòng cao thêm.
const ACT =
  'group inline-flex items-center gap-1.5 py-3 -my-3 text-sm leading-5 font-semibold whitespace-nowrap text-brand no-underline hover:text-brand-hover';
const COPY_FIX = '-my-3! py-3 leading-5 max-md:gap-1';

// Bảng thông tin DN (spec mục 3.4 — đúng thứ tự trường, mỗi mục icon + nhãn + giá trị, trường trống thì ẩn). Hai phần:
//   1. Định danh & liên hệ (MST, đơn vị chủ quản, địa chỉ, người đại diện, điện thoại, email): dạng hàng, nút hành
//      động thẳng một cột bên phải.
//   2. Thông tin đăng ký (ngày hoạt động, quản lý bởi, loại hình, tình trạng, vốn): lưới ô «nhãn nhỏ / giá trị» —
//      giá trị ngắn, lướt ngang một lần là đọc hết.
// Hàng (phần 1):
//   ≥ 768px: [icon + nhãn 180px] [giá trị] [hành động, dạt phải].
//   < 768px: nhãn (icon + chữ xám 14px) ở trên, giá trị ở dưới; hành động bên phải giá trị (pair) hoặc dưới
//            giá trị (stack); dòng điện thoại (phone): khối PhoneReveal tự xếp số che + nút rộng hết ngang.
function Row({ icon: Icon, label, children, action, layout = 'pair' }) {
  const full = layout === 'phone' || !action;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-line-soft py-3 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)_auto] md:gap-x-5 md:py-3.5">
      <dt className="col-span-2 flex items-baseline gap-2 text-sm leading-5 text-muted md:col-span-1 md:gap-2.5 md:leading-6">
        <Icon className="h-4 w-4 flex-none self-center text-field md:h-[18px] md:w-[18px]" />
        <span>{label}</span>
      </dt>
      <dd
        className={`mt-1 min-w-0 text-[15px] leading-6 break-words text-ink md:mt-0 ${full ? 'col-span-2' : layout === 'stack' ? 'col-span-2 md:col-span-1' : ''}`}
      >
        {children}
      </dd>
      {action && layout !== 'phone' && (
        <dd
          className={`justify-self-start md:justify-self-end ${layout === 'stack' ? 'col-span-2 mt-1 md:col-span-1 md:mt-0' : 'mt-1 md:mt-0'}`}
        >
          {action}
        </dd>
      )}
    </div>
  );
}

// Ô của phần 2: icon + nhãn nhỏ xám ở trên, giá trị chữ đậm ở dưới.
function Fact({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[13px] leading-5 text-muted">
        <Icon className="h-4 w-4 flex-none text-field" />
        <span>{label}</span>
      </dt>
      <dd className="mt-1 text-[15px] leading-6 font-semibold break-words text-ink">{children}</dd>
    </div>
  );
}

export default function CompanyInfoTable({ company: c, parent }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`;
  const repHref = `/tim-kiem?q=${encodeURIComponent(c.representative || '')}`;
  const hasFacts = c.founded_date || c.tax_office || c.business_type || c.status || c.capital;
  return (
    <>
      <dl>
        <Row
          icon={IconHash}
          label={M.company.mst}
          action={
            <CopyButton
              text={c.mst}
              label={M.company.copyMst}
              variant="text"
              className={COPY_FIX}
            />
          }
        >
          {/* Không tabular-nums / giãn chữ: số «1» Inter dạng bảng rộng bằng số khác → MST trông như hai cụm.
            Điện thoại 18px: MST + «Sao chép» vừa một dòng cả ở 360px. */}
          <span className="text-[20px] leading-7 font-semibold tracking-[0.02em] whitespace-nowrap md:text-[22px]">
            {c.mst}
          </span>
        </Row>

        {c.parent_mst && (
          <Row icon={IconBuilding} label={M.company.parent} layout="stack">
            <Link
              href={parent ? companyPath(parent) : `/${c.parent_mst}`}
              className="font-semibold"
            >
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
            layout="stack"
            action={
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={ACT}>
                <IconMap size={18} className="flex-none" />
                {M.company.viewMap}
              </a>
            }
          >
            {c.address}
          </Row>
        )}

        {c.representative && (
          <Row
            icon={IconUser}
            label={M.company.representative}
            layout="stack"
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

        <Row icon={IconPhone} label={M.company.phone} layout="phone">
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
      </dl>
      {hasFacts && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line py-5 md:grid-cols-3 lg:grid-cols-5">
          {c.founded_date && (
            <Fact icon={IconCalendar} label={M.company.foundedDate}>
              <span className="tabular-nums">{formatDate(c.founded_date)}</span>
            </Fact>
          )}
          {c.tax_office && (
            <Fact icon={IconLandmark} label={M.company.taxOffice}>
              {c.tax_office}
            </Fact>
          )}
          {c.business_type && (
            <Fact icon={IconLayers} label={M.company.businessType}>
              {c.business_type}
            </Fact>
          )}
          {c.status && (
            <Fact icon={IconCheckCircle} label={M.company.status}>
              <StatusBadge status={c.status} />
            </Fact>
          )}
          {c.capital ? (
            <Fact icon={IconBanknote} label={M.company.capital}>
              <span className="tabular-nums">{formatMoney(c.capital)}</span>
              <span className="block text-sm font-normal text-muted">
                {formatMoneyWords(c.capital)}
              </span>
            </Fact>
          ) : null}
        </dl>
      )}
    </>
  );
}
