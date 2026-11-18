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
          {/* Rê chuột: chỉ đổi màu viền + bóng nhẹ, không nhấc / trượt. */}
          <li>
            {/* Vạch màu mép trái theo tình trạng (xanh: đang hoạt động, xám: ngừng/đóng) — nhãn chữ vẫn có. */}
            <div
              className={`overflow-hidden rounded-xl border border-l-[3px] border-line bg-white shadow-[0_1px_2px_rgba(10,42,94,0.05)] transition-[border-color,box-shadow] duration-150 hover:border-brand hover:shadow-[0_4px_16px_rgba(10,42,94,0.08)] ${
                (c.status?.code || 'active') === 'active' ? 'border-l-ok' : 'border-l-field'
              }`}
            >
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
