/**
 * Demo data layer.
 *
 * Everything lives in one in-memory object that is persisted to localStorage, so every
 * page reads the same records and changes survive a refresh. All writes go through the
 * action functions below, which apply the same role checks the UI uses.
 *
 * This is a presentation build: authentication, invitations and password-reset delivery
 * are simulated in the browser. It is NOT a security boundary.
 */
import { useSyncExternalStore } from 'react';
import { can, JOB_STATUS_LABEL, Permission, ROLE_LABEL } from './constants';
import { createSeed, SCHEMA } from './seed';
import type { Activity, Customer, Db, InboxMessage, Job, JobNote, JobPriority, JobStatus, Site, User } from './types';

const DATA_KEY = 'nf-fieldops-demo';

export class DemoError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

// ---------------------------------------------------------------- persistence
function isDb(v: unknown): v is Db {
  const d = v as Db;
  return !!d && d.schema === SCHEMA && Array.isArray(d.users) && Array.isArray(d.jobs) && Array.isArray(d.activity) && Array.isArray(d.inbox);
}

function load(): Db {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isDb(parsed)) return parsed;
    }
  } catch { /* storage unavailable or corrupt: fall through to a fresh seed */ }
  const fresh = createSeed();
  save(fresh);
  return fresh;
}

function save(d: Db) {
  try { localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch { /* private mode etc. — demo still works in memory */ }
}

let db: Db = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function commit(next: Db) {
  db = next;
  save(db);
  emit();
}

// Keep several open tabs in sync (records only — each tab keeps its own signed-in user).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== DATA_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue);
      if (isDb(parsed)) {
        const session = parsed.users.some((u) => u.id === db.sessionUserId && u.status === 'active') ? db.sessionUserId : null;
        db = { ...parsed, sessionUserId: session };
        emit();
      }
    } catch { /* ignore */ }
  });
}

export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getDb = () => db;
export const useDb = () => useSyncExternalStore(subscribe, getDb, getDb);

// ---------------------------------------------------------------- helpers
const id = (prefix: string) => `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();
const wait = (ms = 280) => new Promise((r) => setTimeout(r, ms));
const clean = (v?: string) => (v ?? '').trim() || undefined;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------- selectors (pure)
export const userById = (d: Db, uid?: string) => (uid ? d.users.find((u) => u.id === uid) : undefined);
export const currentUser = (d: Db) => {
  const u = userById(d, d.sessionUserId ?? undefined);
  return u && u.status === 'active' ? u : null;
};
export const customerById = (d: Db, cid?: string) => d.customers.find((c) => c.id === cid);
export const siteById = (d: Db, sid?: string) => d.sites.find((s) => s.id === sid);
export const sitesFor = (d: Db, cid: string) => d.sites.filter((s) => s.customerId === cid);
export const activeTechs = (d: Db) => d.users.filter((u) => u.role === 'tech' && u.status === 'active').sort((a, b) => a.name.localeCompare(b.name));
export const canViewJob = (u: User | null, j: Job) => !!u && (can(u.role, 'jobs.view_all') || j.assignedTo === u.id);
export const canAddNote = (u: User | null, j: Job) => !!u && can(u.role, 'notes.add') && canViewJob(u, j);

export interface JobRow extends Job {
  customer?: Customer;
  site?: Site;
  assignee?: User;
  noteCount: number;
}
export const jobRow = (d: Db, j: Job): JobRow => ({
  ...j,
  customer: customerById(d, j.customerId),
  site: siteById(d, j.siteId),
  assignee: userById(d, j.assignedTo),
  noteCount: d.notes.filter((n) => n.jobId === j.id).length,
});
/** Jobs the given user is allowed to see, newest first. */
export const visibleJobs = (d: Db, u: User | null) =>
  d.jobs.filter((j) => canViewJob(u, j)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((j) => jobRow(d, j));

export const siteAddress = (s?: Site) => {
  if (!s) return '';
  const line2 = [s.city, [s.state, s.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [s.address, line2].filter(Boolean).join(', ');
};
export const jobLabel = (j: Pick<Job, 'number' | 'title'>) => `${j.number} — ${j.title}`;

// ---------------------------------------------------------------- guards
function me(): User {
  const u = currentUser(db);
  if (!u) throw new DemoError('Your session has ended. Please log in again.');
  return u;
}
function requirePerm(p: Permission): User {
  const u = me();
  if (!can(u.role, p)) throw new DemoError(`${ROLE_LABEL[u.role]} accounts can't do that.`);
  return u;
}
function log(actor: User, a: Omit<Activity, 'id' | 'at' | 'actorId' | 'actorName'>, at = nowIso()): Activity {
  return { id: id('a'), at, actorId: actor.id, actorName: actor.name, ...a };
}

