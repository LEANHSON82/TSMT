'use client';

// Dòng «Điện thoại» trên trang DN (spec mục 3.4, 4). SĐT chỉ được render SAU KHI người dùng bấm nút
// và xem xong quảng cáo — không render sẵn rồi ẩn bằng CSS, không có trong HTML server trả về.
import { useEffect, useRef, useState } from 'react';
import { usePhoneUnlock } from '@/hooks/usePhoneUnlock';
import { track } from '@/lib/analytics';
import { M } from '@/lib/messages';
import dynamic from 'next/dynamic';
import { copyText } from './CopyButton';
import Modal from './Modal';
import RollingNumber from './RollingNumber';
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconEyeOff,
  IconPhone,
  IconPlay,
  IconRefresh,
  IconZalo,
} from './Icons';

const AdOverlayHost = dynamic(() => import('./AdOverlayHost'), { ssr: false });

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
    />
  );
}

function useMinutesLeft(retryAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!retryAt) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [retryAt]);
  if (!retryAt) return 0;
  return Math.max(1, Math.ceil((retryAt - now) / 60000));
}

// indent: class cho DÒNG ĐẦU (số che / số đã hiện / câu «không có số») — bảng thông tin trên điện thoại cho khối
// này phủ cả 2 cột (nút rộng hết ngang) và thụt dòng đầu sang cột giá trị, ngang hàng nhãn «Điện thoại».
export default function PhoneReveal({ mst, hasPhone, phoneHidden, masked, indent = '' }) {
  if (!hasPhone) return <span className={`block text-ink-2 ${indent}`}>{M.phone.noPhone}</span>;
  if (phoneHidden) {
    return (
      // items-baseline: chữ chung đường chân chữ với nhãn «Điện thoại»; icon canh theo dòng đầu (chữ có thể 2 dòng).
      <span className={`flex items-baseline gap-1.5 text-ink-2 ${indent}`}>
        <IconEyeOff size={18} className="mt-[3px] flex-none self-start text-muted" />
        <span>{M.phone.hidden}</span>
      </span>
    );
  }
  return <PhoneUnlocker mst={mst} masked={masked} indent={indent} />;
}

