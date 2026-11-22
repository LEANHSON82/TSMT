// Nhận ra tỉnh/thành trong từ khoá tìm kiếm.
import { queryTokens, tokenize, wordScore } from './search-text.js';

// Tiền tố đơn vị và tên gọi khác hay gõ.
const PREFIX = new Set(['tp', 'thanh', 'pho', 'tinh']);
const norm = (s) =>
  tokenize(s)
    .map((x) => x.n)
    .join(' ');

// Tên gọi khác và tên 63 tỉnh cũ (trước sáp nhập 01/07/2025) → tỉnh mới, theo tên tỉnh mới đã bỏ dấu. Người dùng
// và địa chỉ trên giấy tờ vẫn ghi tỉnh cũ («binh duong», «vung tau»). Nguồn: Nghị quyết 202/2025/QH15 (xem
// .design/research_notes, «Tối ưu tra cứu doanh nghiệp»).
const OTHER_NAMES = {
  'ho chi minh': [
    'hcm',
    'tphcm',
    'tp hcm',
    'sai gon',
    'saigon',
    'binh duong',
    'ba ria vung tau',
    'vung tau',
    'ba ria',
    'brvt',
  ],
  hue: ['thua thien hue', 'tt hue'],
  'lao cai': ['yen bai'],
  'thai nguyen': ['bac kan'],
  'phu tho': ['vinh phuc', 'hoa binh'],
  'bac ninh': ['bac giang'],
  'hung yen': ['thai binh'],
  'hai phong': ['hai duong'],
  'ninh binh': ['ha nam', 'nam dinh'],
  'quang tri': ['quang binh'],
  'da nang': ['quang nam'],
  'quang ngai': ['kon tum'],
  'gia lai': ['binh dinh'],
  'khanh hoa': ['ninh thuan'],
  'lam dong': ['dak nong', 'binh thuan'],
  'dak lak': ['phu yen'],
  'dong nai': ['binh phuoc'],
  'tay ninh': ['long an'],
  'can tho': ['soc trang', 'hau giang'],
  'vinh long': ['ben tre', 'tra vinh'],
  'dong thap': ['tien giang'],
  'ca mau': ['bac lieu'],
  'an giang': ['kien giang'],
  'tuyen quang': ['ha giang'],
};

const nameTokens = (p) => {
  const t = tokenize(p.name).map((x) => x.n);
  while (t.length > 1 && PREFIX.has(t[0])) t.shift();
  return t;
};

/** Các tên khác của một tỉnh (mảng chuỗi đã bỏ dấu, cách nhau dấu cách). */
const otherNames = (p) => OTHER_NAMES[nameTokens(p).join(' ')] || [];

/** Tên cũ / tên gọi khác của tỉnh mà từ khoá đang gõ khớp (để hiện «Bình Dương nay thuộc …»), hoặc null. */
export function matchedOtherName(q, p) {
  const query = norm(q).replace(/^(tp|tinh|thanh pho) /, '');
  if (query.length < 2) return null;
  return otherNames(p).find((n) => n === query || n.startsWith(query)) || null;
}

/** Gợi ý tỉnh khi đang gõ: mọi từ khoá khớp tên tỉnh (từ cuối được khớp phần đầu). Tối đa `limit`. */
export function suggestProvinces(q, provinces, limit = 3) {
  const query = String(q || '').trim();
  if (query.length < 2 || /^\d/.test(query)) return [];
  const tokens = queryTokens(query);
  return provinces
    .filter((p) => {
      const words = tokenize(p.name);
      if (tokens.every((t, i) => words.some((w) => wordScore(t, w, i === tokens.length - 1))))
        return true;
      return Boolean(matchedOtherName(query, p));
    })
    .sort((a, b) => (b.company_count || 0) - (a.company_count || 0))
    .slice(0, limit);
}

/**
 * Tìm tên tỉnh nằm trong từ khoá (vd. «xây dựng hà nội») → { province, rest } với rest là từ khoá đã bỏ
 * tên tỉnh («xây dựng»). Không thấy → null.
 */
export function findProvinceInQuery(q, provinces) {
  const words = String(q || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const norm = words.map((w) => tokenize(w)[0]?.n || '');
  const candidates = [];
  for (const p of provinces) {
    for (const seq of [nameTokens(p), ...otherNames(p).map((n) => n.split(' '))])
      candidates.push({ p, seq });
  }
  // Ưu tiên tên dài hơn (tránh khớp nhầm một phần).
  candidates.sort((a, b) => b.seq.length - a.seq.length);
  for (const { p, seq } of candidates) {
    for (let i = 0; i + seq.length <= norm.length; i++) {
      if (seq.every((s, k) => norm[i + k] === s)) {
        let start = i;
        // Bỏ luôn tiền tố «tp», «tỉnh», «thành phố» đứng ngay trước.
        while (start > 0 && PREFIX.has(norm[start - 1])) start -= 1;
        const rest = [...words.slice(0, start), ...words.slice(i + seq.length)].join(' ');
        return { province: p, rest };
      }
    }
  }
  return null;
}
