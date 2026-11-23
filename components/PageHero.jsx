import Breadcrumb from './Breadcrumb';

// Dải đầu trang dùng chung cho mọi trang trong (danh sách, chi tiết DN, form, trang tĩnh, 404): nền xanh xám nhạt
// rộng hết màn hình (.list-hero, cùng tông hero trang chủ), breadcrumb (hoặc dòng nhỏ thay breadcrumb, vd «Lỗi 404»)
// rồi nội dung đầu trang (H1, mô tả, thanh tìm…). Một kiểu duy nhất để các trang trông đồng bộ.
export default function PageHero({ breadcrumb, eyebrow, children, className = '' }) {
  return (
    <div className="list-hero">
      <div className={`site-wrap pt-3 pb-6 md:pt-4 md:pb-8 ${className}`}>
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {!breadcrumb && eyebrow && <p className="text-sm font-semibold text-muted">{eyebrow}</p>}
        <div className={breadcrumb || eyebrow ? 'mt-3 md:mt-4' : ''}>{children}</div>
      </div>
    </div>
  );
}

/** H1 cùng cỡ ở mọi trang trong. */
export const PAGE_H1 =
  'text-[24px] leading-[30px] font-semibold text-pretty break-words text-title md:text-[32px] md:leading-10';
