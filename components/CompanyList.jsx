import { Fragment } from 'react';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard from './CompanyCard';

// Banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4) — chỉ khi còn dòng phía sau.
const AD_AFTER = [4, 14];

/**
 * Danh sách DN kiểu Pappers, 20 dòng/trang: mỗi DN một thẻ trắng (CompanyCard variant="row"), cách nhau 12px
 * (máy tính 16px). Ô quảng cáo nằm giữa danh sách, nền xám không bo góc nên không lẫn với thẻ nội dung.
 * Vẫn một <ol> duy nhất (thứ tự đọc của trình đọc màn hình không bị ngắt).
 */
export default function CompanyList({
  items,
  slotPrefix = 'list',
  highlight,
  showNew = true,
  showProvince = true,
}) {
  const last = items.length - 1;
  const adAfter = (i) => BANNERS_ON && AD_AFTER.includes(i) && i < last;
  return (
    <ol className="flex flex-col gap-3 md:gap-4">
      {items.map((c, i) => (
        <Fragment key={c.mst}>
          <li>
            <CompanyCard
              company={c}
              variant="row"
              headingLevel={2}
              highlight={highlight}
              showNew={showNew}
              showProvince={showProvince}
            />
          </li>
          {adAfter(i) && (
            <li className="list-none py-2">
              <AdSlot slotId={`${slotPrefix}-${i + 1}`} />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}
