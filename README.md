# tracuu-dn-web

Frontend website tra cứu thông tin doanh nghiệp Việt Nam theo mã số thuế (MST), kiếm tiền bằng quảng cáo.
Xem thông tin miễn phí; muốn xem **số điện thoại** thì phải xem một video quảng cáo có thưởng.

> Giai đoạn hiện tại: **mockup chạy được trên dữ liệu giả**. Mọi phần cần dịch vụ thật (API Go,
> Google Ad Manager, Cloudflare Turnstile, GA4) đều có lớp giả lập và để sau.

## Chạy thử

Yêu cầu Node 20 LTS trở lên.

```bash
npm install
npm run dev            # http://localhost:3000
```

Chế độ dev cố ý không tối ưu (JS ~1,6 MB/trang, lần đầu mở mỗi trang phải biên dịch) nên **chậm hơn
nhiều so với thật**. Muốn xem đúng tốc độ khi lên server: `npm run preview` (build + chạy production,
JS ~0,4 MB/trang, máy chủ trả trang 5–30 ms).

Không cần file `.env`: thiếu `NEXT_PUBLIC_API_BASE` thì app tự chạy trên mock. Muốn đổi cấu hình thì
sao chép `.env.example` thành `.env.local`.

| Lệnh                              | Việc                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`                     | chạy dev (Turbopack; `npm run dev:webpack` nếu cần trình biên dịch cũ)                        |
| `npm run preview`                 | build và chạy production (đúng tốc độ thật)                                                   |
| `npm run build && npm start`      | build và chạy production                                                                      |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                             |
| `npm test`                        | unit test (Vitest): slug, MST, định dạng, analytics, mock API                                 |
| `npm run test:e2e`                | Playwright (tự build + chạy server cổng 3200); lần đầu chạy `npx playwright install chromium` |
| `npm run test:e2e:api`            | cùng bộ test, nhưng app gọi API **ngoài** (`mock:api` đóng vai API Go, cổng 4100)             |
| `npm run mock:gen`                | sinh lại dữ liệu giả trong `mocks/data/`                                                      |
| `npm run mock:api`                | chạy server API giả riêng (cổng 4000), cùng hợp đồng API, dùng thử chế độ API ngoài           |

## Thử luồng xem số điện thoại

Mở một trang DN, ví dụ `/0319786701-cong-ty-tnhh-giai-phap-ky-thuat-pc-viet-nam`, bấm «Xem số điện thoại».
Thêm tham số vào URL để ép từng nhánh ở spec mục 4.2:

| URL               | Nhánh                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| _(không thêm gì)_ | video giả lập 3 giây → hiện số                                           |
| `?ad=closed`      | đóng video sớm → «Bạn cần xem hết video…» + Xem lại                      |
| `?ad=no_fill`     | không có quảng cáo → quảng cáo dự phòng đếm ngược 5 giây → hiện số       |
| `?ad=blocked`     | trình duyệt chặn quảng cáo → hướng dẫn tắt AdBlock                       |
| `?mock=429`       | vượt giới hạn → khoá nút, «Thử lại sau 5 phút»                           |
| `?mock=410`       | phiên hết hạn → tự tạo phiên mới, không bắt xem lại video                |
| `?mock=500`       | lỗi server sau khi xem xong → «Thử lại» lấy được số, không xem lại video |

Số đã mở được nhớ trong `sessionStorage` của tab. Muốn xem lại luồng thì mở tab mới.

## Cấu trúc

```
middleware.js                # 301 slug sai, 404 (đủ HTML) cho MST/tỉnh/ngành/trang không tồn tại
app/                         # Next.js App Router
  page.js                    # trang chủ (ISR 10 phút)
  [mstSlug]/page.js          # chi tiết DN + chi nhánh (ISR 24h)
  tim-kiem/                  # kết quả tìm (SSR, noindex)
  tinh/[slug]/  nganh/[codeSlug]/  doanh-nghiep-moi-thanh-lap/
    page.js  view.js         #   trang 1 (ISR) + phần hiển thị dùng chung
    q/[tinh]/[page]/         #   route nội bộ cho ?tinh=&page= (ISR), xem «Trang danh sách và ISR»
  khong-tim-thay/            # trang 404 tĩnh, middleware rewrite về đây kèm mã 404
  yeu-cau-cap-nhat/          # form yêu cầu ẩn/sửa thông tin
  gioi-thieu/ lien-he/ dieu-khoan/ chinh-sach-bao-mat/
  robots.js  sitemap.xml/  sitemaps/[name]/  not-found.js  error.js
  api/mock/v1/[...path]/     # mock server cho trình duyệt (chỉ dùng khi chưa có API Go)
