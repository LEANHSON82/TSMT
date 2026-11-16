// DANH SÁCH TẠM cho menu «Ngành nghề» — chờ owner chốt có làm trang /nganh đầy đủ
// (cần thêm API GET /v1/industries) hay chỉ giữ dropdown ngành phổ biến.
import { toSlug } from './slug';

export const POPULAR_INDUSTRIES = [
  ['4101', 'Xây dựng nhà để ở'],
  ['4321', 'Lắp đặt hệ thống điện'],
  ['4330', 'Hoàn thiện công trình xây dựng'],
  ['4610', 'Đại lý, môi giới, đấu giá hàng hóa'],
  ['4632', 'Bán buôn thực phẩm'],
  ['4659', 'Bán buôn máy móc, thiết bị và phụ tùng máy khác'],
  ['4663', 'Bán buôn vật liệu, thiết bị lắp đặt khác trong xây dựng'],
  ['4690', 'Bán buôn tổng hợp'],
  ['4791', 'Bán lẻ theo yêu cầu đặt hàng qua bưu điện hoặc internet'],
  ['4933', 'Vận tải hàng hóa bằng đường bộ'],
  ['5610', 'Nhà hàng và các dịch vụ ăn uống phục vụ lưu động'],
  ['6201', 'Lập trình máy vi tính'],
  ['6810', 'Kinh doanh bất động sản, quyền sử dụng đất thuộc chủ sở hữu, chủ sử dụng hoặc đi thuê'],
  ['7020', 'Hoạt động tư vấn quản lý'],
  ['7310', 'Quảng cáo'],
].map(([code, name]) => ({ code, name, href: `/nganh/${code}-${toSlug(name)}` }));
