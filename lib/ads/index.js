// Lớp AdProvider (spec mục 5.2): một interface, ba cài đặt. Trang và hook usePhoneUnlock chỉ gọi
// interface này, không gọi googletag trực tiếp.
//   showRewarded() -> Promise<{ status: 'granted' | 'closed' | 'no_fill' | 'blocked', payload?: object }>
//   renderBanner(slotId, el) -> void
//   chọn cài đặt theo NEXT_PUBLIC_AD_PROVIDER = 'gpt' | 'fallback' | 'mock' (mặc định mock)
import * as fallback from './fallback';
import * as gpt from './gpt';
import * as mock from './mock';

const IMPLS = { gpt, fallback, mock };
export const AD_PROVIDER = IMPLS[process.env.NEXT_PUBLIC_AD_PROVIDER]
  ? process.env.NEXT_PUBLIC_AD_PROVIDER
  : 'mock';
const impl = IMPLS[AD_PROVIDER];

/** ad_type cho analytics */
export const REWARDED_AD_TYPE = { gpt: 'rewarded', fallback: 'fallback', mock: 'mock' }[
  AD_PROVIDER
];

export function showRewarded(opts) {
  return impl.showRewarded(opts);
}

/** Quảng cáo dự phòng, dùng khi showRewarded trả 'no_fill'. */
export function showFallback(opts) {
  return fallback.showRewarded(opts);
}

export function renderBanner(slotId, el) {
  return impl.renderBanner(slotId, el);
}
