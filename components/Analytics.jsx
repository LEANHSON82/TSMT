'use client';

// Nạp GA4 sau khi người dùng đồng ý cookie thống kê (banner CookieConsent phát sự kiện
// "cookie-consent-change"). Không có NEXT_PUBLIC_GA_ID thì không làm gì.
import { useEffect } from 'react';
import { syncAnalyticsConsent } from '@/lib/analytics';

export default function Analytics() {
  useEffect(() => {
    syncAnalyticsConsent();
    window.addEventListener('cookie-consent-change', syncAnalyticsConsent);
    return () => window.removeEventListener('cookie-consent-change', syncAnalyticsConsent);
  }, []);
  return null;
}
