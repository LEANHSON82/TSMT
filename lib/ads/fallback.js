// Quảng cáo dự phòng (spec mục 4.2, 5.2): modal toàn màn hình chứa 1 banner lớn (336×280 hoặc 300×600)
// + đếm ngược 5 giây rồi trả granted với payload.type='fallback'. Đóng sớm → 'closed'.
import { openAdOverlay } from './overlay';

export const FALLBACK_SECONDS = Number(process.env.NEXT_PUBLIC_FALLBACK_SECONDS) || 5;

export async function showRewarded({ onShown } = {}) {
  const result = await openAdOverlay({ kind: 'fallback', seconds: FALLBACK_SECONDS, onShown });
  if (result.status === 'granted') return { status: 'granted', payload: { type: 'fallback' } };
  return result;
}

export function renderBanner() {
  /* Banner dự phòng: AdSlot đã vẽ khung giữ chỗ. */
}
