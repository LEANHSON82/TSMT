import { Fragment } from 'react';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard, { TABLE_COLS } from './CompanyCard';
import { M } from '@/lib/messages';

// Banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4) — chỉ khi còn dòng phía sau.
const AD_AFTER = [4, 14];

/**
 * Danh sách DN dạng liệt kê gọn, 20 dòng/trang: một khung trắng, các dòng ngăn nhau bằng vạch mảnh.
 *   ≥ 1024px: bảng — hàng tiêu đề cột MỘT lần ở đầu (Doanh nghiệp · MST · Người đại diện · Địa chỉ · Ngày hoạt
 *            động · Tình trạng), mỗi DN đúng một hàng ngang.
 *   < 1024px: mỗi DN một thẻ, mỗi trường một dòng «Nhãn │ Giá trị» (xem CompanyCard).
 * Ô quảng cáo là một dòng nền nhạt trong khung (spec 5.4: sau dòng 5 và 15).
 */
export default function CompanyList({
  items,
  slotPrefix = 'list',
  highlight,
  showNew = true,
  showProvince = true,
  ads = true, // false: không chèn quảng cáo (khối DN mới trang chủ — quảng cáo trang chủ nằm giữa các khối)
  headingLevel = 2,
  mobileLimit, // số DN hiện sẵn trên điện thoại (phần còn lại «mobile-extra», mở bằng MobileMore)
}) {
  const last = items.length - 1;
  const adAfter = (i) => ads && BANNERS_ON && AD_AFTER.includes(i) && i < last;
  const th = 'text-[13px] font-medium whitespace-nowrap text-muted';
  return (
    <div className="panel">
      <div
        aria-hidden="true"
        className={`hidden border-b border-line bg-white px-5 py-3 lg:grid lg:gap-x-5 ${TABLE_COLS}`}
      >
        <span className={th}>{M.list.colCompany}</span>
        <span className={th}>{M.company.mst}</span>
        <span className={th}>{M.company.representative}</span>
        <span className={th}>{M.company.addressShort}</span>
        <span className={th}>{M.company.foundedDate}</span>
        <span className={`${th} text-right`}>{M.company.status}</span>
      </div>
      <ol>
        {items.map((c, i) => (
          <Fragment key={c.mst}>
            <li
              className={`border-b border-line-soft last:border-b-0 ${mobileLimit && i >= mobileLimit ? 'mobile-extra' : ''}`}
            >
              <CompanyCard
                company={c}
                variant="row"
                headingLevel={headingLevel}
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
