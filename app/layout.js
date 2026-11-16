import { Be_Vietnam_Pro } from 'next/font/google';
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

// Một font đủ dấu tiếng Việt, tối đa 2 độ đậm (spec mục 7.2).
const font = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-be-vietnam',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
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
  themeColor: '#0A2A5E',
};

// Chạy trước lần vẽ đầu: đã chọn cookie rồi thì gắn data-consent để CSS ẩn banner ngay,
// không chờ JS (banner được render sẵn trong HTML để không làm chậm LCP lần đầu vào trang).
// Đoạn mã là hằng số, không chứa dữ liệu từ API.
const CONSENT_BOOTSTRAP =
  "try{if(localStorage.getItem('cookie_consent'))document.documentElement.setAttribute('data-consent','1')}catch(e){}";

export default async function RootLayout({ children }) {
  const provinces = await getProvinces().catch(() => []);
  return (
    // suppressHydrationWarning: thuộc tính data-consent do script trên gắn trước khi React hydrate.
    <html lang="vi" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded focus:bg-white focus:px-4 focus:py-2"
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
