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
import Modal from './Modal';

const AdOverlayHost = dynamic(() => import('./AdOverlayHost'), { ssr: false });

const MAX_AUTO_RETRIES = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Xin vé ('ad' kèm kết quả quảng cáo, 'human' chỉ cần Turnstile); ném lỗi có status (0 = lỗi mạng).
 * token: token Turnstile lấy sẵn từ trước khi chạy quảng cáo (dùng một lần); không có thì lấy mới.
 */
async function requestPass(mode, adResult, onInteractive, token) {
  if (!token) token = await getTurnstileToken({ onInteractive });
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
 * state: idle · checking (kiểm tra Cloudflare TRƯỚC khi chạy quảng cáo) · ad (đang chạy quảng cáo)
 *        · verifying (đang xin vé) · closed (đóng sớm) · blocked (chặn quảng cáo)
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
  const tokenRef = useRef(null); // token Turnstile lấy trước quảng cáo, dùng ngay khi xem xong
  const busyRef = useRef(false);

  useEffect(() => {
    track('list_gate_view', { path: window.location.pathname, mode });
  }, [mode]);

  const unlock = useCallback(async () => {
    setState('verifying');
    setNeedTick(false);
    for (let retries = 0; ; retries += 1) {
      try {
        const token = tokenRef.current;
        tokenRef.current = null; // token chỉ dùng được một lần; lần thử lại lấy token mới
        await requestPass(mode, adResultRef.current, () => setNeedTick(true), token);
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
    try {
      // Kiểm tra Cloudflare TRƯỚC video: nếu cần tick ô xác minh thì người dùng tick lúc đầu, xem xong quảng cáo là
      // danh sách hiện ngay (token còn hạn 5 phút, đủ cho một quảng cáo). Lỗi thì vẫn cho xem quảng cáo, lấy lại
      // token sau.
      setState('checking');
      setNeedTick(false);
      tokenRef.current = await getTurnstileToken({ onInteractive: () => setNeedTick(true) }).catch(
        () => null,
      );
      setNeedTick(false);
      setState('ad');
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

  const busy = state === 'ad' || state === 'verifying' || state === 'checking';
  const label =
    state === 'ad' || state === 'checking'
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
    checking: needTick ? M.gate.tickFirst : undefined,
  }[state];

  // Hộp thoại mời xem (chỉ cổng quảng cáo): tự mở khi vào trang — quảng cáo có thưởng phải do người dùng tự chọn xem
  // (chính sách Google, spec 5.1), nên không tự chạy video; bấm «Xem» một lần là chạy. «Để sau» / Esc → còn khung nhỏ.
  const confirmRef = useRef(null);
  const [prompt, setPrompt] = useState(false);
  useEffect(() => {
    if (!human) setPrompt(true);
  }, [human]);
  const accept = () => {
    setPrompt(false);
    start();
  };

  const tone =
    needTick && (state === 'verifying' || state === 'checking')
      ? 'font-semibold text-ink'
      : message
        ? 'text-danger'
        : 'text-muted';
  return (
    <div className="w-full max-w-[440px] rounded-xl border border-line bg-white p-5 text-center shadow-[0_18px_50px_-12px_rgba(15,23,42,0.28)] sm:p-6">
      <h2 className="text-[18px] leading-[26px] font-semibold text-pretty text-title">
        {human ? M.gate.humanTitle : M.gate.cardTitle}
      </h2>
      <p className="mt-1.5 text-sm text-pretty text-ink-2">
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
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cta px-6 text-body font-semibold text-white hover:bg-cta-hover aria-busy:cursor-progress disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-2"
        >
          {busy ? (
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
            />
          ) : human ? null : (
            <IconPlay size={16} />
          )}
          {label}
        </button>
      )}
      <p aria-live="polite" className={`mt-2.5 text-meta ${tone}`}>
        {message || (human ? M.gate.humanNote(minutes, pages) : M.gate.note(minutes, pages))}
      </p>
      {state === 'blocked' && (
        <div className="mt-2 text-left text-meta text-ink-2">
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
      <Modal
        open={prompt && state === 'idle'}
        onClose={() => setPrompt(false)}
        title={M.gate.confirmTitle}
        describedBy="gate-confirm-body"
        initialFocusRef={confirmRef}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPrompt(false)}
              className="h-11 rounded-md bg-page px-4 text-body font-semibold text-brand hover:bg-line-soft"
            >
              {M.gate.confirmCancel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={accept}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cta px-4 text-body font-semibold text-white hover:bg-cta-hover active:bg-chrome-2"
            >
              <IconPlay size={14} />
              {M.gate.confirmOk}
            </button>
          </div>
        }
      >
        <p id="gate-confirm-body" className="text-sm leading-6 text-ink-2 sm:text-body">
          {M.gate.confirmBody(minutes)}
        </p>
      </Modal>
      {armed && <AdOverlayHost />}
    </div>
  );
}
