import React from 'react';
import { ArrowRight, Briefcase, ChevronRight, KeyRound, Mail, MapPin, Pencil, Phone, Plus, StickyNote, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { jobRow, siteAddress, useDb } from '@/lib/store';
import { fmtDate } from '@/lib/format';
import { AccessDenied, Button, Card, CardHeader, EmptyState, PageHeader } from './ui';
import { JobListItem } from './ListItems';

function NextStepBanner({ title, body, action, onDismiss }: { title: string; body: string; action: React.ReactNode; onDismiss: () => void }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:mb-6 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-amber-950"><ArrowRight className="h-4 w-4" aria-hidden />{title}</div>
        <p className="mt-0.5 text-sm text-amber-950/80">{body}</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 sm:flex-none [&>button]:w-full">{action}</div>
        <button onClick={onDismiss} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-amber-900 hover:bg-amber-100 sm:h-10 sm:w-10" aria-label="Dismiss"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function CustomerDetailView({ id }: { id: string }) {
  const db = useDb();
  const { can } = useAuth();
  const { go, openCustomerForm, openSiteForm, openJobForm, nextStep, setNextStep } = useUI();

  if (!can('customers.manage')) return <AccessDenied body="Technicians see customer and site details on the jobs assigned to them." action={<Button variant="secondary" onClick={() => go({ name: 'jobs' })}>Go to my jobs</Button>} />;

  const c = db.customers.find((x) => x.id === id);
  if (!c) return <AccessDenied title="Customer not found" body="This customer may have been removed when the demo was reset." action={<Button variant="secondary" onClick={() => go({ name: 'customers' })}>Back to customers</Button>} />;

  const sites = db.sites.filter((s) => s.customerId === c.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const jobs = db.jobs.filter((j) => j.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((j) => jobRow(db, j));
  const canJobs = can('jobs.manage');

  const showAddSite = nextStep?.kind === 'add-site' && nextStep.customerId === c.id && sites.length === 0;
  const stepSite = nextStep?.kind === 'create-job' && nextStep.customerId === c.id ? sites.find((s) => s.id === nextStep.siteId) : undefined;

  const primary = sites.length === 0
    ? <Button onClick={() => openSiteForm({ customerId: c.id })}><Plus className="h-4 w-4" aria-hidden /> Add site</Button>
    : canJobs ? <Button onClick={() => openJobForm({ customerId: c.id })}><Plus className="h-4 w-4" aria-hidden /> Create job</Button> : null;

  return (
    <div>
      <PageHeader
        crumbs={<nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1"><button onClick={() => go({ name: 'customers' })} className="font-medium hover:text-navy-900 hover:underline">Customers</button><ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{c.name}</span></nav>}
        title={c.name}
        subtitle={`Customer since ${fmtDate(c.createdAt)} · ${sites.length} ${sites.length === 1 ? 'site' : 'sites'} · ${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`}
        action={<><Button variant="secondary" onClick={() => openCustomerForm(c)}><Pencil className="h-4 w-4" aria-hidden /> Edit customer</Button>{primary}</>}
      />

      {showAddSite && (
        <NextStepBanner title="Customer created — next, add a job site" body="Jobs are tied to a site, so add the address where the work will happen."
          action={<Button onClick={() => openSiteForm({ customerId: c.id })}><Plus className="h-4 w-4" aria-hidden /> Add site</Button>}
          onDismiss={() => setNextStep(null)} />
      )}
      {stepSite && canJobs && (
        <NextStepBanner title={`Site “${stepSite.name}” added — next, create a job`} body="The customer and site will be filled in for you."
          action={<Button onClick={() => openJobForm({ customerId: c.id, siteId: stepSite.id })}><Plus className="h-4 w-4" aria-hidden /> Create job</Button>}
          onDismiss={() => setNextStep(null)} />
      )}

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5">
        <div className="space-y-5 sm:space-y-6 lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Contact</h2>
            <ul className="space-y-1 text-[15px]">
              <li className="flex items-center gap-2.5 py-1 text-stone-800"><UserIcon className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />{c.contactName ?? <span className="text-stone-500">No contact name</span>}</li>
              <li>{c.phone ? <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="flex min-h-[40px] items-center gap-2.5 text-navy-800 hover:underline"><Phone className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />{c.phone}</a>
                : <span className="flex min-h-[40px] items-center gap-2.5 text-stone-500"><Phone className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />No phone</span>}</li>
              <li>{c.email ? <a href={`mailto:${c.email}`} className="flex min-h-[40px] min-w-0 items-center gap-2.5 text-navy-800 hover:underline"><Mail className="h-4 w-4 shrink-0 text-stone-400" aria-hidden /><span className="truncate">{c.email}</span></a>
                : <span className="flex min-h-[40px] items-center gap-2.5 text-stone-500"><Mail className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />No email</span>}</li>
            </ul>
            {c.notes && <div className="mt-3 flex gap-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-700 ring-1 ring-stone-200"><StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" aria-hidden /><p className="whitespace-pre-wrap">{c.notes}</p></div>}
          </Card>

          <Card>
            <CardHeader title="Job sites" icon={<MapPin className="h-4 w-4" />} count={sites.length}
              action={sites.length > 0 && <Button size="sm" variant="secondary" onClick={() => openSiteForm({ customerId: c.id })}><Plus className="h-4 w-4" aria-hidden /> Add site</Button>} />
            {sites.length === 0 ? (
              <EmptyState icon={<MapPin className="h-5 w-5" />} title="No sites yet" body="Add the first service location for this customer."
                action={<Button onClick={() => openSiteForm({ customerId: c.id })}><Plus className="h-4 w-4" aria-hidden /> Add site</Button>} />
            ) : (
              <ul className="divide-y divide-stone-100">
                {sites.map((s) => {
                  const addr = siteAddress(s);
                  return (
                    <li key={s.id} className="px-4 py-4 sm:px-5">
                      <div className="text-[15px] font-semibold text-navy-950">{s.name}</div>
                      <div className="mt-0.5 text-sm text-stone-700">{addr || <span className="text-stone-500">No address on file</span>}</div>
                      {s.accessInstructions && <div className="mt-2 flex gap-1.5 text-sm text-amber-900"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{s.accessInstructions}</div>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {canJobs && <Button size="sm" variant="secondary" onClick={() => openJobForm({ customerId: c.id, siteId: s.id })}><Plus className="h-4 w-4" aria-hidden /> Create job here</Button>}
                        <Button size="sm" variant="ghost" onClick={() => openSiteForm({ site: s })}><Pencil className="h-4 w-4" aria-hidden /> Edit site</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit lg:col-span-3">
          <CardHeader title="Jobs" icon={<Briefcase className="h-4 w-4" />} count={jobs.length} />
          {jobs.length === 0 ? (
            <EmptyState icon={<Briefcase className="h-5 w-5" />} title="No jobs for this customer yet"
              body={sites.length === 0 ? 'Add a site first, then create a job there.' : 'Create the first job for this customer.'}
              action={sites.length > 0 && canJobs ? <Button onClick={() => openJobForm({ customerId: c.id })}><Plus className="h-4 w-4" aria-hidden /> Create job</Button> : undefined} />
          ) : (
            <ul className="divide-y divide-stone-100">{jobs.map((j) => <JobListItem key={j.id} job={j} showCustomer={false} />)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