components/                  # CompanyCard, CompanyInfoTable, PhoneReveal, AdSlot, Pagination, SearchBox, Logo…
hooks/usePhoneUnlock.js      # máy trạng thái luồng xem SĐT
lib/
  api.js                     # chỗ DUY NHẤT gọi API
  ads/                       # AdProvider: mock | fallback | gpt (gpt đang stub)
  analytics.js               # track(name, params) — lọc bỏ SĐT/email
  messages.js                # toàn bộ chữ hiển thị
  slug.js mst.js format.js   # có unit test
mocks/
  handlers.js                # MSW handlers theo hợp đồng API (spec mục 6)
  data/*.json                # ~250 DN giả, SĐT giả tách riêng trong phones.json
tests/unit/  tests/e2e/
```

### Chuẩn hoá URL (middleware) và ISR trang danh sách

- `middleware.js` tra API (có cache trong bộ nhớ 1 giờ, 404 nhớ 5 phút, hỏi lại API trước khi redirect/404
  để không lặp redirect khi slug vừa đổi):
  - `/{mst}`, slug sai, `/nganh/{mã}` slug sai → **301** về URL chuẩn, giữ tham số.
  - MST/tỉnh/mã ngành sai hoặc không tồn tại, `?page=` vượt số trang → **404** kèm trang 404 render đủ HTML
    ở server (`app/khong-tim-thay`).
  - `?tinh=` không hợp lệ ở trang ngành/DN mới → 301 bỏ tham số.
- **Trang danh sách và ISR:** trang đọc `searchParams` thì Next buộc render động, nên `rewrites()` trong
  `next.config.mjs` chuyển `?tinh=&page=` (URL người dùng thấy giữ nguyên) vào route nội bộ
  `/…/q/[tinh]/[page]` để vẫn ISR (lượt sau `x-nextjs-cache: HIT`). Truy cập thẳng `/…/q/…` bị 301 về
  URL công khai. Rewrite phải nằm ở `next.config.mjs`: rewrite từ middleware thì Next 15.5 không cache ISR.
- Đổi lại: mỗi DN/tỉnh/ngành tốn một lần gọi API ở middleware cho mỗi lần cache hết hạn (không phải mỗi
  lượt xem).

### Mock API

`mocks/handlers.js` viết bằng MSW theo đúng bản nháp hợp đồng API. Không dùng Service Worker: server
component gọi thẳng handler qua `getResponse()` của MSW, còn trình duyệt gọi `/api/mock/v1/*`.
Hai đường này tách nhau qua subpath import `#mock-fetch` trong `package.json` (điều kiện `react-server`),
nên dữ liệu SĐT giả **không bao giờ** nằm trong bundle trình duyệt.

### Chuyển sang API Go

Đặt `NEXT_PUBLIC_API_BASE=https://api.<domain>` rồi build lại, không phải sửa code trang. Khi đó route
`/api/mock/*` tự tắt và CSP `connect-src` tự thêm domain API.

Đã kiểm bằng `npm run test:e2e:api`: `scripts/mock-api-server.mjs` chạy thành một tiến trình riêng (giống API Go),
app build với `NEXT_PUBLIC_API_BASE=http://localhost:4100`, toàn bộ 52 test e2e vẫn xanh.

Yêu cầu với API Go (xem `scripts/mock-api-server.mjs`):

- Bật CORS cho domain web (trình duyệt gọi thẳng `/v1/suggest`, `/v1/phone-unlocks*`, `/v1/update-requests`), cho phép header `Content-Type`, expose `Retry-After`.
- Bản staging nên hỗ trợ header `X-Mock-Scenario: 429|410|500` để QA ép nhánh lỗi; web gửi header này khi build với `NEXT_PUBLIC_MOCK_SCENARIOS=1`. Production **không** đặt biến này.

### Đề xuất API tìm kiếm (gửi team Go)

Hợp đồng ở spec mục 6 là bản nháp. Frontend đã làm theo bản mở rộng dưới đây; bộ tìm mẫu ở
`mocks/search.js` (có unit test `tests/unit/search.test.js`) mô tả đúng hành vi mong muốn. API chưa hỗ trợ
thì trang vẫn chạy (không có `matched` → mọi gợi ý vào nhóm «Doanh nghiệp»; không có `counts` → tab không
hiện số).

- `GET /v1/suggest?q=` → mỗi dòng thêm `representative` và `matched`
  (`name` | `representative` | `mst` | `phone`) để ô gợi ý chia nhóm và ghi rõ khớp ở đâu.
- `GET /v1/search` nhận thêm `field=name|representative|number`, `sort=founded_desc|founded_asc` (bỏ
  trống = phù hợp nhất), `industry=`; mỗi DN thêm `matched`; thêm `counts: {all, name, representative,
number}` (tính sau bộ lọc tỉnh/tình trạng/ngành, trước `field`).
- Xếp hạng: khớp nguyên chữ trước khớp phần đầu; gõ có dấu thì đúng dấu xếp trên; mọi từ khoá khớp trong
  cùng một trường; khớp tên DN xếp trên khớp người đại diện khi điểm bằng nhau; bỏ qua cụm chữ chung
  («công ty», «TNHH», «cổ phần»…). Gợi ý (đang gõ) cho khớp phần đầu từ cuối; trang kết quả có kết quả
  khớp nguyên chữ thì bỏ kết quả chỉ khớp phần đầu.
- **Bắt buộc:** không tìm theo SĐT của DN đã ẩn hoặc không công khai SĐT; cần tối thiểu 6 số mới tìm
  theo SĐT; không bao giờ trả SĐT trong kết quả tìm.
- Gợi ý < 150 ms trên ~1 triệu DN, có bỏ dấu tiếng Việt và chịu gõ sai → nên dùng Meilisearch / Typesense,
  hoặc Postgres `unaccent` + `pg_trgm`.

## Đã làm theo spec

- **Trang:** đủ các trang ở mục 2. Header dính đầu trang: logo, ô tìm (máy tính trùng khít ô nhập của ô tìm lớn trang chủ; trang chủ chỉ hiện khi cuộn qua ô lớn), menu Tỉnh/thành · Ngành nghề · DN mới (≥ 1280px; nhỏ hơn dùng nút ☰). Có footer và banner cookie.
- **Logo TMST** (`components/Logo.jsx`): biểu tượng ô vuông xanh chữ T + kính lúp cam (vẽ tay trên lưới 48×48, cũng là favicon `app/icon.svg`) + chữ «TMST» một màu xanh đậm, là nét Be Vietnam Pro đã chuyển thành path (in lại path bằng `python3 scripts/gen-logo.py <font SemiBold .woff2>`). Tên site mặc định `TMST` (`NEXT_PUBLIC_SITE_NAME`).
- **Màu sắc, hình ảnh** (spec không quy định bảng màu; mục 7.2 yêu cầu ảnh/icon SVG):
  - Thẻ DN ghi địa chỉ rút gọn: phường/xã, tỉnh/thành (trang theo tỉnh chỉ ghi phường/xã) — `areaAddress` trong `lib/format.js`.
  - Nhãn «Mới» cho DN thành lập trong 7 ngày (tắt ở khối/trang DN mới thành lập).
  - Trang chủ: khối tỉnh/thành đặt trước khối DN mới, trên dải nền xanh nhạt. Bản đồ chấm Việt Nam (có Hoàng Sa, Trường Sa) sinh lại bằng `python3 scripts/gen-vn-dots.py countries-50m.json` (dữ liệu Natural Earth, xem đầu script).
  - Hình minh hoạ SVG cho không có kết quả, trang 404, gửi yêu cầu thành công (`components/Illustrations.jsx`).
  - Bản đồ chấm đánh dấu tỉnh (`components/VnDotMap.jsx`, toạ độ trung tâm hành chính 34 tỉnh/thành trong `lib/vn-map-points.js`, sinh cùng script bản đồ): trang tỉnh đánh dấu tỉnh đang xem; khối tỉnh/thành trang chủ (≥ 1024px) rê chuột tên tỉnh thì chấm tỉnh sáng lên (CSS `:has`, không JS).
  - Minh hoạ đầu trang: DN mới, ngành nghề, giới thiệu, liên hệ, điều khoản, chính sách, form yêu cầu. Ẩn trên điện thoại.
- **Chuyển động** (CSS thuần, không thư viện; chỉ transform/opacity nên CLS 0; tắt hết khi máy bật «giảm chuyển động»):
  - Khối/thẻ nằm dưới màn hình đầu trượt lên khi cuộn tới (`.reveal`, CSS scroll-driven animation — trình duyệt chưa hỗ trợ thì hiện bình thường). Không làm mờ để chữ luôn đủ tương phản.
  - Thẻ DN trong danh sách nhấc nhẹ khi rê chuột; mũi tên «Xem tất cả» trượt; gợi ý tìm kiếm hiện lần lượt.
  - Số điện thoại «chạy số» rồi dừng ở số thật sau khi xem quảng cáo (`components/RollingNumber.jsx`); khôi phục từ sessionStorage thì không chạy.
  - Chuyển trang: nội dung trang mới hiện mờ dần + trượt lên 6px (0,22 s; không chạy ở lần tải đầu). Trang DN chưa có trong bộ đệm hiện khung chờ (`app/[mstSlug]/loading.js`); gợi ý tìm kiếm đang chọn được tải trước.
  - Header có bóng đổ khi cuộn khỏi đầu trang (scroll-driven); viền focus khép vào nút; ô form báo lỗi rung nhẹ khi bấm gửi.
- **SEO bổ sung:** URL viết hoa → 301 chữ thường; `/{mst}-{slug}.html` → 301; đường dẫn có dấu chấm khác → 404 thật; «DN mới» lọc tỉnh canonical về `/tinh/{slug}`; ngành × tỉnh không có DN → noindex; trang 2+ có «– Trang N» trong H1; Open Graph cho mọi trang, ảnh `app/opengraph-image.png` (1200×630 — **đổi tên site thì chụp lại ảnh này**).
- **Tìm kiếm:** gợi ý chia nhóm Doanh nghiệp / Người đại diện / Tỉnh/thành (ghi rõ khớp ở đâu, khớp SĐT không hiện số) + dòng «Xem tất cả kết quả»; trạng thái đang tải / không có gợi ý. Trang kết quả có tab «Tìm theo» kèm số đếm, lọc tỉnh/tình trạng/ngành, sắp xếp, thẻ bộ lọc bỏ được từng cái, gợi ý «Lọc tại [tỉnh]» khi từ khoá có tên tỉnh. Tô sáng từng từ khoá ở đầu chữ (không phân biệt hoa/thường, dấu — `lib/highlight.js`).
- **Chi tiết DN:**
  - Bảng thông tin ẩn dòng trống, ngành nghề thu gọn khi quá 10 ngành, khối DN cùng ngành.
  - Banner dưới bảng thông tin và cột phải dính khi cuộn.
  - Trang chi nhánh có nhãn «Chi nhánh» và dòng «Đơn vị chủ quản».
- **SĐT:**
  - Không có trong HTML hay API chi tiết, chỉ render sau khi xem xong quảng cáo.
  - Không có trong title, meta, JSON-LD hay analytics.
- **Danh sách:**
  - 20 dòng mỗi trang, banner sau dòng 5 và dòng 15, phân trang số.
  - Bộ lọc gắn vào URL.
  - Đủ 3 trạng thái: skeleton, rỗng, lỗi kèm nút Thử lại.
- **SEO:**
  - title ≤ 65 ký tự, description ≤ 155 ký tự, canonical.
  - JSON-LD Organization (không có telephone) và BreadcrumbList.
  - Sitemap index (50.000 URL mỗi file), robots.txt.
- **Bảo mật:** CSP, `nosniff`, `Referrer-Policy`. `dangerouslySetInnerHTML` chỉ dùng cho JSON-LD và một đoạn script hằng số trong `app/layout.js` (đọc lựa chọn cookie để ẩn banner trước lần vẽ đầu), không bao giờ với dữ liệu từ API.
- **Analytics:** GA4 chỉ nạp khi có `NEXT_PUBLIC_GA_ID` **và** người dùng đồng ý cookie thống kê, tải sau khi trang hiển thị; rút lại đồng ý thì tắt gửi. Đủ 11 sự kiện mục 8.1, có test e2e kiểm tham số và không chứa SĐT/email.
- **Trợ năng:**
  - Ô tìm kiếm theo mẫu combobox; modal giữ focus, đóng bằng Esc, có `aria-modal`.
  - Vùng bấm ≥ 44px, viền focus rõ. Không có thanh cuộn ngang ở 360px.

## Để sau (cần dịch vụ thật hoặc owner chốt)

- [ ] Nối API Go thật
- [ ] Google Ad Manager: `lib/ads/gpt.js` đang stub (ghi sẵn các bước) và luôn trả `no_fill`, nên rơi xuống quảng cáo dự phòng. Banner thật đổ vào `data-ad-slot`.
- [ ] Cloudflare Turnstile: `lib/turnstile.js` đang trả token giả
- [ ] GA4: code xong (nạp sau khi đồng ý cookie). Cần owner tạo property GA4, đưa `NEXT_PUBLIC_GA_ID`, rồi kiểm bằng GA4 DebugView.
- [ ] Nội dung chính thức của các trang tĩnh (owner gửi, luật sư duyệt)
- [ ] Đo lại Lighthouse/PageSpeed Insights trên môi trường thật (đã đo trên máy local, xem bên dưới)
- [ ] Kiểm tra sitemap bằng Google Search Console khi có domain thật

## Lighthouse (đo trên máy local, mobile, throttling mô phỏng)

| Trang        | Performance | Accessibility | Best practices | SEO    | LCP       | CLS |
| ------------ | ----------- | ------------- | -------------- | ------ | --------- | --- |
| Chi tiết DN  | 92–97       | 100           | 100            | 100    | 2,2–2,8 s | 0   |
| Trang chủ    | 95–97       | 100           | 100            | 100    | 2,2–2,6 s | 0   |
| DN theo tỉnh | 93–97       | 100           | 100            | 100    | 2,2–2,3 s | 0   |
| Kết quả tìm  | 90–97       | 100           | 100            | 54–66¹ | 2,1–2,2 s | 0   |

¹ `/tim-kiem` cố ý để `noindex` theo spec mục 2 nên Lighthouse trừ điểm SEO.

Tiêu chí 9.2 (≥ 90 và CLS < 0,1) đạt. LCP mô phỏng dao động quanh mốc 2,5 s của mục 7.2: trình duyệt
thực tế vẽ LCP ngay lúc FCP (~0,25 s trên localhost), con số 2,2–2,8 s là do Lighthouse cộng cả JS/font tải
trước mốc đó khi giả lập 4G chậm. Cần đo lại bằng PageSpeed Insights khi có domain thật.

## Điểm lệch so với spec, cần chú/BE quyết

Các lệch trước đây (308 thay 301, trang danh sách không ISR, `?page=999` trả 200, HTML trang 404 trống)
đã sửa bằng middleware + rewrite ở trên. Còn lại:

1. **LCP mô phỏng 2,2–2,8 s** quanh mốc 2,5 s của mục 7.2 (xem mục Lighthouse). Cần đo trên môi trường thật.
2. **Nội dung nháp 4 trang tĩnh** nằm ngay trong file trang, không gom vào `lib/messages.js`: đây là văn bản
   sẽ được thay bằng bản owner gửi/luật sư duyệt, không phải chữ giao diện. Mọi chữ giao diện khác đã ở
   `lib/messages.js`.
3. **Header dính đầu trang** (ô tìm luôn trong màn hình) là thêm ngoài spec, không trái spec.
4. **Thứ tự khối trang chủ:** theo yêu cầu, khối «Tra cứu theo tỉnh/thành» đặt trước khối «Doanh nghiệp mới thành lập» (spec 3.1 liệt kê ngược lại); ô quảng cáo vẫn nằm giữa hai khối.
5. **Quy trình:** spec yêu cầu pull request < 400 dòng kèm ảnh chụp; mockup này đang là các commit trên `main`.

## Câu hỏi mở cho owner (spec mục 9.4, cộng thêm)

- Tên site và domain? Hiện tạm `TMST` (đổi bằng `NEXT_PUBLIC_SITE_NAME`).
- Menu «Ngành nghề»: chỉ cần dropdown ngành phổ biến (`lib/popular-industries.js`, đang tạm), hay làm trang `/nganh` đầy đủ, khi đó BE cần thêm `GET /v1/industries`?
- Đã mở SĐT thì giữ bao lâu? Hiện: trong tab (sessionStorage).
- Email có phải xem quảng cáo như SĐT không? Hiện: hiện thẳng.
- Người dùng bật AdBlock: chặn mở SĐT (hiện tại) hay cho xem sau quảng cáo dự phòng?
- Quảng cáo dự phòng đếm ngược 5 giây có đủ không?
- Ai mở Google Ad Manager và khi nào xong?
