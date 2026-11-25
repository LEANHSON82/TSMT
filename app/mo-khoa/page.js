// Màn hình thay cho trang danh sách khi lớp chống crawl chặn lại (lib/list-gate.js). middleware.js rewrite về đây (URL
// người dùng thấy giữ nguyên) kèm ?p=<đường dẫn> và ?loai=:
//   ad    — trang DN mới: xem quảng cáo + Turnstile để mở (het=1: vé cũ đã xem hết số trang)
//   human — xem quá nhiều trang trong thời gian ngắn: xác minh Turnstile để xem tiếp
//   sau   — trang lớn hơn MAX_LIST_PAGE: chỉ đường sang bộ lọc
//   cham  — quá nhiều lượt: thử lại sau ?phut= phút (HTTP 429)
// Không có dữ liệu DN nào trong HTML; noindex.
import Link from 'next/link';
import ListGate from '@/components/ListGate';
import PageHero, { PAGE_H1 } from '@/components/PageHero';
import { LinkList } from '@/components/States';
import { AD_PASS_PAGES, HUMAN_PASS_PAGES, MAX_LIST_PAGE, PASS_TTL_S } from '@/lib/list-gate';
import { M } from '@/lib/messages';
import { firstParam } from '@/lib/url';

const MINUTES = Math.round(PASS_TTL_S / 60);
const AD_TITLES = { '/doanh-nghiep-moi-thanh-lap': M.list.newCompanies.title };

export const metadata = {
  title: M.gate.metaTitle,
  robots: { index: false, follow: false },
};

export default async function ListGatePage({ searchParams }) {
  const sp = await searchParams;
  const loai = firstParam(sp.loai) || 'ad';
  const path = firstParam(sp.p) || '/';
  const used = firstParam(sp.het) === '1';

  let title;
  let body;
  if (loai === 'human') {
    title = M.gate.humanTitle;
    body = <ListGate mode="human" minutes={MINUTES} pages={HUMAN_PASS_PAGES} used={used} />;
  } else if (loai === 'sau') {
    title = M.gate.deepTitle(MAX_LIST_PAGE);
    body = (
      <div className="panel flex flex-col gap-4 p-5 md:p-7">
        <p className="max-w-[640px] text-body text-pretty text-ink-2">{M.gate.deepLead}</p>
        <LinkList
          label={M.gate.deepTitle(MAX_LIST_PAGE)}
          links={[
            { href: path.startsWith('/') ? path : '/', label: M.gate.deepFirst },
            { href: '/tim-kiem', label: M.gate.deepFilter },
          ]}
        />
      </div>
    );
  } else if (loai === 'cham') {
    title = M.gate.slowTitle;
    const minutes = Math.max(1, Number.parseInt(firstParam(sp.phut), 10) || 10);
    body = (
      <div className="panel flex flex-col items-start gap-4 p-5 md:p-7">
        <p className="max-w-[640px] text-body text-pretty text-ink-2">{M.gate.slowLead(minutes)}</p>
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
          {M.notFound.home}
        </Link>
      </div>
    );
  } else {
    title = AD_TITLES[path] || M.gate.metaTitle;
    body = <ListGate mode="ad" minutes={MINUTES} pages={AD_PASS_PAGES} used={used} />;
  }

  return (
    <main className="pb-12 md:pb-16">
      <PageHero breadcrumb={[{ name: title }]}>
        <h1 className={PAGE_H1}>{title}</h1>
      </PageHero>
      <div className="site-wrap">
        <div className="mt-5 max-w-[852px] md:mt-8">{body}</div>
      </div>
    </main>
  );
}
