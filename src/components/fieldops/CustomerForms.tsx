import React, { useLayoutEffect as useEffect, useState } from 'react';
import { toast } from 'sonner';
import { customers as customersApi, DemoError, EMAIL_RE, useDb } from '@/lib/store';
import type { Customer, Site } from '@/lib/types';
import { Button, ErrorBanner, Field, Input, Modal, Select, Textarea } from './ui';

type Errors = Record<string, string | undefined>;

export function CustomerFormModal({ open, customer, onClose, onSaved }: {
  open: boolean; customer?: Customer; onClose: () => void; onSaved?: (c: Customer, created: boolean) => void;
}) {
  const editing = !!customer;
  const empty = { name: '', contactName: '', phone: '', email: '', notes: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(customer ? { name: customer.name, contactName: customer.contactName ?? '', phone: customer.phone ?? '', email: customer.email ?? '', notes: customer.notes ?? '' } : empty);
    setErrors({}); setFormError(null);
  }, [open, customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Enter the customer or business name.';
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address, or leave it blank.';
    setErrors(errs); setFormError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const c = editing ? await customersApi.update(customer!.id, form) : await customersApi.create(form);
      toast.success(editing ? 'Customer updated' : 'Customer created', { description: c.name });
      onClose();
      onSaved?.(c, !editing);
    } catch (err) {
      if (err instanceof DemoError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof Error ? err.message : 'Could not save the customer.');
    } finally { setBusy(false); }
  };

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit customer' : 'Add customer'} subtitle={editing ? customer!.name : 'You’ll add job sites on the next step.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="customer-form" type="submit" loading={busy}>{editing ? 'Save changes' : 'Add customer'}</Button></>}>
      <form id="customer-form" onSubmit={submit} noValidate className="space-y-4">
        <ErrorBanner message={formError} />
        <Field label="Customer or business name" htmlFor="cf-name" required error={errors.name}>
          <Input id="cf-name" value={form.name} onChange={u('name')} invalid={!!errors.name} placeholder="e.g. Brightwater Bakery" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="cf-contact" optional><Input id="cf-contact" value={form.contactName} onChange={u('contactName')} autoComplete="off" /></Field>
          <Field label="Phone" htmlFor="cf-phone" optional><Input id="cf-phone" type="tel" inputMode="tel" value={form.phone} onChange={u('phone')} placeholder="(512) 555-0123" /></Field>
        </div>
        <Field label="Email" htmlFor="cf-email" optional error={errors.email}>
          <Input id="cf-email" type="email" inputMode="email" value={form.email} onChange={u('email')} invalid={!!errors.email} placeholder="name@company.com" />
        </Field>
        <Field label="Notes" htmlFor="cf-notes" optional>
          <Textarea id="cf-notes" rows={3} value={form.notes} onChange={u('notes')} placeholder="Billing preferences, gate codes, best time to call…" />
        </Field>
      </form>
    </Modal>
  );
}

export function SiteFormModal({ open, presetCustomerId, site, onClose, onSaved }: {
  open: boolean; presetCustomerId?: string; site?: Site; onClose: () => void; onSaved?: (s: Site, created: boolean) => void;
}) {
  const db = useDb();
  const editing = !!site;
  const empty = { customerId: '', name: '', address: '', city: '', state: '', postalCode: '', accessInstructions: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const customerList = [...db.customers].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (!open) return;
    setForm(site
      ? { customerId: site.customerId, name: site.name, address: site.address ?? '', city: site.city ?? '', state: site.state ?? '', postalCode: site.postalCode ?? '', accessInstructions: site.accessInstructions ?? '' }
      : { ...empty, customerId: presetCustomerId ?? '' });
    setErrors({}); setFormError(null);
  }, [open, site, presetCustomerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (!form.customerId) errs.customerId = 'Choose the customer this site belongs to.';
    if (!form.name.trim()) errs.name = 'Enter a site name, like “Main house” or “Warehouse B”.';
    if (form.state.trim() && !/^[A-Za-z]{2}$/.test(form.state.trim())) errs.state = 'Use 2 letters.';
    if (form.postalCode.trim() && !/^\d{5}(-\d{4})?$/.test(form.postalCode.trim())) errs.postalCode = 'Use a 5-digit ZIP.';
    setErrors(errs); setFormError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const s = editing ? await customersApi.updateSite(site!.id, form) : await customersApi.createSite(form);
      toast.success(editing ? 'Site updated' : 'Site added', { description: s.name });
      onClose();
      onSaved?.(s, !editing);
    } catch (err) {
      if (err instanceof DemoError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof Error ? err.message : 'Could not save the site.');
    } finally { setBusy(false); }
  };

  const u = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit job site' : 'Add job site'} subtitle={editing ? site!.name : 'A service location where work happens.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button form="site-form" type="submit" loading={busy}>{editing ? 'Save changes' : 'Add site'}</Button></>}>
      <form id="site-form" onSubmit={submit} noValidate className="space-y-4">
        <ErrorBanner message={formError} />
        <Field label="Customer" htmlFor="sf-customer" required error={errors.customerId}>
          <Select id="sf-customer" value={form.customerId} onChange={u('customerId')} invalid={!!errors.customerId}>
            <option value="">Choose a customer…</option>
            {customerList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Site name" htmlFor="sf-name" required error={errors.name}>
          <Input id="sf-name" value={form.name} onChange={u('name')} invalid={!!errors.name} placeholder="e.g. Main house, Warehouse B" />
        </Field>
        <Field label="Street address" htmlFor="sf-address" optional>
          <Input id="sf-address" value={form.address} onChange={u('address')} autoComplete="off" placeholder="418 Live Oak Ln" />
        </Field>
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-6 sm:col-span-3"><Field label="City" htmlFor="sf-city"><Input id="sf-city" value={form.city} onChange={u('city')} /></Field></div>
          <div className="col-span-2 sm:col-span-1"><Field label="State" htmlFor="sf-state" error={errors.state}><Input id="sf-state" value={form.state} maxLength={2} onChange={u('state')} invalid={!!errors.state} className="uppercase" placeholder="TX" /></Field></div>
          <div className="col-span-4 sm:col-span-2"><Field label="ZIP code" htmlFor="sf-zip" error={errors.postalCode}><Input id="sf-zip" value={form.postalCode} inputMode="numeric" maxLength={10} onChange={u('postalCode')} invalid={!!errors.postalCode} /></Field></div>
        </div>
        <Field label="Access instructions" htmlFor="sf-access" optional hint="Gate codes, panel location, parking, pets, who to ask for.">
          <Textarea id="sf-access" rows={3} value={form.accessInstructions} onChange={u('accessInstructions')} />
        </Field>
      </form>
    </Modal>
  );
}
