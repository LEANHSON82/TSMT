// Import tĩnh: Next gắn mã băm vào tên tệp (/_next/static/media/…) → trình duyệt lưu lâu dài.
import dots from '@/assets/vn-dots-plain.svg';
import { MAP_HEIGHT, MAP_WIDTH, PROVINCE_POINTS } from '@/lib/vn-map-points';

// Bản đồ Việt Nam dạng chấm (có Hoàng Sa, Trường Sa) với chấm đánh dấu tỉnh/thành. Chỉ trang trí.
//   highlight: mã tỉnh được đánh dấu (chấm cam + vòng sóng) — trang tỉnh.
//   showAll: hiện chấm mọi tỉnh; đặt trong .prov-map-scope thì rê chuột / focus link [data-prov=mã]
//            làm chấm tỉnh đó sáng lên (CSS :has trong globals.css, không JS) — trang chủ.
// Kích thước theo className (đặt chiều rộng); tỉ lệ cố định nên không giật bố cục. loading=lazy: bản đồ
// bị ẩn (điện thoại) thì trình duyệt không tải.
export default function VnDotMap({ highlight, showAll = false, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative select-none ${className}`}
      style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dots.src}
        alt=""
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        decoding="async"
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
      {Object.entries(PROVINCE_POINTS).map(([code, [x, y]]) =>
        showAll || code === highlight ? (
          <span
            key={code}
            data-map-prov={code}
            className={`map-dot ${code === highlight ? 'is-on' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ) : null,
      )}
    </div>
  );
}
