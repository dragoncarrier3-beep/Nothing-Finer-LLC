import React from 'react';
import { Activity as ActivityIcon, Briefcase, Building2, ChevronRight, MapPin, MessageSquare, UserPlus } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';
import { relTime, fmtDateTime } from '@/lib/format';
import type { Activity, View } from '@/lib/types';
import type { JobRow } from '@/lib/store';
import { PriorityBadge, StatusBadge, cx } from './ui';

export function JobListItem({ job, showAssignee = true, showCustomer = true }: { job: JobRow; showAssignee?: boolean; showCustomer?: boolean }) {
  const { go } = useUI();
  return (
    <li>
      <button onClick={() => go({ name: 'job', id: job.id })} className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-stone-50 active:bg-stone-100 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-semibold tabular-nums text-stone-500">{job.number}</span>
            <PriorityBadge priority={job.priority} />
          </div>
          <div className="mt-0.5 line-clamp-2 text-[15px] font-semibold text-navy-950">{job.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-stone-600">
            {showCustomer && <span className="inline-flex min-w-0 items-center gap-1"><Building2 className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden /><span className="truncate">{job.customer?.name ?? 'Unknown customer'}</span></span>}
            <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden /><span className="truncate">{job.site?.name ?? '—'}</span></span>
            {showAssignee && <span className={cx('truncate', !job.assignee && 'text-stone-500')}>{job.assignee?.name ?? 'Unassigned'}</span>}
            {job.noteCount > 0 && <span className="inline-flex items-center gap-1 text-stone-500"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{job.noteCount}<span className="sr-only"> notes</span></span>}
          </div>
        </div>
        <StatusBadge status={job.status} />
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-stone-400 group-hover:text-navy-700 sm:block" aria-hidden />
      </button>
    </li>
  );
}

const hrefFor = (v: View) => (v.name === 'job' ? `#/jobs/${v.id}` : v.name === 'customer' ? `#/customers/${v.id}` : `#/${v.name}`);

function targetView(a: Activity): View | null {
  switch (a.targetType) {
    case 'job': return a.targetId ? { name: 'job', id: a.targetId } : null;
    case 'customer': return a.targetId ? { name: 'customer', id: a.targetId } : null;
    case 'site': return a.customerId ? { name: 'customer', id: a.customerId } : null;
    case 'user': return { name: 'team' };
    default: return a.action === 'user.activated' ? { name: 'team' } : null;
  }
}

const iconFor = (a: Activity) => {
  if (a.action.startsWith('user')) return UserPlus;
  if (a.action.startsWith('customer') || a.action.startsWith('site')) return Building2;
  if (a.action === 'note.added') return MessageSquare;
  if (a.action.startsWith('job')) return Briefcase;
  return ActivityIcon;
};

/** "Jordan Lee created job NF-1042 — Panel replacement." with the record linked. */
export function ActivitySentence({ a, canOpen }: { a: Activity; canOpen: boolean }) {
  const { go } = useUI();
  const v = targetView(a);
  return (
    <span className="text-[15px] leading-snug text-stone-700">
      <span className="font-semibold text-navy-950">{a.actorName}</span> {a.verb}
      {a.targetLabel && <> {v && canOpen
        ? <a href={hrefFor(v)} onClick={(e) => { e.preventDefault(); go(v); }} className="font-semibold text-navy-800 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500">{a.targetLabel}</a>
        : <span className="font-semibold text-navy-900">{a.targetLabel}</span>}</>}
      {a.detail && <> {a.detail}</>}.
    </span>
  );
}

export function ActivityListItem({ a, canOpen = true }: { a: Activity; canOpen?: boolean }) {
  const Icon = iconFor(a);
  return (
    <li className="flex gap-3 px-4 py-3 sm:px-5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600"><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <ActivitySentence a={a} canOpen={canOpen} />
        <div className="mt-0.5 text-xs text-stone-500"><time dateTime={a.at} title={fmtDateTime(a.at)}>{relTime(a.at)} · {fmtDateTime(a.at)}</time></div>
      </div>
    </li>
  );
}
