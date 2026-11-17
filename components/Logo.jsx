// Logo TMST: biểu tượng (ô vuông xanh, chữ T trắng, kính lúp cam ở góc — «tra cứu») + chữ «TMST» một màu.
// Chữ là nét Be Vietnam Pro SemiBold đã chuyển thành path (sinh lại: scripts/gen-logo.py) nên hiển thị sắc
// nét, giống nhau mọi máy. Biểu tượng vẽ tay trên lưới 48×48 — cũng là favicon (app/icon.svg).
// tone="dark": chữ trắng, dùng trên nền tối.
const T_PATH = 'M269 740V118H41V0H633V118H405V740Z';
const MST_PATH =
  'M736.0 740V0H917.0L1102.0 401L1291.0 0H1469.0V740H1335.0V205L1165.0 561H1039.0L870.0 203V740ZM1870.0 750Q1801.0 750 1752.0 733.0Q1703.0 716 1670.5 689.0Q1638.0 662 1619.0 631.5Q1600.0 601 1590.5 574.0Q1581.0 547 1578.0 530.0Q1575.0 513 1575.0 513H1713.0Q1713.0 513 1715.5 525.0Q1718.0 537 1727.0 555.5Q1736.0 574 1753.5 592.0Q1771.0 610 1800.5 622.5Q1830.0 635 1874.0 635Q1942.0 635 1977.5 604.5Q2013.0 574 2013.0 529Q2013.0 491 1986.0 468.5Q1959.0 446 1906.0 435L1808.0 414Q1751.0 402 1701.5 378.0Q1652.0 354 1622.0 313.0Q1592.0 272 1592.0 208Q1592.0 141 1625.5 92.0Q1659.0 43 1718.0 16.5Q1777.0 -10 1856.0 -10Q1931.0 -10 1980.0 12.0Q2029.0 34 2058.5 66.0Q2088.0 98 2102.0 130.0Q2116.0 162 2120.5 184.0Q2125.0 206 2125.0 206H1992.0Q1992.0 206 1988.0 190.5Q1984.0 175 1970.0 155.0Q1956.0 135 1928.0 119.5Q1900.0 104 1853.0 104Q1786.0 104 1755.5 134.0Q1725.0 164 1725.0 199Q1725.0 235 1753.0 255.0Q1781.0 275 1828.0 286L1933.0 308Q1992.0 321 2041.0 347.0Q2090.0 373 2119.0 415.5Q2148.0 458 2148.0 521Q2148.0 585 2116.0 637.0Q2084.0 689 2022.0 719.5Q1960.0 750 1870.0 750ZM2446.0 740V118H2218.0V0H2810.0V118H2582.0V740Z';

const WORD = { light: 'var(--color-navy)', dark: '#ffffff' };

/** Biểu tượng trên lưới 48×48 (phần vẽ nằm trong 2…48). */
export function LogoMark() {
  return (
    <>
      <rect x="2" y="2" width="40" height="40" rx="10" fill="#1446a0" />
      <path d="M11 12h22v6h-8v18h-6V18h-8z" fill="#fff" />
      <circle cx="36" cy="36" r="8" fill="#fff" stroke="#c2410c" strokeWidth="4" />
      <path d="M41.5 41.5l4 4" stroke="#c2410c" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

// Khung 3479×1000: biểu tượng cao trọn 1000; chữ (gốc 2769×760) thu còn cao 620, căn giữa theo chiều dọc,
// cách biểu tượng 220.
export default function Logo({ tone = 'light', className = '', title = 'TMST' }) {
  return (
    <svg
      viewBox="0 0 3479 1000"
      role="img"
      aria-label={title}
      className={className}
      focusable="false"
    >
      <g transform="scale(21.739) translate(-2 -2)">
        <LogoMark />
      </g>
      <g
        transform="translate(1220 190) scale(0.8158) translate(-41 10)"
        fill={WORD[tone] || WORD.light}
      >
        <path d={T_PATH} />
        <path d={MST_PATH} />
      </g>
    </svg>
  );
}
