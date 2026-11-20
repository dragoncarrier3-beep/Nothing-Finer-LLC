import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { currentUser, demo, inbox as inboxApi, useDb } from '@/lib/store';
import type { Customer, Job, JobStatus, Site, View } from '@/lib/types';
import { NextStep, UICtx, UIActions } from '@/contexts/UIContext';
import AuthScreen from './fieldops/AuthScreen';
import Shell from './fieldops/Shell';
import DashboardView from './fieldops/DashboardView';
import JobsView from './fieldops/JobsView';
import JobDetailView from './fieldops/JobDetailView';
import CustomersView from './fieldops/CustomersView';
import CustomerDetailView from './fieldops/CustomerDetailView';
import TeamView from './fieldops/TeamView';
import ActivityView from './fieldops/ActivityView';
import AccountView from './fieldops/AccountView';
import JobFormModal from './fieldops/JobFormModal';
import InviteModal from './fieldops/InviteModal';
import DemoInbox from './fieldops/DemoInbox';
import { AcceptInvitationScreen, ResetPasswordScreen } from './fieldops/AuthFlows';
import { CustomerFormModal, SiteFormModal } from './fieldops/CustomerForms';
import DemoBar from './fieldops/DemoBar';
import { ConfirmDialog } from './fieldops/ui';

// ---- hash routing: #/jobs, #/jobs/:id, #/jobs?status=new, #/customers/:id ...
const STATUSES: JobStatus[] = ['new', 'in_progress', 'completed'];
function parseHash(): View {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [a, b] = path.split('/');
  switch (a) {
    case 'jobs': {
      if (b) return { name: 'job', id: decodeURIComponent(b) };
      const s = new URLSearchParams(query).get('status') as JobStatus | null;
      return { name: 'jobs', status: s && STATUSES.includes(s) ? s : undefined };
    }
    case 'customers': return b ? { name: 'customer', id: decodeURIComponent(b) } : { name: 'customers' };
    case 'team': return { name: 'team' };
    case 'activity': return { name: 'activity' };
    case 'account': return { name: 'account' };
    default: return { name: 'dashboard' };
  }
}
function toHash(v: View) {
  switch (v.name) {
    case 'job': return `#/jobs/${encodeURIComponent(v.id)}`;
    case 'customer': return `#/customers/${encodeURIComponent(v.id)}`;
    case 'jobs': return v.status ? `#/jobs?status=${v.status}` : '#/jobs';
    case 'dashboard': return '#/';
    default: return `#/${v.name}`;
  }
}

type Flow = { kind: 'invite' | 'reset'; messageId: string } | null;

