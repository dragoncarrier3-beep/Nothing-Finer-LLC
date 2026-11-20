import React, { useState } from 'react';
import { Activity, Search, SearchX, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { useDb } from '@/lib/store';
import type { Activity as Entry } from '@/lib/types';
import { AccessDenied, Button, Card, EmptyState, Input, PageHeader, Select } from './ui';
import { ActivityListItem } from './ListItems';

const TYPES: { k: string; l: string; match: (a: Entry) => boolean }[] = [
  { k: 'all', l: 'All activity', match: () => true },
  { k: 'jobs', l: 'Jobs', match: (a) => a.action.startsWith('job') },
  { k: 'notes', l: 'Notes', match: (a) => a.action === 'note.added' },
  { k: 'customers', l: 'Customers & sites', match: (a) => a.action.startsWith('customer') || a.action.startsWith('site') },
  { k: 'team', l: 'Team', match: (a) => a.action.startsWith('user') },
];

export default function ActivityView() {
  const db = useDb();
  const { can } = useAuth();
  const { go } = useUI();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [actor, setActor] = useState('all');

  if (!can('activity.view')) return <AccessDenied body="The organization-wide activity log is available to the owner and admins." action={<Button variant="secondary" onClick={() => go({ name: 'dashboard' })}>Back to dashboard</Button>} />;

  const actors = Array.from(new Set(db.activity.map((a) => a.actorName))).sort();
  const t = TYPES.find((x) => x.k === type) ?? TYPES[0];
  const term = q.trim().toLowerCase();
  const rows = db.activity.filter((a) => t.match(a) && (actor === 'all' || a.actorName === actor)
    && (!term || `${a.actorName} ${a.verb} ${a.targetLabel ?? ''} ${a.detail ?? ''}`.toLowerCase().includes(term)));

  return (
    <div>
      <PageHeader title="Activity" subtitle="A running record of who did what, and when." />
      <Card>
        <div className="grid grid-cols-1 gap-3 border-b border-stone-200 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity" aria-label="Search activity" className="pl-9 pr-10" />
            {q && <button onClick={() => setQ('')} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
            {TYPES.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}
          </Select>
          <Select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Filter by person">
            <option value="all">Everyone</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        {db.activity.length === 0 ? (
          <EmptyState icon={<Activity className="h-5 w-5" />} title="No activity yet" />
        ) : rows.length === 0 ? (
          <EmptyState icon={<SearchX className="h-5 w-5" />} title="No activity matches these filters"
            action={<Button variant="secondary" onClick={() => { setQ(''); setType('all'); setActor('all'); }}>Clear filters</Button>} />
        ) : (
          <>
            <ul className="divide-y divide-stone-100">{rows.map((a) => <ActivityListItem key={a.id} a={a} />)}</ul>
            <div className="border-t border-stone-200 px-4 py-3 text-xs text-stone-500 sm:px-5">{rows.length} of {db.activity.length} entries</div>
          </>
        )}
      </Card>
    </div>
  );
}
