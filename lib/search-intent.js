// Nhận ra tỉnh/thành trong từ khoá tìm kiếm.
import { queryTokens, tokenize, wordScore } from './search-text.js';

// Tiền tố đơn vị và tên gọi khác hay gõ.
const PREFIX = new Set(['tp', 'thanh', 'pho', 'tinh']);
const ALIASES = { 79: [['hcm'], ['tphcm'], ['sai', 'gon'], ['saigon']] };

const nameTokens = (p) => {
  const t = tokenize(p.name).map((x) => x.n);
  while (t.length > 1 && PREFIX.has(t[0])) t.shift();
  return t;
};

/** Gợi ý tỉnh khi đang gõ: mọi từ khoá khớp tên tỉnh (từ cuối được khớp phần đầu). Tối đa `limit`. */
export function suggestProvinces(q, provinces, limit = 3) {
  const query = String(q || '').trim();
  if (query.length < 2 || /^\d/.test(query)) return [];
  const tokens = queryTokens(query);
  return provinces
    .filter((p) => {
      const words = tokenize(p.name);
      return tokens.every((t, i) => words.some((w) => wordScore(t, w, i === tokens.length - 1)));
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
    for (const seq of [nameTokens(p), ...(ALIASES[p.code] || [])]) candidates.push({ p, seq });
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
