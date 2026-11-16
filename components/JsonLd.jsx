// JSON-LD là ngoại lệ duy nhất được dùng dangerouslySetInnerHTML, và luôn qua JSON.stringify (spec mục 8.2).
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
