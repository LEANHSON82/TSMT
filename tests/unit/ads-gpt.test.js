// lib/ads/gpt.js + gpt-loader.js với googletag giả: các nhánh granted / closed / no_fill / blocked (spec 4.2, 5.2, 5.3).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function fakeGoogletag({ slotNull = false } = {}) {
  const listeners = {};
  const pubads = {
    setPrivacySettings: vi.fn(),
    addEventListener: (type, fn) => (listeners[type] ||= []).push(fn),
  };
  const gt = {
    apiReady: true,
    enums: { OutOfPageFormat: { REWARDED: 'REWARDED' } },
    pubads: () => pubads,
    enableServices: vi.fn(),
    destroySlots: vi.fn(),
    display: vi.fn(),
    defineOutOfPageSlot: vi.fn(() => (slotNull ? null : gt._slot)),
    defineSlot: vi.fn(() => gt._slot),
    _slot: {
      addService: vi.fn(function addService() {
        return this;
      }),
      setTargeting: vi.fn(),
    },
    emit: (type, e = {}) => (listeners[type] || []).forEach((fn) => fn({ slot: gt._slot, ...e })),
  };
  return gt;
}

let scripts;
function setupDom({ loads = true, gt = fakeGoogletag() } = {}) {
  scripts = [];
  const winListeners = {};
  globalThis.window = {
    googletag: undefined,
    localStorage: { getItem: () => JSON.stringify({ ads: true }) },
    addEventListener: (t, fn) => (winListeners[t] ||= []).push(fn),
  };
  globalThis.document = {
    createElement: () => {
      const handlers = {};
      const el = {
        dataset: {},
        isConnected: true,
        addEventListener: (t, fn) => (handlers[t] ||= []).push(fn),
        remove() {
          el.isConnected = false;
        },
        fire: (t) => (handlers[t] || []).forEach((fn) => fn()),
      };
      return el;
    },
    head: {
      appendChild(el) {
        scripts.push(el);
        // Script tải xong: GPT thật thay mảng cmd bằng đối tượng và chạy hàng đợi.
        if (loads)
          queueMicrotask(() => {
            const queued = window.googletag.cmd;
            Object.assign(window.googletag, gt, { cmd: { push: (f) => f() } });
            queued.forEach((f) => f());
          });
      },
    },
  };
  return gt;
}

async function loadGptModule(env = {}) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_GPT_AD_UNIT_PATH', env.rewarded ?? '/1/rewarded');
  vi.stubEnv('NEXT_PUBLIC_GPT_BANNER_PATH', env.banner ?? '/1/banner');
  return import('@/lib/ads/gpt');
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  delete globalThis.window;
  delete globalThis.document;
});

