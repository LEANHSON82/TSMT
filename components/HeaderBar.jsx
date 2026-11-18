'use client';

// Header: logo, ô tìm kiếm thu gọn, menu Tỉnh/thành · Ngành nghề · DN mới (spec mục 3).
// Dính đầu trang khi cuộn, ô tìm luôn trong màn hình. Trang chủ: ô tìm trong header chỉ hiện khi
// ô tìm lớn ở hero đã cuộn khuất dưới header.
// Máy tính: dropdown (Esc / bấm ra ngoài để đóng, focus quay về nút).
// Điện thoại: menu toàn màn hình + danh sách con có nút «‹ Menu».
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { M } from '@/lib/messages';
import { SITE_NAME } from '@/lib/site';
import IndustryCode from './IndustryCode';
import { trapTab } from './focusTrap';
import Logo from './Logo';
import IndustryIcon from './IndustryIcon';
import SearchBox from './SearchBox';
import {
  IconBriefcase,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconEyeOff,
  IconMapPin,
  IconMenu,
} from './Icons';

// Ô tìm trên header. Dưới 1024px ô hẹp: danh sách gợi ý rộng hết màn hình, ngay dưới header.
const NAV_SEARCH = {
  size: 'nav',
  placeholder: M.search.placeholderHeader,
  placeholderWide: M.search.placeholderNavWide,
  listClassName:
    'max-lg:fixed max-lg:inset-x-0 max-lg:top-14 max-lg:mt-0 md:max-lg:top-16 max-lg:rounded-none max-lg:border-x-0',
};

function SearchWithQuery() {
  const q = useSearchParams().get('q') || '';
  return <SearchBox key={q} defaultValue={q} {...NAV_SEARCH} />;
}

function SiteLogo() {
  return (
    <Link
      href="/"
      aria-label={`${SITE_NAME} — ${M.nav.home}`}
      className="inline-flex min-h-11 flex-none items-center no-underline"
    >
      <Logo className="h-[22px] w-auto md:h-6" />
    </Link>
  );
}

// Vạch dưới mục menu của trang đang xem (nằm sát viền dưới header).
const CURRENT_BAR =
  'relative after:absolute after:inset-x-1.5 after:-bottom-[14px] after:h-[3px] after:rounded-full after:bg-brand';

function DesktopDropdown({ id, label, open, current, onToggle, onClose, children }) {
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        btnRef.current?.focus();
      }
    };
    const outside = (t) => !panelRef.current?.contains(t) && !btnRef.current?.contains(t);
    const onClick = (e) => outside(e.target) && onClose();
    // Tab ra khỏi nút + bảng thì đóng bảng (không để focus đi vào nội dung nằm dưới bảng).
    const onFocus = (e) => outside(e.target) && onClose();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-current={current ? 'true' : undefined}
        onClick={onToggle}
        className={`inline-flex min-h-11 items-center gap-0.5 rounded-md px-1.5 text-sm font-semibold whitespace-nowrap ${
          open ? 'bg-brand-50 text-brand-hover' : current ? 'text-brand' : 'text-navy hover:bg-page'
        } ${current ? CURRENT_BAR : ''}`}
      >
        {label}
        <IconChevronDown
          size={14}
          strokeWidth={1.8}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        ref={panelRef}
        id={id}
        hidden={!open}
        className="motion-drop absolute top-[72px] right-0 left-0 z-30 border-b border-line bg-white shadow-[0_8px_24px_rgba(10,42,94,0.12)]"
      >
        <div className="mx-auto max-w-[1200px] px-6 pt-5 pb-6">{children}</div>
      </div>
    </>
  );
}

