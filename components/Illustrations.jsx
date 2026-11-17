// Hình minh hoạ nhỏ (SVG vẽ tay, nhúng thẳng — không tải thêm file) cho trạng thái rỗng, trang 404 và
// gửi form thành công. Chỉ trang trí: aria-hidden, kích thước cố định (không giật bố cục).
const C = {
  brand: '#1446a0',
  tint: '#eef3fc',
  chip: '#dbeafe',
  line: '#d9dee7',
  soft: '#eef0f3',
  cta: '#c2410c',
  warm: '#fde7b0',
  ok: '#1f9d48',
  okBg: '#e7f6ec',
};

function Frame({ children, className = '' }) {
  return (
    <svg
      viewBox="0 0 160 120"
      width="160"
      height="120"
      aria-hidden="true"
      focusable="false"
      className={`h-auto max-w-full ${className}`}
    >
      {children}
    </svg>
  );
}

function MiniCard({ y, opacity = 1, chip = C.chip }) {
  return (
    <g opacity={opacity}>
      <rect
        x="22"
        y={y}
        width="88"
        height="24"
        rx="5"
        fill="#fff"
        stroke={C.line}
        strokeWidth="1.5"
      />
      <rect x="29" y={y + 6} width="12" height="12" rx="3" fill={chip} />
      <rect x="47" y={y + 7} width="50" height="4" rx="2" fill={C.line} />
      <rect x="47" y={y + 14} width="32" height="3.5" rx="1.75" fill={C.soft} />
    </g>
  );
}

/** Không có kết quả: danh sách thẻ DN trống + kính lúp. */
export function IllusEmptySearch({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="64" rx="70" ry="50" fill={C.tint} />
      <MiniCard y={20} />
      <MiniCard y={50} opacity={0.75} chip={C.warm} />
      <MiniCard y={80} opacity={0.45} />
      <circle
        cx="116"
        cy="66"
        r="19"
        fill="#fff"
        fillOpacity="0.7"
        stroke={C.brand}
        strokeWidth="5"
      />
      <path d="M130 80l13 13" stroke={C.brand} strokeWidth="7" strokeLinecap="round" />
      <path d="M109 66h14" stroke={C.cta} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="146" cy="30" r="3" fill={C.cta} opacity="0.7" />
      <circle cx="14" cy="96" r="2.5" fill={C.brand} opacity="0.35" />
    </Frame>
  );
}

/** Không tìm thấy trang / DN: toà nhà với biển «?». */
export function IllusNotFound({ className }) {
  const win = [];
  for (const y of [42, 57, 72])
    for (const x of [59, 74, 89])
      win.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="11"
          height="9"
          rx="1.5"
          fill={x === 89 && y === 57 ? C.warm : C.chip}
        />,
      );
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="66" rx="70" ry="48" fill={C.tint} />
      <path d="M18 104h124" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
      <rect
        x="51"
        y="33"
        width="58"
        height="71"
        rx="4"
        fill="#fff"
        stroke={C.brand}
        strokeWidth="3"
      />
      {win}
      <rect x="72" y="87" width="16" height="17" rx="2" fill={C.brand} />
      <path d="M80 33v-6" stroke={C.brand} strokeWidth="2.5" />
      <rect x="64" y="12" width="32" height="16" rx="4" fill={C.cta} />
      <path
        d="M76.5 17.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.1-1.5 2.1"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="80" cy="25.3" r="1.2" fill="#fff" />
      <circle cx="126" cy="86" r="10" fill="#fff" stroke={C.brand} strokeWidth="4" />
      <path d="M133 93l8 8" stroke={C.brand} strokeWidth="5" strokeLinecap="round" />
      <circle cx="30" cy="40" r="3" fill={C.cta} opacity="0.6" />
    </Frame>
  );
}

