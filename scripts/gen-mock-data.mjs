// Sinh dữ liệu giả cho mock server: node scripts/gen-mock-data.mjs
// Kết quả cố định (seed), ghi vào mocks/data/*.json.
// Khi owner gửi ~200 DN thật (đã thay SĐT bằng số giả) thì thay các file này.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toSlug } from '../lib/slug.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'mocks', 'data');
mkdirSync(OUT, { recursive: true });

// --- PRNG có seed để dữ liệu ổn định giữa các lần chạy ---
let seed = 20261115;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pad = (n, w) => String(n).padStart(w, '0');

// --- 34 tỉnh/thành (sau sắp xếp 2025) ---
const PROVINCES = [
  ['01', 'Hà Nội', 'Thành phố Hà Nội', 18],
  ['79', 'TP Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 26],
  ['31', 'Hải Phòng', 'Thành phố Hải Phòng', 6],
  ['48', 'Đà Nẵng', 'Thành phố Đà Nẵng', 6],
  ['92', 'Cần Thơ', 'Thành phố Cần Thơ', 4],
  ['46', 'Huế', 'Thành phố Huế', 2],
  ['75', 'Đồng Nai', 'Tỉnh Đồng Nai', 6],
  ['24', 'Bắc Ninh', 'Tỉnh Bắc Ninh', 5],
  ['33', 'Hưng Yên', 'Tỉnh Hưng Yên', 3],
  ['38', 'Thanh Hóa', 'Tỉnh Thanh Hóa', 3],
  ['56', 'Khánh Hòa', 'Tỉnh Khánh Hòa', 3],
  ['80', 'Tây Ninh', 'Tỉnh Tây Ninh', 3],
  ['40', 'Nghệ An', 'Tỉnh Nghệ An', 3],
  ['68', 'Lâm Đồng', 'Tỉnh Lâm Đồng', 2],
  ['22', 'Quảng Ninh', 'Tỉnh Quảng Ninh', 2],
  ['25', 'Phú Thọ', 'Tỉnh Phú Thọ', 2],
  ['19', 'Thái Nguyên', 'Tỉnh Thái Nguyên', 2],
  ['37', 'Ninh Bình', 'Tỉnh Ninh Bình', 2],
  ['89', 'An Giang', 'Tỉnh An Giang', 2],
  ['52', 'Gia Lai', 'Tỉnh Gia Lai', 2],
  ['66', 'Đắk Lắk', 'Tỉnh Đắk Lắk', 2],
  ['86', 'Vĩnh Long', 'Tỉnh Vĩnh Long', 2],
  ['87', 'Đồng Tháp', 'Tỉnh Đồng Tháp', 1],
  ['51', 'Quảng Ngãi', 'Tỉnh Quảng Ngãi', 1],
  ['42', 'Hà Tĩnh', 'Tỉnh Hà Tĩnh', 1],
  ['45', 'Quảng Trị', 'Tỉnh Quảng Trị', 1],
  ['96', 'Cà Mau', 'Tỉnh Cà Mau', 1],
  ['10', 'Lào Cai', 'Tỉnh Lào Cai', 1],
  ['08', 'Tuyên Quang', 'Tỉnh Tuyên Quang', 1],
  ['20', 'Lạng Sơn', 'Tỉnh Lạng Sơn', 1],
  ['14', 'Sơn La', 'Tỉnh Sơn La', 1],
  ['04', 'Cao Bằng', 'Tỉnh Cao Bằng', 1],
  ['11', 'Điện Biên', 'Tỉnh Điện Biên', 1],
  ['12', 'Lai Châu', 'Tỉnh Lai Châu', 1],
];

// --- Danh mục ngành VSIC (4 số) ---
const INDUSTRIES = [
  ['4101', 'Xây dựng nhà để ở'],
  ['4102', 'Xây dựng nhà không để ở'],
  ['4211', 'Xây dựng công trình đường sắt'],
  ['4321', 'Lắp đặt hệ thống điện'],
  ['4322', 'Lắp đặt hệ thống cấp, thoát nước, lò sưởi và điều hoà không khí'],
  ['4330', 'Hoàn thiện công trình xây dựng'],
  ['4390', 'Hoạt động xây dựng chuyên dụng khác'],
  ['2011', 'Sản xuất hóa chất cơ bản'],
  ['1079', 'Sản xuất thực phẩm khác chưa được phân vào đâu'],
  ['1410', 'May trang phục (trừ trang phục từ da lông thú)'],
  ['2511', 'Sản xuất các cấu kiện kim loại'],
  ['3312', 'Sửa chữa máy móc, thiết bị'],
  ['4610', 'Đại lý, môi giới, đấu giá hàng hóa'],
  ['4632', 'Bán buôn thực phẩm'],
  ['4641', 'Bán buôn vải, hàng may mặc, giày dép'],
  ['4651', 'Bán buôn máy vi tính, thiết bị ngoại vi và phần mềm'],
  ['4659', 'Bán buôn máy móc, thiết bị và phụ tùng máy khác'],
  ['4663', 'Bán buôn vật liệu, thiết bị lắp đặt khác trong xây dựng'],
  ['4690', 'Bán buôn tổng hợp'],
  [
    '4752',
    'Bán lẻ đồ ngũ kim, sơn, kính và thiết bị lắp đặt khác trong xây dựng trong các cửa hàng chuyên doanh',
  ],
  ['4791', 'Bán lẻ theo yêu cầu đặt hàng qua bưu điện hoặc internet'],
  ['4933', 'Vận tải hàng hóa bằng đường bộ'],
  ['5210', 'Kho bãi và lưu giữ hàng hóa'],
  ['5229', 'Hoạt động dịch vụ hỗ trợ khác liên quan đến vận tải'],
  ['5510', 'Dịch vụ lưu trú ngắn ngày'],
  ['5610', 'Nhà hàng và các dịch vụ ăn uống phục vụ lưu động'],
  ['6201', 'Lập trình máy vi tính'],
  ['6202', 'Tư vấn máy vi tính và quản trị hệ thống máy vi tính'],
  ['6311', 'Xử lý dữ liệu, cho thuê và các hoạt động liên quan'],
  ['6810', 'Kinh doanh bất động sản, quyền sử dụng đất thuộc chủ sở hữu, chủ sử dụng hoặc đi thuê'],
  ['6920', 'Hoạt động liên quan đến kế toán, kiểm toán và tư vấn về thuế'],
  ['7020', 'Hoạt động tư vấn quản lý'],
  ['7110', 'Hoạt động kiến trúc và tư vấn kỹ thuật có liên quan'],
  ['7120', 'Kiểm tra và phân tích kỹ thuật'],
  ['7310', 'Quảng cáo'],
  ['7490', 'Hoạt động chuyên môn, khoa học và công nghệ khác chưa được phân vào đâu'],
  ['7911', 'Đại lý du lịch'],
  ['8299', 'Hoạt động dịch vụ hỗ trợ kinh doanh khác còn lại chưa được phân vào đâu'],
  ['8559', 'Giáo dục khác chưa được phân vào đâu'],
  ['0118', 'Trồng rau, đậu các loại và trồng hoa'],
];

// Nhóm ngành để DN có ngành nghề "hợp lý" với tên
const SECTORS = [
  {
    words: ['XÂY DỰNG', 'KIẾN TRÚC', 'NỘI THẤT'],
    en: 'CONSTRUCTION',
    codes: ['4330', '4101', '4102', '4321', '4322', '4390', '4663', '7110', '4752', '2511'],
  },
  {
    words: ['THƯƠNG MẠI DỊCH VỤ', 'THƯƠNG MẠI', 'XUẤT NHẬP KHẨU'],
    en: 'TRADING',
    codes: ['4690', '4610', '4632', '4641', '4659', '4663', '4791', '8299'],
  },
  {
    words: ['CÔNG NGHỆ', 'PHẦN MỀM', 'GIẢI PHÁP SỐ'],
    en: 'TECHNOLOGY',
    codes: ['6201', '6202', '6311', '4651', '7490', '7020'],
  },
  {
    words: ['VẬN TẢI', 'LOGISTICS', 'GIAO NHẬN'],
    en: 'LOGISTICS',
    codes: ['4933', '5210', '5229', '4610'],
  },
  { words: ['DU LỊCH', 'KHÁCH SẠN', 'NHÀ HÀNG'], en: 'TOURISM', codes: ['7911', '5510', '5610'] },
  {
    words: ['TƯ VẤN', 'KẾ TOÁN', 'QUẢNG CÁO'],
    en: 'CONSULTING',
    codes: ['6920', '7020', '7310', '8299', '8559'],
  },
  {
    words: ['SẢN XUẤT', 'CƠ KHÍ', 'MAY MẶC'],
    en: 'MANUFACTURING',
    codes: ['2511', '3312', '1410', '1079', '2011', '4659'],
  },
  { words: ['BẤT ĐỘNG SẢN', 'ĐẦU TƯ'], en: 'REAL ESTATE', codes: ['6810', '4101', '7020'] },
  { words: ['NÔNG SẢN', 'THỰC PHẨM'], en: 'AGRICULTURE', codes: ['0118', '1079', '4632', '4690'] },
];

const BRANDS = [
  ['AN PHÁT', 'AN PHAT'],
  ['MINH KHANG', 'MINH KHANG'],
  ['HOÀNG GIA', 'HOANG GIA'],
  ['ĐẠI VIỆT', 'DAI VIET'],
  ['SAO MAI', 'SAO MAI'],
  ['PHÚ QUÝ', 'PHU QUY'],
  ['THÀNH ĐẠT', 'THANH DAT'],
  ['NAM PHONG', 'NAM PHONG'],
  ['BẢO LONG', 'BAO LONG'],
  ['TÂN THỊNH', 'TAN THINH'],
  ['HƯNG THỊNH', 'HUNG THINH'],
  ['KIM NGÂN', 'KIM NGAN'],
  ['THIÊN PHÚC', 'THIEN PHUC'],
  ['VIỆT TIẾN', 'VIET TIEN'],
  ['HẢI ĐĂNG', 'HAI DANG'],
  ['TRƯỜNG AN', 'TRUONG AN'],
  ['GIA HUY', 'GIA HUY'],
  ['ÁNH DƯƠNG', 'ANH DUONG'],
  ['ĐÔNG Á', 'DONG A'],
  ['NGỌC LAN', 'NGOC LAN'],
  ['QUANG MINH', 'QUANG MINH'],
  ['PHƯƠNG NAM', 'PHUONG NAM'],
  ['THẢO NGUYÊN', 'THAO NGUYEN'],
  ['SÔNG HỒNG', 'SONG HONG'],
  ['MỸ AN', 'MY AN'],
  ['LỘC PHÁT', 'LOC PHAT'],
  ['VẠN XUÂN', 'VAN XUAN'],
  ['TÍN NGHĨA', 'TIN NGHIA'],
  ['HÒA BÌNH', 'HOA BINH'],
  ['XUÂN MAI', 'XUAN MAI'],
  ['BÌNH MINH', 'BINH MINH'],
  ['TRÍ VIỆT', 'TRI VIET'],
  ['ĐỨC TÀI', 'DUC TAI'],
  ['KHÁNH LINH', 'KHANH LINH'],
  ['TOÀN CẦU', 'TOAN CAU'],
  ['ÂU LẠC', 'AU LAC'],
];

const TYPES = [
  {
    prefix: 'CÔNG TY TNHH',
    enSuffix: 'COMPANY LIMITED',
    shortSuffix: 'CO.,LTD',
    type: 'Công ty TNHH',
    w: 5,
  },
  {
    prefix: 'CÔNG TY TNHH MỘT THÀNH VIÊN',
    enSuffix: 'ONE MEMBER COMPANY LIMITED',
    shortSuffix: 'CO.,LTD',
    type: 'Công ty TNHH một thành viên',
    w: 2,
  },
  {
    prefix: 'CÔNG TY CỔ PHẦN',
    enSuffix: 'JOINT STOCK COMPANY',
    shortSuffix: 'JSC',
    type: 'Công ty cổ phần',
    w: 2,
  },
  {
    prefix: 'DOANH NGHIỆP TƯ NHÂN',
    enSuffix: 'PRIVATE ENTERPRISE',
    shortSuffix: null,
    type: 'Doanh nghiệp tư nhân',
    w: 1,
  },
];
const weighted = (items) => {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rand() * total;
  for (const i of items) if ((r -= i.w) < 0) return i;
  return items[0];
};

const FAMILY = [
  'NGUYỄN',
  'TRẦN',
  'LÊ',
  'PHẠM',
  'HOÀNG',
  'HUỲNH',
  'PHAN',
  'VŨ',
  'VÕ',
  'ĐẶNG',
  'BÙI',
  'ĐỖ',
  'HỒ',
  'NGÔ',
  'DƯƠNG',
  'LÝ',
];
const MIDDLE = [
  'VĂN',
  'THỊ',
  'MINH',
  'NGỌC',
  'ĐỨC',
  'THANH',
  'HỮU',
  'QUANG',
  'THU',
  'HOÀNG',
  'XUÂN',
  'GIA',
];
const GIVEN = [
  'AN',
  'BÌNH',
  'CƯỜNG',
  'DŨNG',
  'HÀ',
  'HẢI',
  'HÙNG',
  'HUY',
  'KHOA',
  'LAN',
  'LINH',
  'LONG',
  'MAI',
  'NAM',
  'NGA',
  'PHONG',
  'PHƯƠNG',
  'QUÂN',
  'SƠN',
  'TÂM',
  'THẢO',
  'THẮNG',
  'TÚ',
  'TUẤN',
  'VY',
  'YẾN',
];
const STREETS = [
  'Lê Lợi',
  'Trần Hưng Đạo',
  'Nguyễn Huệ',
  'Hai Bà Trưng',
  'Lý Thường Kiệt',
  'Nguyễn Trãi',
  'Hùng Vương',
  'Phan Chu Trinh',
  'Quang Trung',
  'Lê Duẩn',
  'Võ Văn Kiệt',
  'Điện Biên Phủ',
  'Cách Mạng Tháng Tám',
  'Nguyễn Văn Linh',
  'Trường Chinh',
];
const WARDS = [
  'Phường Bến Thành',
  'Phường Hiệp Bình',
  'Phường Kim Liên',
  'Phường Đông Hải',
  'Phường Tân An',
  'Phường Sơn Trà',
  'Phường Hòa Cường',
  'Phường Ninh Kiều',
  'Phường Trung Tâm',
  'Phường Hồng Hải',
  'Xã Tân Phú',
  'Xã Bình Minh',
  'Phường An Khánh',
  'Phường Thanh Xuân',
];

const provinceObj = (p) => ({ code: p[0], name: p[1], slug: toSlug(p[1].replace(/^TP /, '')) });

function personName() {
  return `${pick(FAMILY)} ${pick(MIDDLE)} ${pick(GIVEN)}`;
}

function fakePhone() {
  // SĐT GIẢ cho mock — không phải số thật.
  const prefix = pick(['0901', '0912', '0936', '0977', '0868', '0789', '0832', '0563']);
  return `${prefix}${pad(int(0, 999999), 6)}`;
}
const maskPhone = (p) => `${p.slice(0, 4)} *** ***`;

function isoDaysAgo(days) {
  const base = Date.UTC(2026, 10, 15); // 15/11/2026
  const d = new Date(base - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function updatedAt(days) {
  const base = Date.UTC(2026, 10, 15, 1, 0, 0);
  const d = new Date(base - days * 86400000 - int(0, 20000) * 1000);
  // ISO có múi giờ +07:00
  const vn = new Date(d.getTime() + 7 * 3600000);
  return `${vn.toISOString().slice(0, 19)}+07:00`;
}

const companies = [];
const phones = {};
const usedMst = new Set();

function makeMst(provinceCode) {
  let mst;
  do {
    mst = `${pad(int(1, 99), 2)}${pad(int(0, 99999999), 8)}`;
    if (provinceCode === '79') mst = `03${pad(int(0, 99999999), 8)}`;
    if (provinceCode === '01') mst = `01${pad(int(0, 99999999), 8)}`;
  } while (usedMst.has(mst));
  usedMst.add(mst);
  return mst;
}

function addCompany(c, phone) {
  companies.push(c);
  if (phone) phones[c.mst] = phone;
}

// 1) DN mẫu đúng như ví dụ trong spec mục 6 (SĐT giả)
const hcm = PROVINCES.find((p) => p[0] === '79');
usedMst.add('0319786701');
addCompany(
  {
    mst: '0319786701',
    slug: toSlug('CÔNG TY TNHH GIẢI PHÁP KỸ THUẬT PC VIỆT NAM'),
    name: 'CÔNG TY TNHH GIẢI PHÁP KỸ THUẬT PC VIỆT NAM',
    name_en: 'PC VIET NAM TECHNICAL SOLUTIONS COMPANY LIMITED',
    name_short: 'PC VIET NAM TECHNICAL SOLUTIONS CO.,LTD',
    address: '75N/2A Đường số 2, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam',
    province: provinceObj(hcm),
    representative: 'NGUYỄN NGỌC THỌC',
    has_phone: true,
    phone_hidden: false,
    phone_masked: '0916 *** ***',
    email: 'lienhe@example.com',
    founded_date: '2026-11-12',
    tax_office: 'Thuế cơ sở 2 Thành phố Hồ Chí Minh',
    business_type: 'Công ty TNHH',
    status: { code: 'active', label: 'Đang hoạt động' },
    capital: 10000000000,
    industries: [
      { code: '4330', name: 'Hoàn thiện công trình xây dựng', is_main: true },
      { code: '2011', name: 'Sản xuất hóa chất cơ bản', is_main: false },
      ...[
        '4321',
        '4322',
        '4390',
        '4663',
        '4659',
        '7110',
        '7120',
        '3312',
        '4752',
        '8299',
        '4610',
      ].map((code) => ({ code, name: INDUSTRIES.find((i) => i[0] === code)[1], is_main: false })),
    ],
    parent_mst: null,
    updated_at: '2026-11-14T08:37:09+07:00',
  },
  '0916000000',
);

// 2) DN ngẫu nhiên
const STATUS = [
  { code: 'active', label: 'Đang hoạt động', w: 85 },
  { code: 'suspended', label: 'Ngừng hoạt động', w: 9 },
  { code: 'closed', label: 'Đã đóng MST', w: 6 },
];
const provincePool = PROVINCES.flatMap((p) => Array(p[3]).fill(p));

for (let i = 0; i < 235; i++) {
  const p = pick(provincePool);
  const t = weighted(TYPES);
  const sector = pick(SECTORS);
  const word = pick(sector.words);
  const [brand, brandEn] = pick(BRANDS);
  const regional = rand() < 0.3 ? ` ${p[1].toUpperCase().replace('TP ', '')}` : '';
  const name =
    t.prefix === 'DOANH NGHIỆP TƯ NHÂN'
      ? `${t.prefix} ${brand}`
      : `${t.prefix} ${word} ${brand}${regional}`;
  const hasEn = t.prefix !== 'DOANH NGHIỆP TƯ NHÂN' && rand() < 0.7;
  const nameEn = hasEn ? `${brandEn} ${sector.en} ${t.enSuffix}` : null;
  const nameShort = hasEn && t.shortSuffix && rand() < 0.7 ? `${brandEn} ${t.shortSuffix}` : null;
  // Tuổi DN: 40% mới trong 30 ngày, còn lại rải 0–18 năm
  const days = rand() < 0.4 ? int(0, 30) : int(31, 365 * 18);
  const status = days < 400 ? STATUS[0] : weighted(STATUS);
  const nInd = rand() < 0.1 ? int(11, 16) : int(1, 8);
  const codes = [
    ...new Set([
      sector.codes[0],
      ...Array.from({ length: nInd * 2 }, () =>
        pick(rand() < 0.75 ? sector.codes : INDUSTRIES.map((x) => x[0])),
      ),
    ]),
  ].slice(0, nInd);
  const mainIdx = int(0, codes.length - 1);
  const roll = rand();
  const hasPhone = roll < 0.82;
  const hidden = hasPhone && rand() < 0.06;
  const phone = hasPhone ? fakePhone() : null;
  const mst = makeMst(p[0]);
  addCompany(
    {
      mst,
      slug: toSlug(name),
      name,
      name_en: nameEn,
      name_short: nameShort,
      address: `Số ${int(1, 300)}${rand() < 0.3 ? `/${int(1, 40)}` : ''} Đường ${pick(STREETS)}, ${pick(WARDS)}, ${p[2]}, Việt Nam`,
      province: provinceObj(p),
      representative: personName(),
      has_phone: hasPhone,
      phone_hidden: hidden,
      phone_masked: hasPhone && !hidden ? maskPhone(phone) : null,
      email: rand() < 0.35 ? `lienhe@${toSlug(brandEn).replace(/-/g, '')}.example.vn` : null,
      founded_date: isoDaysAgo(days),
      tax_office: `Thuế cơ sở ${int(1, 12)} ${p[2]}`,
      business_type: t.type,
      status: { code: status.code, label: status.label },
      capital:
        t.prefix === 'DOANH NGHIỆP TƯ NHÂN' && rand() < 0.4
          ? null
          : pick([500, 1000, 1500, 2000, 3000, 5000, 9000, 10000, 20000, 50000]) * 1e6,
      industries: codes.map((code, idx) => ({
        code,
        name: INDUSTRIES.find((x) => x[0] === code)[1],
        is_main: idx === mainIdx,
      })),
      parent_mst: null,
      updated_at: updatedAt(Math.min(days, int(0, 60))),
    },
    phone,
  );
}

// 3) Chi nhánh (MST 13 số) của một số DN mẹ
const parents = companies
  .filter((c) => c.business_type !== 'Doanh nghiệp tư nhân' && c.status.code === 'active')
  .slice(1, 13);
parents.forEach((parent, idx) => {
  const p = pick(provincePool);
  const mst = `${parent.mst}-${pad((idx % 3) + 1, 3)}`;
  const name = `CHI NHÁNH ${parent.name} TẠI ${p[1].toUpperCase()}`;
  const phone = rand() < 0.7 ? fakePhone() : null;
  addCompany(
    {
      ...parent,
      mst,
      slug: toSlug(name),
      name,
      name_en: null,
      name_short: null,
      address: `Số ${int(1, 300)} Đường ${pick(STREETS)}, ${pick(WARDS)}, ${p[2]}, Việt Nam`,
      province: provinceObj(p),
      representative: personName(),
      has_phone: Boolean(phone),
      phone_hidden: false,
      phone_masked: phone ? maskPhone(phone) : null,
      email: null,
      founded_date: isoDaysAgo(int(10, 2000)),
      business_type: 'Chi nhánh',
      capital: null,
      parent_mst: parent.mst,
      updated_at: updatedAt(int(0, 60)),
    },
    phone,
  );
});

companies.sort((a, b) =>
  a.founded_date < b.founded_date
    ? 1
    : a.founded_date > b.founded_date
      ? -1
      : a.mst.localeCompare(b.mst),
);

const provinces = PROVINCES.map((p) => ({
  ...provinceObj(p),
  company_count: companies.filter((c) => c.province.code === p[0]).length,
})).sort((a, b) => b.company_count - a.company_count || a.name.localeCompare(b.name, 'vi'));

const industries = INDUSTRIES.map(([code, name]) => ({ code, name, slug: toSlug(name) }));

writeFileSync(join(OUT, 'companies.json'), JSON.stringify(companies, null, 1));
writeFileSync(join(OUT, 'phones.json'), JSON.stringify(phones, null, 1));
writeFileSync(join(OUT, 'provinces.json'), JSON.stringify(provinces, null, 1));
writeFileSync(join(OUT, 'industries.json'), JSON.stringify(industries, null, 1));

console.log(
  `companies=${companies.length} phones=${Object.keys(phones).length} provinces=${provinces.length} industries=${industries.length}`,
);
