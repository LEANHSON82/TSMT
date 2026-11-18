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

export default function PeopleMatches({ people, q, tab, params }) {
  if (!people?.length || !q || (tab && tab !== 'dai-dien')) return null;
  // Gõ đúng họ tên và đang xem tab «Người đại diện»: một câu tóm tắt (tab «Tất cả» vẫn hiện thẻ bên dưới).
  if (tab === 'dai-dien' && people.length === 1 && key(people[0].name) === key(q)) {
    return (
      <p className="flex flex-col gap-0.5 rounded-xl border border-brand/20 bg-brand-50 px-4 py-3 text-body text-ink-2">
        <span>
          <strong className="font-semibold text-navy">{people[0].name}</strong>{' '}
          {M.search.peopleExact(people[0].count)}
        </span>
        <span className="text-meta text-muted">{M.search.peopleNote}</span>
      </p>
    );
  }
  return (
    <section
      aria-labelledby="people-title"
      className="flex flex-col gap-1 rounded-xl border border-line bg-white px-4 py-3"
    >
      <h2 id="people-title" className="text-sm font-semibold text-navy">
        {M.search.peopleTitle(q)}
      </h2>
      <ul className="flex flex-wrap gap-x-2">
        {people.slice(0, 10).map((p) => (
          <li key={p.name}>
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
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm text-ink group-hover:border-brand group-hover:text-brand">
                <span className="font-semibold">{p.name}</span>
                <span className="text-muted tabular-nums">· {M.search.peopleCount(p.count)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-meta text-muted">{M.search.peopleNote}</p>
    </section>
  );
}
