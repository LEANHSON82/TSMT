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

// Hành động của một dòng (Sao chép, Xem bản đồ, Đại diện của N DN): chữ xanh đậm 14px + icon, nằm NGAY SAU giá
// trị (cùng dòng chữ, gần chỗ mắt đang đọc) chứ không dạt ra mép phải. Vùng bấm 44px bằng py-3 + margin âm
// -my-3 → không làm dòng cao thêm. items-baseline: chữ của hành động chung đường chân chữ với giá trị (icon
// tự canh giữa, không tham gia baseline). CopyButton variant="text" có sẵn class riêng → đè bằng COPY_FIX.
const ACT =
  'group inline-flex items-baseline gap-1.5 py-3 -my-3 text-sm leading-5 font-semibold whitespace-nowrap text-brand no-underline hover:text-brand-hover hover:underline hover:underline-offset-[3px] [&>svg]:self-center';
const COPY_FIX = 'items-baseline! -my-3! py-3 leading-5 max-md:gap-1 [&>svg]:self-center';

// Khoảng cách giá trị → hành động là MỘT DẤU CÁCH giãn chữ (word-spacing) chứ không phải margin: khi hành động
// phải xuống dòng (tên người đại diện, màn hẹp), dấu cách cuối dòng bị bỏ → hành động thẳng mép trái giá trị,
// không thụt 12px. inline-block để cụm hành động không bị ngắt giữa chừng.
function Action({ children }) {
  return (
    <>
      <span className="[word-spacing:6px] md:[word-spacing:12px]"> </span>
      <span className="inline-block">{children}</span>
    </>
  );
}

// Bảng thông tin DN (spec mục 3.4), kiểu A «sổ đăng ký»: dòng kẻ mảnh, nhãn và giá trị chung đường chân chữ
// (items-baseline) ở mọi dòng. Trường trống thì ẩn dòng.
//   ≥ 768px: cột nhãn (icon + nhãn) 208px → mọi giá trị thẳng một cột.
//   < 768px: gọn để nút «Xem số điện thoại» lọt màn hình đầu — trường ngắn 2 cột «nhãn 104px | giá trị»
//            (không icon, nhãn 13px không xuống dòng: «Ngày hoạt động» 106px lấn 2px vào khe 10px — nới cột
//            thì MST + «Sao chép» không còn vừa một dòng ở 360px); trường dài (layout="stack": địa chỉ, đơn vị
//            chủ quản) nhãn ở trên.
//            layout="phone": nhãn | số che cùng dòng, nút xem số rộng hết ngang ở dưới (dd phủ cả 2 cột,
//            dòng đầu thụt 114px = 104 + khe 10 qua prop indent của PhoneReveal).
const PHONE_INDENT = 'max-md:pl-[114px]';
function Row({ icon: Icon, label, children, action, layout = 'pair' }) {
  const mobile =
    layout === 'stack' ? 'grid-cols-1 gap-y-0.5' : 'grid-cols-[104px_minmax(0,1fr)] gap-x-2.5';
  return (
    <div
      className={`grid items-baseline border-b border-line py-2 first:pt-2 md:grid-cols-[208px_minmax(0,1fr)] md:gap-x-4 md:py-3.5 md:first:pt-2.5 ${mobile}`}
    >
      <dt
        className={`flex items-baseline gap-3 text-meta text-muted md:text-sm md:leading-6 ${layout === 'phone' ? 'max-md:col-start-1 max-md:row-start-1' : ''} ${layout === 'stack' ? '' : 'max-md:whitespace-nowrap'}`}
      >
        <Icon className="mt-[3px] hidden h-[18px] w-[18px] flex-none self-start text-field md:block" />
        <span>{label}</span>
      </dt>
      <dd
        className={`min-w-0 text-body leading-6 break-words text-ink ${layout === 'phone' ? 'max-md:col-span-2 max-md:col-start-1 max-md:row-start-1' : ''}`}
      >
        {children}
        {action && <Action>{action}</Action>}
      </dd>
    </div>
  );
}

export default function CompanyInfoTable({ company: c, parent }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`;
  const repHref = `/tim-kiem?q=${encodeURIComponent(c.representative || '')}`;
  return (
    <dl>
      <Row
        icon={IconHash}
        label={M.company.mst}
        action={
          <CopyButton text={c.mst} label={M.company.copyMst} variant="text" className={COPY_FIX} />
        }
      >
        {/* Không tabular-nums / giãn chữ: số «1» Inter dạng bảng rộng bằng số khác → MST trông như hai cụm.
            Điện thoại 18px: MST + «Sao chép» vừa một dòng cả ở 360px. */}
        <span className="text-[18px] font-semibold whitespace-nowrap md:text-[20px]">{c.mst}</span>
      </Row>

      {c.parent_mst && (
        <Row icon={IconBuilding} label={M.company.parent} layout="stack">
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
          action={
            // Người này (cùng họ tên) đại diện thêm DN khác: link xem tất cả (API trả representative_company_count).
            c.representative_company_count > 1 ? (
              <Link href={`${repHref}&theo=dai-dien`} rel="nofollow" className={ACT}>
                {M.company.repCompanies(c.representative_company_count)}
                <IconArrow />
              </Link>
            ) : null
          }
        >
          {/* Vùng bấm 44px (spec 7.3) bằng padding + margin âm — dòng không cao thêm. */}
          <Link
            href={repHref}
            rel="nofollow"
            className="-my-2.5 inline-block py-2.5 no-underline hover:underline hover:underline-offset-[3px]"
          >
            {c.representative}
          </Link>
        </Row>
      )}

      <Row icon={IconPhone} label={M.company.phone} layout="phone">
        <PhoneReveal
          indent={PHONE_INDENT}
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
          <a href={`mailto:${c.email}`} className="break-all">
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
      {c.status && (
        <Row icon={IconCheckCircle} label={M.company.status}>
          <StatusBadge status={c.status} />
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