// ---------------------------------------------------------------- auth (simulated)
export const auth = {
  async login(email: string, password: string) {
    await wait(350);
    const e = email.trim().toLowerCase();
    const u = db.users.find((x) => x.email.toLowerCase() === e);
    if (!u || u.password !== password) throw new DemoError('Incorrect email or password.');
    if (u.status === 'pending') throw new DemoError('This invitation hasn’t been accepted yet. Open it from the demo inbox first.');
    if (u.status === 'inactive') throw new DemoError('This account has been deactivated. Ask the owner to reactivate it.');
    commit({ ...db, sessionUserId: u.id });
    return u;
  },

  /** Presentation feature: switch the active demo account without a password. */
  switchTo(userId: string) {
    const u = userById(db, userId);
    if (!u || u.status !== 'active') throw new DemoError('That account is not active.');
    commit({ ...db, sessionUserId: u.id });
    return u;
  },

  logout() {
    commit({ ...db, sessionUserId: null });
  },

  /** Always resolves the same way so the screen never reveals whether an account exists. */
  async requestPasswordReset(email: string) {
    await wait();
    const e = email.trim().toLowerCase();
    const u = db.users.find((x) => x.email.toLowerCase() === e && x.status === 'active');
    if (!u) return;
    const msg: InboxMessage = { id: id('m'), kind: 'reset', userId: u.id, to: u.email, subject: 'Reset your Field Operations password', createdAt: nowIso(), read: false };
    commit({ ...db, inbox: [msg, ...db.inbox] });
  },

  async completePasswordReset(messageId: string, password: string) {
    await wait();
    const m = db.inbox.find((x) => x.id === messageId && x.kind === 'reset');
    if (!m) throw new DemoError('This reset link is not valid.');
    if (m.usedAt) throw new DemoError('This reset link has already been used. Request a new one.');
    validatePassword(password);
    const u = userById(db, m.userId);
    if (!u) throw new DemoError('Account not found.');
    commit({
      ...db,
      users: db.users.map((x) => (x.id === u.id ? { ...x, password } : x)),
      inbox: db.inbox.map((x) => (x.id === m.id ? { ...x, usedAt: nowIso(), read: true } : x)),
    });
    return u;
  },

  async acceptInvitation(messageId: string, name: string, password: string) {
    await wait();
    const m = db.inbox.find((x) => x.id === messageId && x.kind === 'invite');
    if (!m) throw new DemoError('This invitation is not valid.');
    const u = userById(db, m.userId);
    if (!u) throw new DemoError('This invitation is no longer valid.');
    if (u.status !== 'pending') throw new DemoError('This invitation has already been accepted.');
    if (!name.trim()) throw new DemoError('Enter your name.', 'name');
    validatePassword(password);
    const activated: User = { ...u, name: name.trim(), password, status: 'active', activatedAt: nowIso() };
    commit({
      ...db,
      users: db.users.map((x) => (x.id === u.id ? activated : x)),
      inbox: db.inbox.map((x) => (x.userId === u.id && x.kind === 'invite' ? { ...x, usedAt: x.usedAt ?? nowIso(), read: true } : x)),
      activity: [log(activated, { action: 'user.activated', verb: 'accepted the invitation and activated their account' }), ...db.activity],
    });
    return activated;
  },
};

function validatePassword(pw: string) {
  if (pw.length < 8) throw new DemoError('Password must be at least 8 characters.', 'password');
}

// ---------------------------------------------------------------- inbox
export const inbox = {
  markRead(messageId: string) {
    if (!db.inbox.some((m) => m.id === messageId && !m.read)) return;
    commit({ ...db, inbox: db.inbox.map((m) => (m.id === messageId ? { ...m, read: true } : m)) });
  },
};