function PhoneUnlocker({ mst, masked, indent }) {
  const { state, phone, retryAt, start, confirm, cancel, retry } = usePhoneUnlock(mst);
  const minutesLeft = useMinutesLeft(state === 'rate_limited' ? retryAt : null);
  const confirmBtnRef = useRef(null);
  // Đã bấm «Xem số điện thoại» ít nhất một lần → giữ lớp quảng cáo trong trang.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (state !== 'idle' && state !== 'success') setArmed(true);
  }, [state]);
  const [copied, setCopied] = useState(false);
  // Chỉ chạy hiệu ứng hiện số khi người dùng vừa đi qua luồng xem quảng cáo trong lần mở trang này,
  // không chạy khi số được khôi phục từ sessionStorage.
  const playedRef = useRef(false);
  useEffect(() => {
    if (['confirm', 'loading', 'ad', 'fetching', 'error'].includes(state)) playedRef.current = true;
  }, [state]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // Vừa xem xong quảng cáo → đưa focus vào khối số (nút cũ đã biến mất, không để focus rơi về <body>).
  const revealedRef = useRef(null);
  useEffect(() => {
    if (state === 'success' && playedRef.current) revealedRef.current?.focus();
  }, [state]);

  // Vùng thông báo cố định (luôn có trong DOM ở cả hai nhánh) để trình đọc màn hình đọc số khi hiện ra.
  const live = (
    <p aria-live="polite" className="sr-only">
      {state === 'success' && phone ? M.phone.revealedSr(phone) : ''}
    </p>
  );

  if (state === 'success' && phone) {
    const digits = phone.replace(/\D/g, '');
    const act = (action) => track('phone_action', { mst, action });
    // Hiệu ứng hiện số (spec: chỉ transform/opacity): khối trồi lên, các chữ số «chạy» rồi dừng ở số
    // thật, nền số loé xanh nhạt rồi tắt, 3 nút Gọi / Sao chép / Zalo trồi lên lần lượt.
    const animate = playedRef.current;
    const rise = animate ? 'motion-rise' : '';
    const delay = (i) => (animate ? { animationDelay: `${i * 60}ms` } : undefined);
    const btn =
      // Nút phụ kiểu A (viền xám đậm, chữ xanh, bo 4px; hover viền xanh). press: nhấn thu nhỏ như <button>;
      // sm:min-w: «Sao chép» ↔ «Đã sao chép» không làm xô hàng nút.
      'press inline-flex h-11 items-center justify-center gap-1 rounded border border-line-strong bg-white px-1.5 text-sm font-semibold whitespace-nowrap text-brand no-underline hover:border-brand hover:text-brand sm:min-w-[136px] sm:gap-1.5 sm:px-3 sm:text-body';
    return (
      <>
        {live}
        <div
          className={`flex flex-col gap-2 ${animate ? 'motion-rise' : ''}`}
          data-testid="phone-revealed"
          ref={revealedRef}
          tabIndex={-1}
        >
          <div className={indent}>
            <span
              className={`-mx-1.5 block w-fit rounded-sm px-1.5 text-[20px] leading-7 font-semibold tracking-[0.02em] text-ink tabular-nums ${animate ? 'motion-highlight' : ''}`}
            >
              {animate ? <RollingNumber value={phone} /> : phone}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <a
              href={`tel:${digits}`}
              onClick={() => act('call')}
              className={`${btn} ${rise}`}
              style={delay(1)}
            >
              <IconPhone size={16} />
              {M.phone.call}
            </a>
            <button
              type="button"
              className={`${btn} ${rise}`}
              style={delay(2)}
              onClick={async () => {
                if (await copyText(phone)) {
                  setCopied(true);
                  act('copy');
                }
              }}
            >
              {copied ? (
                <IconCheck size={16} className="motion-pop text-ok" />
              ) : (
                <IconCopy size={16} />
              )}
              {copied ? M.phone.copiedShort : M.phone.copy}
            </button>
            <a
              href={`https://zalo.me/${digits}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => act('zalo')}
              className={`${btn} ${rise}`}
              style={delay(3)}
            >
              <IconZalo size={16} />
              {M.phone.zalo}
            </a>
          </div>
          <span aria-live="polite" className="sr-only">
            {copied ? M.company.copied : ''}
          </span>
        </div>
      </>
    );
  }

  const busy = ['loading', 'ad', 'fetching'].includes(state);
  const locked = state === 'rate_limited';

  // Một nút + một dòng chữ nhỏ đổi theo trạng thái (spec mục 4.2), không hiện khung thông báo riêng:
  //   đóng video sớm → «Xem lại» + câu nhắc; lỗi sau khi xem xong → «Thử lại» (không bắt xem lại video);
  //   vượt giới hạn → nút khoá + «Thử lại sau X phút».
  let label = M.phone.reveal;
  let icon = <IconPlay size={14} />;
  let onClick = start;
  let note = M.phone.revealNote;
  let noteTone = 'text-muted';
  if (busy) {
    label = M.phone.loading;
    icon = <Spinner />;
  } else if (state === 'closed') {
    label = M.phone.watchAgain;
    onClick = retry;
    note = M.phone.closedEarly;
    noteTone = 'text-warn';
  } else if (state === 'error') {
    label = M.phone.retry;
    icon = <IconRefresh size={16} />;
    onClick = retry;
    note = M.phone.networkError;
    noteTone = 'text-danger';
  } else if (state === 'blocked') {
    label = M.phone.reload;
    icon = <IconRefresh size={16} />;
    onClick = () => window.location.reload();
    note = M.phone.adBlocked;
    noteTone = 'text-warn';
  } else if (locked) {
    icon = <IconClock size={18} />;
    note = M.phone.rateLimited(minutesLeft);
  }

  return (
    <>
      {live}
      <div>
        {/* Kiểu A: số che ở dòng đầu (thẳng hàng nhãn «Điện thoại»), ngay dưới là nút cam «▶ Xem số điện thoại»
            (spec 4.1) + dòng chữ nhỏ bên cạnh. Điện thoại: nút rộng hết chiều ngang (spec 7.3), chữ nhỏ xuống
            dưới nút. */}
        <span className={`block text-body tracking-[0.04em] text-ink tabular-nums ${indent}`}>
          <span aria-hidden="true">{masked}</span>
          <span className="sr-only">{M.phone.maskedLabel(masked)}</span>
        </span>
        <div className="mt-2 flex flex-col items-stretch gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
          <button
            type="button"
            // Đang bận: aria-disabled (vẫn nhận focus — hộp thoại đóng trả focus về đây được) và giữ màu
            // cam + con trỏ «đang xử lý»; chỉ khi bị khoá thật (429) mới dùng disabled, màu xám.
            onClick={busy ? undefined : onClick}
            disabled={locked}
            aria-disabled={busy || undefined}
            aria-describedby={`phone-note-${mst}`}
            aria-busy={busy}
            className="inline-flex h-12 w-full flex-none items-center justify-center gap-2 rounded bg-cta px-5 text-body font-semibold text-white hover:bg-cta-hover aria-busy:cursor-progress aria-busy:hover:bg-cta disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-2 sm:w-auto"
          >
            {icon}
            {label}
          </button>
          <span
            id={`phone-note-${mst}`}
            aria-live="polite"
            className={`min-w-0 text-sm sm:flex-1 ${noteTone}`}
          >
            {note}
          </span>
        </div>

        {/* Chặn quảng cáo: hướng dẫn ngắn (spec mục 4.2) thu gọn, bấm mới mở. */}
        {state === 'blocked' && (
          <details className="mt-2 max-w-[480px] text-meta text-ink-2">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-brand">
              {M.phone.adBlockedHow}
            </summary>
            <ol className="list-decimal space-y-1 pl-5 text-left">
              {M.phone.adBlockedSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
        )}

        <Modal
          open={state === 'confirm'}
          onClose={cancel}
          title={M.phone.confirmTitle}
          describedBy={`phone-confirm-${mst}`}
          initialFocusRef={confirmBtnRef}
          footer={
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={cancel}
                className="h-11 rounded border border-line-strong bg-white px-4 text-body font-semibold text-ink-2 hover:border-field hover:bg-page"
              >
                {M.phone.confirmCancel}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={confirm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded bg-cta px-4 text-body font-semibold text-white hover:bg-cta-hover"
              >
                <IconPlay size={14} />
                {M.phone.confirmOk}
              </button>
            </div>
          }
        >
          <p id={`phone-confirm-${mst}`} className="text-sm leading-6 text-ink-2 sm:text-body">
            {M.phone.confirmBody}
          </p>
        </Modal>

        {/* Nạp lớp hiển thị quảng cáo từ lần bấm đầu (hộp thoại xác nhận cho đủ thời gian tải xong). */}
        {armed && <AdOverlayHost />}
      </div>
    </>
  );
}
