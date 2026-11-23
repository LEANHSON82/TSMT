'use client';

// Luồng cốt lõi (spec mục 4): bấm «Xem số điện thoại» → hộp thoại xác nhận → tạo phiên mở số →
// xem video quảng cáo có thưởng → complete → hiện SĐT.
//
// state:
//   'idle'        số che + nút
//   'confirm'     hộp thoại «Xem video ngắn để hiện số điện thoại?»
//   'loading'     đang tạo phiên (POST /v1/phone-unlocks)
//   'ad'          video / quảng cáo dự phòng đang chạy
//   'fetching'    đã xem xong, đang lấy số (POST .../complete)
//   'success'     có số
//   'closed'      đóng video sớm → «Xem lại»
//   'blocked'     trình duyệt chặn quảng cáo
//   'rate_limited' API trả 429 → khoá nút, đếm ngược
//   'error'       lỗi mạng/server sau khi đã xem xong → «Thử lại» (KHÔNG bắt xem lại video)
//
// Quy tắc vàng: đã xem xong video thì không bao giờ bắt xem lại vì lỗi của chúng ta.
// ad_result được giữ trong bộ nhớ (ref) cho tới khi lấy được số.
import { useCallback, useEffect, useRef, useState } from 'react';
import { REWARDED_AD_TYPE, showFallback, showRewarded } from '@/lib/ads';
import { completePhoneUnlock, createPhoneUnlock } from '@/lib/api';
import { getDevice, track } from '@/lib/analytics';
import { safeSession } from '@/lib/storage';
import { getTurnstileToken } from '@/lib/turnstile';

const MAX_AUTO_RETRIES = 2;
const MAX_RENEWALS = 2;
/** Chuỗi có ít nhất 6 chữ số (số điện thoại hợp lệ — loại «undefined», chuỗi rỗng…). */
const isPhone = (v) => typeof v === 'string' && /\d{6}/.test(v.replace(/\D/g, ''));