// ---------------------------------------------------------------- team
export const team = {
  async inviteTechnician(input: { name: string; email: string }) {
    const actor = requirePerm('team.invite');
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) throw new DemoError('Name is required.', 'name');
    if (!EMAIL_RE.test(email)) throw new DemoError('Enter a valid email address.', 'email');
    const existing = db.users.find((u) => u.email.toLowerCase() === email);
    if (existing?.status === 'active') throw new DemoError(`${existing.name} already uses this email and is an active team member.`, 'email');
    if (existing?.status === 'pending') throw new DemoError(`An invitation for ${email} is already pending. Use “Resend” on the Team page instead.`, 'email');
    if (existing?.status === 'inactive') throw new DemoError(`This email belongs to a deactivated account (${existing.name}). The owner can reactivate it from the Team page.`, 'email');
    await wait();
    const user: User = { id: id('u'), name, email, role: 'tech', status: 'pending', password: '', createdAt: nowIso(), invitedBy: actor.id };
    const msg: InboxMessage = { id: id('m'), kind: 'invite', userId: user.id, to: email, subject: `${actor.name} invited you to join Nothing Finer Field Operations`, createdAt: nowIso(), read: false };
    commit({
      ...db,
      users: [...db.users, user],
      inbox: [msg, ...db.inbox],
      activity: [log(actor, { action: 'user.invited', verb: 'invited technician', targetType: 'user', targetId: user.id, targetLabel: name }), ...db.activity],
    });
    return { user, message: msg };
  },

  async resendInvitation(userId: string) {
    const actor = requirePerm('team.invite');
    const u = userById(db, userId);
    if (!u || u.status !== 'pending') throw new DemoError('Only pending invitations can be resent.');
    await wait();
    const msg: InboxMessage = { id: id('m'), kind: 'invite', userId: u.id, to: u.email, subject: `Reminder: ${actor.name} invited you to join Nothing Finer Field Operations`, createdAt: nowIso(), read: false };
    commit({
      ...db,
      inbox: [msg, ...db.inbox],
      activity: [log(actor, { action: 'user.invite_resent', verb: 'resent the invitation to', targetType: 'user', targetId: u.id, targetLabel: u.name }), ...db.activity],
    });
    return msg;
  },

  async setActive(userId: string, active: boolean) {
    const actor = requirePerm('team.manage');
    const u = userById(db, userId);
    if (!u) throw new DemoError('Team member not found.');
    if (u.role === 'owner' || u.id === actor.id) throw new DemoError('The owner account cannot be deactivated.');
    if (u.status === 'pending') throw new DemoError('This person hasn’t accepted their invitation yet.');
    await wait();
    commit({
      ...db,
      users: db.users.map((x) => (x.id === u.id ? { ...x, status: active ? 'active' : 'inactive' } : x)),
      activity: [log(actor, active
        ? { action: 'user.reactivated', verb: 'reactivated', targetType: 'user', targetId: u.id, targetLabel: u.name }
        : { action: 'user.deactivated', verb: 'deactivated', targetType: 'user', targetId: u.id, targetLabel: u.name }), ...db.activity],
    });
  },
};

// ---------------------------------------------------------------- customers & sites
export interface CustomerInput { name: string; contactName?: string; phone?: string; email?: string; notes?: string }
export interface SiteInput { customerId: string; name: string; address?: string; city?: string; state?: string; postalCode?: string; accessInstructions?: string }

function validateCustomer(c: CustomerInput) {
  if (!c.name.trim()) throw new DemoError('Customer or business name is required.', 'name');
  if (c.email?.trim() && !EMAIL_RE.test(c.email.trim())) throw new DemoError('Enter a valid email address.', 'email');
}
function validateSite(s: SiteInput) {
  if (!s.customerId || !customerById(db, s.customerId)) throw new DemoError('Choose the customer this site belongs to.', 'customerId');
  if (!s.name.trim()) throw new DemoError('Site name is required.', 'name');
  if (s.state?.trim() && !/^[A-Za-z]{2}$/.test(s.state.trim())) throw new DemoError('Use a 2-letter state code.', 'state');
  if (s.postalCode?.trim() && !/^\d{5}(-\d{4})?$/.test(s.postalCode.trim())) throw new DemoError('Use a 5-digit ZIP code.', 'postalCode');
}
const customerFields = (c: CustomerInput) => ({ name: c.name.trim(), contactName: clean(c.contactName), phone: clean(c.phone), email: clean(c.email)?.toLowerCase(), notes: clean(c.notes) });
const siteFields = (s: SiteInput) => ({
  customerId: s.customerId, name: s.name.trim(), address: clean(s.address), city: clean(s.city), state: clean(s.state)?.toUpperCase(),
  postalCode: clean(s.postalCode), accessInstructions: clean(s.accessInstructions),
});

