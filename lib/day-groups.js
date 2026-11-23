// Nhóm danh sách DN (đã xếp ngày hoạt động mới nhất trước) theo ngày hoạt động — khối DN mới trang chủ, trang DN mới.
// Ngày hiện ở tiêu đề nhóm («Hôm nay · 23/11/2026», «Hôm qua · …», hoặc ngày) nên thẻ không lặp lại «Hoạt động từ».
import { daysAgoVN, todayVN } from './filters';
import { formatDate } from './format';
import { M } from './messages';

export function dayHeading(date, now = new Date()) {
  const label =
    date === todayVN(now) ? M.home.today : date === daysAgoVN(1, now) ? M.home.yesterday : '';
  return M.home.dayGroup(label, formatDate(date));
}

/** [{ date, heading, items }] theo đúng thứ tự xuất hiện. */
export function groupByDay(items, now = new Date()) {
  const groups = [];
  for (const c of items) {
    const date = (c.founded_date || '').slice(0, 10);
    let g = groups[groups.length - 1];
    if (!g || g.date !== date) {
      g = { date, heading: dayHeading(date, now), items: [] };
      groups.push(g);
    }
    g.items.push(c);
  }
  return groups;
}
