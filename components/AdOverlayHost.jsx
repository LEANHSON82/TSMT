'use client';

// Vẽ modal quảng cáo giả lập (video 3 giây) và quảng cáo dự phòng (banner + đếm ngược 5 giây)
// theo yêu cầu từ lib/ads (qua lib/ads/overlay).
import { useEffect, useRef, useState } from 'react';
import { subscribeAdOverlay } from '@/lib/ads/overlay';
import { M } from '@/lib/messages';
import Modal from './Modal';
import AdUnit from './AdUnit';
import { IconClose, IconPlay } from './Icons';

function MockVideo({ req, done }) {
  const [elapsed, setElapsed] = useState(0);
  const closeRef = useRef(null);
  const doneRef = useRef(done);
  doneRef.current = done;
  const total = req.durationMs || 3000;

  useEffect(() => {
    req.onShown?.();
    if (req.forceClose) {
      const t = setTimeout(() => doneRef.current({ status: 'closed' }), 900);
      return () => clearTimeout(t);
    }
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const e = Date.now() - startedAt;
      setElapsed(e);
      if (e >= total) {
        clearInterval(iv);
        doneRef.current({ status: 'granted' });
      }
    }, 100);
    return () => clearInterval(iv);
  }, [req, total]);

  const pct = Math.min(100, (elapsed / total) * 100);
  return (
    <Modal
      open
      variant="fullscreen"
      title={M.phone.mockVideo}
      onClose={() => done({ status: 'closed' })}
      initialFocusRef={closeRef}
    >
      <div className="on-dark relative flex h-full flex-col items-center justify-center gap-5 bg-[#252525] px-6 text-white">
        {/* Nút đóng mô phỏng giao diện của mạng quảng cáo — FE thật không tự vẽ nút bỏ qua. */}
        <button
          ref={closeRef}
          type="button"
          aria-label={M.phone.closeAd}
          onClick={() => done({ status: 'closed' })}
          className="absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
        >
          <IconClose size={22} />
        </button>
        <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <IconPlay size={40} />
        </span>
        <p className="text-center text-lg font-semibold tracking-wide" data-testid="mock-video">
          {M.phone.mockVideo}
        </p>
        <p className="text-center text-sm text-white/75">{M.phone.mockVideoNote}</p>
        <div
          className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-label={M.phone.videoProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          {/* Chạy bằng animation CSS (scaleX, mượt) thay vì đổi width mỗi 100 ms. */}
          <div
            className="h-full origin-left bg-white"
            style={{ animation: `motion-progress ${total}ms linear forwards` }}
          />
        </div>
      </div>
    </Modal>
  );
}

function FallbackAd({ req, done }) {
  const total = req.seconds || 5;
  const [left, setLeft] = useState(total);
  const doneRef = useRef(done);
  doneRef.current = done;

  useEffect(() => {
    req.onShown?.();
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const remain = Math.max(0, total - Math.floor((Date.now() - startedAt) / 1000));
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(iv);
        doneRef.current({ status: 'granted' });
      }
    }, 200);
    return () => clearInterval(iv);
  }, [req, total]);

  return (
    <Modal
      open
      title={M.phone.fallbackTitle}
      onClose={() => done({ status: 'closed' })}
      className="sm:max-w-[400px]"
    >
      {/* Kiểu A: nhãn «Quảng cáo» 13px xám trên khung banner trơn (không bo), như ô quảng cáo trong trang. */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-1">
          <span className="self-start text-meta text-muted">{M.ad.label}</span>
          <AdUnit
            slotId="fallback"
            size="fallback"
            className="flex h-[280px] w-[336px] max-w-full items-center justify-center overflow-hidden bg-ad"
          />
        </div>
        <p
          className="text-center text-body font-semibold text-ink"
          aria-live="polite"
          data-testid="fallback-countdown"
        >
          {left > 0 ? M.phone.fallbackSeconds(left) : M.phone.fallbackDone}
        </p>
        {/* Vòng đếm ngược chạy liên tục trong `total` giây (CSS), số giây ở giữa. */}
        <div className="relative h-16 w-16" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-line)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="var(--color-cta)"
              strokeWidth="5"
              strokeLinecap="butt"
              pathLength="100"
              strokeDasharray="100"
              style={{ animation: `motion-ring ${total}s linear forwards` }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-h2 font-semibold text-ink tabular-nums">
            {left}
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default function AdOverlayHost() {
  const [req, setReq] = useState(null);

  useEffect(() => subscribeAdOverlay((r) => setReq(r)), []);

  if (!req) return null;
  const done = (result) => {
    if (req.settled) return;
    req.settled = true;
    setReq(null);
    req.resolve(result);
  };
  return req.kind === 'fallback' ? (
    <FallbackAd req={req} done={done} />
  ) : (
    <MockVideo req={req} done={done} />
  );
}