export const customers = {
  async create(input: CustomerInput) {
    const actor = requirePerm('customers.manage');
    validateCustomer(input);
    await wait();
    const c: Customer = { id: id('c'), ...customerFields(input), createdAt: nowIso(), createdBy: actor.id };
    commit({
      ...db,
      customers: [c, ...db.customers],
      activity: [log(actor, { action: 'customer.created', verb: 'created customer', targetType: 'customer', targetId: c.id, targetLabel: c.name }), ...db.activity],
    });
    return c;
  },

  async update(customerId: string, input: CustomerInput) {
    const actor = requirePerm('customers.manage');
    const existing = customerById(db, customerId);
    if (!existing) throw new DemoError('Customer not found.');
    validateCustomer(input);
    await wait();
    const c: Customer = { ...existing, ...customerFields(input) };
    commit({
      ...db,
      customers: db.customers.map((x) => (x.id === c.id ? c : x)),
      activity: [log(actor, { action: 'customer.updated', verb: 'updated customer', targetType: 'customer', targetId: c.id, targetLabel: c.name }), ...db.activity],
    });
    return c;
  },

  async createSite(input: SiteInput) {
    const actor = requirePerm('customers.manage');
    validateSite(input);
    await wait();
    const s: Site = { id: id('s'), ...siteFields(input), createdAt: nowIso() };
    const cust = customerById(db, s.customerId)!;
    commit({
      ...db,
      sites: [...db.sites, s],
      activity: [log(actor, { action: 'site.created', verb: 'added site', targetType: 'site', targetId: s.id, targetLabel: s.name, detail: `for ${cust.name}`, customerId: cust.id }), ...db.activity],
    });
    return s;
  },

  async updateSite(siteId: string, input: SiteInput) {
    const actor = requirePerm('customers.manage');
    const existing = siteById(db, siteId);
    if (!existing) throw new DemoError('Site not found.');
    validateSite(input);
    if (input.customerId !== existing.customerId && db.jobs.some((j) => j.siteId === siteId)) {
      throw new DemoError('This site already has jobs, so it can’t be moved to another customer.', 'customerId');
    }
    await wait();
    const s: Site = { ...existing, ...siteFields(input) };
    const cust = customerById(db, s.customerId)!;
    commit({
      ...db,
      sites: db.sites.map((x) => (x.id === s.id ? s : x)),
      activity: [log(actor, { action: 'site.updated', verb: 'updated site', targetType: 'site', targetId: s.id, targetLabel: s.name, detail: `for ${cust.name}`, customerId: cust.id }), ...db.activity],
    });
    return s;
  },
};

// ---------------------------------------------------------------- jobs & notes
export interface JobInput {
  title: string;
  customerId: string;
  siteId: string;
  assignedTo?: string;
  description?: string;
  priority: JobPriority;
  status: JobStatus;
}

function validateJob(j: JobInput) {
  if (!j.title.trim()) throw new DemoError('Job title is required.', 'title');
  if (!customerById(db, j.customerId)) throw new DemoError('Choose a customer.', 'customerId');
  const s = siteById(db, j.siteId);
  if (!s || s.customerId !== j.customerId) throw new DemoError('Choose a site that belongs to this customer.', 'siteId');
  if (j.assignedTo) {
    const t = userById(db, j.assignedTo);
    if (!t || t.role !== 'tech' || t.status !== 'active') throw new DemoError('Only active technicians can be assigned.', 'assignedTo');
  }
}

const assignEntry = (actor: User, j: Job, techId?: string) => {
  const tech = userById(db, techId);
  return log(actor, tech
    ? { action: 'job.assigned', verb: 'assigned', targetType: 'job', targetId: j.id, targetLabel: jobLabel(j), detail: `to ${tech.name}` }
    : { action: 'job.assigned', verb: 'unassigned', targetType: 'job', targetId: j.id, targetLabel: jobLabel(j) });
};
const statusEntry = (actor: User, j: Job, status: JobStatus) =>
  log(actor, { action: 'job.status_changed', verb: 'marked', targetType: 'job', targetId: j.id, targetLabel: jobLabel(j), detail: `as ${JOB_STATUS_LABEL[status]}` });

