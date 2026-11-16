// Bản giả lập cho dev và test tự động (spec mục 5.2): modal «VIDEO QUẢNG CÁO (giả lập)» 3 giây.
// Thêm ?ad=closed | ?ad=no_fill | ?ad=blocked vào URL để ép từng nhánh lỗi.
import { openAdOverlay } from './overlay';

const MOCK_VIDEO_MS = Number(process.env.NEXT_PUBLIC_MOCK_VIDEO_MS) || 3000;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function forced() {
  try {
    return new URLSearchParams(window.location.search).get('ad');
  } catch {
    return null;
  }
}

export async function showRewarded({ onShown } = {}) {
  const f = forced();
  if (f === 'blocked') {
    await wait(300);
    return { status: 'blocked' };
  }
  if (f === 'no_fill') {
    await wait(400);
    return { status: 'no_fill' };
  }
  const result = await openAdOverlay({
    kind: 'mock-video',
    durationMs: MOCK_VIDEO_MS,
    forceClose: f === 'closed',
    onShown,
  });
  if (result.status === 'granted') return { status: 'granted', payload: { type: 'mock' } };
  return result;
}

export function renderBanner() {
  /* Bản mock: AdSlot đã vẽ khung giữ chỗ. */
}
