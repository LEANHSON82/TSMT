'use client';

// Modal dùng chung (spec mục 7.3): giữ focus trong modal, Esc đóng, aria-modal + tiêu đề.
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FOCUSABLE, trapTab } from './focusTrap';
import { IconClose } from './Icons';
import { M } from '@/lib/messages';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  initialFocusRef,
  dismissible = true,
  variant = 'dialog', // 'dialog' | 'fullscreen'
  labelClose = M.common.close,
  describedBy, // id phần tử mô tả (trình đọc màn hình đọc kèm tiêu đề khi mở)
  className = '',
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = initialFocusRef?.current || panel?.querySelector(FOCUSABLE) || panel;
    first?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      trapTab(e, panel);
    };
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, dismissible, initialFocusRef]);

  if (!open || typeof document === 'undefined') return null;

  const full = variant === 'fullscreen';
  return createPortal(
    <div
      className={`motion-fade fixed inset-0 z-[60] flex ${full ? '' : 'items-end justify-center bg-[rgba(10,20,40,0.55)] sm:items-center sm:p-6'}`}
      onMouseDown={(e) => {
        if (!full && dismissible && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={
          full
            ? `flex h-full w-full flex-col ${className}`
            : `motion-sheet w-full max-w-[480px] rounded-t-2xl bg-white shadow-xl sm:rounded-xl ${className}`
        }
      >
        {full ? (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {children}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
              <h2 id={titleId} className="text-lg leading-7 font-semibold text-navy">
                {title}
              </h2>
              {dismissible && (
                <button
                  type="button"
                  aria-label={labelClose}
                  onClick={onClose}
                  className="-mt-1.5 -mr-2 inline-flex h-11 w-11 flex-none items-center justify-center rounded-md text-ink-2 hover:bg-page"
                >
                  <IconClose size={22} />
                </button>
              )}
            </div>
            <div className="px-5 pt-2 pb-5 sm:px-6">{children}</div>
            {footer && <div className="border-t border-line-soft px-5 py-4 sm:px-6">{footer}</div>}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
