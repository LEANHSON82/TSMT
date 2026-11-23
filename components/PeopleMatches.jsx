import Link from 'next/link';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';

// Trang kết quả: người đại diện khớp từ khoá, gộp theo họ tên kèm số DN (API trả `people`).
// - Từ khoá đúng bằng họ tên một người (đang xem tab «Người đại diện»): một câu tóm tắt «X là người đại diện của
//   N doanh nghiệp».
// - Còn lại: mỗi họ tên một thẻ «HỌ TÊN · N DN», bấm để xem tất cả DN của tên đó (tab Người đại diện).
// Không có mã định danh cá nhân công khai → luôn ghi rõ có thể gồm nhiều người trùng họ tên.
const key = (s) =>
  String(s || '')
    .normalize('NFC')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

// Hệ A: gọn, không hộp — một dòng nhãn + các thẻ tên chữ nhật viền mảnh, chú thích nhỏ bên dưới.
export default function PeopleMatches({ people, q, tab, params }) {
  if (!people?.length || !q || (tab && tab !== 'dai-dien')) return null;
  // Gõ đúng họ tên và đang xem tab «Người đại diện»: một câu tóm tắt (tab «Tất cả» vẫn hiện thẻ bên dưới).
  if (tab === 'dai-dien' && people.length === 1 && key(people[0].name) === key(q)) {
    return (
      <p className="text-body text-ink-2">
        <strong className="font-semibold text-ink">{people[0].name}</strong>{' '}
        {M.search.peopleExact(people[0].count)}
      </p>
    );
  }
  return (
    <section
      aria-labelledby="people-title"
      className="flex flex-col md:flex-row md:flex-wrap md:items-center md:gap-x-3"
    >
      <h2 id="people-title" className="text-sm font-semibold text-ink-2">
        {M.search.peopleTitle(q)}
      </h2>
      {/* Điện thoại: thẻ tên xếp một hàng cuộn ngang (không chiếm cả màn hình đầu, đẩy kết quả xuống). */}
      <ul className="flex flex-wrap gap-x-2 max-md:-mx-4 max-md:flex-nowrap max-md:overflow-x-auto max-md:px-4">
        {people.slice(0, 10).map((p) => (
          <li key={p.name} className="flex-none">
            <Link
              href={buildHref('/tim-kiem', {
                ...params,
                q: p.name,
                theo: 'dai-dien',
                page: undefined,
              })}
              prefetch={false}
              className="group inline-flex min-h-11 items-center no-underline"
            >
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-2.5 text-sm text-brand group-hover:border-brand">
                <span className="font-semibold">{p.name}</span>
                {p.count > 1 && (
                  <span className="text-muted tabular-nums">· {M.search.peopleCount(p.count)}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
