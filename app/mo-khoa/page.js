// Màn hình cổng của danh sách bị chặn (lib/list-gate.js). middleware.js rewrite các URL bị chặn về đây khi chưa có
// vé (URL người dùng thấy giữ nguyên), kèm ?p=<đường dẫn bị chặn> và ?het=1 khi vé đã xem hết số trang. Không có dữ
// liệu DN nào trong HTML; noindex.
import ListGate from '@/components/ListGate';
import PageHero, { PAGE_H1 } from '@/components/PageHero';
import { PASS_PAGE_BUDGET, PASS_TTL_S } from '@/lib/list-gate';
import { M } from '@/lib/messages';
import { firstParam } from '@/lib/url';

const TITLES = { '/doanh-nghiep-moi-thanh-lap': M.list.newCompanies.title };

export const metadata = {
  title: M.gate.metaTitle,
  robots: { index: false, follow: false },
};

export default async function ListGatePage({ searchParams }) {
  const sp = await searchParams;
  const title = TITLES[firstParam(sp.p)] || M.gate.metaTitle;
  return (
    <main className="pb-12 md:pb-16">
      <PageHero breadcrumb={[{ name: title }]}>
        <h1 className={PAGE_H1}>{title}</h1>
      </PageHero>
      <div className="site-wrap">
        <div className="mt-5 max-w-[852px] md:mt-8">
          <ListGate
            minutes={Math.round(PASS_TTL_S / 60)}
            pages={PASS_PAGE_BUDGET}
            used={firstParam(sp.het) === '1'}
          />
        </div>
      </div>
    </main>
  );
}
