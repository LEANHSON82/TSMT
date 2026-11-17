// Cầu nối giữa lớp AdProvider (JS thuần) và giao diện React của quảng cáo giả lập / dự phòng.
// Provider gọi openAdOverlay() → <AdOverlayHost/> vẽ modal → resolve kết quả.
// AdOverlayHost được nạp khi người dùng bấm «Xem số điện thoại» lần đầu (không nằm trong JS tải lần đầu):
// nếu provider gọi trước khi host kịp nạp xong thì chờ tối đa HOST_WAIT_MS rồi mới coi là không có quảng cáo.
const HOST_WAIT_MS = 5000;
let listener = null;
let waiters = [];

export function subscribeAdOverlay(fn) {
  listener = fn;
  waiters.splice(0).forEach((w) => w(fn));
  return () => {
    if (listener === fn) listener = null;
  };
}

function waitForHost() {
  if (listener) return Promise.resolve(listener);
  return new Promise((resolve) => {
    const onReady = (fn) => {
      clearTimeout(timer);
      resolve(fn);
    };
    const timer = setTimeout(() => {
      waiters = waiters.filter((w) => w !== onReady);
      resolve(null);
    }, HOST_WAIT_MS);
    waiters.push(onReady);
  });
}

/** request: { kind: 'mock-video' | 'fallback', durationMs?, seconds?, forceClose? } */
export async function openAdOverlay(request) {
  const host = await waitForHost();
  if (!host) return { status: 'no_fill' };
  return new Promise((resolve) => host({ ...request, resolve }));
}
