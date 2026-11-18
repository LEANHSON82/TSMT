import { Fragment } from 'react';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard from './CompanyCard';

// Banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4) — chỉ khi còn dòng phía sau.
const AD_AFTER = [4, 14];

/**
 * Danh sách thẻ DN, 20 dòng/trang. Các dòng liền nhau nằm chung một khung, ngăn bằng đường kẻ mảnh (gọn,
 * dễ dò như bảng tra cứu) thay vì mỗi dòng một thẻ rời. Ô banner chia danh sách thành các khung nối tiếp.
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
    <ol className="flex flex-col">
      {items.map((c, i) => {
        const first = i === 0 || adAfter(i - 1);
        const end = i === last || adAfter(i);
        return (
          <Fragment key={c.mst}>
            <li
              className={`overflow-hidden border-x border-line bg-white transition-colors duration-150 hover:bg-brand-50 ${
                first ? 'rounded-t-xl border-t' : ''
              } ${end ? 'rounded-b-xl border-b' : 'border-b'}`}
            >
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
              <li className="list-none py-5">
                <AdSlot slotId={`${slotPrefix}-${i + 1}`} />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
