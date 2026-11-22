import { Fragment } from 'react';
import { M } from '@/lib/messages';
import AdSlot, { BANNERS_ON } from './AdSlot';
import CompanyCard, { ROW_COLS } from './CompanyCard';

// Banner sau dòng 5 và dòng 15 (spec mục 3.2, 5.4) — chỉ khi còn dòng phía sau.
const AD_AFTER = [4, 14];

/**
 * Danh sách DN hệ A, 20 dòng/trang: bảng kẻ mảnh như sổ đăng ký.
 * - Từ 1024px: MỘT hàng tiêu đề cột (vạch 2px trên) rồi các dòng; tiêu đề và dòng dùng chung ROW_COLS nên cột
 *   thẳng tuyệt đối, kể cả qua ô quảng cáo (ô nằm trong một <li> riêng, rộng hết bảng).
 * - Dưới 1024px: không có hàng tiêu đề cột — mỗi dòng là thẻ gọn có nhãn, vạch 2px nằm ngay trên dòng đầu.
 * Vẫn một <ol> duy nhất (thứ tự đọc của trình đọc màn hình không bị ngắt). Hàng tiêu đề cột chỉ để nhìn
 * (aria-hidden): mỗi ô trong dòng đã có nhãn ẩn «Mã số thuế: …», đọc rõ hơn bảng giả.
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
    <div>
      <div
        aria-hidden="true"
        className={`hidden border-t-2 border-b border-ink border-b-line-strong py-2.5 text-meta font-semibold text-muted lg:grid ${ROW_COLS}`}
      >
        <span>{M.list.colName}</span>
        <span>{M.company.mst}</span>
        <span>{M.company.representative}</span>
        <span>{M.company.foundedDate}</span>
        <span>{M.company.status}</span>
      </div>
      <ol className="border-t-2 border-ink lg:border-t-0">
        {items.map((c, i) => (
          <Fragment key={c.mst}>
            <li className="border-b border-line transition-colors duration-150 lg:hover:bg-surface">
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
              <li className="list-none border-b border-line py-6">
                <AdSlot slotId={`${slotPrefix}-${i + 1}`} />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
