// Google Publisher Tag — video có thưởng (rewarded) và banner (spec mục 5.1, 5.2, 5.4).
// Đường dẫn ad unit lấy từ biến môi trường (owner tạo trong Google Ad Manager). Khi chưa có tài khoản, dùng
// ad unit thử nghiệm công khai của Google (xem .env.example) để chạy thử luồng thật.
// Tài liệu: https://developers.google.com/publisher-tag/samples/display-rewarded-ad
import { loadGpt, onSlot } from './gpt-loader';

export const AD_UNIT_PATH = process.env.NEXT_PUBLIC_GPT_AD_UNIT_PATH || '';
export const BANNER_PATH = process.env.NEXT_PUBLIC_GPT_BANNER_PATH || '';
export const READY_MS = 8000;

/**
 * Rewarded: slot null (trang không đủ điều kiện, nhất là máy tính), trống, hoặc quá 8 giây chưa sẵn sàng
 * → 'no_fill' (hook chuyển sang quảng cáo dự phòng). Đóng trước khi được thưởng → 'closed'.
 * Được thưởng → chờ người dùng đóng quảng cáo rồi mới trả 'granted' (số hiện ra khi trang không còn bị che).
 */
export async function showRewarded({ onShown } = {}) {
  if (!AD_UNIT_PATH) return { status: 'no_fill' };
  let gt;
  try {
    gt = await loadGpt();
  } catch {
    return { status: 'blocked' };
  }
  const slot = gt.defineOutOfPageSlot(AD_UNIT_PATH, gt.enums.OutOfPageFormat.REWARDED);
  if (!slot) return { status: 'no_fill' };
  slot.addService(gt.pubads());

  return new Promise((resolve) => {
    let reward = null;
    let shown = false;
    let off = () => {};
    const finish = (result) => {
      clearTimeout(timer);
      off();
      gt.destroySlots([slot]);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ status: 'no_fill' }), READY_MS);
    off = onSlot(slot, {
      rewardedSlotReady: (e) => {
        clearTimeout(timer);
        shown = true;
        e.makeRewardedVisible();
        onShown?.();
      },
      rewardedSlotGranted: (e) => {
        reward = e.payload || {};
      },
      rewardedSlotClosed: () =>
        finish(
          reward
            ? { status: 'granted', payload: { type: 'rewarded', reward } }
            : { status: 'closed' },
        ),
      slotRenderEnded: (e) => {
        if (e.isEmpty && !shown) finish({ status: 'no_fill' });
      },
    });
    gt.display(slot);
  });
}

/**
 * Đổ banner vào phần tử giữ chỗ. sizes: [w, h] hoặc [[w, h], …]. Trả hàm huỷ slot (gọi khi rời trang).
 * Chặn quảng cáo / chưa cấu hình → giữ nguyên khung xám có nhãn «Quảng cáo».
 */
export async function renderBanner(slotId, el, { sizes } = {}) {
  if (!BANNER_PATH || !el || !sizes) return undefined;
  const gt = await loadGpt();
  if (!el.isConnected) return undefined;
  if (!el.id) el.id = `ad-${slotId}`;
  const slot = gt.defineSlot(BANNER_PATH, sizes, el.id);
  if (!slot) return undefined; // id đã có slot (render 2 lần trong dev)
  slot.addService(gt.pubads()).setTargeting('pos', slotId);
  gt.display(el.id);
  return () => gt.destroySlots([slot]);
}
