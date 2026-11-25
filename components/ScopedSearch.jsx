'use client';

// Thanh «Tìm trong …» ở trang tỉnh / trang ngành: ô tìm + vài bộ lọc nhanh. Trang tỉnh / ngành giữ nguyên danh sách
// (ISR, cho Google lập chỉ mục — spec 3.5); khi người dùng gõ hoặc chọn lọc thì sang trang kết quả /tim-kiem (noindex)
// với tỉnh / ngành chọn sẵn, nơi đã có đủ bộ lọc, sắp xếp, phân trang. Là <form method="get"> thật nên vẫn chạy khi
// JS chưa tải; có JS thì bỏ tham số rỗng khỏi URL.
//   fixed   — tham số cố định của trang: { tinh: 'ha-noi' } hoặc { nganh: '4101' }
//   label   — tên đọc của ô tìm (trình đọc màn hình), vd «Tìm doanh nghiệp tại Hà Nội». Chữ gợi ý trong ô giống ô
//             tìm chính (câu ngắn trên điện thoại).
//   selects — [{ name, label, allLabel, options: [{ value, label }] }]
// Chuột / chạm đổi ô chọn là áp dụng ngay; bàn phím chỉ áp dụng khi Enter hoặc rời ô (WCAG 3.2.2).
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { buildHref } from '@/lib/url';
import { M } from '@/lib/messages';
import { IconSearch } from './Icons';
import { startNavigation } from './NavigationProgress';

// scope: phạm vi hiện trong chữ gợi ý («Hà Nội», «ngành 4330»), để không nhầm với ô tìm toàn site trên header.
export default function ScopedSearch({ action = '/tim-kiem', fixed, label, scope, selects = [] }) {
  const router = useRouter();
  const uid = useId();
  const formRef = useRef(null);
  const keyboardRef = useRef(false);
  const pendingRef = useRef(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639.98px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  function apply() {
    const fd = new FormData(formRef.current);
    const params = { ...fixed };
    for (const [k, v] of fd.entries()) {
      const s = String(v).trim();
      if (s && !(k in fixed)) params[k] = s;
    }
    startNavigation();
    router.push(buildHref(action, params));
  }

  const selectCls =
    'select-chevron h-11 w-full min-w-0 cursor-pointer truncate rounded-md border border-line-strong bg-white pr-9 pl-3 text-body text-ink hover:border-field';

  return (
    <form
      ref={formRef}
      method="get"
      action={action}
      role="search"
      aria-label={label}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      {Object.entries(fixed).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="search-box search-box--nav flex h-11 min-w-0 flex-[1_1_280px] items-stretch">
        <label htmlFor={`${uid}-q`} className="sr-only">
          {label}
        </label>
        <input
          id={`${uid}-q`}
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={
            scope
              ? narrow
                ? M.search.scopedPlaceholderNarrow(scope)
                : M.search.scopedPlaceholder(scope)
              : narrow
                ? M.search.placeholderNarrow
                : M.search.placeholder
          }
          className="search-input h-full w-full min-w-0 appearance-none border-0 bg-transparent px-3.5 text-base text-ellipsis md:text-[15px]"
        />
        <button
          type="submit"
          aria-label={M.search.submit}
          title={M.search.submit}
          className="search-submit inline-flex h-full w-12 flex-none items-center justify-center"
        >
          <IconSearch size={20} strokeWidth={2.2} />
        </button>
      </div>
      {selects.map((f) => (
        <div key={f.name} className="w-full min-w-0 sm:w-[200px] sm:flex-none">
          <label htmlFor={`${uid}-${f.name}`} className="sr-only">
            {f.label}
          </label>
          <select
            id={`${uid}-${f.name}`}
            name={f.name}
            defaultValue=""
            onPointerDown={() => {
              keyboardRef.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key.length === 1 || e.key.startsWith('Arrow')) keyboardRef.current = true;
              if (e.key === 'Enter' && pendingRef.current) {
                e.preventDefault();
                apply();
              }
            }}
            onChange={() => {
              if (keyboardRef.current) pendingRef.current = f.name;
              else apply();
            }}
            onBlur={() => {
              keyboardRef.current = false;
              if (pendingRef.current === f.name) apply();
            }}
            className={selectCls}
          >
            <option value="">{f.allLabel}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </form>
  );
}
