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

// Hành động trong dòng (Sao chép, Xem bản đồ…): chữ nhỏ xám, xanh khi rê. Vùng bấm 44px bằng py-3 + margin âm.
const ACT =
  'group inline-flex items-center gap-1.5 py-3 -my-3 text-sm leading-5 font-medium text-ink-2 no-underline hover:text-brand';
const COPY_FIX = '-my-3! py-3 leading-5';

// Một dòng trong khung: nhãn nhỏ xám ở trên, giá trị ở dưới, hành động dạt phải cùng dòng giá trị. Các dòng ngăn nhau
// bằng vạch mảnh. Mỗi trường vẫn có icon + nhãn + giá trị (spec 3.4), trường trống thì ẩn.
function Row({ icon: Icon, label, children, action, wide = false }) {
  return (
    <div className="min-w-0 border-b border-line-soft px-5 py-3.5 last:border-b-0 md:px-6">
      <dt className="flex items-center gap-1.5 text-[13px] leading-5 text-muted">
        <Icon className="h-3.5 w-3.5 flex-none" />
        <span>{label}</span>
      </dt>
      <dd className="mt-1 flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[15px] leading-6 break-words text-ink">
        <span className={wide ? 'w-full min-w-0' : 'min-w-0'}>{children}</span>
        {action && <span className="flex-none">{action}</span>}
      </dd>
    </div>
  );
}

// Khung có tiêu đề nhỏ: gom các trường theo việc người dùng cần (liên hệ / đăng ký) thay vì 9 ô rời.
function Group({ title, children }) {
  return (
    <section className="min-w-0 rounded-card border border-line bg-white">
      <h3 className="border-b border-line-soft px-5 py-3 text-sm font-semibold text-ink md:px-6">
        {title}
      </h3>
      <dl>{children}</dl>
    </section>
  );
}

export default function CompanyInfoTable({ company: c, parent }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`;
  const repHref = `/tim-kiem?q=${encodeURIComponent(c.representative || '')}`;
  return (
    // Hai khung cạnh nhau từ 1024px (trái: định danh + liên hệ — đúng thứ tự trường đầu của spec 3.4; phải: thông tin
    // đăng ký), một cột trên điện thoại.
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
      <Group title={M.company.groupContact}>
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
          <span className="text-[18px] leading-7 font-semibold tracking-[0.02em] whitespace-nowrap">
            {c.mst}
          </span>
        </Row>
        {c.parent_mst && (
          <Row icon={IconBuilding} label={M.company.parent}>
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
            action={
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={ACT}>
                <IconMap size={16} className="flex-none" />
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
            <Link
              href={repHref}
              prefetch={false}
              rel="nofollow"
              className="-my-2.5 inline-block py-2.5 font-semibold text-ink no-underline hover:text-brand hover:underline"
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
      </Group>

      <Group title={M.company.groupRegistration}>
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
      </Group>
    </div>
  );
}
