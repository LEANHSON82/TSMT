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
  IconDoc,
  IconLandmark,
  IconLayers,
  IconMail,
  IconMap,
  IconMapPin,
  IconPhone,
  IconUser,
} from './Icons';

// Bảng thông tin DN (spec mục 3.4): mỗi dòng icon + nhãn + giá trị; trường trống thì ẩn dòng.
// compact: giá trị ngắn — điện thoại cũng để nhãn bên trái, giá trị bên phải (không xếp chồng).
function Row({ icon: Icon, label, children, action, compact = false }) {
  return (
    <div
      className={`border-t border-line-soft px-4 py-3 first:border-t-0 md:grid md:grid-cols-[202px_minmax(0,1fr)] md:items-center md:gap-0 md:px-5 ${
        compact
          ? 'grid grid-cols-[150px_minmax(0,1fr)] items-center gap-x-2'
          : 'flex flex-col gap-1'
      }`}
    >
      <dt className="flex items-center gap-2.5 text-sm text-muted md:gap-3 md:text-body">
        <Icon size={20} className="flex-none text-field" />
        {label}
      </dt>
      <dd className={`flex min-w-0 items-center gap-1 md:pl-0 ${compact ? '' : 'pl-8'}`}>
        <div className="min-w-0 flex-1 text-body leading-[22px] break-words text-ink">
          {children}
        </div>
        {action && <div className="-my-2.5 flex flex-none items-center">{action}</div>}
      </dd>
    </div>
  );
}

export default function CompanyInfoTable({ company: c, parent }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`;
  return (
    <dl className="overflow-hidden rounded-xl border border-line bg-white">
      {/* Không compact: điện thoại để MST xuống dưới nhãn (đủ chỗ cho MST chi nhánh 14 ký tự + nút chép). */}
      <Row
        icon={IconDoc}
        label={M.company.mst}
        action={<CopyButton text={c.mst} label={M.company.copyMst} />}
      >
        <span className="text-lg font-semibold tracking-[0.02em] whitespace-nowrap tabular-nums">
          {c.mst}
        </span>
      </Row>

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
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 min-w-11 flex-none items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold no-underline hover:bg-brand-50"
            >
              <IconMap size={18} />
              <span className="hidden sm:inline">{M.company.viewMap}</span>
              <span className="sr-only sm:hidden">{M.company.viewMap}</span>
            </a>
          }
        >
          {c.address}
        </Row>
      )}

      {c.representative && (
        <Row compact icon={IconUser} label={M.company.representative}>
          <Link
            href={`/tim-kiem?q=${encodeURIComponent(c.representative)}`}
            rel="nofollow"
            className="text-ink no-underline hover:text-brand"
          >
            {c.representative}
          </Link>
        </Row>
      )}

      <Row icon={IconPhone} label={M.company.phone}>
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
          action={<CopyButton text={c.email} label={M.company.copyEmail} />}
        >
          <a href={`mailto:${c.email}`} className="break-all">
            {c.email}
          </a>
        </Row>
      )}

      {c.founded_date && (
        <Row compact icon={IconCalendar} label={M.company.foundedDate}>
          {formatDate(c.founded_date)}
        </Row>
      )}
      {c.tax_office && (
        <Row compact icon={IconLandmark} label={M.company.taxOffice}>
          {c.tax_office}
        </Row>
      )}
      {c.business_type && (
        <Row compact icon={IconLayers} label={M.company.businessType}>
          {c.business_type}
        </Row>
      )}
      {c.status && (
        <Row compact icon={IconCheckCircle} label={M.company.status}>
          <StatusBadge status={c.status} />
        </Row>
      )}
      {c.capital ? (
        <Row compact icon={IconBanknote} label={M.company.capital}>
          <span className="tabular-nums">{formatMoney(c.capital)}</span>{' '}
          <span className="text-sm text-muted">({formatMoneyWords(c.capital)})</span>
        </Row>
      ) : null}
    </dl>
  );
}
