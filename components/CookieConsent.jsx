'use client';

// Banner đồng ý cookie (spec mục 8.3): phải có trước khi tải script quảng cáo và analytics.
// Lưu lựa chọn ở localStorage (tiện ích theo từng trình duyệt). Footer có nút «Tuỳ chỉnh cookie».
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { safeLocal } from '@/lib/storage';
import { M } from '@/lib/messages';
import Modal from './Modal';

const KEY = 'cookie_consent';
export const OPEN_COOKIE_PREFS = 'open-cookie-prefs';

function readConsent() {
  try {
    return JSON.parse(safeLocal.get(KEY) || 'null');
  } catch {
    return null;
  }
}

function saveConsent(consent) {
  const value = { ...consent, necessary: true, at: new Date().toISOString() };
  safeLocal.set(KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: value }));
}

function Switch({ id, checked, onChange, disabled, label, desc }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-line py-4 first:border-t-0">
      <div>
        <p id={`${id}-label`} className="text-body font-semibold text-ink">
          {label}
        </p>
        <p id={`${id}-desc`} className="mt-0.5 text-sm text-muted">
          {desc}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors disabled:opacity-60 ${
          checked ? 'bg-brand' : 'bg-field'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function CookieConsent() {
  // Banner render sẵn trong HTML (tốt cho LCP). Người đã chọn cookie: CSS ẩn ngay từ đầu
  // (html[data-consent]), sau khi hydrate thì gỡ hẳn khỏi DOM.
  const [showBanner, setShowBanner] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);

  useEffect(() => {
    const c = readConsent();
    if (c) {
      setShowBanner(false);
      setAnalytics(Boolean(c.analytics));
      setAds(Boolean(c.ads));
    }
    const open = () => setShowPrefs(true);
    window.addEventListener(OPEN_COOKIE_PREFS, open);
    return () => window.removeEventListener(OPEN_COOKIE_PREFS, open);
  }, []);

  const acceptAll = () => {
    saveConsent({ analytics: true, ads: true });
    setShowBanner(false);
    setShowPrefs(false);
  };
  const savePrefs = () => {
    saveConsent({ analytics, ads });
    setShowBanner(false);
    setShowPrefs(false);
  };

  return (
    <>
      {showBanner && !showPrefs && (
        <section
          data-cookie-banner
          aria-label={M.cookie.region}
          // z-20: dưới header (z-30, chứa menu điện thoại) — banner không đè menu; hộp thoại (z-60) chờ banner xong mới mở.
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line-strong bg-white shadow-[0_-4px_16px_rgba(22,27,38,0.08)]"
        >
          <div className="site-wrap flex flex-col gap-2 py-2.5 md:flex-row md:items-center md:gap-8 md:py-4">
            <p className="flex-1 text-[13px] leading-[18px] text-ink-2 md:text-sm md:leading-5">
              {M.cookie.banner}{' '}
              <Link
                href="/chinh-sach-bao-mat#cookie"
                prefetch={false}
                className="whitespace-nowrap"
              >
                {M.footer.privacy}
              </Link>
              .
            </p>
            <div className="grid grid-cols-2 gap-2 md:flex md:flex-none">
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="h-10 rounded border border-brand bg-white px-5 text-[15px] font-semibold text-brand md:h-11 md:min-w-36 md:text-body"
              >
                {M.cookie.customize}
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="h-10 rounded border border-brand bg-brand px-5 text-[15px] font-semibold text-white hover:bg-cta-hover active:bg-chrome-2 md:h-11 md:min-w-36 md:text-body"
              >
                {M.cookie.accept}
              </button>
            </div>
          </div>
        </section>
      )}

      <Modal
        open={showPrefs}
        onClose={() => setShowPrefs(false)}
        title={M.cookie.prefsTitle}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={savePrefs}
              className="h-11 rounded border border-brand bg-white px-4 text-body font-semibold text-brand"
            >
              {M.cookie.save}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="h-11 rounded-lg bg-brand px-4 text-body font-semibold text-white hover:bg-cta-hover active:bg-chrome-2"
            >
              {M.cookie.acceptAll}
            </button>
          </div>
        }
      >
        <Switch
          id="ck-necessary"
          checked
          disabled
          onChange={() => {}}
          label={M.cookie.necessary}
          desc={M.cookie.necessaryDesc}
        />
        <Switch
          id="ck-analytics"
          checked={analytics}
          onChange={setAnalytics}
          label={M.cookie.analytics}
          desc={M.cookie.analyticsDesc}
        />
        <Switch
          id="ck-ads"
          checked={ads}
          onChange={setAds}
          label={M.cookie.ads}
          desc={M.cookie.adsDesc}
        />
      </Modal>
    </>
  );
}

export function CookieSettingsButton({ className }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFS))}
    >
      {M.footer.cookieSettings}
    </button>
  );
}
