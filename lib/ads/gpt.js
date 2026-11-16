// Google Publisher Tag — video có thưởng (rewarded) trên web (spec mục 5.1, 5.3).
// ĐỂ SAU: cần owner mở tài khoản Google Ad Manager và tạo ad unit (NEXT_PUBLIC_GPT_AD_UNIT_PATH).
//
// Khi làm thật:
//   1. Tải https://securepubads.g.doubleclick.net/tag/js/gpt.js chỉ khi cần (lần đầu bấm nút),
//      qua next/script strategy="lazyOnload". Script lỗi (onError) hoặc sau 3 giây vẫn không có
//      window.googletag → trả { status: 'blocked' }.
//   2. googletag.defineOutOfPageSlot(AD_UNIT_PATH, googletag.enums.OutOfPageFormat.REWARDED).
//      Hàm có thể trả null (trang không đủ điều kiện, nhất là trên máy tính) → { status: 'no_fill' }.
//   3. Lắng nghe: rewardedSlotReady → event.makeRewardedVisible(); rewardedSlotGranted → granted;
//      rewardedSlotClosed (chưa granted) → 'closed'; slotRenderEnded isEmpty → 'no_fill';
//      quá 8 giây chưa ready → 'no_fill'.
//   4. Trả { status: 'granted', payload: { type: 'rewarded', ...event.payload } }.
//   5. Nhớ googletag.destroySlots([slot]) sau khi xong.
// Tài liệu: https://developers.google.com/publisher-tag/samples/display-rewarded-ad

export const AD_UNIT_PATH = process.env.NEXT_PUBLIC_GPT_AD_UNIT_PATH || '';

export async function showRewarded() {
  // Chưa có Ad Manager → coi như không có quảng cáo, hook sẽ chuyển sang quảng cáo dự phòng.
  return { status: 'no_fill' };
}

export function renderBanner() {
  /* TODO: googletag.defineSlot(...).addService(googletag.pubads()); googletag.display(el.id) */
}
