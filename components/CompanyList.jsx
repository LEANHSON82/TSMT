import { Fragment } from 'react';
import AdSlot from './AdSlot';
import CompanyCard from './CompanyCard';

/** Danh sách thẻ DN, 20 dòng/trang; banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4). */
export default function CompanyList({
  items,
  slotPrefix = 'list',
  highlight,
  showNew = true,
  showProvince = true,
}) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((c, i) => (
        <Fragment key={c.mst}>
          {/* reveal: trồi lên khi cuộn tới; rê chuột: nhấc 2px + bóng đổ (translate tách khỏi transform
              của reveal nên không đè nhau). */}
          {/* li đứng yên làm vùng rê chuột, khối bên trong mới nhấc 2px — nếu chính li nhấc thì ở mép dưới
              con trỏ rơi ra ngoài rồi lại vào, thẻ nháy liên tục. */}
          <li className="group/row reveal">
            <div className="overflow-hidden rounded-xl border border-line transition-[border-color,box-shadow,translate] duration-150 group-hover/row:-translate-y-0.5 group-hover/row:border-brand group-hover/row:shadow-[0_6px_20px_rgba(10,42,94,0.10)]">
              <CompanyCard
                company={c}
                variant="row"
                headingLevel={2}
                highlight={highlight}
                showNew={showNew}
                showProvince={showProvince}
              />
            </div>
          </li>
          {(i === 4 || i === 14) && i < items.length - 1 && (
            <li className="list-none">
              <AdSlot slotId={`${slotPrefix}-${i + 1}`} />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}
