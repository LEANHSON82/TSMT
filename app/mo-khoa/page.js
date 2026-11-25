// Màn hình thay cho trang danh sách khi lớp chống crawl chặn lại (lib/list-gate.js). middleware.js rewrite về đây (URL
// người dùng thấy giữ nguyên) kèm ?p=<đường dẫn> và ?loai=:
//   ad    — trang DN mới: xem quảng cáo + Turnstile để mở (het=1: vé cũ đã xem hết số trang)
//   human — xem quá nhiều trang trong thời gian ngắn: xác minh Turnstile để xem tiếp
//   sau   — trang lớn hơn MAX_LIST_PAGE: chỉ đường sang bộ lọc
//   cham  — quá nhiều lượt: thử lại sau ?phut= phút (HTTP 429)
// Không có dữ liệu DN nào trong HTML; noindex.
import Link from 'next/link';
import GateBackdrop from '@/components/GateBackdrop';
import ListGate from '@/components/ListGate';
import PageHero, { PAGE_H1 } from '@/components/PageHero';
import { LinkList } from '@/components/States';
import { AD_PASS_PAGES, HUMAN_PASS_PAGES, MAX_LIST_PAGE, PASS_TTL_S } from '@/lib/list-gate';
import { M } from '@/lib/messages';
import { firstParam } from '@/lib/url';

const MINUTES = Math.round(PASS_TTL_S / 60);
const AD_PAGES = {
  '/doanh-nghiep-moi-thanh-lap': {
    title: M.list.newCompanies.title,
    lead: M.list.newCompanies.lead(''),
  },
};

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
  let lead;
  let body;
  // Khung mở danh sách nằm giữa một bảng mờ toàn dòng giả (trông như trang danh sách, không có dữ liệu thật).
  const overBackdrop = (card) => (
    <div className="relative">
      <GateBackdrop />
      <div className="absolute inset-x-0 top-6 flex justify-center px-3 sm:top-16">{card}</div>
    </div>
  );
  if (loai === 'human') {
    title = M.gate.humanTitle;
    body = overBackdrop(
      <ListGate mode="human" minutes={MINUTES} pages={HUMAN_PASS_PAGES} used={used} />,
    );
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
    title = AD_PAGES[path]?.title || M.gate.metaTitle;
    lead = AD_PAGES[path]?.lead;
    body = overBackdrop(<ListGate mode="ad" minutes={MINUTES} pages={AD_PASS_PAGES} used={used} />);
  }

  return (
    <main className="pb-12 md:pb-16">
      <PageHero breadcrumb={[{ name: title }]}>
        <h1 className={PAGE_H1}>{title}</h1>
        {lead && (
          <p className="mt-2 max-w-[760px] text-sm text-pretty text-ink-2 md:text-[15px]">{lead}</p>
        )}
      </PageHero>
      <div className="site-wrap">
        {/* Màn hình chữ («dùng bộ lọc», «tạm dừng») hẹp vừa đọc; khung mở danh sách rộng bằng bảng. */}
        <div className={`mt-5 md:mt-8 ${['sau', 'cham'].includes(loai) ? 'max-w-[852px]' : ''}`}>
          {body}
        </div>
      </div>
    </main>
  );
}
