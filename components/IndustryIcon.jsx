// Icon nét theo nhóm ngành VSIC (2 số đầu của mã ngành → ngành cấp 1). Dùng cạnh tên ngành ở khối «Ngành nghề có
// nhiều doanh nghiệp» và tiêu đề trang ngành. Icon đứng trần (không ô vuông nền màu), màu theo chữ xung quanh.
const GROUPS = [
  // [mã cấp 2 từ, đến, nhóm]
  [1, 3, 'agri'],
  [5, 39, 'factory'],
  [41, 43, 'build'],
  [45, 47, 'trade'],
  [49, 53, 'truck'],
  [55, 56, 'food'],
  [58, 63, 'tech'],
  [64, 66, 'finance'],
  [68, 68, 'house'],
  [69, 75, 'pro'],
  [85, 85, 'edu'],
  [86, 88, 'health'],
];

const PATHS = {
  agri: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7',
  factory: 'M3 21V11l5 3v-3l5 3V7l8 4v10zM3 21h18M7 17h2M12 17h2M17 17h1',
  build: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6',
  trade: 'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0',
  truck:
    'M2 6h12v10H2zM14 10h4l3 3v3h-7M6 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  food: 'M7 3v7M5 3v4a2 2 0 0 0 4 0V3M7 10v11M17 3c-2.5 2-2.5 7 0 8.5V21',
  tech: 'M3 5h18v11H3zM8 20h8M12 16v4M10 8.5L8 10.5l2 2M14 8.5l2 2-2 2',
  finance: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  house: 'M4 11l8-7 8 7v9H4zM10 20v-5h4v5',
  pro: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  edu: 'M12 4l10 5-10 5L2 9zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
  health: 'M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z',
  other: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
};

export function industryGroup(code) {
  const div = Number(String(code || '').slice(0, 2));
  return GROUPS.find(([a, b]) => div >= a && div <= b)?.[2] || 'other';
}

export default function IndustryIcon({ code, size = 20, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATHS[industryGroup(code)]} />
    </svg>
  );
}
