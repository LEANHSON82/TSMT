'use client';

import { useState } from 'react';

// Hiệu ứng «chạy số» cho số điện thoại vừa mở: mỗi chữ số cuộn qua 10 số rồi dừng ở số thật, lần lượt từ
// trái sang. Chỉ dùng transform. Chạy xong (hoặc người dùng chọn giảm chuyển động — animation gần như
// tức thì) thì thay bằng chữ thường để bôi đen/chép được. Trình đọc màn hình chỉ đọc số thật.
const STEP_MS = 55;

export default function RollingNumber({ value }) {
  const chars = [...String(value)];
  const lastDigit = chars.reduce((last, ch, i) => (/\d/.test(ch) ? i : last), -1);
  const [done, setDone] = useState(lastDigit < 0);
  if (done) return value;
  return (
    <>
      <span className="sr-only">{value}</span>
      {/* items-start + mọi ký tự cao đúng 1 dòng: ô có overflow-hidden lấy mép dưới làm đường chân chữ,
          canh theo baseline sẽ lệch hàng. */}
      <span aria-hidden="true" className="inline-flex items-start align-top">
        {chars.map((ch, i) => {
          if (!/\d/.test(ch)) {
            return (
              <span key={i} className="h-[1lh]">
                {ch === ' ' ? ' ' : ch}
              </span>
            );
          }
          const d = Number(ch);
          // 10 số liên tiếp, kết thúc ở chữ số thật
          const column = Array.from({ length: 10 }, (_, k) => (d + 1 + k) % 10);
          return (
            <span key={i} className="h-[1lh] overflow-hidden">
              <span
                className="motion-roll flex flex-col"
                style={{ '--to': '-90%', animationDelay: `${i * STEP_MS}ms` }}
                onAnimationEnd={i === lastDigit ? () => setDone(true) : undefined}
              >
                {column.map((n, k) => (
                  <span key={k} className="h-[1lh]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
