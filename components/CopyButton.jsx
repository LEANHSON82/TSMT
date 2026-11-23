'use client';

import { useEffect, useState } from 'react';
import { M } from '@/lib/messages';
import { IconCheck, IconCopy } from './Icons';

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Cùng kiểu «hành động của dòng» trong bảng thông tin DN (CompanyInfoTable): chữ xanh 14px đậm, vùng bấm 44px
// với margin âm. Chép lại chuỗi class vì CompanyInfoTable là component server.
const TEXT_CLS =
  'inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-brand hover:text-brand-hover hover:underline hover:underline-offset-[3px] -mb-2.5 md:-my-2.5';

/** Nút sao chép; báo «Đã sao chép» qua aria-live.
 *  variant="icon" (mặc định): nút vuông 44px chỉ có icon.
 *  variant="text": icon + chữ «Sao chép» → «Đã sao chép» (bảng thông tin DN, kiểu A). */
export default function CopyButton({ text, label, onCopied, variant = 'icon', className = '' }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const onClick = async () => {
    if (await copyText(text)) {
      setCopied(true);
      onCopied?.();
    }
  };

  if (variant === 'text') {
    return (
      // Tên đọc = câu đầy đủ («Sao chép mã số thuế»), chứa chữ đang hiện «Sao chép» (WCAG 2.5.3).
      <button
        type="button"
        aria-label={copied ? M.company.copied : label}
        onClick={onClick}
        className={`${TEXT_CLS} ${className}`}
      >
        {copied ? (
          <IconCheck size={18} className="motion-pop flex-none text-chrome" />
        ) : (
          <IconCopy size={18} className="flex-none" />
        )}
        <span>{copied ? M.company.copied : M.phone.copy}</span>
        <span aria-live="polite" className="sr-only">
          {copied ? M.company.copied : ''}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={copied ? M.company.copied : label}
      title={label}
      onClick={onClick}
      className={`relative inline-flex h-11 w-11 flex-none items-center justify-center rounded-md text-brand hover:bg-brand-50 ${className}`}
    >
      {copied ? <IconCheck size={18} className="motion-pop text-chrome" /> : <IconCopy size={18} />}
      <span aria-live="polite" className="sr-only">
        {copied ? M.company.copied : ''}
      </span>
      {copied && (
        <span
          aria-hidden="true"
          // Hiện bên trái nút, trong cùng hàng: bảng thông tin cắt phần tràn ra ngoài (bo góc) nên
          // đặt phía trên nút sẽ bị che ở hàng đầu.
          className="motion-fade pointer-events-none absolute top-1/2 right-full mr-1 -translate-y-1/2 rounded bg-navy px-2 py-1 text-meta whitespace-nowrap text-white"
        >
          {M.company.copied}
        </span>
      )}
    </button>
  );
}
