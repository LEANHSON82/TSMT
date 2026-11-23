// Nạp Google Publisher Tag (gpt.js) một lần, chỉ khi cần (spec mục 5.2, 5.3): lần đầu bấm «Xem số điện thoại»
// hoặc khi một ô banner sắp vào màn hình. Không nằm trong JS tải lần đầu.
//
// Chặn quảng cáo (spec 5.3): script lỗi (onerror) hoặc sau 3 giây GPT vẫn chưa chạy → 'blocked'. Lần gọi sau
// thử nạp lại (mạng chập chờn không bị coi là chặn mãi).
//
// Đồng ý cookie (spec 8.3): chưa đồng ý cookie quảng cáo → limitedAds (không cookie / localStorage, không
// cá nhân hoá). Người dùng đổi lựa chọn → áp ngay cho các lần tải quảng cáo sau, không cần tải lại trang.
import { safeLocal } from '@/lib/storage';

export const GPT_SRC = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
export const BLOCK_MS = 3000;

let scriptEl = null;
let ready = null;
const handlers = new Map(); // slot → { tên sự kiện: hàm }
const EVENTS = [
  'rewardedSlotReady',
  'rewardedSlotGranted',
  'rewardedSlotVideoCompleted',
  'rewardedSlotClosed',
  'slotRenderEnded',
];

function adsConsent() {
  try {
    return Boolean(JSON.parse(safeLocal.get('cookie_consent') || 'null')?.ads);
  } catch {
    return false;
  }
}

function applyPrivacy(gt) {
  gt.pubads().setPrivacySettings({ limitedAds: !adsConsent() });
}

function setup(gt) {
  applyPrivacy(gt);
  window.addEventListener('cookie-consent-change', () => applyPrivacy(gt));
  // Một bộ lắng nghe chung cho mọi slot, chia về đúng slot qua onSlot().
  for (const type of EVENTS) {
    gt.pubads().addEventListener(type, (e) => handlers.get(e.slot)?.[type]?.(e));
  }
  gt.enableServices();
}

/** Người dùng đã trả lời banner cookie (đồng ý hoặc chỉ cookie cần thiết) chưa. */
function consentDecided() {
  try {
    return Boolean(safeLocal.get('cookie_consent'));
  } catch {
    return true;
  }
}

let gate = null;
/**
 * Banner quảng cáo chỉ nạp GPT khi (1) người dùng đã trả lời banner cookie (spec 8.3: đồng ý cookie trước khi tải
 * script quảng cáo) và (2) trang đã tải xong + trình duyệt rảnh (spec 7.2: script quảng cáo tải sau khi trang hiển
 * thị) — không tranh luồng chính với nội dung. Luồng «Xem số điện thoại» (người dùng chủ động bấm) không qua cổng này.
 */
export function bannerGate() {
  if (gate) return gate;
  gate = new Promise((resolve) => {
    const idle = () =>
      (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(() => resolve(), {
        timeout: 4000,
      });
    const afterLoad = () => {
      if (document.readyState === 'complete') idle();
      else window.addEventListener('load', idle, { once: true });
    };
    if (consentDecided()) afterLoad();
    else {
      const onDecide = () => {
        if (!consentDecided()) return;
        window.removeEventListener('cookie-consent-change', onDecide);
        afterLoad();
      };
      window.addEventListener('cookie-consent-change', onDecide);
    }
  });
  return gate;
}

/** Đăng ký hàm xử lý sự kiện GPT cho một slot. Trả hàm huỷ đăng ký. */
export function onSlot(slot, map) {
  handlers.set(slot, map);
  return () => handlers.delete(slot);
}

const blockedError = () => Object.assign(new Error('gpt_blocked'), { code: 'blocked' });

function inject() {
  const el = document.createElement('script');
  el.src = GPT_SRC;
  el.async = true;
  el.crossOrigin = 'anonymous';
  el.addEventListener('error', () => {
    el.dataset.failed = '1';
    el.remove();
    if (scriptEl === el) scriptEl = null;
  });
  document.head.appendChild(el);
  return el;
}

function blockedAfter(el) {
  return new Promise((_, reject) => {
    if (!el.isConnected) return reject(blockedError());
    el.addEventListener('error', () => reject(blockedError()), { once: true });
    setTimeout(() => reject(blockedError()), BLOCK_MS);
  });
}

/** Promise<googletag> đã sẵn sàng; reject { code: 'blocked' } khi bị chặn / không tải được. */
export function loadGpt() {
  const gt = (window.googletag = window.googletag || { cmd: [] });
  if (gt.apiReady && ready) return ready;
  // Hàng đợi cmd giữ nguyên qua các lần nạp lại: setup chỉ chạy một lần, khi GPT thực sự chạy.
  if (!ready) ready = new Promise((resolve) => gt.cmd.push(() => (setup(gt), resolve(gt))));
  if (!scriptEl) scriptEl = inject();
  return Promise.race([ready, blockedAfter(scriptEl)]);
}
