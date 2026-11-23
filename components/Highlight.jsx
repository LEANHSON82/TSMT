import { highlightParts } from '@/lib/highlight';

/** Chữ có tô sáng từ khoá (<mark>). Không có query thì trả chữ nguyên. */
export default function Highlight({ text, query }) {
  if (!query) return text;
  return highlightParts(text, query).map((p, i) =>
    p.hit ? (
      <mark key={i} className="rounded-sm bg-silver px-px text-inherit">
        {p.text}
      </mark>
    ) : (
      p.text
    ),
  );
}
