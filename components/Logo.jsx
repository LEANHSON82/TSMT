// Logo «TMST» dạng hình vẽ (SVG): nét chữ Be Vietnam Pro SemiBold đã chuyển thành path nên hiển thị
// sắc nét, giống nhau mọi máy, không phụ thuộc font. «T» màu navy, «MST» màu xanh thương hiệu.
// tone="dark" dùng trên nền tối (footer). Sinh lại path: xem scripts/gen-logo.py.
const T_PATH = 'M269 740V118H41V0H633V118H405V740Z';
const MST_PATH =
  'M736.0 740V0H917.0L1102.0 401L1291.0 0H1469.0V740H1335.0V205L1165.0 561H1039.0L870.0 203V740ZM1870.0 750Q1801.0 750 1752.0 733.0Q1703.0 716 1670.5 689.0Q1638.0 662 1619.0 631.5Q1600.0 601 1590.5 574.0Q1581.0 547 1578.0 530.0Q1575.0 513 1575.0 513H1713.0Q1713.0 513 1715.5 525.0Q1718.0 537 1727.0 555.5Q1736.0 574 1753.5 592.0Q1771.0 610 1800.5 622.5Q1830.0 635 1874.0 635Q1942.0 635 1977.5 604.5Q2013.0 574 2013.0 529Q2013.0 491 1986.0 468.5Q1959.0 446 1906.0 435L1808.0 414Q1751.0 402 1701.5 378.0Q1652.0 354 1622.0 313.0Q1592.0 272 1592.0 208Q1592.0 141 1625.5 92.0Q1659.0 43 1718.0 16.5Q1777.0 -10 1856.0 -10Q1931.0 -10 1980.0 12.0Q2029.0 34 2058.5 66.0Q2088.0 98 2102.0 130.0Q2116.0 162 2120.5 184.0Q2125.0 206 2125.0 206H1992.0Q1992.0 206 1988.0 190.5Q1984.0 175 1970.0 155.0Q1956.0 135 1928.0 119.5Q1900.0 104 1853.0 104Q1786.0 104 1755.5 134.0Q1725.0 164 1725.0 199Q1725.0 235 1753.0 255.0Q1781.0 275 1828.0 286L1933.0 308Q1992.0 321 2041.0 347.0Q2090.0 373 2119.0 415.5Q2148.0 458 2148.0 521Q2148.0 585 2116.0 637.0Q2084.0 689 2022.0 719.5Q1960.0 750 1870.0 750ZM2446.0 740V118H2218.0V0H2810.0V118H2582.0V740Z';

const TONES = {
  light: { t: 'var(--color-navy)', mst: 'var(--color-brand)' },
  dark: { t: '#ffffff', mst: '#9dbcf0' },
};

export default function Logo({ tone = 'light', className = '', title = 'TMST' }) {
  const c = TONES[tone] || TONES.light;
  return (
    <svg
      viewBox="41 -10 2769 760"
      role="img"
      aria-label={title}
      className={className}
      focusable="false"
    >
      <path d={T_PATH} fill={c.t} />
      <path d={MST_PATH} fill={c.mst} />
    </svg>
  );
}
