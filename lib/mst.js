// Mã số thuế: 10 số (doanh nghiệp) hoặc 10 số + "-" + 3 số (chi nhánh).
const MST_RE = /^\d{10}(-\d{3})?$/;

/** Bỏ khoảng trắng, dấu chấm; "0101234567001" → "0101234567-001". */
export function normalizeMst(input) {
  const s = String(input ?? '')
    .trim()
    .replace(/[\s.]/g, '');
  if (/^\d{13}$/.test(s)) return `${s.slice(0, 10)}-${s.slice(10)}`;
  return s;
}

export function isValidMst(input) {
  return MST_RE.test(normalizeMst(input));
}

/**
 * Tách tham số URL trang chi tiết: "{mst}-{slug}", "{mst}-{sss}-{slug}", "{mst}" hoặc "{mst}-{sss}".
 * Trả về { mst, slug } hoặc null nếu sai định dạng (→ 404 luôn, không gọi API).
 */
export function parseMstSlug(param) {
  if (typeof param !== 'string') return null;
  const m = /^(\d{10})(?:-(\d{3}))?(?:-([a-z0-9]+(?:-[a-z0-9]+)*))?$/.exec(param);
  if (!m) return null;
  return { mst: m[2] ? `${m[1]}-${m[2]}` : m[1], slug: m[3] || '' };
}

export function companyPath(company) {
  return company.slug ? `/${company.mst}-${company.slug}` : `/${company.mst}`;
}

/** Loại từ khoá cho sự kiện analytics «search» (spec mục 8.1): toàn chữ số → 'mst', còn lại 'text'. */
export function searchQueryType(q) {
  return /^\d[\d\s.\-]*$/.test(String(q || '').trim()) ? 'mst' : 'text';
}
