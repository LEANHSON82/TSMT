import { Fragment } from 'react';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard from './CompanyCard';
import SectionHeader from './SectionHeader';

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
}) {
  const last = items.length - 1;
  const adAfter = (i) => BANNERS_ON && AD_AFTER.includes(i) && i < last;
  const list = (
    <ol className={title ? '' : 'panel'}>
      {items.map((c, i) => (
        <Fragment key={c.mst}>
          <li className="border-b border-line-soft last:border-b-0">
            <CompanyCard
              company={c}
              variant="row"
              headingLevel={title ? 3 : 2}
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