/** Đã gửi yêu cầu: tờ đơn + dấu ✓ (tự vẽ nét khi hiện). */
export function IllusSent({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="64" rx="66" ry="48" fill={C.okBg} />
      <rect
        x="46"
        y="16"
        width="62"
        height="80"
        rx="5"
        fill="#fff"
        stroke={C.line}
        strokeWidth="2"
      />
      <rect x="55" y="27" width="30" height="5" rx="2.5" fill={C.brand} opacity="0.85" />
      <rect x="55" y="40" width="44" height="4" rx="2" fill={C.line} />
      <rect x="55" y="50" width="38" height="4" rx="2" fill={C.line} />
      <rect x="55" y="60" width="42" height="4" rx="2" fill={C.line} />
      <rect x="55" y="70" width="24" height="4" rx="2" fill={C.soft} />
      <circle cx="108" cy="86" r="19" fill={C.ok} />
      <g className="motion-draw">
        <path
          d="M99 86.5l6 6 12-12.5"
          fill="none"
          stroke="#fff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="30" cy="34" r="3" fill={C.ok} opacity="0.5" />
      <circle cx="138" cy="40" r="2.5" fill={C.cta} opacity="0.6" />
    </Frame>
  );
}

function Sparkle({ x, y, s = 5, fill = C.cta, opacity = 0.8 }) {
  return (
    <path
      d={`M${x} ${y - s}q${s * 0.2} ${s * 0.8} ${s} ${s}q-${s * 0.8} ${s * 0.2} -${s} ${s}q-${s * 0.2} -${s * 0.8} -${s} -${s}q${s * 0.8} -${s * 0.2} ${s} -${s}z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

function DocLines({ x, y, w, rows = 4 }) {
  return Array.from({ length: rows }, (_, i) => (
    <rect
      key={i}
      x={x}
      y={y + i * 10}
      width={i === rows - 1 ? w * 0.55 : w - (i % 2) * 8}
      height="4"
      rx="2"
      fill={i === rows - 1 ? C.soft : C.line}
    />
  ));
}

/** DN mới thành lập: toà nhà cắm cờ + tờ lịch có dấu ✓. */
export function IllusNewCompany({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="66" rx="70" ry="48" fill={C.tint} />
      <path d="M16 104h128" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
      <rect
        x="34"
        y="40"
        width="54"
        height="64"
        rx="4"
        fill="#fff"
        stroke={C.brand}
        strokeWidth="3"
      />
      {[50, 64, 78].map((y) =>
        [42, 56, 70].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="10" height="8" rx="1.5" fill={C.chip} />
        )),
      )}
      <rect x="54" y="90" width="14" height="14" rx="2" fill={C.brand} />
      <path d="M61 40V22" stroke={C.brand} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M61 22h15l-4 4.5 4 4.5H61z" fill={C.cta} />
      <rect
        x="98"
        y="52"
        width="44"
        height="44"
        rx="5"
        fill="#fff"
        stroke={C.line}
        strokeWidth="2"
      />
      <path d="M98 57a5 5 0 0 1 5-5h34a5 5 0 0 1 5 5v8H98z" fill={C.cta} />
      <path d="M108 48v8M132 48v8" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M110 80l6 6 12-12"
        fill="none"
        stroke={C.ok}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Sparkle x={130} y={28} />
      <Sparkle x={20} y={46} s={4} fill={C.brand} opacity={0.4} />
    </Frame>
  );
}

function Gear({ cx, cy, r, teeth, fg, bg }) {
  return (
    <g>
      {Array.from({ length: teeth }, (_, i) => (
        <rect
          key={i}
          x={cx - r * 0.22}
          y={cy - r - r * 0.32}
          width={r * 0.44}
          height={r * 0.5}
          rx={r * 0.08}
          fill={fg}
          transform={`rotate(${(i * 360) / teeth} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={fg} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r * 0.36} fill={bg} stroke={fg} strokeWidth="2" />
    </g>
  );
}

/** Ngành nghề: bánh răng + biểu đồ cột. */
export function IllusIndustry({ fg = C.brand, bg = C.tint, className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="64" rx="70" ry="48" fill={bg} />
      <Gear cx={58} cy={64} r={22} teeth={8} fg={fg} bg={bg} />
      <Gear cx={90} cy={36} r={12} teeth={6} fg={fg} bg={bg} />
      <path d="M100 102h42" stroke={C.line} strokeWidth="2" strokeLinecap="round" />
      <rect x="104" y="80" width="9" height="22" rx="2" fill={fg} opacity="0.45" />
      <rect x="117" y="68" width="9" height="34" rx="2" fill={fg} opacity="0.7" />
      <rect x="130" y="56" width="9" height="46" rx="2" fill={fg} />
      <path
        d="M102 70l13-10 11 5 15-15"
        fill="none"
        stroke={C.cta}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M135 49h7v7" fill="none" stroke={C.cta} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

/** Giới thiệu: hồ sơ DN + kính lúp. */
export function IllusAbout({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="64" rx="68" ry="48" fill={C.tint} />
      <rect
        x="40"
        y="16"
        width="62"
        height="82"
        rx="5"
        fill="#fff"
        stroke={C.line}
        strokeWidth="2"
      />
      <rect x="49" y="26" width="14" height="14" rx="3" fill={C.chip} />
      <rect x="68" y="28" width="26" height="4" rx="2" fill={C.brand} opacity="0.85" />
      <rect x="68" y="35" width="18" height="3.5" rx="1.75" fill={C.line} />
      <DocLines x={49} y={50} w={44} rows={4} />
      <circle
        cx="108"
        cy="72"
        r="18"
        fill="#fff"
        fillOpacity="0.75"
        stroke={C.brand}
        strokeWidth="5"
      />
      <path d="M121 85l13 13" stroke={C.brand} strokeWidth="7" strokeLinecap="round" />
      <path d="M100 72h16M100 66h10" stroke={C.cta} strokeWidth="3" strokeLinecap="round" />
      <Sparkle x={136} y={30} s={4} />
    </Frame>
  );
}

/** Liên hệ: phong bì có thư + bong bóng chat. */
export function IllusContact({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="66" rx="70" ry="46" fill={C.tint} />
      <rect
        x="48"
        y="22"
        width="64"
        height="44"
        rx="4"
        fill="#fff"
        stroke={C.line}
        strokeWidth="2"
      />
      <DocLines x={56} y={32} w={46} rows={3} />
      <path
        d="M34 46h92v48a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6z"
        fill="#fff"
        stroke={C.brand}
        strokeWidth="3"
      />
      <path
        d="M36 50l44 30 44-30"
        fill="none"
        stroke={C.brand}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M118 14h26a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6h-16l-8 7v-7a6 6 0 0 1-6-6V20a6 6 0 0 1 4-6z"
        fill={C.cta}
      />
      <circle cx="124" cy="27" r="2.2" fill="#fff" />
      <circle cx="132" cy="27" r="2.2" fill="#fff" />
      <circle cx="140" cy="27" r="2.2" fill="#fff" />
    </Frame>
  );
}

/** Điều khoản / chính sách: văn bản + khiên có dấu ✓. */
export function IllusLegal({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="64" rx="68" ry="48" fill={C.tint} />
      <rect
        x="38"
        y="16"
        width="60"
        height="82"
        rx="5"
        fill="#fff"
        stroke={C.line}
        strokeWidth="2"
      />
      <rect x="47" y="26" width="30" height="5" rx="2.5" fill={C.brand} opacity="0.85" />
      <DocLines x={47} y={40} w={42} rows={5} />
      <path d="M110 44l22 8v17c0 14-9.5 24-22 29-12.5-5-22-15-22-29V52z" fill={C.brand} />
      <path
        d="M100 70l7 7 13-14"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Sparkle x={140} y={36} s={4} />
    </Frame>
  );
}

/** Form yêu cầu ẩn/sửa: tờ đơn có ô nhập + bút. */
export function IllusForm({ className }) {
  return (
    <Frame className={className}>
      <ellipse cx="80" cy="64" rx="68" ry="48" fill={C.tint} />
      <rect
        x="36"
        y="14"
        width="64"
        height="86"
        rx="5"
        fill="#fff"
        stroke={C.line}
        strokeWidth="2"
      />
      <rect x="45" y="24" width="28" height="5" rx="2.5" fill={C.brand} opacity="0.85" />
      {[36, 56, 76].map((y) => (
        <g key={y}>
          <rect x="45" y={y} width="18" height="3.5" rx="1.75" fill={C.line} />
          <rect
            x="45"
            y={y + 6}
            width="46"
            height="9"
            rx="2"
            fill="#fff"
            stroke={C.line}
            strokeWidth="1.5"
          />
        </g>
      ))}
      <g transform="rotate(35 118 62)">
        <rect x="111" y="22" width="14" height="62" rx="2" fill={C.cta} />
        <rect x="111" y="22" width="14" height="9" rx="2" fill={C.warm} />
        <path d="M111 84h14l-7 13z" fill={C.warm} />
        <path d="M116 92.5h4l-2 4.5z" fill={C.brand} />
      </g>
    </Frame>
  );
}
