'use client';

// Ngành nghề kinh doanh (spec mục 3.4), kiểu CafeF: bảng kẻ dòng mảnh, hàng tiêu đề nền xám hai cột Mã ngành · Tên ngành, mã ngành là link
// chữ xanh (cột thẳng, số tabular), ngành chính đứng đầu, in đậm + nhãn «Ngành chính». Quá 10 ngành thì thu
// gọn, nút «Xem thêm N ngành». Toàn bộ ngành vẫn có trong HTML server trả về để Google đọc được.
import Link from 'next/link';
import { useId, useState } from 'react';
import { M } from '@/lib/messages';
import { toSlug } from '@/lib/slug';
import { IconChevronDown, IconChevronUp } from './Icons';

const VISIBLE = 10;

export default function IndustryTable({ industries }) {
  const [expanded, setExpanded] = useState(false);
  const tableId = useId();
  const rows = [...industries].sort((a, b) => Number(b.is_main) - Number(a.is_main));
  const extra = rows.length - VISIBLE;

  return (
    <>
      <table id={tableId} className="w-full border-collapse text-body">
        <thead>
          <tr className="bg-page text-left text-[13px] text-ink-2">
            <th
              scope="col"
              className="w-[72px] py-2 pr-3 pl-4 font-semibold whitespace-nowrap md:w-[130px] md:pl-[22px]"
            >
              {M.company.industryCode}
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold md:pr-[22px]">
              {M.company.industryName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ind, i) => (
            <tr
              key={ind.code}
              hidden={!expanded && i >= VISIBLE}
              className={`align-top ${i >= VISIBLE ? 'motion-fade' : ''}`}
            >
              <td
                className={`border-t border-line-soft py-2.5 pr-3 pl-4 leading-6 tabular-nums md:pl-[22px] ${ind.is_main ? 'font-semibold' : ''}`}
              >
                {/* Vùng bấm 44px bằng padding + margin âm: dòng không cao thêm. */}
                <Link
                  href={`/nganh/${ind.code}-${toSlug(ind.name)}`}
                  aria-label={`${ind.code} – ${ind.name}`}
                  className="-my-2.5 inline-block min-w-11 py-2.5 no-underline hover:text-brand-hover"
                >
                  {ind.code}
                </Link>
              </td>
              <td className="border-t border-line-soft py-2.5 pr-4 leading-6 text-ink md:pr-[22px]">
                <span className={ind.is_main ? 'font-semibold' : ''}>{ind.name}</span>
                {/* Máy tính: nhãn ngay sau tên trên cùng dòng; điện thoại: xuống dòng dưới tên (cột tên hẹp). */}
                {ind.is_main && (
                  <span className="tag tag-title mt-1 table align-[1px] md:mt-0 md:ml-2.5 md:inline-block">
                    {M.company.mainIndustry}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {extra > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={tableId}
          onClick={() => setExpanded((v) => !v)}
          className="mx-4 inline-flex min-h-11 items-center gap-1.5 text-body font-semibold text-brand md:mx-[22px] hover:text-brand-hover"
        >
          {expanded ? M.company.showLessIndustries : M.company.showMoreIndustries(extra)}
          {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </button>
      )}
    </>
  );
}