function MobileMenu({ provinces, industries, pathname, onClose }) {
  const [sub, setSub] = useState(null); // null | 'provinces' | 'industries'
  const closeRef = useRef(null);
  const backRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    (sub ? backRef : closeRef).current?.focus();
  }, [sub]);

  useEffect(() => {
    // Esc đóng; Tab không thoát ra nội dung trang đang bị menu che (spec 7.3).
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else trapTab(e, panelRef.current);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const itemCls =
    'flex min-h-[60px] items-center gap-3.5 border-b border-line-soft px-4 text-lg font-semibold no-underline hover:bg-page';
  // Mục của trang đang xem: nền nhạt + vạch trái.
  const currentCls = 'bg-brand-50 text-brand shadow-[inset_3px_0_0_var(--color-brand)]';
  const cur = (on) => (on ? currentCls : 'text-navy');

  return (
    <>
      {/* Máy tính bảng (768–1279px): menu là ngăn kéo 400px bên phải, nền mờ phía sau (bấm để đóng).
        Điện thoại: phủ toàn màn hình. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="motion-fade fixed inset-0 z-50 hidden bg-[rgba(10,20,40,0.45)] md:block xl:hidden"
      />
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          sub === 'provinces'
            ? M.nav.provinces
            : sub === 'industries'
              ? M.nav.industries
              : M.nav.menu
        }
        className="motion-slide-in fixed inset-0 z-50 flex flex-col bg-white md:left-auto md:w-[400px] md:border-l md:border-line md:shadow-[-8px_0_24px_rgba(10,42,94,0.12)] xl:hidden"
      >
        {sub ? (
          <>
            <div className="grid h-14 flex-none grid-cols-[96px_minmax(0,1fr)_96px] items-center border-b border-line px-2 md:h-16">
              <button
                ref={backRef}
                type="button"
                onClick={() => setSub(null)}
                aria-label={M.nav.backToMain}
                className="inline-flex h-11 items-center gap-0.5 justify-self-start rounded-md pr-2.5 pl-1 text-body font-semibold text-brand"
              >
                <IconChevronLeft size={22} strokeWidth={1.8} />
                {M.nav.backToMenu}
              </button>
              <h2 className="truncate text-center text-lg font-semibold text-navy">
                {sub === 'provinces' ? M.nav.provinces : M.nav.industries}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={M.nav.closeMenu}
                className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-md text-navy"
              >
                <IconClose size={24} strokeWidth={1.6} />
              </button>
            </div>
            <p className="px-4 pt-3 pb-2 text-meta text-muted">
              {sub === 'provinces'
                ? M.nav.provincesNote(provinces.length)
                : M.nav.industriesSubNote}
            </p>
            <nav
              aria-label={sub === 'provinces' ? M.nav.provinces : M.nav.industries}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <ul>
                {sub === 'provinces'
                  ? provinces.map((p) => (
                      <li key={p.code}>
                        <Link
                          href={`/tinh/${p.slug}`}
                          onClick={onClose}
                          aria-current={pathname === `/tinh/${p.slug}` ? 'page' : undefined}
                          className={`flex min-h-[52px] items-center justify-between border-t border-line-soft px-4 text-base text-navy no-underline ${cur(pathname === `/tinh/${p.slug}`)}`}
                        >
                          {p.name}
                          <IconChevronRight size={18} className="text-muted" />
                        </Link>
                      </li>
                    ))
                  : industries.map((n) => (
                      <li key={n.code}>
                        <Link
                          href={n.href}
                          onClick={onClose}
                          className="flex min-h-[60px] items-center gap-3 border-t border-line-soft px-4 py-2 text-navy no-underline"
                        >
                          <IndustryIcon code={n.code} className="flex-none text-brand" />
                          <IndustryCode code={n.code} />
                          <span className="flex-1 text-body leading-[21px]">{n.name}</span>
                          <IconChevronRight size={18} className="flex-none text-muted" />
                        </Link>
                      </li>
                    ))}
              </ul>
            </nav>
          </>
        ) : (
          <>
            <div className="flex h-14 flex-none items-center justify-between border-b border-line pr-2 pl-4 md:h-16 md:px-4">
              <SiteLogo />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={M.nav.closeMenu}
                aria-expanded="true"
                aria-controls="mobile-menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-navy"
              >
                <IconClose size={24} strokeWidth={1.6} />
              </button>
            </div>
            <nav aria-label={M.nav.mainMenu} className="flex flex-1 flex-col py-2">
              <button
                type="button"
                className={`${itemCls} w-full text-left ${cur(pathname.startsWith('/tinh/'))}`}
                onClick={() => setSub('provinces')}
              >
                <IconMapPin size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.provinces}</span>
                <IconChevronRight size={18} className="text-muted" />
              </button>
              <button
                type="button"
                className={`${itemCls} w-full text-left ${cur(pathname.startsWith('/nganh/'))}`}
                onClick={() => setSub('industries')}
              >
                <IconBriefcase size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.industries}</span>
                <IconChevronRight size={18} className="text-muted" />
              </button>
              <Link
                href="/doanh-nghiep-moi-thanh-lap"
                onClick={onClose}
                aria-current={pathname === '/doanh-nghiep-moi-thanh-lap' ? 'page' : undefined}
                className={`${itemCls} ${cur(pathname === '/doanh-nghiep-moi-thanh-lap')}`}
              >
                <IconCalendarPlus size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.newCompanies}</span>
                <IconChevronRight size={18} className="text-muted" />
              </Link>
              <Link
                href="/yeu-cau-cap-nhat"
                onClick={onClose}
                aria-current={pathname === '/yeu-cau-cap-nhat' ? 'page' : undefined}
                className={`${itemCls} ${cur(pathname === '/yeu-cau-cap-nhat')}`}
              >
                <IconEyeOff size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.updateRequest}</span>
                <IconChevronRight size={18} className="text-muted" />
              </Link>
            </nav>
          </>
        )}
      </div>
    </>
  );
}

export default function HeaderBar({ provinces, industries }) {
  const pathname = usePathname();
  const [dropdown, setDropdown] = useState(null); // 'provinces' | 'industries' | null
  const [mobileOpen, setMobileOpen] = useState(false);
  // Trang chủ chắc chắn có ô tìm lớn nên mặc định ẩn ô trong header (tránh nháy khi tải).
  const [heroSearchVisible, setHeroSearchVisible] = useState(pathname === '/');
  const menuBtnRef = useRef(null);
  const headerRef = useRef(null);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  // Trang có ô tìm lớn ([data-hero-search]: trang chủ, /tim-kiem chưa nhập từ khoá): ô đó khuất
  // dưới header thì mới hiện ô tìm thu gọn, tránh 2 ô tìm cùng lúc.
  useEffect(() => {
    const hero = document.querySelector('[data-hero-search]');
    if (!hero || typeof IntersectionObserver === 'undefined') {
      setHeroSearchVisible(false);
      return undefined;
    }
    const top = headerRef.current?.offsetHeight || 64;
    const io = new IntersectionObserver(([entry]) => setHeroSearchVisible(entry.isIntersecting), {
      rootMargin: `-${top}px 0px 0px 0px`,
    });
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  const showHeaderSearch = !heroSearchVisible;
  const sortedProvinces = [...provinces].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const closeDropdown = () => setDropdown(null);

  return (
    <header ref={headerRef} className="header-lift sticky top-0 z-30 border-b border-line bg-white">
      {/* Điện thoại/máy tính bảng: một hàng logo + ô tìm + nút menu. Từ 1024px: ô tìm đặt tuyệt đối,
          trùng khít ô nhập của ô tìm lớn trang chủ (nhóm ô + nút rộng 760px căn giữa trang: ô nhập
          656px bắt đầu ở giữa trang − 380px). Menu chữ hiện từ 1280px (đủ chỗ bên phải ô tìm). */}
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 pr-2 pl-4 md:h-16 md:gap-6 md:px-6 lg:h-[72px]">
        <SiteLogo />

        {/* Luôn giữ chỗ (không đẩy menu khi hiện/ẩn); khi ẩn thì inert để không focus được. */}
        <div
          data-header-search
          inert={!showHeaderSearch}
          className={`min-w-0 flex-1 transition-opacity duration-150 lg:absolute lg:top-1/2 lg:left-1/2 lg:w-[656px] lg:flex-none lg:-translate-x-[380px] lg:-translate-y-1/2 ${
            showHeaderSearch ? 'opacity-100' : 'invisible opacity-0'
          }`}
        >
          {/* Trang kết quả: ô giữ sẵn từ khoá đang tìm. useSearchParams chỉ chạy trên /tim-kiem (trang vốn
              render động) — các trang tĩnh/ISR khác không bị chuyển sang render phía trình duyệt. */}
          {pathname === '/tim-kiem' ? (
            <Suspense fallback={<SearchBox {...NAV_SEARCH} />}>
              <SearchWithQuery />
            </Suspense>
          ) : (
            <SearchBox {...NAV_SEARCH} />
          )}
        </div>

        <nav aria-label={M.nav.mainMenu} className="ml-auto hidden items-center xl:flex">
          <DesktopDropdown
            id="menu-provinces"
            label={M.nav.provinces}
            open={dropdown === 'provinces'}
            current={pathname.startsWith('/tinh/')}
            onToggle={() => setDropdown((d) => (d === 'provinces' ? null : 'provinces'))}
            onClose={closeDropdown}
          >
            <div className="mb-3 flex items-baseline gap-3">
              {/* Không dùng h2: bảng nằm trước H1 của trang (sai thứ bậc heading). */}
              <p className="text-base font-semibold text-navy">{M.nav.provincesHeading}</p>
              <span className="text-meta text-muted">{M.nav.provincesNote(provinces.length)}</span>
            </div>
            <ul className="grid grid-cols-4 gap-x-4 gap-y-0.5 lg:grid-cols-6">
              {sortedProvinces.map((p) => (
                <li key={p.code}>
                  <Link
                    href={`/tinh/${p.slug}`}
                    aria-current={pathname === `/tinh/${p.slug}` ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-md px-2.5 text-body no-underline ${
                      pathname === `/tinh/${p.slug}`
                        ? 'bg-brand-50 font-semibold text-brand'
                        : 'hover:bg-page'
                    }`}
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </DesktopDropdown>
          <DesktopDropdown
            id="menu-industries"
            label={M.nav.industries}
            open={dropdown === 'industries'}
            current={pathname.startsWith('/nganh/')}
            onToggle={() => setDropdown((d) => (d === 'industries' ? null : 'industries'))}
            onClose={closeDropdown}
          >
            <div className="mb-3 flex items-baseline gap-3">
              <p className="text-base font-semibold text-navy">{M.nav.industriesHeading}</p>
              <span className="text-meta text-muted">{M.nav.industriesNote}</span>
            </div>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-0.5">
              {industries.map((n) => (
                <li key={n.code}>
                  <Link
                    href={n.href}
                    className="flex min-h-12 items-center gap-3 rounded-md px-2.5 py-1 no-underline hover:bg-page"
                  >
                    <IndustryIcon code={n.code} className="flex-none text-brand" />
                    <IndustryCode code={n.code} />
                    <span className="text-body leading-[21px]">{n.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </DesktopDropdown>
          <Link
            href="/doanh-nghiep-moi-thanh-lap"
            aria-current={pathname === '/doanh-nghiep-moi-thanh-lap' ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-md px-1.5 text-sm font-semibold whitespace-nowrap no-underline ${
              pathname === '/doanh-nghiep-moi-thanh-lap'
                ? `text-brand ${CURRENT_BAR}`
                : 'text-navy hover:bg-page'
            }`}
          >
            {M.nav.newCompaniesShort}
          </Link>
        </nav>

        <div className="ml-auto flex flex-none items-center xl:hidden">
          <button
            ref={menuBtnRef}
            type="button"
            aria-label={M.nav.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-navy"
          >
            <IconMenu size={24} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <MobileMenu
          pathname={pathname}
          provinces={sortedProvinces}
          industries={industries}
          onClose={() => {
            setMobileOpen(false);
            menuBtnRef.current?.focus();
          }}
        />
      )}
    </header>
  );
}
