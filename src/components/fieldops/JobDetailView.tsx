import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ClipboardList, KeyRound, Mail, MapPin, MessageSquare, Navigation, Pencil, Phone, Send, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { activeTechs, canAddNote, canViewJob, jobRow, jobs as jobsApi, siteAddress, useDb, userById } from '@/lib/store';
import { JOB_STATUSES, JOB_STATUS_LABEL, ROLE_LABEL } from '@/lib/constants';
import { fmtDateTime, relTime } from '@/lib/format';
import type { JobStatus } from '@/lib/types';
import { AccessDenied, Avatar, Button, Card, CardHeader, EmptyState, ErrorBanner, PageHeader, PriorityBadge, RoleBadge, Segmented, Select, StatusBadge, Textarea } from './ui';

export default function JobDetailView({ id }: { id: string }) {
  const db = useDb();
  const { user, can } = useAuth();
  const { go, openJobForm } = useUI();
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [saving, setSaving] = useState<null | 'status' | 'tech'>(null);
  const lastNoteRef = useRef<HTMLLIElement>(null);
  const prevCount = useRef<number | null>(null);

  const raw = db.jobs.find((j) => j.id === id);
  const visible = !!raw && canViewJob(user, raw);
  const notes = visible ? db.notes.filter((n) => n.jobId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : [];

  useEffect(() => {
    if (prevCount.current !== null && notes.length > prevCount.current) lastNoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    prevCount.current = notes.length;
  }, [notes.length]);

  // Technicians get the same response whether the job is missing or simply not theirs.
  if (!visible) {
    const manager = can('jobs.view_all');
    return (
      <AccessDenied
        title={manager ? 'Job not found' : 'You don’t have access to this job'}
        body={manager ? 'This job may have been removed when the demo was reset.' : 'Technicians can only open jobs assigned to them.'}
        action={<Button variant="secondary" onClick={() => go({ name: 'jobs' })}>Back to {manager ? 'jobs' : 'my jobs'}</Button>} />
    );
  }

  const job = jobRow(db, raw);
  const { customer, site, assignee } = job;
  const createdBy = userById(db, job.createdBy);
  const manager = can('jobs.manage');
  const techs = activeTechs(db);
  const address = siteAddress(site);

  const changeStatus = async (s: JobStatus) => {
    if (s === job.status) return;
    setSaving('status');
    try { await jobsApi.setStatus(job.id, s); toast.success(`${job.number} marked ${JOB_STATUS_LABEL[s]}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the status.'); }
    finally { setSaving(null); }
  };

  const changeTech = async (techId: string) => {
    setSaving('tech');
    try {
      await jobsApi.assign(job.id, techId);
      toast.success(techId ? `Assigned to ${userById(db, techId)?.name}` : `${job.number} is now unassigned`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not change the assignment.'); }
    finally { setSaving(null); }
  };

  const postNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (posting) return;
    if (!note.trim()) { setNoteError('Write something before adding the note.'); return; }
    setNoteError(null); setPosting(true);
    try {
      await jobsApi.addNote(job.id, note);
      setNote('');
      toast.success('Note added');
    } catch (err) { setNoteError(err instanceof Error ? err.message : 'Could not add the note.'); }
    finally { setPosting(false); }
  };

  return (
    <div>
      <PageHeader
        crumbs={<nav aria-label="Breadcrumb" className="flex items-center gap-1"><button onClick={() => go({ name: 'jobs' })} className="font-medium hover:text-navy-900 hover:underline">{can('jobs.view_all') ? 'Jobs' : 'My jobs'}</button><ChevronRight className="h-3.5 w-3.5" aria-hidden /><span className="tabular-nums">{job.number}</span></nav>}
        title={job.title}
        subtitle={<span className="mt-1 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold tabular-nums text-stone-600">{job.number}</span><StatusBadge status={job.status} /><PriorityBadge priority={job.priority} /></span>}
        action={manager && <Button variant="secondary" onClick={() => openJobForm({ job: raw })}><Pencil className="h-4 w-4" aria-hidden /> Edit job</Button>}
      />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-5 sm:space-y-6 lg:col-span-2">
          {/* Status & assignment */}
          <Card className="p-4 sm:p-5">
            {manager ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
                <div>
                  <div className="mb-1.5 text-sm font-medium text-navy-900">Status</div>
                  <Segmented label="Job status" value={job.status} onChange={changeStatus} options={JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABEL[s] }))} />
                </div>
                <div>
                  <label htmlFor="jd-tech" className="mb-1.5 block text-sm font-medium text-navy-900">Assigned technician</label>
                  <Select id="jd-tech" value={job.assignedTo ?? ''} onChange={(e) => changeTech(e.target.value)} disabled={saving === 'tech'}>
                    <option value="">Unassigned</option>
                    {assignee && !techs.some((t) => t.id === assignee.id) && <option value={assignee.id} disabled>{assignee.name} (deactivated)</option>}
                    {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-stone-500">Status</dt><dd className="mt-1"><StatusBadge status={job.status} /></dd></div>
                <div><dt className="text-stone-500">Assigned to</dt><dd className="mt-1 font-semibold text-navy-950">{assignee?.name ?? 'Unassigned'}</dd></div>
              </dl>
            )}
            <div className="mt-5 border-t border-stone-100 pt-4">
              <h2 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-navy-950"><ClipboardList className="h-4 w-4 text-amber-600" aria-hidden /> Description</h2>
              {job.description ? <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-800">{job.description}</p> : <p className="text-sm text-stone-500">No description.</p>}
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader title="Notes" icon={<MessageSquare className="h-4 w-4" />} count={notes.length} />
            {notes.length === 0 ? (
              <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No notes yet" body={canAddNote(user, raw) ? 'Add the first note below — what you found, what you did, what’s next.' : undefined} />
            ) : (
              <ol className="space-y-4 px-4 py-4 sm:px-5">
                {notes.map((n, i) => {
                  const author = userById(db, n.authorId);
                  return (
                    <li key={n.id} ref={i === notes.length - 1 ? lastNoteRef : undefined} className="flex gap-3">
                      <Avatar name={author?.name ?? '?'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-navy-950">{author?.name ?? 'Former team member'}</span>
                          {author && <RoleBadge role={author.role} />}
                          <time dateTime={n.createdAt} className="text-xs text-stone-500" title={fmtDateTime(n.createdAt)}>{fmtDateTime(n.createdAt)} · {relTime(n.createdAt)}</time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words rounded-lg bg-stone-50 px-3.5 py-2.5 text-[15px] leading-relaxed text-stone-800 ring-1 ring-stone-200">{n.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {canAddNote(user, raw) && (
              <form onSubmit={postNote} noValidate className="border-t border-stone-200 bg-stone-50/70 p-4 sm:rounded-b-xl sm:p-5">
                <label htmlFor="note-body" className="mb-1.5 block text-sm font-medium text-navy-900">Add a note as {user?.name} <span className="font-normal text-stone-500">({ROLE_LABEL[user!.role]})</span></label>
                <Textarea id="note-body" rows={3} value={note} maxLength={2000} invalid={!!noteError}
                  onChange={(e) => { setNote(e.target.value); if (noteError) setNoteError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postNote(); }}
                  placeholder="What you found, what you did, what’s next…" />
                {noteError && <div className="mt-2"><ErrorBanner message={noteError} /></div>}
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-stone-500">Notes are plain text and can’t be edited after posting. {note.length}/2000</span>
                  <Button type="submit" loading={posting} className="w-full sm:w-auto">{!posting && <Send className="h-4 w-4" aria-hidden />} {posting ? 'Saving…' : 'Add note'}</Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Customer, site and record details */}
        <div className="space-y-5 sm:space-y-6">
          <Card className="p-4 sm:p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Customer</h2>
            {customer ? (
              <>
                {can('customers.manage')
                  ? <button onClick={() => go({ name: 'customer', id: customer.id })} className="text-left text-base font-semibold text-navy-900 underline decoration-stone-300 underline-offset-2 hover:decoration-amber-500">{customer.name}</button>
                  : <div className="text-base font-semibold text-navy-950">{customer.name}</div>}
                <ul className="mt-3 space-y-1 text-[15px]">
                  {customer.contactName && <li className="flex items-center gap-2.5 py-1 text-stone-800"><UserIcon className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />{customer.contactName}</li>}
                  {customer.phone && <li><a href={`tel:${customer.phone.replace(/[^\d+]/g, '')}`} className="flex min-h-[40px] items-center gap-2.5 text-navy-800 hover:underline"><Phone className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />{customer.phone}</a></li>}
                  {customer.email && <li><a href={`mailto:${customer.email}`} className="flex min-h-[40px] min-w-0 items-center gap-2.5 text-navy-800 hover:underline"><Mail className="h-4 w-4 shrink-0 text-stone-400" aria-hidden /><span className="truncate">{customer.email}</span></a></li>}
                  {!customer.contactName && !customer.phone && !customer.email && <li className="text-sm text-stone-500">No contact details on file.</li>}
                </ul>
              </>
            ) : <p className="text-sm text-stone-500">Customer record unavailable.</p>}
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Job site</h2>
            <div className="text-base font-semibold text-navy-950">{site?.name ?? '—'}</div>
            {address ? <div className="mt-2 flex gap-2.5 text-[15px] text-stone-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />{address}</div>
              : <p className="mt-2 text-sm text-stone-500">No address on file.</p>}
            {site?.accessInstructions && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900"><KeyRound className="h-3.5 w-3.5" aria-hidden /> Access instructions</div>
                <p className="text-[15px] leading-relaxed text-amber-950">{site.accessInstructions}</p>
              </div>
            )}
            {address && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy-900 text-[15px] font-semibold text-white hover:bg-navy-800 sm:h-10 sm:text-sm">
                <Navigation className="h-4 w-4" aria-hidden /> Get directions
              </a>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-stone-500">Created by</dt><dd className="text-right font-medium text-navy-950">{createdBy?.name ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-500">Created</dt><dd className="text-right font-medium text-navy-950">{fmtDateTime(job.createdAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-stone-500">Last updated</dt><dd className="text-right font-medium text-navy-950">{relTime(job.updatedAt)}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
