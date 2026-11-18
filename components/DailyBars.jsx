'use client';

// Biểu đồ cột nhỏ «DN mới theo ngày» (14 ngày) trong dải xanh trang chủ. Một chuỗi số liệu → không cần chú thích
// màu (tiêu đề đã nói). Cột ≤ 24px, đầu bo 4px, cách nhau 2px; ngày mới nhất màu nhấn. Rê chuột / chạm vào cột
// → dòng số liệu phía trên đổi theo ngày đó (vùng bắt chuột là cả chiều cao cột, không chỉ phần có màu).
// Trình đọc màn hình: bảng ẩn liệt kê đủ 14 ngày.
import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { M } from '@/lib/messages';

const shortDate = (iso) => formatDate(iso).slice(0, 5); // dd/mm

export default function DailyBars({ daily }) {
  const [active, setActive] = useState(null);
  if (!daily?.length) return null;
  const max = Math.max(1, ...daily.map((d) => d.count));
  const shown = active ?? daily.length - 1;
  const cur = daily[shown];

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3 text-sm text-white/75">
        <span>{M.home.dailyTitle}</span>
        <span className="text-white tabular-nums" aria-hidden="true">
          {shortDate(cur.date)}: <strong className="font-semibold">{cur.count}</strong>
        </span>
      </figcaption>
      <div
        className="flex h-14 items-end gap-[2px] border-b border-white/20"
        onMouseLeave={() => setActive(null)}
        aria-hidden="true"
      >
        {daily.map((d, i) => (
          <div
            key={d.date}
            className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
            onMouseEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
          >
            {d.count > 0 && (
              <span
                className={`block w-full max-w-6 rounded-t-[4px] ${i === shown ? 'bg-[#fdba74]' : 'bg-[#6f93d6]'}`}
                style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/60 tabular-nums" aria-hidden="true">
        <span>{shortDate(daily[0].date)}</span>
        <span>{shortDate(daily[daily.length - 1].date)}</span>
      </div>
      <table className="sr-only">
        <caption>{M.home.dailyTitle}</caption>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <th scope="row">{formatDate(d.date)}</th>
              <td>{M.home.stats(d.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
