'use client';

// Điện thoại: lưới tỉnh/thành chỉ hiện 8 tỉnh nhiều DN nhất (CSS [data-collapsed] trong globals.css), nút bên dưới
// mở cả 34. Máy tính hiện đủ, không có nút. Chưa có JS: hiện 8 tỉnh, các tỉnh khác vẫn vào được từ menu Tỉnh/thành.
import { useId, useState } from 'react';
import { M } from '@/lib/messages';

export default function ProvinceListToggle({ total, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div id={id} data-collapsed={open ? undefined : ''} className="flex flex-col gap-2">
      {children}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center self-start text-body font-semibold text-brand md:hidden"
      >
        {open ? M.home.showFewerProvinces : M.home.showAllProvinces(total)}
      </button>
    </div>
  );
}
