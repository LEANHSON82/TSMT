import { Fragment } from 'react';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard from './CompanyCard';
import SectionHeader from './SectionHeader';
import { dayHeading } from '@/lib/day-groups';
import { M } from '@/lib/messages';

// Banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4) — chỉ khi còn dòng phía sau.
const AD_AFTER = [4, 14];

/**
 * Danh sách DN kiểu CafeF, 20 dòng/trang: một khung trắng, các dòng ngăn nhau bằng vạch mảnh. Ô quảng cáo là một
 * dòng nền xám trong khung (không lẫn với dòng nội dung). Vẫn một <ol> duy nhất.
 */
export default function CompanyList({
  items,
  slotPrefix = 'list',
  highlight,
  showNew = true,
  showProvince = true,
  title, // có tiêu đề: khung có tab tiêu đề (H2) như các khối khác, tên DN thành H3
  meta,
  // Nhóm theo ngày hoạt động (trang DN mới): mỗi ngày một hàng tiêu đề «14/11/2026 · 5 DN», thẻ không lặp lại ngày.
  groupByDate = false,
}) {
  const last = items.length - 1;
  const adAfter = (i) => BANNERS_ON && AD_AFTER.includes(i) && i < last;
  const day = (c) => (c.founded_date || '').slice(0, 10);
  const dayCount = groupByDate
    ? items.reduce((m, c) => m.set(day(c), (m.get(day(c)) || 0) + 1), new Map())
    : null;
  const cardLevel = (title ? 3 : 2) + (groupByDate ? 1 : 0);
  const list = (
    <ol className={title ? '' : 'panel'}>
      {items.map((c, i) => (
        <Fragment key={c.mst}>
          {groupByDate && (i === 0 || day(items[i - 1]) !== day(c)) && (
            <li className="list-none border-b border-line-soft bg-page px-4 py-2 md:px-5">
              {(() => {
                const H = `h${cardLevel - 1}`;
                return (
                  <H className="flex items-baseline gap-2 text-sm font-semibold text-ink-2">
                    {dayHeading(day(c))}
                    <span className="font-normal text-muted tabular-nums">
                      · {M.home.dayGroupCount(dayCount.get(day(c)))}
                    </span>
                  </H>
                );
              })()}
            </li>
          )}
          <li className="border-b border-line-soft last:border-b-0">
            <CompanyCard
              company={c}
              variant="row"
              headingLevel={cardLevel}
              showDate={!groupByDate}
              highlight={highlight}
              showNew={showNew}
              showProvince={showProvince}
            />
          </li>
          {adAfter(i) && (
            <li className="list-none border-b border-line-soft bg-page px-3 py-4">
              <AdSlot slotId={`${slotPrefix}-${i + 1}`} />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
  if (!title) return list;
  return (
    <section className="panel" aria-labelledby={`${slotPrefix}-list-title`}>
      <SectionHeader id={`${slotPrefix}-list-title`} title={title} meta={meta} />
      {list}
    </section>
  );
}
