import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Inbox, Info, LogIn, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { auth, EMAIL_RE, useDb } from '@/lib/store';
import { BRAND, DEMO_PASSWORD, ROLE_LABEL } from '@/lib/constants';
import { useUI } from '@/contexts/UIContext';
import { Button, ErrorBanner, Field, Input, RoleBadge, cx } from './ui';
import { BrandMark } from './Shell';

export function PasswordInput({ id, value, onChange, autoComplete, invalid, placeholder }: { id: string; value: string; onChange: (v: string) => void; autoComplete?: string; invalid?: boolean; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} invalid={invalid} placeholder={placeholder} className="pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-navy-900"
        aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-2.75rem)] flex-col bg-paper">
      <header className="bg-navy-950 px-4 py-4 sm:px-6"><BrandMark /></header>
      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <footer className="px-4 pb-6 text-center text-xs text-stone-500">© {new Date().getFullYear()} {BRAND.legal} · Sprint 1 demonstration build</footer>
    </div>
  );
}

export default function AuthScreen({ initialEmail = '' }: { initialEmail?: string }) {
  const db = useDb();
  const { openInbox } = useUI();
  const [mode, setMode] = useState<'login' | 'forgot' | 'forgot-done'>('login');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const owner = db.users.find((u) => u.role === 'owner' && u.status === 'active');
  const sampleAccounts = db.users.filter((u) => u.status === 'active' && ['u-jordan', 'u-dana', 'u-marcus'].includes(u.id));

  const switchMode = (m: typeof mode) => { setMode(m); setErrors({}); setFormError(null); };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address, like name@company.com.';
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs); setFormError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const u = await auth.login(email, password);
      toast.success(`Welcome, ${u.name.split(' ')[0]}`, { description: `Signed in as ${ROLE_LABEL[u.role]}` });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not log in.');
    } finally { setBusy(false); }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setErrors({ email: 'Enter a valid email address.' }); return; }
    setErrors({}); setBusy(true);
    try { await auth.requestPasswordReset(email); setMode('forgot-done'); } finally { setBusy(false); }
  };

  const enterAsOwner = () => {
    if (!owner) return;
    const u = auth.switchTo(owner.id);
    toast.success(`Welcome, ${u.name.split(' ')[0]}`, { description: 'Demo entered as Owner' });
  };

  return (
    <AuthFrame>
      {mode === 'login' && (
        <>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">Log in</h1>
            <p className="mt-1 text-[15px] text-stone-600">Jobs, customers and your crew in one place.</p>
            <form onSubmit={submitLogin} noValidate className="mt-6 space-y-4">
              <ErrorBanner message={formError} />
              <Field label="Email" htmlFor="login-email" error={errors.email}>
                <Input id="login-email" type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} placeholder="name@company.com" />
              </Field>
              <Field label="Password" htmlFor="login-password" error={errors.password}>
                <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" invalid={!!errors.password} />
              </Field>
              <div className="flex justify-end">
                <button type="button" onClick={() => switchMode('forgot')} className="py-1 text-sm font-semibold text-navy-700 underline-offset-2 hover:underline">Forgot password?</button>
              </div>
              <Button type="submit" loading={busy} className="w-full"><LogIn className="h-4 w-4" aria-hidden /> Log in</Button>
            </form>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950"><Info className="h-4 w-4" aria-hidden /> Presenting the demo?</div>
            <Button variant="accent" onClick={enterAsOwner} disabled={!owner} className="mt-3 w-full">Enter demo as owner</Button>
            <p className="mt-3 text-xs text-amber-950/80">Or log in with a sample account. All use the password <code className="rounded bg-white px-1 py-0.5 font-mono font-semibold text-navy-950">{DEMO_PASSWORD}</code>.</p>
            <ul className="mt-2 space-y-1">
              {sampleAccounts.map((u) => (
                <li key={u.id}>
                  <button type="button" onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setErrors({}); setFormError(null); }}
                    className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-sm hover:bg-amber-100">
                    <span className="truncate text-navy-900">{u.email}</span><RoleBadge role={u.role} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-950/80">Sign-in is simulated in this browser for the demonstration.</p>
          </div>
        </>
      )}

      {mode === 'forgot' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <button onClick={() => switchMode('login')} className="mb-4 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-navy-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to log in</button>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Reset your password</h1>
          <p className="mt-1 text-[15px] text-stone-600">Enter the email on your account and we’ll create a reset link.</p>
          <form onSubmit={submitForgot} noValidate className="mt-6 space-y-4">
            <Field label="Email" htmlFor="forgot-email" error={errors.email}>
              <Input id="forgot-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} placeholder="name@company.com" />
            </Field>
            <Button type="submit" loading={busy} className="w-full"><Mail className="h-4 w-4" aria-hidden /> Create reset link</Button>
            <p className="text-xs text-stone-500">Demo: the link is delivered to the labeled demo inbox. No real email is sent.</p>
          </form>
        </div>
      )}

      {mode === 'forgot-done' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="mb-4 inline-flex rounded-full bg-amber-100 p-3 text-amber-800"><Inbox className="h-6 w-6" aria-hidden /></div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Check the demo inbox</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
            If an active account exists for <b className="break-all">{email.trim()}</b>, a password-reset message is now in the demo inbox.
          </p>
          <p className="mt-2 text-sm text-stone-500">Simulated delivery — in production this would be sent by email.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => openInbox()} className="sm:flex-1"><Inbox className="h-4 w-4" aria-hidden /> Open demo inbox</Button>
            <Button variant="secondary" onClick={() => switchMode('login')} className={cx('sm:flex-1')}>Back to log in</Button>
          </div>
        </div>
      )}
    </AuthFrame>
  );
}
