import { TABLE_COLS } from './CompanyCard';
import { M, STATUS_LABELS } from '@/lib/messages';

// Nền mờ sau khung mở danh sách (app/mo-khoa): trông như bảng danh sách thật nhưng toàn DÒNG GIẢ — HTML không có dữ
// liệu DN nào (chống crawl). aria-hidden + inert: trình đọc màn hình và bàn phím bỏ qua.
const ROWS = [
  ['CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ AN PHÁT', 'NGUYỄN VĂN AN', 'Phường Bến Nghé, TP Hồ Chí Minh'],
  ['CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG MINH TÂM', 'TRẦN THỊ HOA', 'Phường Cầu Giấy, Hà Nội'],
  ['CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM BÌNH MINH', 'LÊ QUANG HUY', 'Phường Hải Châu, Đà Nẵng'],
  ['DOANH NGHIỆP TƯ NHÂN VẬN TẢI HỒNG PHÚC', 'PHẠM MINH ĐỨC', 'Phường Ninh Kiều, Cần Thơ'],
  ['CÔNG TY TNHH SẢN XUẤT BAO BÌ THÀNH CÔNG', 'VŨ THỊ LAN', 'Xã Tân Phú, Đồng Nai'],
  ['CÔNG TY CỔ PHẦN NÔNG SẢN XANH VIỆT', 'HOÀNG VĂN NAM', 'Phường Trung Tâm, Đắk Lắk'],
  ['CÔNG TY TNHH NHÀ HÀNG ẨM THỰC SÔNG HỒNG', 'ĐỖ THU HÀ', 'Phường Hồng Hải, Quảng Ninh'],
  ['CÔNG TY TNHH TƯ VẤN QUẢN LÝ ĐẠI NAM', 'BÙI ĐỨC THẮNG', 'Phường Thanh Xuân, Hà Nội'],
];

export default function GateBackdrop() {
  const th = 'text-xs font-semibold tracking-[0.02em] whitespace-nowrap text-ink-2 uppercase';
  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none opacity-60 blur-[5px] select-none"
      data-gate-backdrop
    >
      <div className="panel">
        <div
          className={`hidden border-b border-line bg-thead px-5 py-3 lg:grid lg:gap-x-5 ${TABLE_COLS}`}
        >
          <span className={th}>{M.list.colCompany}</span>
          <span className={th}>{M.company.mst}</span>
          <span className={th}>{M.company.representative}</span>
          <span className={th}>{M.company.addressShort}</span>
          <span className={th}>{M.company.foundedDate}</span>
          <span className={`${th} text-right`}>{M.company.status}</span>
        </div>
        {ROWS.map(([name, rep, addr], i) => (
          <div
            key={name}
            className={`grid gap-1 border-b border-line-soft px-4 py-3.5 last:border-b-0 lg:items-center lg:gap-x-5 lg:px-5 ${TABLE_COLS}`}
          >
            <span className="font-semibold text-title">{name}</span>
            <span className="font-medium text-ink">{`0${(316000000 + i * 7919).toString().slice(0, 9)}`}</span>
            <span className="text-ink">{rep}</span>
            <span className="text-ink-2">{addr}</span>
            <span className="text-ink-2">{`${String(15 - i).padStart(2, '0')}/11/2026`}</span>
            <span className="font-semibold text-ok lg:text-right">{STATUS_LABELS.active}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
