import { Fragment } from 'react';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard, { TABLE_COLS } from './CompanyCard';
import { M } from '@/lib/messages';

// Banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4) — chỉ khi còn dòng phía sau.
const AD_AFTER = [4, 14];

/**
 * Danh sách DN dạng liệt kê gọn, 20 dòng/trang: một khung trắng, các dòng ngăn nhau bằng vạch mảnh.
 *   ≥ 1024px: bảng — hàng tiêu đề cột MỘT lần ở đầu (Doanh nghiệp · MST · Người đại diện · Ngày hoạt động · Tình
 *            trạng), các dòng chỉ còn giá trị (không lặp nhãn từng dòng).
 *   < 1024px: mỗi DN 3 dòng gọn (xem CompanyCard).
 * Ô quảng cáo là một dòng nền nhạt trong khung (spec 5.4: sau dòng 5 và 15).
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
  const th = 'text-xs font-semibold tracking-[0.02em] text-muted uppercase';
  return (
    <div className="panel">
      <div
        aria-hidden="true"
        className={`hidden border-b border-line bg-page px-5 py-2.5 lg:grid lg:gap-x-6 ${TABLE_COLS}`}
      >
        <span className={th}>{M.list.colCompany}</span>
        <span className={th}>{M.company.mst}</span>
        <span className={th}>{M.company.representative}</span>
        <span className={th}>{M.company.foundedDate}</span>
        <span className={`${th} text-right`}>{M.company.status}</span>
      </div>
      <ol>
        {items.map((c, i) => (
          <Fragment key={c.mst}>
            <li className="border-b border-line-soft last:border-b-0">
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
              <li className="list-none border-b border-line-soft px-3 py-4">
                <AdSlot slotId={`${slotPrefix}-${i + 1}`} />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