const storageKey = (mst) => `phone:${mst}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function usePhoneUnlock(mst) {
  const [state, setStateRaw] = useState('idle');
  const [phone, setPhone] = useState(null);
  const [error, setError] = useState(null);
  const [retryAt, setRetryAt] = useState(null);

  const stateRef = useRef('idle');
  const adResultRef = useRef(null);
  const unlockRef = useRef(null);
  const mountedRef = useRef(true);

  const setState = useCallback((s) => {
    stateRef.current = s;
    if (mountedRef.current) setStateRaw(s);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Trong cùng tab, quay lại DN đã mở thì không phải xem lại video (sessionStorage theo MST).
  useEffect(() => {
    const saved = safeSession.get(storageKey(mst));
    if (isPhone(saved)) {
      setPhone(saved);
      setState('success');
    }
  }, [mst, setState]);

  // Hết thời gian chờ 429 → mở lại nút.
  useEffect(() => {
    if (state !== 'rate_limited' || !retryAt) return undefined;
    const t = setTimeout(() => setState('idle'), Math.max(0, retryAt - Date.now()));
    return () => clearTimeout(t);
  }, [state, retryAt, setState]);

  const fail = useCallback(
    (err) => {
      const status = err?.status ?? 0;
      if (status === 429) {
        const seconds = Number(err.retryAfter) || 60;
        setRetryAt(Date.now() + seconds * 1000);
        setError({ code: 'rate_limited', status });
        track('phone_unlock_error', { mst, error_code: '429' });
        setState('rate_limited');
        return;
      }
      setError({ code: err?.code || 'network_error', status });
      track('phone_unlock_error', { mst, error_code: String(status || 'network') });
      setState('error');
    },
    [mst, setState],
  );

  /** Lấy số bằng ad_result đã có. Tự thử lại tối đa 2 lần khi lỗi mạng/5xx; 410 → tạo phiên mới. */
  const fetchPhone = useCallback(async () => {
    setState('fetching');
    setError(null);
    let retries = 0;
    let renewals = 0;
    for (;;) {
      try {
        if (!unlockRef.current) unlockRef.current = await createPhoneUnlock(mst);
        const token = await getTurnstileToken();
        const res = await completePhoneUnlock(unlockRef.current.unlock_id, {
          mst,
          ad_result: adResultRef.current,
          turnstile_token: token,
        });
        // Phản hồi 200 nhưng không có số hợp lệ → coi như lỗi mạng (tự thử lại / nút «Thử lại»).
        if (!isPhone(res?.phone)) throw Object.assign(new Error('bad_response'), { status: 0 });
        const adType = adResultRef.current?.type;
        unlockRef.current = null;
        adResultRef.current = null;
        safeSession.set(storageKey(mst), res.phone);
        setPhone(res.phone);
        track('phone_unlock_success', { mst, ad_type: adType });
        setState('success');
        return;
      } catch (err) {
        const status = err?.status ?? 0;
        if (status === 410 && renewals < MAX_RENEWALS) {
          // Phiên hết hạn: tự tạo phiên mới, không bắt xem lại vì đã granted. Vẫn ghi sự kiện lỗi (spec 8.1).
          track('phone_unlock_error', { mst, error_code: '410' });
          renewals += 1;
          unlockRef.current = null;
          continue;
        }
        if (status === 429) {
          fail(err);
          return;
        }
        const retriable = status === 0 || status >= 500 || status === 403 || status === 410;
        if (retriable && retries < MAX_AUTO_RETRIES) {
          retries += 1;
          if (status === 410) unlockRef.current = null;
          await sleep(400 * retries);
          continue;
        }
        fail(err);
        return;
      }
    }
  }, [mst, setState, fail]);

  /** Tạo phiên + chạy quảng cáo. Gọi từ nút «Xem» của hộp thoại, hoặc «Xem lại» sau khi đóng sớm. */
  const runAd = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      unlockRef.current = await createPhoneUnlock(mst);
    } catch (err) {
      fail(err);
      return;
    }
    setState('ad');
    const onShown = (adType) => track('phone_unlock_ad_shown', { mst, ad_type: adType });
    // Script quảng cáo ném lỗi (GPT thật) → coi như không có quảng cáo, chuyển sang quảng cáo dự phòng;
    // dự phòng cũng lỗi / không hiện được → báo lỗi có nút «Thử lại», không kẹt ở trạng thái «Đang tải».
    let result;
    try {
      result = await showRewarded({ onShown: () => onShown(REWARDED_AD_TYPE) });
    } catch {
      result = { status: 'no_fill' };
    }
    if (result.status === 'no_fill') {
      track('phone_unlock_no_fill', { mst, device: getDevice() });
      try {
        result = await showFallback({ onShown: () => onShown('fallback') });
      } catch {
        result = { status: 'error' };
      }
      if (result.status === 'no_fill' || result.status === 'error') {
        unlockRef.current = null;
        fail({ status: 0, code: 'ad_unavailable' });
        return;
      }
    }
    if (result.status === 'blocked') {
      track('phone_unlock_blocked', { mst });
      setState('blocked');
      return;
    }
    if (result.status !== 'granted') {
      track('phone_unlock_closed', { mst });
      setState('closed');
      return;
    }
    adResultRef.current = { type: result.payload?.type || REWARDED_AD_TYPE, ...result.payload };
    await fetchPhone();
  }, [mst, setState, fail, fetchPhone]);

  /** Bấm «Xem số điện thoại»: chỉ nhận khi đang ở trạng thái ban đầu (bỏ qua bấm liên tiếp). */
  const start = useCallback(() => {
    if (!['idle', 'closed'].includes(stateRef.current)) return;
    track('phone_unlock_click', { mst });
    setState('confirm');
  }, [mst, setState]);

  const confirm = useCallback(() => {
    if (stateRef.current !== 'confirm') return;
    runAd();
  }, [runAd]);

  const cancel = useCallback(() => {
    if (stateRef.current === 'confirm') setState('idle');
  }, [setState]);

  /** «Thử lại»: lỗi sau khi đã xem xong → chỉ lấy lại số; đóng sớm → chạy lại quảng cáo. */
  const retry = useCallback(() => {
    const s = stateRef.current;
    if (s === 'error' && adResultRef.current) fetchPhone();
    else if (s === 'error' || s === 'closed') runAd();
  }, [fetchPhone, runAd]);

  return { state, phone, error, retryAt, start, confirm, cancel, retry };
}
