// Mã số thuế: 10 số (doanh nghiệp) hoặc 10 số + "-" + 3 số (chi nhánh).
const MST_RE = /^\d{10}(-\d{3})?$/;

// Nhãn hay dán kèm khi copy từ hoá đơn / Excel / Zalo: «MST: 0101234567», «Mã số thuế 0101234567».
const MST_LABEL_RE = /^(?:m[aã]\s*s[oố]\s*thu[eế]|mst)\s*[:：.]?\s*/iu;
// Các kiểu gạch ngang khi copy từ Word/PDF (– — ‒ ‐ −) và gạch dưới → coi như «-».
const DASHES_RE = /[\u2010-\u2015\u2212_]/g;

/**
 * Chuẩn hoá MST người dùng nhập: bỏ nhãn «MST»/«Mã số thuế», khoảng trắng, dấu chấm; mọi kiểu gạch → «-»;
 * "0101234567001" → "0101234567-001". Chuỗi không phải MST thì trả về gần như nguyên vẹn (đã bỏ khoảng trắng).
 */
export function normalizeMst(input) {
  let s = String(input ?? '')
    .trim()
    .normalize('NFC');
  const unlabeled = s.replace(MST_LABEL_RE, '');
  // Chỉ bỏ nhãn khi phần còn lại bắt đầu bằng chữ số (không cắt chữ «mst» của một tên DN).
  if (unlabeled !== s && /^\d/.test(unlabeled)) s = unlabeled;
  s = s.replace(DASHES_RE, '-').replace(/[\s.]/g, '').replace(/-+/g, '-');
  // Gạch chia nhóm số kiểu «019-580-5215» / «0195-805-215-001»: bỏ hết gạch mà còn đúng 10 hoặc 13 chữ số → MST.
  if (/^[\d-]+$/.test(s) && !/^\d{10}-\d{3}$/.test(s)) {
    const digits = s.replace(/-/g, '');
    if (/^(\d{10}|\d{13})$/.test(digits)) s = digits;
  }
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
  return /^\d[\d-]*$/.test(normalizeMst(q)) ? 'mst' : 'text';
}
