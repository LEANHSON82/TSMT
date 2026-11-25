import localFont from 'next/font/local';
import './globals.css';
import HeaderBar from '@/components/HeaderBar';
import SiteFooter from '@/components/SiteFooter';
import CookieConsent from '@/components/CookieConsent';
import Analytics from '@/components/Analytics';
import NavigationProgress from '@/components/NavigationProgress';
import { Suspense } from 'react';
import { getProvinces } from '@/lib/api';
import { ProvincesProvider } from '@/components/ProvincesContext';
import { POPULAR_INDUSTRIES } from '@/lib/popular-industries';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { M } from '@/lib/messages';

// Một font đủ dấu tiếng Việt (spec mục 7.2): Inter theo hệ thiết kế A, chỉ dùng 2 độ đậm 400/600. Chữ số đều
// nét, có số tabular (cột ngày thẳng hàng).
// Tự lưu file font trong repo (next/font/local) thay cho next/font/google: lúc build, Google Fonts thỉnh thoảng trả
// đường dẫn file không có đuôi .woff2 → next/font báo lỗi và build trên Railway hỏng (2026-11-19). File lấy từ
// Google Fonts (Inter v20, bản biến thiên độ đậm), chia 3 phần theo bảng mã như Google: trình duyệt chỉ tải phần
// có ký tự trên trang. Mỗi phần là một họ font riêng (next/font/local không cho unicode-range theo từng file),
// xếp nối nhau trong --font-sans (globals.css): tiếng Việt → latin-ext → latin. Chỉ phần latin (đứng cuối) có font
// dự phòng chỉnh cỡ (giảm xô chữ khi font tải xong); hai phần kia không có, nếu không chữ có dấu sẽ rơi vào font
// dự phòng đó trước khi tới phần Inter chứa nó.
const interVi = localFont({
  src: './fonts/inter-vietnamese.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter-vi',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    },
  ],
});
const interLatinExt = localFont({
  src: './fonts/inter-latin-ext.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter-latin-ext',
  adjustFontFallback: false,
  preload: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
});
const interLatin = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter-latin',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});
// Font tiêu đề: Be Vietnam Pro Bold (font do người Việt thiết kế, dấu đẹp) cho H1/H2 và tên DN — tạo thứ bậc rõ mà
// không phải dùng màu. Chỉ 1 độ đậm (700), 3 phần theo bảng mã như Inter. Chữ thường vẫn là Inter.
const headVi = localFont({
  src: './fonts/bvp-700-vietnamese.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-head-vi',
  adjustFontFallback: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    },
  ],
});
const headLatinExt = localFont({
  src: './fonts/bvp-700-latin-ext.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-head-latin-ext',
  adjustFontFallback: false,
  preload: false,
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
  ],
});
const headLatin = localFont({
  src: './fonts/bvp-700-latin.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-head-latin',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
  ],
});
const fontVars = `${interVi.variable} ${interLatinExt.variable} ${interLatin.variable} ${headVi.variable} ${headLatinExt.variable} ${headLatin.variable}`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Open Graph chung (chia sẻ Zalo/Facebook). Ảnh: app/opengraph-image.png. Trang nào tự khai openGraph
  // (trang DN) phải tự ghi siteName/locale vì Next thay cả khối.
  openGraph: { siteName: SITE_NAME, locale: 'vi_VN', type: 'website' },
  title: {
    default: M.site.defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: M.site.defaultDescription,
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Thanh trình duyệt điện thoại cùng màu nền trắng của header A.
  themeColor: '#FFFFFF',
};

// Chạy trước lần vẽ đầu: đã chọn cookie rồi thì gắn data-consent để CSS ẩn banner ngay,
// không chờ JS (banner được render sẵn trong HTML để không làm chậm LCP lần đầu vào trang).
// Đoạn mã là hằng số, không chứa dữ liệu từ API.
const CONSENT_BOOTSTRAP =
  "try{if(localStorage.getItem('cookie_consent'))document.documentElement.setAttribute('data-consent','1')}catch(e){}";

export default async function RootLayout({ children }) {
  // Lỗi API thì ném lỗi (không nuốt thành danh mục rỗng): trang ISR đang có bản cũ được giữ nguyên thay vì bị cache
  // lại thành bản thiếu menu tỉnh/thành.
  const provinces = await getProvinces();
  return (
    // suppressHydrationWarning: thuộc tính data-consent do script trên gắn trước khi React hydrate.
    <html lang="vi" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          {M.site.skipToContent}
        </a>
        <ProvincesProvider provinces={provinces}>
          <HeaderBar provinces={provinces} industries={POPULAR_INDUSTRIES} />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
        </ProvincesProvider>
        <SiteFooter />
        <CookieConsent />
        <Analytics />
        {/* useSearchParams cần Suspense để trang tĩnh không bị chuyển sang render phía client. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
      </body>
    </html>
  );
}
