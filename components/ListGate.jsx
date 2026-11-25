'use client';

// Màn hình cổng trước danh sách bị chặn (lib/list-gate.js): bấm nút → video có thưởng (không có thì quảng cáo dự
// phòng, spec 5.1) → token Turnstile → POST /api/list-pass (cấp cookie vé) → tải lại đúng URL đang xem, middleware
// cho qua và trả danh sách. Cùng lớp quảng cáo và cùng quy tắc với luồng xem SĐT (hooks/usePhoneUnlock.js):
// đã xem xong quảng cáo thì lỗi phía chúng ta không bắt xem lại.
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { REWARDED_AD_TYPE, showFallback, showRewarded } from '@/lib/ads';
import { getDevice, track } from '@/lib/analytics';
import { M } from '@/lib/messages';
import { getTurnstileToken } from '@/lib/turnstile';
import { IconPlay } from './Icons';

const AdOverlayHost = dynamic(() => import('./AdOverlayHost'), { ssr: false });

const MAX_AUTO_RETRIES = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Xin vé ('ad' kèm kết quả quảng cáo, 'human' chỉ cần Turnstile); ném lỗi có status (0 = lỗi mạng). */
async function requestPass(mode, adResult, onInteractive) {
  const token = await getTurnstileToken({ onInteractive });
  let res;
  try {
    res = await fetch('/api/list-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        mode === 'human'
          ? { mode, turnstile_token: token }
          : { ad_result: adResult, turnstile_token: token },
      ),
      credentials: 'same-origin',
    });
  } catch {
    throw Object.assign(new Error('network'), { status: 0 });
  }
  if (!res.ok) {
    throw Object.assign(new Error('pass'), {
      status: res.status,
      retryAfter: Number(res.headers.get('Retry-After')) || 0,
    });
  }
}

/**
 * state: idle · ad (đang chạy quảng cáo) · verifying (đang xin vé) · closed (đóng sớm) · blocked (chặn quảng cáo)
 *        · rate_limited (IP xin quá nhiều vé) · error (lỗi sau khi đã xem xong → «Thử lại» chỉ xin lại vé)
 */
/** mode: 'ad' (cổng quảng cáo trang DN mới) | 'human' (xem quá nhiều trang → chỉ xác minh Turnstile). */
export default function ListGate({ mode = 'ad', minutes, pages, used = false }) {
  const human = mode === 'human';
  const [state, setState] = useState('idle');
  const [waitMin, setWaitMin] = useState(0);
  const [needTick, setNeedTick] = useState(false); // Cloudflare đang chờ người dùng tick ô xác minh
  const [armed, setArmed] = useState(false);
  const adResultRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    track('list_gate_view', { path: window.location.pathname, mode });
  }, [mode]);

  const unlock = useCallback(async () => {
    setState('verifying');
    setNeedTick(false);
    for (let retries = 0; ; retries += 1) {
      try {
        await requestPass(mode, adResultRef.current, () => setNeedTick(true));
        track('list_unlock_success', { mode, ad_type: adResultRef.current?.type });
        // Tải lại đúng URL (giữ ?page= / ?tinh=): request mới mang cookie vé, middleware trả danh sách.
        window.location.reload();
        return;
      } catch (err) {
        setNeedTick(false);
        if (err.status === 429) {
          setWaitMin(Math.max(1, Math.ceil((err.retryAfter || 60) / 60)));
          setState('rate_limited');
          return;
        }
        const retriable = err.status === 0 || err.status >= 500 || err.status === 403;
        if (retriable && retries < MAX_AUTO_RETRIES) {
          await sleep(400 * (retries + 1));
          continue;
        }
        track('list_unlock_error', { error_code: String(err.status || 'network') });
        setState('error');
        return;
      }
    }
  }, [mode]);

  const runAd = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setArmed(true);
    setState('ad');
    try {
      const onShown = (adType) => track('list_unlock_ad_shown', { ad_type: adType });
      let result;
      try {
        result = await showRewarded({ onShown: () => onShown(REWARDED_AD_TYPE) });
      } catch {
        result = { status: 'no_fill' };
      }
      if (result.status === 'no_fill') {
        track('list_unlock_no_fill', { device: getDevice() });
        try {
          result = await showFallback({ onShown: () => onShown('fallback') });
        } catch {
          result = { status: 'error' };
        }
        if (result.status === 'no_fill' || result.status === 'error') {
          setState('error');
          return;
        }
      }
      if (result.status === 'blocked') {
        setState('blocked');
        return;
      }
      if (result.status !== 'granted') {
        setState('closed');
        return;
      }
      adResultRef.current = { type: result.payload?.type || REWARDED_AD_TYPE };
      await unlock();
    } finally {
      busyRef.current = false;
    }
  }, [unlock]);

  const start = () => {
    track('list_unlock_click', { path: window.location.pathname, mode });
    if (human) unlock();
    else runAd();
  };
  const retry = () => (human || adResultRef.current ? unlock() : runAd());

  const busy = state === 'ad' || state === 'verifying';
  const label =
    state === 'ad'
      ? M.gate.loading
      : state === 'verifying'
        ? human
          ? M.gate.humanVerifying
          : M.gate.verifying
        : state === 'closed'
          ? M.gate.watchAgain
          : state === 'error'
            ? M.gate.retry
            : human
              ? M.gate.humanButton
              : M.gate.button;
  const message = {
    closed: M.gate.closedEarly,
    blocked: M.gate.adBlocked,
    rate_limited: M.gate.rateLimited(waitMin),
    error: human ? M.gate.humanError : M.gate.error,
    verifying: needTick ? M.gate.tick : undefined,
  }[state];

  return (
    <div className="panel flex flex-col items-start gap-4 p-5 md:p-7">
      <p className="max-w-[640px] text-body text-pretty text-ink-2">
        {human
          ? used
            ? M.gate.humanUsed(pages)
            : M.gate.humanLead
          : used
            ? M.gate.used(pages)
            : M.gate.lead}
      </p>
      {state !== 'blocked' && (
        <button
          type="button"
          onClick={busy ? undefined : state === 'error' || state === 'closed' ? retry : start}
          disabled={state === 'rate_limited'}
          aria-disabled={busy || undefined}
          aria-busy={busy}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cta px-6 text-body font-semibold text-white hover:bg-cta-hover aria-busy:cursor-progress disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-2 max-sm:w-full"
        >
          {busy ? (
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
            />
          ) : human ? null : (
            <IconPlay size={18} />
          )}
          {label}
        </button>
      )}
      <p
        aria-live="polite"
        className={`text-meta ${needTick && state === 'verifying' ? 'font-semibold text-ink' : message ? 'text-danger' : 'text-muted'}`}
      >
        {message || (human ? M.gate.humanNote(minutes, pages) : M.gate.note(minutes, pages))}
      </p>
      {state === 'blocked' && (
        <div className="text-meta text-ink-2">
          <ol className="list-decimal space-y-1 pl-5">
            {M.gate.adBlockedSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand"
          >
            {M.phone.reload}
          </button>
        </div>
      )}
      {armed && <AdOverlayHost />}
    </div>
  );
}
