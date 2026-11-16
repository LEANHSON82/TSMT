// Cầu nối giữa lớp AdProvider (JS thuần) và giao diện React của quảng cáo giả lập / dự phòng.
// Provider gọi openAdOverlay() → <AdOverlayHost/> vẽ modal → resolve kết quả.
let listener = null;

export function subscribeAdOverlay(fn) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** request: { kind: 'mock-video' | 'fallback', durationMs?, seconds?, forceClose? } */
export function openAdOverlay(request) {
  return new Promise((resolve) => {
    if (!listener) {
      resolve({ status: 'no_fill' });
      return;
    }
    listener({ ...request, resolve });
  });
}
