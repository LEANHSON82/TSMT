// Cloudflare Turnstile (chống spam/bot). ĐỂ SAU: khi có site key thì render widget ẩn
// (https://challenges.cloudflare.com/turnstile/v0/api.js) và lấy token thật.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export async function getTurnstileToken() {
  if (!TURNSTILE_SITE_KEY) return 'mock-turnstile-token';
  // TODO: window.turnstile.execute(...) với widget ẩn
  return 'mock-turnstile-token';
}
