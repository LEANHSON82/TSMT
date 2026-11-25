import { TABLE_COLS } from './CompanyCard';
import { M, STATUS_LABELS } from '@/lib/messages';

// Nền mờ sau khung mở danh sách (app/mo-khoa): CÙNG bố cục, cỡ chữ và độ cao hàng với bảng danh sách thật
// (components/CompanyList + CompanyCard) để mở xong trang không nhảy — nhưng toàn DÒNG GIẢ: HTML không có dữ liệu DN
// nào (chống crawl). aria-hidden + inert: trình đọc màn hình và bàn phím bỏ qua.
const ROWS = [
  ['CÔNG TY TNHH THƯƠNG MẠI AN PHÁT', 'NGUYỄN VĂN AN', 'TP Hồ Chí Minh'],
  ['CÔNG TY CỔ PHẦN XÂY DỰNG MINH TÂM', 'TRẦN THỊ HOA', 'Hà Nội'],
  ['CÔNG TY TNHH PHẦN MỀM BÌNH MINH', 'LÊ QUANG HUY', 'Đà Nẵng'],
  ['DOANH NGHIỆP TƯ NHÂN HỒNG PHÚC', 'PHẠM MINH ĐỨC', 'Cần Thơ'],
  ['CÔNG TY TNHH BAO BÌ THÀNH CÔNG', 'VŨ THỊ LAN', 'Đồng Nai'],
  ['CÔNG TY CỔ PHẦN NÔNG SẢN XANH', 'HOÀNG VĂN NAM', 'Đắk Lắk'],
  ['CÔNG TY TNHH ẨM THỰC SÔNG HỒNG', 'ĐỖ THU HÀ', 'Quảng Ninh'],
  ['CÔNG TY TNHH TƯ VẤN ĐẠI NAM', 'BÙI ĐỨC THẮNG', 'Hà Nội'],
];

export default function GateBackdrop() {
  const th = 'text-[13px] font-medium whitespace-nowrap text-muted';
  const pair = 'inline-flex items-baseline gap-x-1.5 lg:block';
  const lbl = 'text-muted lg:hidden';
  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none opacity-60 blur-[5px] select-none"
      data-gate-backdrop
    >
      <div className="panel">
        <div
          className={`hidden border-b border-line bg-white px-5 py-3 lg:grid lg:gap-x-4 ${TABLE_COLS}`}
        >
          <span className={th}>{M.list.colCompany}</span>
          <span className={th}>{M.company.mst}</span>
          <span className={th}>{M.company.representative}</span>
          <span className={th}>{M.company.provinceShort}</span>
          <span className={th}>{M.company.foundedDate}</span>
          <span className={`${th} text-right`}>{M.company.status}</span>
        </div>
        {ROWS.map(([name, rep, province], i) => (
          <div
            key={name}
            className={`flex flex-wrap gap-x-4 border-b border-line-soft px-4 py-3 text-sm leading-6 last:border-b-0 md:px-5 lg:grid lg:items-center lg:gap-x-4 ${TABLE_COLS}`}
          >
            <span className="mb-0.5 w-full text-base font-semibold text-title lg:mb-0 lg:w-auto lg:text-[15px]">
              {name}
            </span>
            <span className={pair}>
              <span className={lbl}>{M.list.mstShort}</span>
              <span className="font-semibold text-ink">{`0${(316000000 + i * 7919).toString().slice(0, 9)}`}</span>
            </span>
            <span className={pair}>
              <span className={lbl}>{M.company.repShort}</span>
              <span className="text-ink">{rep}</span>
            </span>
            <span className="text-ink-2">{province}</span>
            <span className={pair}>
              <span className={lbl}>{M.list.activeSince}</span>
              <span className="text-ink-2">{`${String(15 - i).padStart(2, '0')}/11/2026`}</span>
            </span>
            <span className="text-ok lg:text-right">{STATUS_LABELS.active}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
