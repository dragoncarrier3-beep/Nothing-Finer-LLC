import React, { useLayoutEffect as useEffect, useState } from 'react';
import { toast } from 'sonner';
import { activeTechs, DemoError, jobs as jobsApi, sitesFor, useDb } from '@/lib/store';
import { JOB_STATUSES, JOB_STATUS_LABEL } from '@/lib/constants';
import type { Job, JobPriority, JobStatus } from '@/lib/types';
import { Button, ErrorBanner, Field, Input, Modal, Segmented, Select, Textarea } from './ui';

type Errors = Record<string, string | undefined>;

export default function JobFormModal({ open, job, presetCustomerId, presetSiteId, onClose, onSaved }: {
  open: boolean; job?: Job; presetCustomerId?: string; presetSiteId?: string; onClose: () => void; onSaved?: (j: Job, created: boolean) => void;
}) {
  const db = useDb();
  const editing = !!job;
  const [form, setForm] = useState({ title: '', customerId: '', siteId: '', assignedTo: '', description: '', priority: 'normal' as JobPriority, status: 'new' as JobStatus });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const customerList = [...db.customers].sort((a, b) => a.name.localeCompare(b.name));
  const sites = form.customerId ? sitesFor(db, form.customerId) : [];
  const techs = activeTechs(db);
  // Keep a deactivated assignee visible when editing an older job, so the select doesn't silently change.
  const currentAssignee = job?.assignedTo && !techs.some((t) => t.id === job.assignedTo) ? db.users.find((u) => u.id === job.assignedTo) : undefined;

  useEffect(() => {
    if (!open) return;
    if (job) {
      setForm({ title: job.title, customerId: job.customerId, siteId: job.siteId, assignedTo: job.assignedTo ?? '', description: job.description ?? '', priority: job.priority, status: job.status });
    } else {
      const cid = presetCustomerId ?? '';
      const own = cid ? sitesFor(db, cid) : [];
      const sid = presetSiteId && own.some((s) => s.id === presetSiteId) ? presetSiteId : own.length === 1 ? own[0].id : '';
      setForm({ title: '', customerId: cid, siteId: sid, assignedTo: '', description: '', priority: 'normal', status: 'new' });
    }
    setErrors({}); setFormError(null);
  }, [open, job, presetCustomerId, presetSiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCustomer = (customerId: string) => {
    const own = customerId ? sitesFor(db, customerId) : [];
    setForm((f) => ({
      ...f,
      customerId,
      // Clear a site that doesn't belong to the newly chosen customer; pick the only site automatically.
      siteId: own.some((s) => s.id === f.siteId) ? f.siteId : own.length === 1 ? own[0].id : '',
    }));
    setErrors((e) => ({ ...e, customerId: undefined, siteId: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!form.title.trim()) errs.title = 'Enter a job title.';
    if (!form.customerId) errs.customerId = 'Choose a customer.';
    if (!form.siteId) errs.siteId = form.customerId && sites.length === 0 ? 'This customer has no sites yet. Add a site first.' : 'Choose a job site.';
    setErrors(errs); setFormError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const j = editing ? await jobsApi.update(job!.id, form) : await jobsApi.create(form);
      toast.success(editing ? `${j.number} updated` : `${j.number} created`, { description: j.title });
      onClose();
      onSaved?.(j, !editing);
    } catch (err) {
      if (err instanceof DemoError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof Error ? err.message : 'Could not save the job.');
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit ${job!.number}` : 'Create job'} subtitle={editing ? job!.title : 'A job number is assigned automatically.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="job-form" type="submit" loading={busy}>{editing ? 'Save changes' : 'Create job'}</Button></>}>
      <form id="job-form" onSubmit={submit} noValidate className="space-y-4">
        <ErrorBanner message={formError} />
        <Field label="Job title" htmlFor="jf-title" required error={errors.title}>
          <Input id="jf-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} invalid={!!errors.title} placeholder="e.g. Panel replacement" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="jf-customer" required error={errors.customerId}>
            <Select id="jf-customer" value={form.customerId} onChange={(e) => changeCustomer(e.target.value)} invalid={!!errors.customerId}>
              <option value="">Choose a customer…</option>
              {customerList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Job site" htmlFor="jf-site" required error={errors.siteId}
            hint={!form.customerId ? 'Choose a customer first.' : sites.length === 0 ? 'This customer has no sites yet.' : undefined}>
            <Select id="jf-site" value={form.siteId} onChange={(e) => { setForm({ ...form, siteId: e.target.value }); setErrors((x) => ({ ...x, siteId: undefined })); }} disabled={!form.customerId || sites.length === 0} invalid={!!errors.siteId}>
              <option value="">{form.customerId ? 'Choose a site…' : '—'}</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}{s.address ? ` — ${s.address}` : ''}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Assigned technician" htmlFor="jf-tech" optional>
          <Select id="jf-tech" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} invalid={!!errors.assignedTo}>
            <option value="">Unassigned</option>
            {currentAssignee && <option value={currentAssignee.id} disabled>{currentAssignee.name} (deactivated)</option>}
            {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          {errors.assignedTo && <p className="mt-1.5 text-sm text-red-700">{errors.assignedTo}</p>}
        </Field>
        <Field label="Description" htmlFor="jf-desc" optional>
          <Textarea id="jf-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to be done, materials, permit details…" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_3fr]">
          <Field label="Priority">
            <Segmented label="Priority" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })}
              options={[{ value: 'normal', label: 'Normal' }, { value: 'urgent', label: 'Urgent', tone: 'text-red-700' }]} />
          </Field>
          <Field label="Status">
            <Segmented label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })}
              options={JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABEL[s] }))} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
