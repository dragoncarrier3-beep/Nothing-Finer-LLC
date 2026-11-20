import React, { useState } from 'react';
import { Building2, ChevronRight, MapPin, Phone, Plus, Search, SearchX, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { siteAddress, useDb } from '@/lib/store';
import { AccessDenied, Button, Card, EmptyState, Input, PageHeader } from './ui';

export default function CustomersView() {
  const db = useDb();
  const { can } = useAuth();
  const { go, openCustomerForm } = useUI();
  const [q, setQ] = useState('');

  if (!can('customers.manage')) return <AccessDenied body="Technicians see customer and site details on the jobs assigned to them." action={<Button variant="secondary" onClick={() => go({ name: 'jobs' })}>Go to my jobs</Button>} />;

  const term = q.trim().toLowerCase();
  const rows = [...db.customers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => {
      const sites = db.sites.filter((s) => s.customerId === c.id);
      const jobs = db.jobs.filter((j) => j.customerId === c.id);
      return { c, sites, total: jobs.length, open: jobs.filter((j) => j.status !== 'completed').length };
    })
    .filter(({ c, sites }) => !term || [c.name, c.contactName, c.phone, c.email, ...sites.map((s) => `${s.name} ${siteAddress(s)}`)].some((v) => v?.toLowerCase().includes(term)));

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${db.customers.length} customers · each can have several job sites`}
        action={<Button onClick={() => openCustomerForm()}><Plus className="h-4 w-4" aria-hidden /> Add customer</Button>} />
      <Card>
        <div className="border-b border-stone-200 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, contact, phone, email or address" aria-label="Search customers" className="pl-9 pr-10" />
            {q && <button onClick={() => setQ('')} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        {db.customers.length === 0 ? (
          <EmptyState icon={<Building2 className="h-5 w-5" />} title="No customers yet" body="Add your first customer, then add the sites where you work for them."
            action={<Button onClick={() => openCustomerForm()}><Plus className="h-4 w-4" aria-hidden /> Add customer</Button>} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<SearchX className="h-5 w-5" />} title="No customers match" body={<>Nothing found for “{q.trim()}”.</>}
            action={<Button variant="secondary" onClick={() => setQ('')}>Clear search</Button>} />
        ) : (
          <ul className="divide-y divide-stone-100">
            {rows.map(({ c, sites, total, open }) => (
              <li key={c.id}>
                <button onClick={() => go({ name: 'customer', id: c.id })} className="group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 active:bg-stone-100 sm:px-5">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 sm:flex"><Building2 className="h-5 w-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-navy-950">{c.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-stone-600">
                      {c.contactName && <span className="truncate">{c.contactName}</span>}
                      {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-stone-400" aria-hidden />{c.phone}</span>}
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-stone-400" aria-hidden />{sites.length} {sites.length === 1 ? 'site' : 'sites'}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm">
                    <span className="block font-semibold tabular-nums text-navy-950">{total} {total === 1 ? 'job' : 'jobs'}</span>
                    {open > 0 && <span className="block text-xs text-stone-500">{open} open</span>}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-stone-400 group-hover:text-navy-700 sm:block" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
