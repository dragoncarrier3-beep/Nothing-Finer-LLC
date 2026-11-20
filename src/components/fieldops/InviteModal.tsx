import React, { useLayoutEffect as useEffect, useState } from 'react';
import { CheckCircle2, Inbox, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { DemoError, EMAIL_RE, team } from '@/lib/store';
import { Button, ErrorBanner, Field, Input, Modal } from './ui';

export default function InviteModal({ open, onClose, onOpenInbox }: { open: boolean; onClose: () => void; onOpenInbox: (messageId: string) => void }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ name: string; email: string; messageId: string } | null>(null);

  useEffect(() => {
    if (open) { setForm({ name: '', email: '' }); setErrors({}); setFormError(null); setResult(null); }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Enter the technician’s name.';
    if (!form.email.trim()) errs.email = 'Enter an email address.';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address, like name@company.com.';
    setErrors(errs); setFormError(null);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { user, message } = await team.inviteTechnician(form);
      setResult({ name: user.name, email: user.email, messageId: message.id });
      toast.success('Demo invitation created', { description: `${user.name} is listed as Pending on the Team page.` });
    } catch (err) {
      if (err instanceof DemoError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof Error ? err.message : 'Could not create the invitation.');
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={result ? 'Demo invitation created' : 'Invite technician'}
      subtitle={result ? undefined : 'They’ll receive a link to set a password and join the team.'}
      footer={result
        ? <><Button variant="secondary" onClick={onClose}>Done</Button><Button onClick={() => onOpenInbox(result.messageId)}><Inbox className="h-4 w-4" aria-hidden /> Open in demo inbox</Button></>
        : <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="invite-form" type="submit" loading={busy}><UserPlus className="h-4 w-4" aria-hidden /> Create invitation</Button></>}>
      {result ? (
        <div className="space-y-3">
          <div className="flex gap-3 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
            <p className="text-[15px] text-emerald-900"><b>{result.name}</b> was added to the Team page as <b>Pending</b>. Their invitation is waiting in the demo inbox.</p>
          </div>
          <p className="text-sm text-stone-600">Email delivery is simulated in this demo. Open the invitation to accept it as {result.name.split(' ')[0]} and activate the account.</p>
        </div>
      ) : (
        <form id="invite-form" onSubmit={submit} noValidate className="space-y-4">
          <ErrorBanner message={formError} />
          <Field label="Full name" htmlFor="inv-new-name" required error={errors.name}>
            <Input id="inv-new-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.name} autoComplete="off" placeholder="e.g. Sam Carter" />
          </Field>
          <Field label="Email" htmlFor="inv-new-email" required error={errors.email}>
            <Input id="inv-new-email" type="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} autoComplete="off" placeholder="sam@company.com" />
          </Field>
          <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-sm text-stone-700 ring-1 ring-stone-200">
            Role: <b>Technician</b> — sees only assigned jobs and can add job notes.
          </div>
        </form>
      )}
    </Modal>
  );
}