describe('gpt showRewarded', () => {
  it('chưa cấu hình ad unit → no_fill, không nạp script', async () => {
    setupDom();
    const { showRewarded } = await loadGptModule({ rewarded: '' });
    expect(await showRewarded()).toEqual({ status: 'no_fill' });
    expect(scripts).toHaveLength(0);
  });

  it('xem đủ rồi đóng → granted kèm phần thưởng; huỷ slot', async () => {
    const gt = setupDom();
    const { showRewarded } = await loadGptModule();
    const onShown = vi.fn();
    const p = showRewarded({ onShown });
    await vi.waitFor(() => expect(gt.display).toHaveBeenCalled());
    const makeRewardedVisible = vi.fn();
    gt.emit('rewardedSlotReady', { makeRewardedVisible });
    expect(makeRewardedVisible).toHaveBeenCalled();
    expect(onShown).toHaveBeenCalled();
    gt.emit('rewardedSlotGranted', { payload: { type: 'coins', amount: 1 } });
    gt.emit('rewardedSlotClosed');
    expect(await p).toEqual({
      status: 'granted',
      payload: { type: 'rewarded', reward: { type: 'coins', amount: 1 } },
    });
    expect(gt.destroySlots).toHaveBeenCalledWith([gt._slot]);
    expect(gt.pubads().setPrivacySettings).toHaveBeenCalledWith({ limitedAds: false });
  });

  it('được thưởng + video hết → tự đóng sau 1 giây, không cần bấm X', async () => {
    const gt = setupDom();
    const { showRewarded, AUTO_CLOSE_MS } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(gt.display).toHaveBeenCalled());
    gt.emit('rewardedSlotReady', { makeRewardedVisible: () => {} });
    gt.emit('rewardedSlotGranted', { payload: { type: 'coins', amount: 20 } });
    gt.emit('rewardedSlotVideoCompleted');
    expect(gt.destroySlots).not.toHaveBeenCalled();
    vi.advanceTimersByTime(AUTO_CLOSE_MS);
    expect(await p).toMatchObject({ status: 'granted' });
    expect(gt.destroySlots).toHaveBeenCalledWith([gt._slot]);
    gt.emit('rewardedSlotClosed'); // đến muộn sau khi đã đóng: không đổi kết quả
  });

  it('được thưởng nhưng không có sự kiện video hết → vẫn tự đóng sau 3 giây', async () => {
    const gt = setupDom();
    const { showRewarded, COMPLETE_WAIT_MS } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(gt.display).toHaveBeenCalled());
    gt.emit('rewardedSlotReady', { makeRewardedVisible: () => {} });
    gt.emit('rewardedSlotGranted', { payload: {} });
    vi.advanceTimersByTime(COMPLETE_WAIT_MS);
    expect(await p).toMatchObject({ status: 'granted' });
  });

  it('đóng trước khi được thưởng → closed', async () => {
    const gt = setupDom();
    const { showRewarded } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(gt.display).toHaveBeenCalled());
    gt.emit('rewardedSlotReady', { makeRewardedVisible: () => {} });
    gt.emit('rewardedSlotClosed');
    expect(await p).toEqual({ status: 'closed' });
  });

  it('slot null (trang không đủ điều kiện) → no_fill', async () => {
    setupDom({ gt: fakeGoogletag({ slotNull: true }) });
    const { showRewarded } = await loadGptModule();
    expect(await showRewarded()).toEqual({ status: 'no_fill' });
  });

  it('quảng cáo trống → no_fill', async () => {
    const gt = setupDom();
    const { showRewarded } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(gt.display).toHaveBeenCalled());
    gt.emit('slotRenderEnded', { isEmpty: true });
    expect(await p).toEqual({ status: 'no_fill' });
  });

  it('quá 8 giây chưa sẵn sàng → no_fill', async () => {
    const gt = setupDom();
    const { showRewarded, READY_MS } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(gt.display).toHaveBeenCalled());
    vi.advanceTimersByTime(READY_MS);
    expect(await p).toEqual({ status: 'no_fill' });
    expect(gt.destroySlots).toHaveBeenCalled();
  });

  it('script lỗi (AdBlock) → blocked', async () => {
    setupDom({ loads: false });
    const { showRewarded } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    scripts[0].fire('error');
    expect(await p).toEqual({ status: 'blocked' });
  });

  it('sau 3 giây GPT chưa chạy → blocked', async () => {
    setupDom({ loads: false });
    const { showRewarded } = await loadGptModule();
    const p = showRewarded();
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    vi.advanceTimersByTime(3000);
    expect(await p).toEqual({ status: 'blocked' });
  });
});

describe('gpt renderBanner', () => {
  it('định nghĩa slot đúng cỡ, hiển thị, trả hàm huỷ', async () => {
    const gt = setupDom();
    const { renderBanner } = await loadGptModule();
    const el = { id: '', isConnected: true };
    const destroy = await renderBanner('home-mid', el, { sizes: [728, 90] });
    expect(el.id).toBe('ad-home-mid');
    expect(gt.defineSlot).toHaveBeenCalledWith('/1/banner', [728, 90], 'ad-home-mid');
    expect(gt.display).toHaveBeenCalledWith('ad-home-mid');
    destroy();
    expect(gt.destroySlots).toHaveBeenCalledWith([gt._slot]);
  });

  it('báo cỡ thật của quảng cáo qua onRender; quảng cáo trống thì không', async () => {
    const gt = setupDom();
    const { renderBanner } = await loadGptModule();
    const onRender = vi.fn();
    await renderBanner(
      'detail-rail',
      { id: '', isConnected: true },
      {
        sizes: [
          [300, 600],
          [300, 250],
        ],
        onRender,
      },
    );
    gt.emit('slotRenderEnded', { isEmpty: true, size: null });
    expect(onRender).not.toHaveBeenCalled();
    gt.emit('slotRenderEnded', { isEmpty: false, size: [300, 250] });
    expect(onRender).toHaveBeenCalledWith([300, 250]);
  });

  it('chưa cấu hình banner → không làm gì', async () => {
    setupDom();
    const { renderBanner } = await loadGptModule({ banner: '' });
    expect(await renderBanner('x', { isConnected: true }, { sizes: [300, 250] })).toBeUndefined();
    expect(scripts).toHaveLength(0);
  });
});
