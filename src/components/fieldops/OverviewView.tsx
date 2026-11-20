import React from 'react';
import {
  Activity as ActivityIcon, Briefcase, Building2, Check, CheckCircle2, Circle, ClipboardCheck, Eye, KeyRound, LogIn, MapPin, MessageSquare, RotateCcw, ScrollText, UserPlus, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { auth, demo, useDb } from '@/lib/store';
import { fmtDateTime } from '@/lib/format';
import type { Activity, ActivityAction } from '@/lib/types';
import { Button, Card, PageHeader, cx } from './ui';
import { ActivitySentence } from './ListItems';

type Step = { title: string; detail: string; icon: React.ElementType; done: boolean; evidence?: Activity; evidenceText?: string; action?: { label: string; run: () => void } };

function ScopeCard({ icon: Icon, title, summary, stat, points, actions }: {
  icon: React.ElementType; title: string; summary: string; stat?: string; points: string[]; actions: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-amber-400"><Icon className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-navy-950">{title}</h3>
          <p className="text-sm text-stone-600">{summary}</p>
        </div>
      </div>
      {stat && <div className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm font-semibold text-navy-900 ring-1 ring-stone-200">{stat}</div>}
      <ul className="mt-3 flex-1 space-y-1.5">
        {points.map((p) => <li key={p} className="flex gap-2 text-sm text-stone-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{p}</li>)}
      </ul>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">{actions}</div>
    </Card>
  );
}

export default function OverviewView() {
  const db = useDb();
  const { user, logout } = useAuth();
  const { go, openInvite, openCustomerForm, openSiteForm, openJobForm, openInbox } = useUI();
  if (!user) return null;

  // ---------------- acceptance script (the client's "Done when"), verified from this run's activity
  const run = db.activity.filter((a) => a.at >= db.runStartedAt);
  const find = (action: ActivityAction) => run.find((a) => a.action === action);
  const lastJob = find('job.created');
  const ownerSignedIn = !!db.lastOwnerSignInAt && db.lastOwnerSignInAt >= db.runStartedAt;
  const steps: Step[] = [
    { title: 'Owner logs in', detail: 'Email and password, with show/hide password and a forgot-password link.', icon: LogIn, done: ownerSignedIn,
      evidenceText: ownerSignedIn ? `Owner signed in · ${fmtDateTime(db.lastOwnerSignInAt)}` : undefined,
      action: { label: 'Show login screen', run: () => { logout(); go({ name: 'overview' }); } } },
    { title: 'Invite a technician', detail: 'Name and email. The person appears on the Team page as Pending.', icon: UserPlus, done: !!find('user.invited'), evidence: find('user.invited'),
      action: { label: 'Invite technician', run: openInvite } },
    { title: 'Technician accepts the invitation', detail: 'Open the invitation in the demo inbox and set a password. The account becomes Active.', icon: KeyRound, done: !!find('user.activated'), evidence: find('user.activated'),
      action: { label: 'Open demo inbox', run: () => openInbox() } },
    { title: 'Create a customer', detail: 'Business name, contact, phone, email and notes.', icon: Building2, done: !!find('customer.created'), evidence: find('customer.created'),
      action: { label: 'Add customer', run: () => openCustomerForm() } },
    { title: 'Add a job site', detail: 'A service address under that customer, with access instructions.', icon: MapPin, done: !!find('site.created'), evidence: find('site.created'),
      action: { label: 'Add site', run: () => openSiteForm({ customerId: find('customer.created')?.targetId }) } },
    { title: 'Create a job', detail: 'Linked to the customer and site, auto-numbered, assigned to the technician.', icon: Briefcase, done: !!lastJob, evidence: lastJob,
      action: { label: 'Create job', run: () => openJobForm() } },
    { title: 'Add a note', detail: 'Plain-text note with the author and time recorded.', icon: MessageSquare, done: !!find('note.added'), evidence: find('note.added'),
      action: { label: lastJob ? 'Open the new job' : 'Open jobs', run: () => go(lastJob?.targetId ? { name: 'job', id: lastJob.targetId } : { name: 'jobs' }) } },
  ];
  const done = steps.filter((s) => s.done).length;
  const complete = done === steps.length;
  const pct = Math.round((done / steps.length) * 100);

  // ---------------- live counts for the scope cards
  const count = (s: string) => db.jobs.filter((j) => j.status === s).length;
  const active = db.users.filter((u) => u.status === 'active').length;
  const pending = db.users.filter((u) => u.status === 'pending').length;
  const tech = db.users.find((u) => u.role === 'tech' && u.status === 'active');
  const jobWithNotes = [...db.jobs].sort((a, b) => db.notes.filter((n) => n.jobId === b.id).length - db.notes.filter((n) => n.jobId === a.id).length)[0];

  const viewAsTech = () => {
    if (!tech) return;
    auth.switchTo(tech.id);
    go({ name: 'dashboard' });
    toast.success(`Now viewing as ${tech.name}`, { description: 'Technician — only assigned jobs are visible' });
  };

  return (
    <div>
      <PageHeader title="Sprint 1 review"
        subtitle="Field Operations App for Nothing Finer LLC. Everything in the Sprint 1 scope is working below with sample data — open any area to try it." />

      {/* Acceptance script */}
      <Card>
        <div className="border-b border-stone-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy-950"><ClipboardCheck className="h-5 w-5 text-amber-600" aria-hidden /> Acceptance script</h2>
              <p className="mt-0.5 text-sm text-stone-600">Owner logs in → invites a tech → creates a customer + site → creates a job → adds a note. Each step checks itself off from the activity log.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { demo.restartRun(); toast.success('Checklist restarted', { description: 'Existing records were kept.' }); }}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Restart checklist
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Acceptance progress">
              <div className={cx('h-full rounded-full transition-all duration-500', complete ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-navy-950">{done} of {steps.length}</span>
          </div>
          {complete && (
            <div className="mt-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Acceptance script complete — every step is recorded in the activity log.
            </div>
          )}
        </div>
        <ol className="divide-y divide-stone-100">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex min-w-0 flex-1 gap-3">
                {s.done ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-label="Done" /> : <Circle className="mt-0.5 h-6 w-6 shrink-0 text-stone-300" aria-label="Not done yet" />}
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Step {i + 1}</div>
                  <div className="text-[15px] font-semibold text-navy-950">{s.title}</div>
                  <p className="text-sm text-stone-600">{s.detail}</p>
                  {s.evidence && <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200"><ActivitySentence a={s.evidence} canOpen /> <span className="text-xs text-stone-500">{fmtDateTime(s.evidence.at)}</span></div>}
                  {!s.evidence && s.evidenceText && <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-200">{s.evidenceText}</div>}
                </div>
              </div>
              {s.action && (
                <div className="pl-9 sm:pl-0">
                  <Button size="sm" variant={s.done ? 'ghost' : 'secondary'} onClick={s.action.run} className="w-full sm:w-auto">{s.done ? 'Do it again' : s.action.label}</Button>
                </div>
              )}
            </li>
          ))}
        </ol>
      </Card>

      {/* Scope coverage */}
      <h2 className="mb-3 mt-8 text-lg font-semibold text-navy-950">Sprint 1 scope</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ScopeCard icon={LogIn} title="Authentication" summary="Login, logout, password reset and “me”."
          points={['Email and password login with clear errors', 'Show/hide password', 'Forgot password with a one-time reset link', 'My account shows the signed-in user and role']}
          actions={<>
            <Button size="sm" variant="secondary" onClick={() => { logout(); go({ name: 'overview' }); }}>Show login screen</Button>
            <Button size="sm" variant="ghost" onClick={() => go({ name: 'account' })}>My account</Button>
          </>} />
        <ScopeCard icon={Users} title="Users and roles" summary="Owner, admin and technician with basic permissions."
          stat={`${active} active${pending ? ` · ${pending} pending invitation${pending > 1 ? 's' : ''}` : ''}`}
          points={['Invite technicians by email', 'Admins run the office but can’t change the owner', 'Technicians see only their assigned jobs']}
          actions={<>
            <Button size="sm" variant="secondary" onClick={() => go({ name: 'team' })}>Open team</Button>
            {tech && <Button size="sm" variant="ghost" onClick={viewAsTech}><Eye className="h-4 w-4" aria-hidden /> View as technician</Button>}
          </>} />
        <ScopeCard icon={Building2} title="Customers and job sites" summary="Each customer can have several service locations."
          stat={`${db.customers.length} customers · ${db.sites.length} job sites`}
          points={['Search by name, contact, phone, email or address', 'Contact details and notes', 'Site address and access instructions']}
          actions={<Button size="sm" variant="secondary" onClick={() => go({ name: 'customers' })}>Open customers</Button>} />
        <ScopeCard icon={Briefcase} title="Jobs" summary="Create, list and open jobs linked to a customer and site."
          stat={`${db.jobs.length} jobs · ${count('new')} new · ${count('in_progress')} in progress · ${count('completed')} completed`}
          points={[`Automatic job numbers (NF-${db.nextJobNumber} is next)`, 'Assign a technician, set status and priority', 'Search and filter by status or technician']}
          actions={<Button size="sm" variant="secondary" onClick={() => go({ name: 'jobs' })}>Open jobs</Button>} />
        <ScopeCard icon={MessageSquare} title="Job notes" summary="A running record on every job."
          stat={`${db.notes.length} notes across ${new Set(db.notes.map((n) => n.jobId)).size} jobs`}
          points={['Author and time on every note', 'Technicians add notes from their phone', 'Append-only, so history can’t be rewritten']}
          actions={jobWithNotes && <Button size="sm" variant="secondary" onClick={() => go({ name: 'job', id: jobWithNotes.id })}>See a job with notes</Button>} />
        <ScopeCard icon={ScrollText} title="Audit log" summary="Who did what, and when — recorded automatically."
          stat={`${db.activity.length} entries`}
          points={['Invites, customers, sites, jobs, assignments, status changes and notes', 'Each entry links to its record', 'Visible to the owner and admins only']}
          actions={<Button size="sm" variant="secondary" onClick={() => go({ name: 'activity' })}><ActivityIcon className="h-4 w-4" aria-hidden /> Open activity</Button>} />
      </div>

      <Card className="mt-6 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-navy-950">Not part of Sprint 1</h2>
        <p className="mt-0.5 text-sm text-stone-600">Kept out on purpose so Sprint 1 stays focused on the acceptance script.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {['Invoicing and payments', 'QuickBooks integration', 'Payroll', 'Inventory', 'Scheduling', 'Estimates', 'Time tracking'].map((x) => (
            <li key={x} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">{x}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
