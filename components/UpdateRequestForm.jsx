'use client';

// Form yêu cầu ẩn/sửa thông tin (spec mục 3.6). Kiểm tra dữ liệu ngay khi nhập (MST, email, file).
// FE kiểm tra để báo lỗi sớm; BE vẫn phải kiểm lại (spec mục 8.2).
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { submitUpdateRequest } from '@/lib/api';
import { track } from '@/lib/analytics';
import { isValidMst, normalizeMst } from '@/lib/mst';
import { M } from '@/lib/messages';
import { getTurnstileToken, TURNSTILE_SITE_KEY } from '@/lib/turnstile';
import { IconAlert, IconCheckCircle, IconFile, IconShield, IconUpload } from './Icons';
import CopyButton from './CopyButton';

const REQUEST_TYPES = M.updateRequest.types;
const E = M.updateRequest.errors;
const F = M.updateRequest.fields;
const MAX_CONTENT = 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values, file) {
  const e = {};
  if (!values.mst.trim()) e.mst = E.mstRequired;
  else if (!isValidMst(values.mst)) e.mst = E.mstInvalid;
  if (!values.request_type) e.request_type = E.typeRequired;
  if (!values.full_name.trim()) e.full_name = E.nameRequired;
  if (!values.email.trim()) e.email = E.emailRequired;
  else if (!EMAIL_RE.test(values.email.trim())) e.email = E.emailInvalid;
  if (!values.content.trim()) e.content = E.contentRequired;
  else if (values.content.length > MAX_CONTENT) e.content = E.contentTooLong(MAX_CONTENT);
  if (file) {
    if (!FILE_TYPES.includes(file.type)) e.file = E.fileType;
    else if (file.size > MAX_FILE_BYTES) e.file = E.fileSize;
  }
  return e;
}

// Hệ A: nhãn đậm trên ô, ô cao 48 viền xám đậm (tương phản ≥ 3:1), bo 4px; lỗi = viền đỏ 2px + dòng chữ đỏ
// 14px có icon ngay dưới ô. Form không đóng hộp — mở đầu bằng vạch 2px như mọi khối khác.

// Ô bắt buộc — aria-required cho trình đọc màn hình (dấu * chỉ để nhìn).
const REQUIRED = new Set(['mst', 'request_type', 'full_name', 'email', 'content']);

function Field({ id, label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body font-semibold text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        ) : (
          <span className="font-normal text-muted"> {M.common.optional}</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm font-semibold text-danger"
        >
          <IconAlert size={16} className="mt-0.5 flex-none" />
          {error}
        </p>
      )}
    </div>
  );
}

// Lỗi: viền đỏ dày 2px vẽ VÀO TRONG ô (inset) — cùng cách với viền focus (globals.css), ô không nhích.
const inputCls = (err) =>
  `h-12 w-full rounded-lg border bg-white px-3 text-base text-ink ${err ? 'border-danger shadow-[inset_0_0_0_1px_var(--color-danger)]' : 'border-field hover:border-ink-2'}`;

