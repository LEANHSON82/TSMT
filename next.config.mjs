// Cấu hình Next.js + header bảo mật (spec mục 8.2).
const isDev = process.env.NODE_ENV !== 'production';

function apiOrigin() {
  try {
    return process.env.NEXT_PUBLIC_API_BASE ? new URL(process.env.NEXT_PUBLIC_API_BASE).origin : '';
  } catch {
    return '';
  }
}

// Chỉ cho phép đúng các domain Google Ads, GA, Turnstile và API (spec 8.2).
// Domain Google Ads lấy từ thực tế khi chạy GPT (banner, SafeFrame, video có thưởng, chống gian lận
// adtrafficquality). Quảng cáo thật mà bị chặn: xem lỗi CSP trong console rồi thêm đúng domain Google đó.
const GOOGLE_ADS = {
  script: [
    'https://securepubads.g.doubleclick.net',
    'https://pagead2.googlesyndication.com',
    'https://tpc.googlesyndication.com',
    'https://www.gstatic.com',
    'https://*.adtrafficquality.google',
  ],
  connect: [
    'https://*.doubleclick.net',
    'https://csi.gstatic.com',
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://www.google.com',
  ],
  frame: [
    'https://*.doubleclick.net',
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://www.google.com',
  ],
};

const csp = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : '',
    ...GOOGLE_ADS.script,
    'https://www.googletagmanager.com',
    'https://challenges.cloudflare.com',
  ]
    .filter(Boolean)
    .join(' '),
  // fonts.googleapis.com / fonts.gstatic.com: font Roboto của mẫu quảng cáo Google.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "media-src 'self' https:",
  [
    "connect-src 'self'",
    apiOrigin(),
    'https://*.google-analytics.com',
    'https://www.googletagmanager.com',
    ...GOOGLE_ADS.connect,
    'https://challenges.cloudflare.com',
  ]
    .filter(Boolean)
    .join(' '),
  ['frame-src', ...GOOGLE_ADS.frame, 'https://challenges.cloudflare.com'].join(' '),
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

// Địa chỉ chính là www.… (NEXT_PUBLIC_SITE_URL) → tên miền gốc chuyển 301 sang www (một địa chỉ duy nhất cho SEO).
function bareHostRedirect() {
  try {
    const { host, protocol } = new URL(process.env.NEXT_PUBLIC_SITE_URL || '');
    if (!host.startsWith('www.')) return [];
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: host.slice(4) }],
        destination: `${protocol}//${host}/:path*`,
        statusCode: 301,
      },
    ];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Next 15.2+ mặc định stream metadata (title, description, canonical) vào cuối <body> ở trang render
  // động, rồi JS mới chuyển lên <head>. Coi mọi user-agent là "HTML-limited" để metadata luôn nằm
  // trong <head> ngay từ HTML (tốt cho SEO/Lighthouse); dữ liệu metadata đã cache nên không chậm thêm.
  htmlLimitedBots: /.*/,
  outputFileTracingRoot: import.meta.dirname,
  // Trang danh sách có ?page= / ?tinh=: chuyển (URL giữ nguyên) vào route nội bộ /…/q/[tinh]/[page]
  // để vẫn ISR được như spec mục 2 — trang đọc searchParams thì Next buộc render động.
  // Chạy SAU middleware.js (middleware lo 301/404 và bỏ ?tinh= không hợp lệ). Rewrite trong middleware
  // không dùng được vì Next 15.5 không cache ISR cho route đích của rewrite từ middleware.
  async redirects() {
    return bareHostRedirect();
  },
  async rewrites() {
    const page = { type: 'query', key: 'page', value: '(?<page>[1-9]\\d{0,5})' };
    const tinh = { type: 'query', key: 'tinh', value: '(?<tinh>[a-z0-9-]{1,80})' };
    const filtered = (source) => [
      { source, has: [tinh, page], destination: `${source}/q/:tinh/:page` },
      { source, has: [tinh], destination: `${source}/q/:tinh/1` },
      { source, has: [page], destination: `${source}/q/_/:page` },
    ];
    return {
      beforeFiles: [
        { source: '/tinh/:slug', has: [page], destination: '/tinh/:slug/q/:page' },
        ...filtered('/nganh/:codeSlug'),
        ...filtered('/doanh-nghiep-moi-thanh-lap'),
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
