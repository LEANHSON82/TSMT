// Bản dùng cho trình duyệt (và client component): gọi mock server qua route /api/mock/v1/*.
export async function mockFetch(path, init) {
  return fetch(`/api/mock${path}`, init);
}
