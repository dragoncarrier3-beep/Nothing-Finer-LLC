import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, LinkIcon, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { auth, DemoError, useDb, userById } from '@/lib/store';
import { BRAND } from '@/lib/constants';
import { AuthFrame, PasswordInput } from './AuthScreen';
import { Button, ErrorBanner, Field, Input, RoleBadge } from './ui';

function LinkProblem({ title, body, onBack, backLabel }: { title: string; body: string; onBack: () => void; backLabel: string }) {
  return (
    <AuthFrame>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="mb-4 inline-flex rounded-full bg-stone-100 p-3 text-stone-600"><LinkIcon className="h-6 w-6" aria-hidden /></div>
        <h1 className="text-xl font-bold text-navy-950">{title}</h1>
        <p className="mt-2 text-[15px] text-stone-600">{body}</p>
        <Button variant="secondary" className="mt-6 w-full" onClick={onBack}>{backLabel}</Button>
      </div>
    </AuthFrame>
  );
}

export function AcceptInvitationScreen({ messageId, hasSession, sessionName, onClose, onSignInAs }: {
  messageId: string; hasSession: boolean; sessionName?: string; onClose: () => void; onSignInAs: (email: string) => void;
}) {
  const db = useDb();
  const msg = db.inbox.find((m) => m.id === messageId && m.kind === 'invite');
  const invitee = userById(db, msg?.userId);
  const inviter = userById(db, invitee?.invitedBy);
  const [name, setName] = useState(invitee?.name ?? '');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errors, setErrors] = useState<{ name?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const backLabel = hasSession ? `Return to ${sessionName ?? 'the app'}` : 'Back to log in';

  if (!msg || !invitee) return <LinkProblem title="Invitation not found" body="This invitation link is no longer valid. It may have been cleared when the demo was reset." onBack={onClose} backLabel={backLabel} />;

  const done = doneId ? userById(db, doneId) : null;
  if (done) {
    return (
      <AuthFrame>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" aria-hidden /></div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Account activated</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
            <b>{done.name}</b> is now an active technician. They appear on the Team page, can be assigned jobs, and are available in the demo account switcher.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {hasSession && <Button onClick={onClose}>Return to {sessionName}</Button>}
            <Button variant={hasSession ? 'secondary' : 'primary'} onClick={() => { auth.switchTo(done.id); onClose(); toast.success(`Now viewing as ${done.name}`, { description: 'Technician' }); }}>
              Continue as {done.name}
            </Button>
            {!hasSession && <Button variant="secondary" onClick={() => onSignInAs(done.email)}>Back to log in</Button>}
          </div>
        </div>
      </AuthFrame>
    );
  }

  if (invitee.status !== 'pending') {
    return <LinkProblem title="Invitation already accepted" body={`${invitee.name}'s account is already active, so this link can’t be used again.`} onBack={onClose} backLabel={backLabel} />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Enter your name.';
    if (pw.length < 8) errs.password = 'Use at least 8 characters.';
    if (!errs.password && pw !== pw2) errs.confirm = 'Passwords don’t match.';
    setErrors(errs); setFormError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const u = await auth.acceptInvitation(messageId, name, pw);
      setDoneId(u.id);
      toast.success(`${u.name} is now active`);
    } catch (err) {
      if (err instanceof DemoError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof Error ? err.message : 'Could not accept the invitation.');
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <button onClick={onClose} className="mb-4 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-navy-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> {backLabel}</button>
        <div className="mb-4 inline-flex rounded-full bg-amber-100 p-3 text-amber-800"><UserCheck className="h-6 w-6" aria-hidden /></div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Join {BRAND.name}</h1>
        <p className="mt-1 text-[15px] text-stone-600">{inviter ? `${inviter.name} invited you` : 'You’ve been invited'} to {BRAND.product}. Set your password to activate your account.</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
          <span className="min-w-0 break-all text-sm text-navy-900">{invitee.email}</span>
          <RoleBadge role={invitee.role} />
        </div>
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <input type="email" autoComplete="username" value={invitee.email} readOnly hidden />
          <ErrorBanner message={formError} />
          <Field label="Your name" htmlFor="inv-name" required error={errors.name}>
            <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" invalid={!!errors.name} />
          </Field>
          <Field label="Create a password" htmlFor="inv-pw" required error={errors.password} hint="At least 8 characters.">
            <PasswordInput id="inv-pw" value={pw} onChange={setPw} autoComplete="new-password" invalid={!!errors.password} />
          </Field>
          <Field label="Confirm password" htmlFor="inv-pw2" required error={errors.confirm}>
            <PasswordInput id="inv-pw2" value={pw2} onChange={setPw2} autoComplete="new-password" invalid={!!errors.confirm} />
          </Field>
          <Button type="submit" loading={busy} className="w-full">Accept invitation</Button>
        </form>
      </div>
    </AuthFrame>
  );
}

export function ResetPasswordScreen({ messageId, onClose }: { messageId: string; onClose: (email?: string) => void }) {
  const db = useDb();
  const msg = db.inbox.find((m) => m.id === messageId && m.kind === 'reset');
  const account = userById(db, msg?.userId);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!msg || !account) return <LinkProblem title="Reset link not found" body="This reset link is no longer valid. Request a new one from the log-in screen." onBack={() => onClose()} backLabel="Close" />;
  if (msg.usedAt) return <LinkProblem title="Link already used" body="This password-reset link has already been used. Request a new one from the log-in screen if needed." onBack={() => onClose()} backLabel="Close" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (pw.length < 8) errs.password = 'Use at least 8 characters.';
    if (!errs.password && pw !== pw2) errs.confirm = 'Passwords don’t match.';
    setErrors(errs); setFormError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const u = await auth.completePasswordReset(messageId, pw);
      toast.success('Password updated', { description: `${u.email} can now log in with the new password.` });
      onClose(u.email);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not update the password.');
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <button onClick={() => onClose()} className="mb-4 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-navy-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Cancel</button>
        <div className="mb-4 inline-flex rounded-full bg-amber-100 p-3 text-amber-800"><KeyRound className="h-6 w-6" aria-hidden /></div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Choose a new password</h1>
        <p className="mt-1 break-all text-[15px] text-stone-600">For {account.email}</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <input type="email" autoComplete="username" value={account.email} readOnly hidden />
          <ErrorBanner message={formError} />
          <Field label="New password" htmlFor="rp-pw" required error={errors.password} hint="At least 8 characters.">
            <PasswordInput id="rp-pw" value={pw} onChange={setPw} autoComplete="new-password" invalid={!!errors.password} />
          </Field>
          <Field label="Confirm new password" htmlFor="rp-pw2" required error={errors.confirm}>
            <PasswordInput id="rp-pw2" value={pw2} onChange={setPw2} autoComplete="new-password" invalid={!!errors.confirm} />
          </Field>
          <Button type="submit" loading={busy} className="w-full">Update password</Button>
        </form>
      </div>
    </AuthFrame>
  );
}
