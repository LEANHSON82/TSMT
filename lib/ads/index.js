// Lớp AdProvider (spec mục 5.2): một interface, ba cài đặt. Trang và hook usePhoneUnlock chỉ gọi
// interface này, không gọi googletag trực tiếp.
//   showRewarded() -> Promise<{ status: 'granted' | 'closed' | 'no_fill' | 'blocked', payload?: object }>
//   renderBanner(slotId, el, { sizes }) -> Promise<hàm huỷ | undefined>  (chỉ gpt đổ quảng cáo thật)
//   chọn cài đặt theo NEXT_PUBLIC_AD_PROVIDER = 'gpt' | 'fallback' | 'mock' (mặc định mock)
// Chỉ nạp đúng cài đặt đang dùng, vào lúc cần (bấm «Xem số điện thoại») — không nằm trong JS tải lần đầu.
const LOADERS = {
  gpt: () => import('./gpt'),
  fallback: () => import('./fallback'),
  mock: () => import('./mock'),
};
export const AD_PROVIDER = LOADERS[process.env.NEXT_PUBLIC_AD_PROVIDER]
  ? process.env.NEXT_PUBLIC_AD_PROVIDER
  : 'mock';
const loadImpl = LOADERS[AD_PROVIDER];

/** ad_type cho analytics */
export const REWARDED_AD_TYPE = { gpt: 'rewarded', fallback: 'fallback', mock: 'mock' }[
  AD_PROVIDER
];

export async function showRewarded(opts) {
  return (await loadImpl()).showRewarded(opts);
}

/** Quảng cáo dự phòng, dùng khi showRewarded trả 'no_fill'. */
export async function showFallback(opts) {
  return (await LOADERS.fallback()).showRewarded(opts);
}

export async function renderBanner(slotId, el, opts) {
  return (await loadImpl()).renderBanner(slotId, el, opts);
}
