'use client';

// Thu gọn trên điện thoại (< 768px): phần tử con có class «mobile-extra» bị ẩn cho tới khi bấm «Xem thêm» (xem
// [data-collapsed] trong globals.css). Mọi phần tử vẫn nằm trong HTML (SEO, spec: đủ 34 tỉnh / 20 DN); từ 768px hiện
// đủ, không có nút.
import { useState } from 'react';
import { M } from '@/lib/messages';

export default function MobileMore({ moreLabel, children, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-collapsed={open ? undefined : ''} className={className}>
      {children}
      <div className="mt-3 flex justify-center md:hidden">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line-strong bg-white px-5 text-sm font-semibold text-brand hover:border-brand"
        >
          {open ? M.home.showLess : moreLabel}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
