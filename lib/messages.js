// Chữ hiển thị gom một chỗ để sửa câu chữ dễ (spec mục 9.1).
import { SITE_NAME } from './site';
import { NEW_WINDOW_DAYS } from './filters';

export { NEW_WINDOW_DAYS };

export const STATUS_LABELS = {
  active: 'Đang hoạt động',
  suspended: 'Ngừng hoạt động',
  closed: 'Đã đóng MST',
};

export const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'suspended', label: 'Ngừng' },
  { value: 'closed', label: 'Đóng MST' },
];

export const M = {
  common: {
    close: 'Đóng',
    loading: 'Đang tải…',
    optional: '(không bắt buộc)',
    pageSuffix: (page) => (page > 1 ? ` - Trang ${page}` : ''),
    inProvince: (province) => (province ? ` tại ${province}` : ''),
  },
  site: {
    defaultTitle: `${SITE_NAME} - Tra cứu mã số thuế, thông tin doanh nghiệp`,
    defaultDescription:
      'Tra cứu miễn phí mã số thuế, địa chỉ, người đại diện, ngành nghề kinh doanh của doanh nghiệp Việt Nam.',
    skipToContent: 'Bỏ qua tới nội dung chính',
    errorTitle: 'Đã có lỗi xảy ra',
  },
  home: {
    companiesSr: ' doanh nghiệp',
    title: 'Tra cứu thông tin doanh nghiệp',
    lead: 'Mã số thuế, địa chỉ, người đại diện, ngành nghề của doanh nghiệp Việt Nam — miễn phí.',
    newTitle: 'Doanh nghiệp mới thành lập',
    // Khối DN mới trang chủ: số DN trong 30 ngày, lối tắt theo tỉnh, nhóm theo ngày hoạt động.
    newCount: `doanh nghiệp mới trong ${NEW_WINDOW_DAYS} ngày qua`,
    newByProvince: 'Xem theo tỉnh:',
    showLess: 'Thu gọn',
    statCompanies: 'doanh nghiệp',
    moreProvinces: (n) => `Xem tất cả ${n} tỉnh/thành`,
    moreIndustries: 'Xem thêm ngành nghề',
    moreNew: (n) => `Xem thêm ${n} doanh nghiệp`,
    viewAll: 'Xem tất cả',
    viewAllShort: 'Tất cả',
    provincesTitle: 'Theo tỉnh/thành',
    industriesTitle: 'Theo ngành nghề',
    emptyNew: 'Chưa tải được danh sách doanh nghiệp mới.',
    emptyProvinces: 'Chưa tải được danh mục tỉnh/thành.',
    retry: 'Tải lại trang',
    retryTitle: 'Chưa tải được trang',
    retryBody: 'Máy chủ dữ liệu đang bận. Bạn thử tải lại trang sau ít phút.',
  },
  nav: {
    menu: 'Menu',
    provinces: 'Tỉnh/thành',
    industries: 'Ngành nghề',
    newCompanies: 'Doanh nghiệp mới thành lập',
    newCompaniesMid: 'Doanh nghiệp mới', // menu máy tính 1024–1279px
    newCompaniesShort: 'DN mới', // chỗ chật: menu 768–1023px, lối tắt đầu trang chủ trên điện thoại
    updateRequest: 'Yêu cầu ẩn/sửa thông tin',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    backToMenu: 'Menu',
    home: 'Trang chủ',
    breadcrumb: 'Đường dẫn',
    mainMenu: 'Menu chính',
    backToMain: 'Quay lại menu chính',
    provincesHeading: 'Tỉnh/thành',
    industriesHeading: 'Ngành nghề phổ biến',
  },
  footer: {
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    terms: 'Điều khoản',
    privacy: 'Chính sách bảo mật',
    dataSource: 'Dữ liệu tổng hợp từ nguồn công khai.',
    cookieSettings: 'Tuỳ chỉnh cookie',
    navLabel: 'Liên kết cuối trang',
    tagline:
      'Tra cứu miễn phí mã số thuế, địa chỉ, người đại diện và ngành nghề của doanh nghiệp Việt Nam.',
    linksTitle: 'Thông tin',
    dataTitle: 'Dữ liệu',
  },
  search: {
    formerProvince: 'Tên tỉnh cũ, nay thuộc tỉnh này',
    label: 'Tìm doanh nghiệp',
    placeholder: 'Nhập mã số thuế, tên doanh nghiệp hoặc người đại diện',
    placeholderShort: 'Nhập MST hoặc tên doanh nghiệp',
    placeholderNarrow: 'MST, tên DN, người đại diện',
    // Hàng ô tìm header điện thoại còn chỗ hẹp hơn (thêm nút icon «Lọc nâng cao» sau nút Tìm).
    placeholderXs: 'MST, tên DN, đại diện',
    placeholderHeader: 'MST, tên DN',
    placeholderNavWide: 'Nhập MST, tên doanh nghiệp hoặc người đại diện',
    submit: 'Tìm',
    // 0 kết quả: câu tự nhiên thay cho «Tìm thấy 0 kết quả…» (n là số đã định dạng, chuỗi '0').
    resultsFor: (n, q) =>
      String(n) === '0'
        ? `Không tìm thấy doanh nghiệp nào cho “${q}”`
        : `Tìm thấy ${n} kết quả cho “${q}”`,
    // Tiêu đề khối gợi ý dưới H1 khi rỗng (H1 đã nói «không tìm thấy» → không lặp lại).
    emptyTitle: 'Thử tìm cách khác',
    emptyHints: [
      'Kiểm tra lại chính tả, thử bỏ bớt từ.',
      'Thử nhập mã số thuế (10 số, chi nhánh thêm -001…).',
      'Thử tìm theo tên người đại diện.',
    ],
    noQuery:
      'Toàn bộ doanh nghiệp, mới thành lập xếp trước. Gõ từ khoá vào ô tìm phía trên hoặc lọc theo tỉnh/thành, ngành nghề, thời gian thành lập.',
    filterTitle: 'Lọc doanh nghiệp',
    filterResults: (n) =>
      String(n) === '0' ? 'Không có doanh nghiệp nào khớp bộ lọc' : `Tìm thấy ${n} doanh nghiệp`,
    emptyFilterHints: [
      'Thử bỏ bớt bộ lọc hoặc chọn thêm tỉnh/thành, ngành nghề.',
      'Chọn khoảng thời gian thành lập dài hơn.',
    ],
    foundedFilter: 'Thành lập trong',
    foundedAll: 'Mọi thời gian',
    founded: {
      '7-ngay': '7 ngày qua',
      '30-ngay': '30 ngày qua',
      '3-thang': '3 tháng qua',
      '6-thang': '6 tháng qua',
      '1-nam': '1 năm qua',
      '3-nam': '3 năm qua',
    },
    foundedChip: (label) => `Thành lập trong ${label}`,
    searchProvince: 'Tìm tỉnh/thành',
    searchIndustry: 'Tìm mã hoặc tên ngành',
    // Thanh «Tìm trong …» ở trang tỉnh / ngành
    scopedLabel: (where) => `Tìm doanh nghiệp ${where}`,
    multiClear: 'Bỏ chọn',
    multiApply: 'Áp dụng',
    multiSummary: (first, n) => (n > 1 ? `${first} +${n - 1}` : first),
    multiCount: (n) => `Đã chọn ${n}`,
    multiNoMatch: 'Không có mục phù hợp',
    pageTitle: 'Tìm kiếm doanh nghiệp',
    resultsTitle: (q) => `Kết quả tìm kiếm “${q}”`,
    suggestions: 'Gợi ý doanh nghiệp',
    noSuggestions: (q) => `Không có gợi ý cho “${q}”. Bấm Enter để tìm kiếm.`,
    // Nhóm gợi ý + nhãn «khớp ở đâu»
    groupCompanies: 'Doanh nghiệp',
    groupRepresentatives: 'Người đại diện',
    groupProvinces: 'Tỉnh/thành',
    groupIndustries: 'Ngành nghề',
    industryCode: (code) => `Mã ngành ${code}`,
    suggestionsCount: (n) => `${n} gợi ý. Dùng phím mũi tên lên xuống để chọn.`,
    navSearchLabel: 'Tìm nhanh doanh nghiệp',
    repOf: 'Đại diện',
    personCompanies: (n) => `Đại diện của ${n} doanh nghiệp`,
    peopleTitle: (q) => `Người đại diện khớp “${q}”`,
    peopleCount: (n) => `${n} DN`,
    peopleExact: (n) => `là người đại diện của ${n} doanh nghiệp dưới đây.`,
    matchedMst: 'Khớp MST',
    matchedPhone: 'Khớp số điện thoại',
    provinceCount: (n) => `${n} doanh nghiệp`,
    seeAll: (q) => `Xem tất cả kết quả cho “${q}”`,
    // Trang kết quả
    mstPrefix: 'MST',
    fieldTabs: 'Tìm theo',
    fieldAll: 'Tất cả',
    fieldName: 'Tên DN',
    fieldNameShort: 'Tên',
    fieldRepresentativeShort: 'Đại diện',
    fieldRepresentative: 'Người đại diện',
    fieldNumber: 'MST/SĐT',
    industryFilter: 'Ngành nghề',
    allIndustries: 'Mọi ngành nghề',
    sortLabel: 'Sắp xếp',
    sortRelevance: 'Phù hợp nhất',
    sortNewest: 'Mới thành lập',
    sortOldest: 'Thành lập lâu nhất',
    matchedPhoneBadge: 'Khớp SĐT',
    provinceIntent: (name) => `Bạn muốn tìm doanh nghiệp tại ${name}?`,
    provinceIntentAction: (name, n) =>
      n == null ? `Lọc tại ${name}` : `Lọc tại ${name} (${n} kết quả)`,
    // Trang 0 kết quả: lối đi tiếp bấm được.
    emptyActionsLabel: 'Thử tìm cách khác',
    tryQuery: (q) => `Tìm “${q}”`,
    tryRepresentative: (q) => `Tìm “${q}” trong tên người đại diện`,
    tryNew: 'Xem doanh nghiệp mới thành lập',
    mstTooShort: (n) => `Mã số thuế cần đủ 10 số (bạn mới nhập ${n} số); chi nhánh thêm 3 số.`,
    emptyInField: 'Không có kết quả trong mục này. Thử xem tab «Tất cả».',
  },
  list: {
    depthNote: (n) =>
      `Chỉ xem được ${n} trang đầu. Dùng bộ lọc hoặc ô tìm kiếm để thu hẹp danh sách.`,
    total: (n) => `${n} doanh nghiệp`,
    // Hàng đầu danh sách hệ A: «29 doanh nghiệp · Hiển thị 1–20» (số in đậm, tách riêng chữ đơn vị).
    countUnit: 'doanh nghiệp',
    showing: (from, to) => `Hiển thị ${from}–${to}`,
    colName: 'Tên doanh nghiệp / Địa chỉ',
    emptyTitle: 'Chưa có doanh nghiệp nào',
    emptyHint: 'Thử bỏ bộ lọc hoặc chọn tỉnh/thành khác.',
    // Trang không có bộ lọc (tỉnh) hoặc chưa lọc gì mà rỗng: chỉ đường sang bảng tỉnh/thành ở trang chủ.
    otherProvinces: 'Xem doanh nghiệp ở tỉnh/thành khác →',
    errorTitle: 'Không tải được dữ liệu',
    errorHint: 'Kiểm tra kết nối mạng rồi thử lại.',
    retry: 'Thử lại',
    filter: 'Lọc',
    allProvinces: 'Tất cả tỉnh/thành',
    allStatuses: 'Mọi tình trạng',
    applyFilter: 'Áp dụng',
    clearFilter: 'Bỏ lọc',
    noFilter: 'Chưa lọc',
    removeFilter: (label) => `Bỏ lọc ${label}`,
    advancedFilter: 'Bộ lọc',
    advancedFilterHint: 'Chọn nhiều tỉnh/thành, nhiều ngành nghề, thời gian thành lập, tình trạng',
    advancedFilterOpen: 'Mở bộ lọc',
    advancedFilterCta: 'Lọc nâng cao: nhiều tỉnh/thành, ngành nghề, thời gian thành lập',
    activeFilters: 'Đang lọc',
    activeFrom: 'Hoạt động từ',
    listTitle: 'Danh sách doanh nghiệp',
    colCompany: 'Doanh nghiệp',
    colCompany: 'Doanh nghiệp',
    activeSince: (date) => `Hoạt động từ ${date}`,
    activeLabel: 'Hoạt động từ',
    activeLabelShort: 'Hoạt động',
    since: (date) => `từ ${date}`,
    newBadge: 'Mới',
    provinceFilter: 'Tỉnh/thành',
    statusFilter: 'Tình trạng',
    province: {
      title: (name) => `Doanh nghiệp tại ${name}`,
      metaDescription: (name, suffix) =>
        `Danh sách doanh nghiệp tại ${name}: mã số thuế, địa chỉ, người đại diện, ngày hoạt động. Cập nhật doanh nghiệp mới thành lập${suffix.toLowerCase()}.`,
      // Không lặp số DN (đã có dòng tổng số ngay dưới) và không lặp lại tiêu đề.
      // Không nhắc lại tên tỉnh (đã có ở breadcrumb và H1).
      lead: () =>
        'Mã số thuế, địa chỉ, người đại diện của doanh nghiệp, mới hoạt động gần đây xếp trước.',
    },
    industry: {
      crumb: (code) => `Ngành ${code}`,
      // <title> (SEO, spec 7.1 «mẫu cố định có tên ngành»): giữ mã ngành. H1 / breadcrumb: chỉ tên ngành.
      title: (code, name) => `Ngành ${code} – ${name}`,
      metaDescription: (code, name, where, suffix = '') =>
        `Danh sách doanh nghiệp ngành ${code} – ${name}${where}${suffix.toLowerCase()}: mã số thuế, địa chỉ, người đại diện, ngày hoạt động.`,
      lead: (where) =>
        `Mã số thuế, địa chỉ, người đại diện của doanh nghiệp đăng ký ngành này${where}, mới hoạt động gần đây xếp trước.`,
    },
    newCompanies: {
      title: 'Doanh nghiệp mới thành lập',
      metaDescription: (where, suffix = '') =>
        `Danh sách doanh nghiệp mới thành lập${where}${suffix.toLowerCase()}, cập nhật hằng ngày: mã số thuế, địa chỉ, người đại diện, ngày hoạt động.`,
      lead: (where) =>
        `Doanh nghiệp có ngày bắt đầu hoạt động trong ${NEW_WINDOW_DAYS} ngày gần nhất${where}, mới nhất xếp trước. Mã số thuế, địa chỉ, người đại diện, cập nhật hằng ngày.`,
      empty: `Chưa có doanh nghiệp nào bắt đầu hoạt động trong ${NEW_WINDOW_DAYS} ngày qua.`,
    },
  },
  pagination: {
    label: 'Phân trang',
    prev: 'Trang trước',
    next: 'Trang sau',
    page: (n) => `Trang ${n}`,
    prevShort: 'Trước',
    nextShort: 'Sau',
    of: (p, total) => `Trang ${p} / ${total}`,
  },
  ad: { label: 'Quảng cáo' },
  company: {
    info: 'Thông tin doanh nghiệp',
    nameEn: 'Tên quốc tế',
    nameShort: 'Tên viết tắt',
    mst: 'Mã số thuế',
    copyMst: 'Sao chép mã số thuế',
    copied: 'Đã sao chép',
    address: 'Địa chỉ',
    viewMap: 'Xem bản đồ',
    representative: 'Người đại diện',
    phone: 'Điện thoại',
    email: 'Email',
    copyEmail: 'Sao chép email',
    repCompanies: (n) => `Đại diện của ${n} doanh nghiệp`,
    groupContact: 'Định danh và liên hệ',
    foundedShort: 'Hoạt động từ',
    updatedShort: 'Cập nhật',
    groupRegistration: 'Thông tin đăng ký',
    foundedDate: 'Ngày hoạt động',
    taxOffice: 'Quản lý bởi',
    businessType: 'Loại hình DN',
    status: 'Tình trạng',
    capital: 'Vốn điều lệ',
    industries: 'Ngành nghề kinh doanh',
    industryCode: 'Mã ngành',
    industryName: 'Tên ngành',
    mainIndustry: 'Ngành chính',
    showMoreIndustries: (n) => `Xem thêm ${n} ngành`,
    industryCount: (n) => `${n} ngành`,
    relatedCount: (n) => `${n} doanh nghiệp`,
    showLessIndustries: 'Thu gọn',
    updatedAt: 'Cập nhật lần cuối',
    requestUpdate: 'Yêu cầu ẩn/sửa thông tin',
    related: (province) => `Doanh nghiệp cùng ngành tại ${province}`,
    branch: 'Chi nhánh',
    parent: 'Đơn vị chủ quản',
    repShort: 'Đại diện',
    addressShort: 'Địa chỉ',
    // Mẫu spec 7.1: «{Tên DN}, mã số thuế {mst}, địa chỉ {địa chỉ}, người đại diện {tên}, hoạt động từ {ngày}.»
    // Trang gọi với địa chỉ đầy đủ; quá ~155 ký tự thì gọi lại với địa chỉ rút gọn (phường, tỉnh).
    metaDescription: (c, founded, address) =>
      [
        `${c.name}, mã số thuế ${c.mst}`,
        address && `địa chỉ ${address}`,
        c.representative && `người đại diện ${c.representative}`,
        founded && `hoạt động từ ${founded}`,
      ]
        .filter(Boolean)
        .join(', ') + '.',
  },
  phone: {
    reveal: 'Xem số điện thoại',
    revealNote: 'Xem một video ngắn để hiện số',
    noPhone: 'Chưa có thông tin',
    hidden: 'Doanh nghiệp đã yêu cầu ẩn',
    loading: 'Đang tải…',
    confirmTitle: 'Xem video ngắn để hiện số điện thoại?',
    confirmBody:
      'Số điện thoại sẽ hiện ngay sau khi video kết thúc. Video do mạng quảng cáo cung cấp.',
    confirmOk: 'Xem',
    confirmCancel: 'Huỷ',
    call: 'Gọi',
    copy: 'Sao chép',
    zalo: 'Zalo',
    closedEarly: 'Bạn cần xem hết video để hiện số điện thoại.',
    watchAgain: 'Xem lại',
    adBlocked: `Vui lòng tắt chặn quảng cáo cho ${SITE_NAME} để xem số điện thoại. Quảng cáo giúp chúng tôi duy trì dịch vụ miễn phí.`,
    adBlockedSteps: [
      'Bấm biểu tượng trình chặn quảng cáo trên thanh công cụ của trình duyệt.',
      `Chọn tạm dừng hoặc tắt chặn trên ${SITE_NAME}.`,
      'Bấm «Tải lại trang» rồi xem số lại.',
    ],
    reload: 'Tải lại trang',
    adBlockedHow: 'Cách tắt chặn quảng cáo',
    rateLimited: (minutes) =>
      `Bạn đã xem nhiều số trong thời gian ngắn. Thử lại sau ${minutes} phút.`,
    networkError: 'Không tải được số, bấm để thử lại.',
    revealedSr: (p) => `Số điện thoại: ${p}`,
    retry: 'Thử lại',
    fallbackTitle: 'Quảng cáo ngắn trước khi hiện số',
    fallbackSeconds: (s) => `Số điện thoại sẽ hiện sau ${s} giây`,
    fallbackDone: 'Đang lấy số điện thoại…',
    mockVideo: 'VIDEO QUẢNG CÁO (giả lập)',
    mockVideoNote: 'Số điện thoại sẽ hiện khi video kết thúc.',
    closeAd: 'Đóng quảng cáo',
    copiedShort: 'Đã sao chép',
    maskedLabel: (masked) => `Số điện thoại đang ẩn: ${masked}`,
    videoProgress: 'Tiến độ video',
  },
  // Cổng quảng cáo trước danh sách bị chặn (lib/list-gate.js, components/ListGate.jsx).
  gate: {
    metaTitle: 'Mở danh sách doanh nghiệp',
    cardTitle: 'Xem quảng cáo ngắn để mở danh sách',
    lead: 'Quảng cáo giúp chúng tôi duy trì dịch vụ miễn phí và hạn chế máy tự động thu thập dữ liệu.',
    button: 'Xem quảng cáo',
    confirmTitle: 'Xem video ngắn để mở danh sách?',
    confirmBody: (minutes) =>
      `Danh sách sẽ hiện ngay sau khi video kết thúc và mở trong ${minutes} phút. Video do mạng quảng cáo cung cấp.`,
    confirmOk: 'Xem',
    confirmCancel: 'Để sau',
    note: (minutes, pages) => `Mở trong ${minutes} phút, xem tối đa ${pages} trang.`,
    used: (pages) =>
      `Bạn đã xem hết ${pages} trang của lượt trước. Xem thêm một quảng cáo để xem tiếp.`,
    loading: 'Đang mở quảng cáo…',
    verifying: 'Đang mở danh sách…',
    tick: 'Bấm vào ô «Xác minh bạn là con người» ở góc dưới bên phải màn hình để mở danh sách.',
    tickFirst:
      'Bấm vào ô «Xác minh bạn là con người» ở góc dưới bên phải màn hình, quảng cáo sẽ chạy ngay sau đó.',
    closedEarly: 'Bạn cần xem hết quảng cáo để mở danh sách.',
    watchAgain: 'Xem lại',
    adBlocked: `Vui lòng tắt chặn quảng cáo cho ${SITE_NAME} để mở danh sách. Thông tin từng doanh nghiệp vẫn tra cứu bình thường bằng ô tìm kiếm.`,
    adBlockedSteps: [
      'Bấm biểu tượng trình chặn quảng cáo trên thanh công cụ của trình duyệt.',
      `Chọn tạm dừng hoặc tắt chặn trên ${SITE_NAME}.`,
      'Bấm «Tải lại trang» rồi mở danh sách lại.',
    ],
    rateLimited: (minutes) =>
      `Bạn đã mở danh sách nhiều lần trong thời gian ngắn. Thử lại sau ${minutes} phút.`,
    error: 'Chưa mở được danh sách. Bấm «Thử lại» (không phải xem lại quảng cáo).',
    retry: 'Thử lại',
    // Xem quá nhiều trang danh sách trong thời gian ngắn → xác minh bằng Turnstile (không có quảng cáo).
    humanTitle: 'Xác minh để xem tiếp',
    humanLead:
      'Bạn đang xem nhiều trang trong thời gian ngắn. Xác minh một lần để chúng tôi biết bạn không phải máy tự động thu thập dữ liệu.',
    humanUsed: (pages) =>
      `Bạn đã xem hết ${pages} trang của lần xác minh trước. Xác minh thêm một lần để xem tiếp.`,
    humanButton: 'Xác minh để xem tiếp',
    humanVerifying: 'Đang xác minh…',
    humanNote: (minutes, pages) =>
      `Sau khi xác minh: xem tiếp ${pages} trang trong ${minutes} phút.`,
    humanError: 'Chưa xác minh được. Bấm «Thử lại».',
    // Trang quá sâu (lớn hơn MAX_LIST_PAGE).
    deepTitle: (n) => `Chỉ xem được ${n} trang đầu`,
    deepLead:
      'Danh sách dài chỉ lật được tới đây. Dùng bộ lọc (tỉnh/thành, ngành nghề, thời gian thành lập) hoặc ô tìm kiếm để thu hẹp và xem tiếp.',
    deepFirst: 'Về trang đầu danh sách',
    deepFilter: 'Mở bộ lọc nâng cao',
    // Quá THROTTLE_HARD lượt.
    slowTitle: 'Tạm dừng xem danh sách',
    slowLead: (minutes) =>
      `Bạn đã xem quá nhiều trang trong thời gian ngắn. Thử lại sau khoảng ${minutes} phút. Tra cứu từng doanh nghiệp bằng ô tìm kiếm vẫn dùng bình thường.`,
  },
  notFound: {
    title: 'Không tìm thấy trang',
    body: 'Doanh nghiệp, tỉnh/thành hoặc ngành nghề bạn tìm không tồn tại. Thử tìm lại bằng mã số thuế hoặc tên doanh nghiệp.',
    home: 'Về trang chủ',
    code: 'Lỗi 404',
    mstTitle: (mst) => `Không tìm thấy mã số thuế ${mst}`,
    mstBody:
      'Chưa có doanh nghiệp nào với mã số thuế này trong dữ liệu. Kiểm tra lại từng chữ số, hoặc tìm bằng tên doanh nghiệp.',
    linksLabel: 'Liên kết gợi ý',
    nearTitle: (prefix) => `Mã số thuế bắt đầu bằng ${prefix}…`,
  },
  staticPage: {
    meta: {
      about: {
        title: 'Giới thiệu',
        description: `${SITE_NAME} tra cứu miễn phí mã số thuế, địa chỉ, người đại diện, ngành nghề của doanh nghiệp Việt Nam từ nguồn dữ liệu công khai.`,
      },
      contact: {
        title: 'Liên hệ',
        description: `Liên hệ ${SITE_NAME} để góp ý, báo thông tin sai hoặc yêu cầu ẩn thông tin doanh nghiệp.`,
      },
      terms: {
        title: 'Điều khoản sử dụng',
        description: `Điều khoản sử dụng ${SITE_NAME}: nguồn dữ liệu công khai, phạm vi sử dụng thông tin, quảng cáo và trách nhiệm các bên.`,
      },
      privacy: {
        title: 'Chính sách bảo mật',
        description: `Chính sách bảo mật ${SITE_NAME}: dữ liệu thu thập, mục đích, cookie quảng cáo và cách yêu cầu ẩn hoặc xoá thông tin.`,
      },
    },
    toc: 'Mục lục',
    tocCount: (n) => `${n} mục`,
    updated: (d) => `Cập nhật: ${d}`,
    draftNote: 'Bản nháp — nội dung chính thức do owner gửi và luật sư duyệt.',
    contactViaForm:
      'Góp ý, báo thông tin sai hoặc yêu cầu ẩn thông tin: gửi qua form yêu cầu ẩn/sửa thông tin, chúng tôi phản hồi qua email bạn để lại.',
    contactEmail: 'Email',
    adsEmail: 'Hợp tác quảng cáo',
    replyByEmail: 'Chúng tôi phản hồi qua email bạn để lại trong form.',
  },
  updateRequest: {
    title: 'Yêu cầu ẩn/sửa thông tin',
    metaTitle: 'Yêu cầu ẩn/sửa thông tin doanh nghiệp',
    metaDescription:
      'Chủ doanh nghiệp gửi yêu cầu ẩn số điện thoại, email hoặc sửa thông tin sai trên trang tra cứu.',
    intro:
      'Dành cho chủ doanh nghiệp hoặc người được uỷ quyền. Chúng tôi xử lý yêu cầu ẩn số điện thoại, email hoặc sửa thông tin sai trong thời gian sớm nhất và phản hồi qua email.',
    types: [
      { value: 'hide_phone', label: 'Ẩn số điện thoại' },
      { value: 'hide_email', label: 'Ẩn email' },
      { value: 'fix_info', label: 'Sửa thông tin sai' },
      { value: 'other', label: 'Khác' },
    ],
    fields: {
      mst: 'Mã số thuế',
      mstHint: '10 số, chi nhánh thêm -3 số',
      requestType: 'Loại yêu cầu',
      requestTypePlaceholder: 'Chọn loại yêu cầu',
      fullName: 'Họ tên người gửi',
      position: 'Chức vụ',
      email: 'Email liên hệ',
      emailHint: 'Chúng tôi phản hồi kết quả qua email này',
      content: 'Nội dung',
      file: 'Đính kèm giấy tờ',
      fileDrop: 'Kéo thả file vào đây hoặc',
      fileChoose: 'Chọn file',
      fileChooseOther: 'Chọn file khác',
      fileRemove: 'Bỏ file',
      fileHint:
        'PDF hoặc ảnh (JPG, PNG, WEBP), tối đa 5 MB — ví dụ giấy phép kinh doanh, giấy giới thiệu.',
    },
    errors: {
      mstRequired: 'Vui lòng nhập mã số thuế.',
      mstInvalid: 'Mã số thuế gồm 10 số, chi nhánh thêm -3 số (vd. 0101234567-001).',
      typeRequired: 'Vui lòng chọn loại yêu cầu.',
      nameRequired: 'Vui lòng nhập họ tên người gửi.',
      emailRequired: 'Vui lòng nhập email liên hệ.',
      emailInvalid: 'Email không hợp lệ.',
      contentRequired: 'Vui lòng mô tả nội dung yêu cầu.',
      contentTooLong: (max) => `Nội dung tối đa ${max} ký tự.`,
      fileType: 'Chỉ nhận file PDF hoặc ảnh (JPG, PNG, WEBP).',
      fileSize: 'File quá 5 MB, vui lòng chọn file nhỏ hơn.',
      invalid: 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại các ô.',
      network: 'Không gửi được yêu cầu. Vui lòng kiểm tra kết nối mạng rồi thử lại.',
    },
    turnstileNote: 'Form được bảo vệ chống spam bởi Cloudflare Turnstile.',
    privacyNote: 'Thông tin bạn gửi chỉ dùng để xử lý yêu cầu này, theo',
    submit: 'Gửi yêu cầu',
    submitting: 'Đang gửi…',
    doneTitle: 'Đã gửi yêu cầu',
    doneBody: 'Cảm ơn bạn. Chúng tôi sẽ xem xét và phản hồi qua email',
    doneKeepCode: 'Vui lòng giữ lại mã yêu cầu để dùng khi liên hệ.',
    copyCode: 'Sao chép mã yêu cầu',
    backToCompany: 'Quay lại trang doanh nghiệp',
    requestCode: 'Mã yêu cầu',
  },
  cookie: {
    region: 'Thông báo cookie',
    banner:
      'Chúng tôi dùng cookie để hiển thị quảng cáo (giúp duy trì dịch vụ miễn phí) và thống kê lượt truy cập. Xem',
    customize: 'Tuỳ chỉnh',
    accept: 'Đồng ý',
    prefsTitle: 'Tuỳ chỉnh cookie',
    save: 'Lưu lựa chọn',
    acceptAll: 'Đồng ý tất cả',
    necessary: 'Cần thiết',
    necessaryDesc: 'Giúp trang hoạt động (ghi nhớ lựa chọn này). Luôn bật.',
    analytics: 'Thống kê',
    analyticsDesc: 'Đếm lượt truy cập ẩn danh (Google Analytics) để cải thiện trang.',
    ads: 'Quảng cáo',
    adsDesc:
      'Hiển thị quảng cáo và video có thưởng để mở số điện thoại. Tắt thì vẫn có quảng cáo nhưng không cá nhân hoá.',
  },
};
