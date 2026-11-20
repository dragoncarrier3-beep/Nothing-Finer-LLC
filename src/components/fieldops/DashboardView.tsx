import React from 'react';
import { Activity, Briefcase, Building2, CheckCircle2, CircleDot, Inbox, Loader, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useDb, visibleJobs } from '@/lib/store';
import type { JobStatus, View } from '@/lib/types';
import { Button, Card, CardHeader, EmptyState, PageHeader, cx } from './ui';
import { ActivityListItem, JobListItem } from './ListItems';

function StatTile({ label, value, icon: Icon, tone, onClick }: { label: string; value: number; icon: React.ElementType; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-stone-200 bg-white p-4 text-left transition-colors hover:border-stone-300 hover:bg-stone-50 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-stone-600">{label}</span>
        <Icon className={cx('h-5 w-5', tone)} aria-hidden />
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-navy-950">{value}</div>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardView() {
  const db = useDb();
  const { user, can } = useAuth();
  const { go, openJobForm, openCustomerForm, openInvite } = useUI();
  if (!user) return null;

  const jobs = visibleJobs(db, user);
  const count = (s?: JobStatus) => jobs.filter((j) => !s || j.status === s).length;
  const toJobs = (status?: JobStatus) => () => go({ name: 'jobs', status } as View);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const first = user.name.split(' ')[0];

  // ---------------- Technician view: only their assigned work
  if (!can('jobs.view_all')) {
    const order: Record<JobStatus, number> = { in_progress: 0, new: 1, completed: 2 };
    const mine = [...jobs].sort((a, b) => order[a.status] - order[b.status] || b.updatedAt.localeCompare(a.updatedAt));
    return (
      <div>
        <PageHeader title={`${greeting()}, ${first}`} subtitle={`${today} · Jobs assigned to you`} />
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatTile label="New" value={count('new')} icon={CircleDot} tone="text-sky-600" onClick={toJobs('new')} />
          <StatTile label="In progress" value={count('in_progress')} icon={Loader} tone="text-amber-600" onClick={toJobs('in_progress')} />
          <StatTile label="Completed" value={count('completed')} icon={CheckCircle2} tone="text-emerald-600" onClick={toJobs('completed')} />
        </div>
        <Card className="mt-5 sm:mt-6">
          <CardHeader title="My assigned jobs" icon={<Briefcase className="h-4 w-4" />} count={mine.length} />
          {mine.length === 0 ? (
            <EmptyState icon={<Inbox className="h-5 w-5" />} title="No jobs assigned yet"
              body="When the office assigns you a job, it will show up here with the customer, site address and access instructions." />
          ) : (
            <ul className="divide-y divide-stone-100">{mine.map((j) => <JobListItem key={j.id} job={j} showAssignee={false} />)}</ul>
          )}
        </Card>
      </div>
    );
  }

  // ---------------- Owner / admin view
  const recentJobs = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const recentActivity = db.activity.slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`${greeting()}, ${first} · ${today}`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total jobs" value={count()} icon={Briefcase} tone="text-navy-600" onClick={toJobs()} />
        <StatTile label="New" value={count('new')} icon={CircleDot} tone="text-sky-600" onClick={toJobs('new')} />
        <StatTile label="In progress" value={count('in_progress')} icon={Loader} tone="text-amber-600" onClick={toJobs('in_progress')} />
        <StatTile label="Completed" value={count('completed')} icon={CheckCircle2} tone="text-emerald-600" onClick={toJobs('completed')} />
      </div>

      <Card className="mt-5 p-4 sm:mt-6 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-stone-600">Quick actions</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {can('jobs.manage') && <Button onClick={() => openJobForm()} className="w-full"><Plus className="h-4 w-4" aria-hidden /> Create job</Button>}
          {can('customers.manage') && <Button variant="secondary" onClick={() => openCustomerForm()} className="w-full"><Building2 className="h-4 w-4" aria-hidden /> Add customer</Button>}
          {can('team.invite') && <Button variant="secondary" onClick={openInvite} className="w-full"><UserPlus className="h-4 w-4" aria-hidden /> Invite technician</Button>}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Recent jobs" icon={<Briefcase className="h-4 w-4" />}
            action={<Button variant="ghost" size="sm" onClick={toJobs()}>View all</Button>} />
          {recentJobs.length === 0
            ? <EmptyState icon={<Briefcase className="h-5 w-5" />} title="No jobs yet" body="Create the first job to see it here." />
            : <ul className="divide-y divide-stone-100">{recentJobs.map((j) => <JobListItem key={j.id} job={j} />)}</ul>}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" icon={<Activity className="h-4 w-4" />}
            action={can('activity.view') && <Button variant="ghost" size="sm" onClick={() => go({ name: 'activity' })}>View all</Button>} />
          {recentActivity.length === 0
            ? <EmptyState icon={<Activity className="h-5 w-5" />} title="No activity yet" />
            : <ul className="divide-y divide-stone-100">{recentActivity.map((a) => <ActivityListItem key={a.id} a={a} />)}</ul>}
        </Card>
      </div>
    </div>
  );
}
