import React, { useEffect, useId } from 'react';
import { AlertTriangle, ChevronDown, Loader2, Lock, X } from 'lucide-react';
import { JOB_STATUS_BADGE, JOB_STATUS_DOT, JOB_STATUS_LABEL, ROLE_BADGE, ROLE_LABEL, USER_STATUS_LABEL } from '@/lib/constants';
import type { JobPriority, JobStatus, Role, UserStatus } from '@/lib/types';
import { initials } from '@/lib/format';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------------------------------------------------------------- buttons & inputs
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export function Button({ variant = 'primary', size = 'md', loading, className, children, type = 'button', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: 'sm' | 'md'; loading?: boolean;
}) {
  const v: Record<ButtonVariant, string> = {
    primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950',
    accent: 'bg-amber-400 text-navy-950 hover:bg-amber-300 active:bg-amber-500',
    secondary: 'bg-white text-navy-900 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 active:bg-stone-100',
    ghost: 'text-navy-700 hover:bg-stone-100 active:bg-stone-200',
    danger: 'bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50',
  };
  const s = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-[15px] sm:h-10 sm:text-sm';
  return (
    <button type={type} {...rest} disabled={rest.disabled || loading}
      className={cx('inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55', v[variant], s, className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, required, optional, children, htmlFor }: { label: string; error?: string; hint?: React.ReactNode; required?: boolean; optional?: boolean; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
        {required && <span className="text-red-600" aria-hidden> *</span>}
        {optional && <span className="font-normal text-stone-500"> (optional)</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-red-700" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

const inputBase = 'block w-full rounded-lg border-0 bg-white px-3 text-base text-navy-950 ring-1 ring-inset placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 disabled:bg-stone-100 disabled:text-stone-500 sm:text-sm';
const ringFor = (invalid?: boolean) => (invalid ? 'ring-red-400' : 'ring-stone-300');

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ invalid, className, ...p }, ref) => <input ref={ref} {...p} aria-invalid={invalid || undefined} className={cx(inputBase, 'h-11 sm:h-10', ringFor(invalid), className)} />,
);
Input.displayName = 'Input';

export function Select({ invalid, className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className={cx('relative', className)}>
      <select {...p} aria-invalid={invalid || undefined} className={cx(inputBase, 'h-11 appearance-none pr-9 sm:h-10', ringFor(invalid))}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden />
    </div>
  );
}

export function Textarea({ invalid, className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea {...p} aria-invalid={invalid || undefined} className={cx(inputBase, 'resize-y py-2.5', ringFor(invalid), className)} />;
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; tone?: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-lg bg-stone-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx('h-10 rounded-md px-2 text-sm font-semibold transition-colors sm:h-9', value === o.value ? cx('bg-white shadow-sm ring-1 ring-stone-200', o.tone ?? 'text-navy-950') : 'text-stone-600 hover:text-navy-900')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- dialogs
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg';
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(e) => e.stopPropagation()}
        className={cx('flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[88dvh] sm:rounded-xl', w)}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-navy-950">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-stone-600">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="-mr-2 -mt-1 rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-navy-900" aria-label="Close dialog"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, danger, onConfirm, onCancel, busy }: {
  open: boolean; title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} className={danger ? '!bg-red-600 !text-white !ring-0 hover:!bg-red-700' : undefined}>{confirmLabel}</Button>
      </>}>
      <div className="text-[15px] leading-relaxed text-stone-700">{body}</div>
    </Modal>
  );
}

// ---------------------------------------------------------------- badges & avatars
export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', JOB_STATUS_BADGE[status])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', JOB_STATUS_DOT[status])} aria-hidden />
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: JobPriority }) {
  if (priority !== 'urgent') return null;
  return <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">Urgent</span>;
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={cx('inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', ROLE_BADGE[role])}>{ROLE_LABEL[role]}</span>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const m = { active: 'bg-emerald-50 text-emerald-800 ring-emerald-200', pending: 'bg-amber-50 text-amber-900 ring-amber-300', inactive: 'bg-stone-100 text-stone-600 ring-stone-300' }[status];
  return <span className={cx('inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', m)}>{status === 'pending' ? 'Pending' : USER_STATUS_LABEL[status]}</span>;
}

const avatarTones = ['bg-navy-700', 'bg-navy-500', 'bg-stone-600', 'bg-amber-700', 'bg-navy-800', 'bg-stone-500'];
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length;
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  return <span aria-hidden className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', avatarTones[idx], s)}>{initials(name)}</span>;
}

// ---------------------------------------------------------------- layout
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cx('rounded-xl border border-stone-200 bg-white', className)}>{children}</section>;
}

export function CardHeader({ title, icon, action, count }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; count?: number }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-5">
      <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-navy-950">
        {icon && <span className="text-amber-600">{icon}</span>}
        <span className="truncate">{title}</span>
        {count !== undefined && <span className="text-sm font-normal text-stone-500">({count})</span>}
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, crumbs }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; crumbs?: React.ReactNode }) {
  return (
    <div className="mb-5 sm:mb-6">
      {crumbs && <div className="mb-2 text-sm text-stone-600">{crumbs}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-[28px]">{title}</h1>
          {subtitle && <div className="mt-1 text-[15px] text-stone-600">{subtitle}</div>}
        </div>
        {action && <div className="flex flex-wrap gap-2 [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-stone-100 p-3 text-stone-500">{icon}</div>
      <h3 className="text-base font-semibold text-navy-950">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-stone-600">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-inset ring-red-200" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{message}
    </div>
  );
}

export function AccessDenied({ title = 'You don’t have access to this page', body, action }: { title?: string; body?: string; action?: React.ReactNode }) {
  return (
    <Card>
      <EmptyState icon={<Lock className="h-5 w-5" />} title={title} body={body ?? 'Your role doesn’t include this area. Ask the owner if you think this is a mistake.'} action={action} />
    </Card>
  );
}