// initialCompany: { mst, name, path } khi mở từ trang DN — hiện tên DN dưới ô MST để chủ DN xác nhận đúng
// công ty, và link quay lại trang DN ở màn cảm ơn.
export default function UpdateRequestForm({ initialMst = '', initialCompany = null }) {
  const [values, setValues] = useState({
    mst: initialMst,
    request_type: '',
    full_name: '',
    position: '',
    email: '',
    content: '',
  });
  const [file, setFile] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // Gửi xong: focus vào màn cảm ơn (form đã biến mất, không để focus rơi về <body>).
  const doneRef = useRef(null);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(null);
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const formRef = useRef(null);

  const errors = validate(values, file);
  const show = (name) => (touched[name] ? errors[name] : undefined);
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));
  const aria = (name, hasHint) => ({
    'aria-required': REQUIRED.has(name) || undefined,
    'aria-invalid': Boolean(show(name)) || undefined,
    'aria-describedby': show(name) ? `f-${name}-error` : hasHint ? `f-${name}-hint` : undefined,
  });

  function pickFile(f) {
    setFile(f || null);
    setTouched((t) => ({ ...t, file: true }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({
      mst: true,
      request_type: true,
      full_name: true,
      email: true,
      content: true,
      file: true,
    });
    if (Object.keys(errors).length) {
      // Đưa focus tới ô lỗi đầu tiên sau khi React vẽ lại thông báo lỗi.
      // Các ô lỗi rung nhẹ để người dùng thấy ngay chỗ cần sửa (tắt khi giảm chuyển động — globals.css).
      setTimeout(() => {
        const invalid = formRef.current?.querySelectorAll('[aria-invalid="true"]') || [];
        invalid.forEach((el) => {
          el.classList.remove('motion-shake');
          void el.offsetWidth;
          el.classList.add('motion-shake');
          el.addEventListener('animationend', () => el.classList.remove('motion-shake'), {
            once: true,
          });
        });
        const el = invalid[0] || fileRef.current;
        el?.focus();
      }, 0);
      return;
    }
    setSubmitting(true);
    setServerError('');
    try {
      const fd = new FormData();
      fd.set('mst', normalizeMst(values.mst));
      fd.set('request_type', values.request_type);
      fd.set('full_name', values.full_name.trim());
      fd.set('position', values.position.trim());
      fd.set('email', values.email.trim());
      fd.set('content', values.content.trim());
      if (file) fd.set('attachment', file);
      fd.set('turnstile_token', await getTurnstileToken());
      const res = await submitUpdateRequest(fd);
      track('update_request_submit', { request_type: values.request_type });
      setDone(res.request_code);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } catch (err) {
      setServerError(err?.status === 422 ? E.invalid : E.network);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    // Đã gửi: thay form tại chỗ, cùng vạch 2px mở khối; mã yêu cầu là dòng nhãn–giá trị như bảng thông tin DN.
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className="card motion-rise flex flex-col items-start gap-3 px-5 py-6 outline-none md:px-8 md:py-8"
      >
        <h2 className="flex items-center gap-2 text-h2-m font-semibold text-ink md:text-h2">
          <IconCheckCircle size={24} strokeWidth={1.8} className="flex-none text-chrome" />
          {M.updateRequest.doneTitle}
        </h2>
        <p className="max-w-[640px] text-body leading-7 text-ink-2">
          {M.updateRequest.doneBody}{' '}
          <strong className="font-semibold text-ink">{values.email.trim()}</strong>.{' '}
          {M.updateRequest.doneKeepCode}
        </p>
        <div className="mt-2 flex w-full items-center gap-4 border-y border-line py-2">
          <span className="text-sm text-muted">{M.updateRequest.requestCode}</span>
          <span className="flex items-center gap-1">
            <span
              className="text-h2 font-semibold text-ink tabular-nums"
              data-testid="request-code"
            >
              {done}
            </span>
            <CopyButton text={done} label={M.updateRequest.copyCode} />
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6">
          {initialCompany && (
            <Link
              href={initialCompany.path}
              className="inline-flex min-h-11 items-center font-semibold"
            >
              {M.updateRequest.backToCompany}
            </Link>
          )}
          <Link href="/" className="inline-flex min-h-11 items-center font-semibold">
            {M.notFound.home}
          </Link>
        </div>
      </div>
    );
  }

  const fileError = show('file');
  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      className="card flex flex-col gap-6 px-5 py-6 md:px-8 md:py-8"
    >
      {serverError && (
        <div
          role="alert"
          className="flex gap-2.5 rounded border border-danger bg-danger-bg px-4 py-3 text-body text-danger"
        >
          <IconAlert size={20} className="mt-0.5 flex-none" />
          {serverError}
        </div>
      )}

      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <Field
          id="f-mst"
          label={F.mst}
          required
          error={show('mst')}
          hint={
            initialCompany && normalizeMst(values.mst) === initialCompany.mst
              ? initialCompany.name
              : F.mstHint
          }
        >
          <input
            id="f-mst"
            inputMode="numeric"
            autoComplete="off"
            value={values.mst}
            onChange={set('mst')}
            onBlur={blur('mst')}
            className={`${inputCls(show('mst'))} tabular-nums`}
            {...aria('mst', true)}
          />
        </Field>
        <Field id="f-request_type" label={F.requestType} required error={show('request_type')}>
          <select
            id="f-request_type"
            value={values.request_type}
            onChange={(e) => {
              set('request_type')(e);
              setTouched((t) => ({ ...t, request_type: true }));
            }}
            onBlur={blur('request_type')}
            className={`select-chevron cursor-pointer ${inputCls(show('request_type'))}`}
            {...aria('request_type')}
          >
            <option value="">{F.requestTypePlaceholder}</option>
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="f-full_name" label={F.fullName} required error={show('full_name')}>
          <input
            id="f-full_name"
            autoComplete="name"
            value={values.full_name}
            onChange={set('full_name')}
            onBlur={blur('full_name')}
            className={inputCls(show('full_name'))}
            {...aria('full_name')}
          />
        </Field>
        <Field id="f-position" label={F.position}>
          <input
            id="f-position"
            autoComplete="organization-title"
            value={values.position}
            onChange={set('position')}
            className={inputCls(false)}
          />
        </Field>
        <div className="md:col-span-2">
          <Field id="f-email" label={F.email} required error={show('email')} hint={F.emailHint}>
            <input
              id="f-email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={set('email')}
              onBlur={blur('email')}
              className={inputCls(show('email'))}
              {...aria('email', true)}
            />
          </Field>
        </div>
      </div>

      <Field id="f-content" label={F.content} required error={show('content')}>
        <textarea
          id="f-content"
          rows={5}
          maxLength={MAX_CONTENT + 200}
          value={values.content}
          onChange={set('content')}
          onBlur={blur('content')}
          className={`${inputCls(show('content'))} h-auto py-2.5 leading-6`}
          {...aria('content')}
        />
        {/* order-last: dòng báo lỗi (nếu có) nằm sát ngay dưới ô, bộ đếm xuống dưới cùng bên phải. */}
        <p
          className={`order-last self-end text-sm tabular-nums ${values.content.length > MAX_CONTENT ? 'font-semibold text-danger' : 'text-muted'}`}
        >
          {values.content.length}/{MAX_CONTENT}
        </p>
      </Field>

      <div className="flex flex-col gap-1.5">
        <span id="f-file-label" className="text-body font-semibold text-ink">
          {F.file} <span className="font-normal text-muted">{M.common.optional}</span>
        </span>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          data-field-error={fileError ? 'true' : undefined}
          className={`flex flex-col items-center gap-2 rounded border border-dashed px-4 py-5 text-center ${
            fileError
              ? 'border-danger bg-danger-bg'
              : dragOver
                ? 'border-brand bg-brand-50'
                : 'border-field bg-white'
          }`}
        >
          {file ? (
            <div className="flex w-full max-w-md items-center gap-3 rounded border border-line bg-white px-3 py-1 text-left">
              <IconFile size={22} className="flex-none text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{file.name}</span>
                <span className="text-meta text-muted">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  pickFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-danger"
              >
                {F.fileRemove}
              </button>
            </div>
          ) : (
            <>
              <IconUpload size={24} className="text-muted" />
              <p className="text-sm text-ink-2">{F.fileDrop}</p>
            </>
          )}
          <label className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-field bg-white px-4 text-body font-semibold text-brand hover:border-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
            <span id="f-file-btn">{file ? F.fileChooseOther : F.fileChoose}</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-labelledby="f-file-label f-file-btn"
              aria-describedby={fileError ? 'f-file-error' : 'f-file-hint'}
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </label>
        </div>
        {fileError ? (
          <p
            id="f-file-error"
            className="flex items-start gap-1.5 text-sm font-semibold text-danger"
          >
            <IconAlert size={16} className="mt-0.5 flex-none" />
            {fileError}
          </p>
        ) : (
          <p id="f-file-hint" className="text-sm text-muted">
            {F.fileHint}
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile: có site key thì lấy token thật lúc bấm gửi (lib/turnstile.js — widget chỉ hiện khi
          Cloudflare cần người dùng tương tác). Chỉ ghi một dòng cho biết form được bảo vệ. */}
      {TURNSTILE_SITE_KEY && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <IconShield size={18} className="flex-none" />
          {M.updateRequest.turnstileNote}
        </p>
      )}

      <p className="text-sm text-muted">
        {M.updateRequest.privacyNote} <Link href="/chinh-sach-bao-mat">{M.footer.privacy}</Link>.
      </p>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-8 text-base font-semibold text-white hover:bg-cta-hover active:bg-chrome-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:self-start"
      >
        {submitting && (
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {submitting ? M.updateRequest.submitting : M.updateRequest.submit}
      </button>
    </form>
  );
}
