// Gửi sự kiện GA4 qua một hàm duy nhất (spec mục 8.1).
// Không bao giờ gửi SĐT, email hay từ khoá có dạng SĐT.
import { safeLocal } from './storage';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const PHONE_LIKE = /(\+?84|0)[\s.-]?\d(?:[\s.-]?\d){7,9}/;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/** Bỏ mọi tham số có giá trị giống SĐT/email. Giữ nguyên MST (10 số không bắt đầu bằng 0 hoặc có dạng -xxx). */
export function sanitizeParams(params = {}) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (key === 'mst') {
      out[key] = String(value);
      continue;
    }
    const s = String(value);
    if (EMAIL_LIKE.test(s) || PHONE_LIKE.test(s)) continue;
    out[key] = value;
  }
  return out;
}

export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  try {
    const consent = JSON.parse(safeLocal.get('cookie_consent') || 'null');
    return Boolean(consent?.analytics);
  } catch {
    return false;
  }
}

export function getDevice() {
  if (typeof window === 'undefined') return 'unknown';
  try {
    return window.matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
  } catch {
    return 'unknown';
  }
}

/**
 * Tạo hàng đợi dataLayer + hàm gtag (chưa tải script). Sự kiện gửi trước khi gtag.js tải xong
 * vẫn nằm trong dataLayer và được gửi khi script chạy.
 */
function ensureGtag() {
  if (window.__gaReady) return;
  window.__gaReady = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js yêu cầu đúng đối tượng `arguments`.
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

/**
 * Nạp GA4 (spec mục 8.3): chỉ khi có NEXT_PUBLIC_GA_ID VÀ người dùng đã đồng ý cookie thống kê.
 * Tải sau khi trang hiển thị (spec mục 7.2). Rút lại đồng ý thì tắt gửi ngay.
 */
export function syncAnalyticsConsent() {
  if (!GA_ID || typeof window === 'undefined') return;
  const allowed = hasAnalyticsConsent();
  window[`ga-disable-${GA_ID}`] = !allowed;
  if (!allowed || window.__gaScriptAdded) return;
  ensureGtag();
  window.__gaScriptAdded = true;
  const inject = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(s);
  };
  const idle = () =>
    window.requestIdleCallback ? requestIdleCallback(inject) : setTimeout(inject, 1);
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

export function track(name, params = {}) {
  if (typeof window === 'undefined') return;
  const clean = sanitizeParams(params);
  if (GA_ID && hasAnalyticsConsent()) {
    ensureGtag();
    window.gtag('event', name, clean);
  } else if (process.env.NODE_ENV !== 'production') {
    console.debug('[track]', name, clean);
  }
  // Dùng cho test e2e: kiểm tra sự kiện mà không cần GA.
  // Nhật ký sự kiện cho test e2e — chỉ bật bằng NEXT_PUBLIC_TRACK_LOG=1 (playwright.config.mjs), không lộ
  // ra biến toàn cục / phình bộ nhớ ở production.
  if (process.env.NEXT_PUBLIC_TRACK_LOG === '1')
    (window.__trackLog ||= []).push({ name, params: clean });
}
