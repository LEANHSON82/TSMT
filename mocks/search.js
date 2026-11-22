// Bộ tìm kiếm MẪU cho mock API — mô tả hành vi mong muốn để team Go làm theo (xem README, mục «Đề xuất
// API tìm kiếm»). Không phải code chạy production: API thật nên dùng công cụ tìm kiếm (Meilisearch,
// Typesense hoặc Postgres unaccent + pg_trgm) để đạt < 150 ms và chịu gõ sai.
//
// Quy tắc:
//  - Từ khoá chữ: mọi từ phải khớp trong CÙNG một trường (tên DN hoặc người đại diện). Từ đã gõ xong phải
//    trùng nguyên chữ; riêng từ cuối được khớp phần đầu («Ho» → «Hoàng»), xếp sau khớp nguyên chữ.
//    Gợi ý (mode 'suggest', đang gõ dở): giữ cả khớp phần đầu. Trang kết quả (mode 'search', đã gõ xong):
//    có kết quả khớp nguyên chữ thì bỏ các kết quả chỉ khớp phần đầu — «Sơn» không kéo theo «Sông».
//  - Gõ có dấu thì kết quả đúng dấu xếp trên. Cụm chữ chung («công ty», «TNHH»…) không tính khi so khớp.
//  - Khớp tên DN xếp trên khớp người đại diện khi điểm bằng nhau; khớp cả cụm liền nhau được cộng điểm.
//  - Từ khoá số (bỏ nhãn «MST:», mọi kiểu gạch): tiền tố MST, hoặc ≥ 6 số trong SĐT — KHÔNG BAO GIỜ khớp SĐT DN đã ẩn / không công khai.
//  - Mỗi kết quả kèm matched: 'name' | 'representative' | 'mst' | 'phone'.
import { normalizeMst } from '../lib/mst.js';
import { queryTokens, tokenize, wordScore } from '../lib/search-text.js';

const NAME_BONUS = 1.5;
const PHRASE_BONUS = 2;

/** → { score, prefix } — prefix: có từ chỉ khớp phần đầu (không trùng nguyên chữ). */
function fieldScore(words, tokens) {
  let total = 0;
  let prefix = false;
  for (let i = 0; i < tokens.length; i++) {
    const last = i === tokens.length - 1;
    let best = 0;
    for (const w of words) best = Math.max(best, wordScore(tokens[i], w, last));
    if (!best) return { score: 0, prefix: false };
    if (best < 3) prefix = true;
    total += best;
  }
  if (tokens.length > 1) {
    const n = tokens.map((t) => t.n).join(' ');
    if (` ${words.map((w) => w.n).join(' ')} `.includes(` ${n}`)) total += PHRASE_BONUS;
  }
  return { score: total, prefix };
}

export function buildIndex(companies, phones) {
  return companies.map((c) => ({
    c,
    name: tokenize(`${c.name} ${c.name_en || ''} ${c.name_short || ''}`),
    rep: tokenize(c.representative),
    mst: c.mst.replace('-', ''),
    // SĐT chỉ đưa vào chỉ mục khi DN có SĐT công khai (chủ DN đã ẩn thì không tìm được bằng số đó).
    phone: c.has_phone && !c.phone_hidden ? phones[c.mst] || '' : '',
  }));
}

/** → [{ c, matched, score }] đã xếp hạng. mode: 'search' (trang kết quả) | 'suggest' (đang gõ). */
export function search(index, q, { mode = 'search' } = {}) {
  const query = String(q || '').trim();
  if (!query) return [];
  // «MST: 0101234567», «0101234567–001» (gạch dài), «0101234567_001» → chuỗi số (normalizeMst bỏ nhãn, đổi gạch).
  const digits = normalizeMst(query).replace(/[-+]/g, '');
  if (/^\d{3,}$/.test(digits)) {
    const phoneDigits = digits.replace(/^84/, '0');
    const out = [];
    for (const r of index) {
      if (r.mst.startsWith(digits))
        out.push({ c: r.c, matched: 'mst', score: r.mst === digits ? 2 : 1 });
      else if (phoneDigits.length >= 6 && r.phone.includes(phoneDigits))
        out.push({ c: r.c, matched: 'phone', score: 1 });
    }
    return out.sort((a, b) => b.score - a.score);
  }
  const tokens = queryTokens(query);
  const out = [];
  for (const r of index) {
    const name = fieldScore(r.name, tokens);
    const rep = fieldScore(r.rep, tokens);
    if (!name.score && !rep.score) continue;
    // Chỉ so các trường thực sự khớp; tên DN được cộng điểm ưu tiên.
    out.push(
      name.score && name.score + NAME_BONUS >= rep.score
        ? { c: r.c, matched: 'name', score: name.score + NAME_BONUS, prefix: name.prefix }
        : { c: r.c, matched: 'representative', score: rep.score, prefix: rep.prefix },
    );
  }
  const exactOnly = mode === 'search' && out.some((r) => !r.prefix);
  return (exactOnly ? out.filter((r) => !r.prefix) : out).sort(
    (a, b) => b.score - a.score || (a.c.founded_date < b.c.founded_date ? 1 : -1),
  );
}

/** Nhóm «Tìm theo» trên trang kết quả. */
export const FIELD_GROUPS = {
  name: ['name'],
  representative: ['representative'],
  number: ['mst', 'phone'],
};

export function countByField(results) {
  const counts = { all: results.length, name: 0, representative: 0, number: 0 };
  for (const r of results)
    for (const [k, v] of Object.entries(FIELD_GROUPS)) if (v.includes(r.matched)) counts[k] += 1;
  return counts;
}