const AppLayout: React.FC = () => {
  const db = useDb();
  const user = currentUser(db);
  const [view, setView] = useState<View>(parseHash);
  const [jobForm, setJobForm] = useState<{ open: boolean; job?: Job; customerId?: string; siteId?: string }>({ open: false });
  const [customerForm, setCustomerForm] = useState<{ open: boolean; customer?: Customer }>({ open: false });
  const [siteForm, setSiteForm] = useState<{ open: boolean; customerId?: string; site?: Site }>({ open: false });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inbox, setInbox] = useState<{ open: boolean; messageId?: string }>({ open: false });
  const [flow, setFlow] = useState<Flow>(null);
  const [nextStep, setNextStep] = useState<NextStep>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const go = useCallback((v: View) => {
    setView(v);
    const h = toHash(v);
    if (window.location.hash !== h) window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${h}`);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const h = () => setView(parseHash());
    window.addEventListener('popstate', h);
    window.addEventListener('hashchange', h);
    return () => { window.removeEventListener('popstate', h); window.removeEventListener('hashchange', h); };
  }, []);

  const closeAll = useCallback(() => {
    setJobForm({ open: false }); setCustomerForm({ open: false }); setSiteForm({ open: false });
    setInviteOpen(false); setInbox({ open: false }); setNextStep(null);
  }, []);

  // Signing out (or switching to a different account) closes any open forms.
  const uid = user?.id;
  useEffect(() => { setJobForm({ open: false }); setCustomerForm({ open: false }); setSiteForm({ open: false }); setInviteOpen(false); setNextStep(null); }, [uid]);

  const ui: UIActions = useMemo(() => ({
    go,
    openJobForm: (o) => setJobForm({ open: true, ...o }),
    openCustomerForm: (customer) => setCustomerForm({ open: true, customer }),
    openSiteForm: (o) => setSiteForm({ open: true, ...o }),
    openInvite: () => setInviteOpen(true),
    openInbox: (messageId) => setInbox({ open: true, messageId }),
    nextStep,
    setNextStep,
  }), [go, nextStep]);

  const openLink = (kind: 'invite' | 'reset', messageId: string) => {
    inboxApi.markRead(messageId);
    setInbox({ open: false });
    setFlow({ kind, messageId });
  };

  const doReset = () => {
    demo.reset();
    closeAll();
    setFlow(null);
    setResetOpen(false);
    setLoginEmail('');
    go({ name: 'dashboard' });
    toast.success('Demo reset', { description: 'The original sample data has been restored.' });
  };

  let screen: React.ReactNode;
  if (flow?.kind === 'invite') {
    screen = (
      <AcceptInvitationScreen messageId={flow.messageId} hasSession={!!user} sessionName={user?.name}
        onClose={() => setFlow(null)}
        onSignInAs={(email) => { setFlow(null); setLoginEmail(email); }} />
    );
  } else if (flow?.kind === 'reset') {
    screen = <ResetPasswordScreen messageId={flow.messageId} onClose={(email) => { setFlow(null); if (email && !user) setLoginEmail(email); }} />;
  } else if (!user) {
    screen = <AuthScreen key={loginEmail} initialEmail={loginEmail} />;
  } else {
    let content: React.ReactNode;
    switch (view.name) {
      case 'jobs': content = <JobsView key={view.status ?? 'all'} initialStatus={view.status} />; break;
      case 'job': content = <JobDetailView key={view.id} id={view.id} />; break;
      case 'customers': content = <CustomersView />; break;
      case 'customer': content = <CustomerDetailView key={view.id} id={view.id} />; break;
      case 'team': content = <TeamView />; break;
      case 'activity': content = <ActivityView />; break;
      case 'account': content = <AccountView />; break;
      default: content = <DashboardView />;
    }
    screen = <Shell view={view}>{content}</Shell>;
  }

  return (
    <UICtx.Provider value={ui}>
      <DemoBar onOpenInbox={() => setInbox({ open: true })} onReset={() => setResetOpen(true)} onSwitched={() => { setFlow(null); go({ name: 'dashboard' }); }} />
      {screen}
      {user && (
        <>
          <JobFormModal open={jobForm.open} job={jobForm.job} presetCustomerId={jobForm.customerId} presetSiteId={jobForm.siteId}
            onClose={() => setJobForm({ open: false })}
            onSaved={(j, created) => { setNextStep(null); if (created) go({ name: 'job', id: j.id }); }} />
          <CustomerFormModal open={customerForm.open} customer={customerForm.customer} onClose={() => setCustomerForm({ open: false })}
            onSaved={(c, created) => { if (created) { setNextStep({ kind: 'add-site', customerId: c.id }); go({ name: 'customer', id: c.id }); } }} />
          <SiteFormModal open={siteForm.open} presetCustomerId={siteForm.customerId} site={siteForm.site} onClose={() => setSiteForm({ open: false })}
            onSaved={(s, created) => { if (created) { setNextStep({ kind: 'create-job', customerId: s.customerId, siteId: s.id }); go({ name: 'customer', id: s.customerId }); } }} />
          <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onOpenInbox={(mid) => { setInviteOpen(false); setInbox({ open: true, messageId: mid }); }} />
        </>
      )}
      <DemoInbox open={inbox.open} initialMessageId={inbox.messageId} onClose={() => setInbox({ open: false })} onOpenLink={openLink} />
      <ConfirmDialog open={resetOpen} title="Reset the demo?" confirmLabel="Reset demo" danger
        body={<>This restores the original sample customers, jobs, notes and team, clears the demo inbox, and signs you out. Anything created during this session will be removed.</>}
        onConfirm={doReset} onCancel={() => setResetOpen(false)} />
    </UICtx.Provider>
  );
};

export default AppLayout;
