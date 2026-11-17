'use client';

// Ngành nghề kinh doanh (spec mục 3.4): ngành chính in đậm + nhãn, quá 10 ngành thì thu gọn.
// Toàn bộ ngành vẫn có trong HTML server trả về để Google đọc được.
import Link from 'next/link';
import { useId, useState } from 'react';
import { M } from '@/lib/messages';
import { toSlug } from '@/lib/slug';
import { IconChevronDown, IconChevronUp } from './Icons';
import IndustryCode from './IndustryCode';

const VISIBLE = 10;

export default function IndustryTable({ industries }) {
  const [expanded, setExpanded] = useState(false);
  const tableId = useId();
  const rows = [...industries].sort((a, b) => Number(b.is_main) - Number(a.is_main));
  const extra = rows.length - VISIBLE;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <table id={tableId} className="w-full border-collapse text-sm md:text-body">
        <thead>
          <tr className="bg-page text-left text-meta font-semibold text-ink-2">
            <th
              scope="col"
              className="w-[72px] py-2.5 pr-2 pl-4 whitespace-nowrap md:w-[120px] md:px-5 md:py-3"
            >
              {M.company.industryCode}
            </th>
            <th scope="col" className="py-2.5 pr-4 pl-2 md:py-3 md:pr-5 md:pl-0">
              {M.company.industryName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ind, i) => (
            <tr
              key={ind.code}
              hidden={!expanded && i >= VISIBLE}
              className={`border-t border-line-soft align-top ${i >= VISIBLE ? 'motion-fade' : ''}`}
            >
              <td
                className={`py-2.5 pr-2 pl-4 tabular-nums md:px-5 md:py-3 ${ind.is_main ? 'font-semibold' : ''}`}
              >
                <Link
                  href={`/nganh/${ind.code}-${toSlug(ind.name)}`}
                  aria-label={`${ind.code} – ${ind.name}`}
                  className="-my-2.5 inline-flex min-h-11 min-w-11 items-center no-underline hover:opacity-80"
                >
                  <IndustryCode code={ind.code} />
                </Link>
              </td>
              <td className="py-2.5 pr-4 pl-2 md:py-3 md:pr-5 md:pl-0">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <span className={ind.is_main ? 'font-semibold' : ''}>{ind.name}</span>
                  {ind.is_main && (
                    <span className="inline-flex h-6 items-center rounded-full bg-brand-50 px-2.5 text-xs font-semibold text-brand">
                      {M.company.mainIndustry}
                    </span>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {extra > 0 && (
        <div className="border-t border-line-soft px-4 pt-3 pb-4 md:px-5">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={tableId}
            onClick={() => setExpanded((v) => !v)}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-md border-[1.5px] border-brand bg-white text-body font-semibold text-brand hover:bg-brand-50 md:inline-flex md:h-11 md:w-auto md:px-4"
          >
            {expanded ? M.company.showLessIndustries : M.company.showMoreIndustries(extra)}
            {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
