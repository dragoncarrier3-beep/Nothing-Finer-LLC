import React, { useState } from 'react';
import { Briefcase, Plus, Search, SearchX, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useDb, visibleJobs } from '@/lib/store';
import { JOB_STATUSES, JOB_STATUS_LABEL } from '@/lib/constants';
import type { JobStatus } from '@/lib/types';
import { Button, Card, EmptyState, Input, PageHeader, Select, cx } from './ui';
import { JobListItem } from './ListItems';

export default function JobsView({ initialStatus }: { initialStatus?: JobStatus }) {
  const db = useDb();
  const { user, can } = useAuth();
  const { openJobForm } = useUI();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<JobStatus | 'all'>(initialStatus ?? 'all');
  const [tech, setTech] = useState('all');
  const manager = can('jobs.view_all');

  const all = visibleJobs(db, user);
  const techOptions = db.users.filter((u) => u.role === 'tech' && u.status !== 'pending').sort((a, b) => a.name.localeCompare(b.name));

  const term = q.trim().toLowerCase();
  const matchesSearchAndTech = all.filter((j) =>
    (!term || `${j.number} ${j.title} ${j.customer?.name ?? ''}`.toLowerCase().includes(term))
    && (!manager || tech === 'all' || (tech === 'unassigned' ? !j.assignedTo : j.assignedTo === tech)));
  const rows = matchesSearchAndTech.filter((j) => status === 'all' || j.status === status);
  const countFor = (s: JobStatus | 'all') => matchesSearchAndTech.filter((j) => s === 'all' || j.status === s).length;
  const filtersActive = !!term || status !== 'all' || (manager && tech !== 'all');
  const clear = () => { setQ(''); setStatus('all'); setTech('all'); };

  return (
    <div>
      <PageHeader title={manager ? 'Jobs' : 'My jobs'} subtitle={manager ? `${all.length} jobs across all customers` : 'Only jobs assigned to you are shown.'}
        action={can('jobs.manage') && <Button onClick={() => openJobForm()}><Plus className="h-4 w-4" aria-hidden /> Create job</Button>} />

      <Card>
        <div className="space-y-3 border-b border-stone-200 p-4 sm:p-5">
          <div className={cx('grid grid-cols-1 gap-3', manager && 'md:grid-cols-[minmax(0,1fr)_220px]')}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search job number, title or customer" aria-label="Search jobs" className="pl-9 pr-10" type="search" />
              {q && <button onClick={() => setQ('')} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </div>
            {manager && (
              <Select value={tech} onChange={(e) => setTech(e.target.value)} aria-label="Filter by technician">
                <option value="all">All technicians</option>
                <option value="unassigned">Unassigned</option>
                {techOptions.map((t) => <option key={t.id} value={t.id}>{t.name}{t.status === 'inactive' ? ' (deactivated)' : ''}</option>)}
              </Select>
            )}
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Filter by status">
            {(['all', ...JOB_STATUSES] as const).map((s) => (
              <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
                className={cx('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors',
                  status === s ? 'bg-navy-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200')}>
                {s === 'all' ? 'All' : JOB_STATUS_LABEL[s]}
                <span className={cx('rounded-full px-1.5 text-xs tabular-nums', status === s ? 'bg-white/20' : 'bg-white text-stone-600')}>{countFor(s)}</span>
              </button>
            ))}
          </div>
        </div>

        {all.length === 0 ? (
          <EmptyState icon={<Briefcase className="h-5 w-5" />} title={manager ? 'No jobs yet' : 'No jobs assigned to you yet'}
            body={manager ? 'Create the first job to start tracking work.' : 'When the office assigns you a job, it will appear here.'}
            action={can('jobs.manage') ? <Button onClick={() => openJobForm()}><Plus className="h-4 w-4" aria-hidden /> Create job</Button> : undefined} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<SearchX className="h-5 w-5" />} title="No jobs match these filters"
            body={term ? <>Nothing found for “{q.trim()}”. Try a job number like NF-1038, a title, or a customer name.</> : 'Try a different status or technician.'}
            action={filtersActive ? <Button variant="secondary" onClick={clear}>Clear filters</Button> : undefined} />
        ) : (
          <ul className="divide-y divide-stone-100">{rows.map((j) => <JobListItem key={j.id} job={j} showAssignee={manager} />)}</ul>
        )}
      </Card>
    </div>
  );
}