export const jobs = {
  async create(input: JobInput) {
    const actor = requirePerm('jobs.manage');
    validateJob(input);
    await wait();
    const ts = nowIso();
    const j: Job = {
      id: id('j'), number: `NF-${db.nextJobNumber}`, title: input.title.trim(), customerId: input.customerId, siteId: input.siteId,
      assignedTo: input.assignedTo || undefined, description: clean(input.description), priority: input.priority, status: input.status,
      createdAt: ts, createdBy: actor.id, updatedAt: ts,
    };
    const entries = [log(actor, { action: 'job.created', verb: 'created job', targetType: 'job', targetId: j.id, targetLabel: jobLabel(j) }, ts)];
    if (j.assignedTo) entries.unshift(assignEntry(actor, j, j.assignedTo));
    commit({ ...db, jobs: [j, ...db.jobs], nextJobNumber: db.nextJobNumber + 1, activity: [...entries, ...db.activity] });
    return j;
  },

  async update(jobId: string, input: JobInput) {
    const actor = requirePerm('jobs.manage');
    const old = db.jobs.find((x) => x.id === jobId);
    if (!old) throw new DemoError('Job not found.');
    validateJob(input);
    await wait();
    const j: Job = {
      ...old, title: input.title.trim(), customerId: input.customerId, siteId: input.siteId, assignedTo: input.assignedTo || undefined,
      description: clean(input.description), priority: input.priority, status: input.status, updatedAt: nowIso(),
    };
    const entries: Activity[] = [];
    const detailsChanged = old.title !== j.title || old.customerId !== j.customerId || old.siteId !== j.siteId || old.description !== j.description || old.priority !== j.priority;
    if (detailsChanged) entries.push(log(actor, { action: 'job.updated', verb: 'edited job', targetType: 'job', targetId: j.id, targetLabel: jobLabel(j) }));
    if (old.assignedTo !== j.assignedTo) entries.push(assignEntry(actor, j, j.assignedTo));
    if (old.status !== j.status) entries.push(statusEntry(actor, j, j.status));
    commit({ ...db, jobs: db.jobs.map((x) => (x.id === j.id ? j : x)), activity: [...entries.reverse(), ...db.activity] });
    return j;
  },

  async setStatus(jobId: string, status: JobStatus) {
    const actor = requirePerm('jobs.manage');
    const old = db.jobs.find((x) => x.id === jobId);
    if (!old) throw new DemoError('Job not found.');
    if (old.status === status) return old;
    await wait(150);
    const j = { ...old, status, updatedAt: nowIso() };
    commit({ ...db, jobs: db.jobs.map((x) => (x.id === j.id ? j : x)), activity: [statusEntry(actor, j, status), ...db.activity] });
    return j;
  },

  async assign(jobId: string, techId: string) {
    const actor = requirePerm('jobs.manage');
    const old = db.jobs.find((x) => x.id === jobId);
    if (!old) throw new DemoError('Job not found.');
    if ((old.assignedTo ?? '') === techId) return old;
    if (techId) {
      const t = userById(db, techId);
      if (!t || t.role !== 'tech' || t.status !== 'active') throw new DemoError('Only active technicians can be assigned.');
    }
    await wait(150);
    const j = { ...old, assignedTo: techId || undefined, updatedAt: nowIso() };
    commit({ ...db, jobs: db.jobs.map((x) => (x.id === j.id ? j : x)), activity: [assignEntry(actor, j, j.assignedTo), ...db.activity] });
    return j;
  },

  async addNote(jobId: string, body: string) {
    const actor = me();
    const j = db.jobs.find((x) => x.id === jobId);
    if (!j || !canViewJob(actor, j)) throw new DemoError('You don’t have access to this job.');
    if (!canAddNote(actor, j)) throw new DemoError('You can’t add notes to this job.');
    const text = body.trim();
    if (!text) throw new DemoError('Write something before adding the note.');
    if (text.length > 2000) throw new DemoError('Notes are limited to 2,000 characters.');
    await wait();
    const ts = nowIso();
    const note: JobNote = { id: id('n'), jobId, authorId: actor.id, body: text, createdAt: ts };
    commit({
      ...db,
      notes: [...db.notes, note],
      jobs: db.jobs.map((x) => (x.id === jobId ? { ...x, updatedAt: ts } : x)),
      activity: [log(actor, { action: 'note.added', verb: 'added a note to', targetType: 'job', targetId: j.id, targetLabel: jobLabel(j) }, ts), ...db.activity],
    });
    return note;
  },
};

// ---------------------------------------------------------------- demo controls
export const demo = {
  reset() {
    commit(createSeed());
  },
};
