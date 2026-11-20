import type { JobPriority, JobStatus, Role, UserStatus } from './types';

export const BRAND = {
  name: 'Nothing Finer',
  product: 'Field Operations',
  legal: 'Nothing Finer LLC',
};

export const DEMO_LABEL = 'Interactive demo — sample data';
export const DEMO_PASSWORD = 'FieldOps1';

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  tech: 'Technician',
};

export const ROLE_BADGE: Record<Role, string> = {
  owner: 'bg-amber-100 text-amber-900 ring-amber-300',
  admin: 'bg-navy-100 text-navy-800 ring-navy-200',
  tech: 'bg-stone-100 text-stone-700 ring-stone-300',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  pending: 'Pending invitation',
  inactive: 'Deactivated',
};

export type Permission =
  | 'team.view'
  | 'team.invite'
  | 'team.manage'
  | 'customers.manage'
  | 'jobs.view_all'
  | 'jobs.manage'
  | 'notes.add'
  | 'activity.view';

export const PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['team.view', 'team.invite', 'team.manage', 'customers.manage', 'jobs.view_all', 'jobs.manage', 'notes.add', 'activity.view'],
  admin: ['team.view', 'team.invite', 'customers.manage', 'jobs.view_all', 'jobs.manage', 'notes.add', 'activity.view'],
  tech: ['notes.add'],
};

export const PERMISSION_LABEL: Record<Permission, string> = {
  'team.view': 'View the team',
  'team.invite': 'Invite technicians',
  'team.manage': 'Deactivate or reactivate team members',
  'customers.manage': 'Create and edit customers and sites',
  'jobs.view_all': 'See every job (technicians see only their own)',
  'jobs.manage': 'Create and edit jobs, change status, assign technicians',
  'notes.add': 'Add job notes (technicians: assigned jobs only)',
  'activity.view': 'View the activity log',
};

export const can = (role: Role | undefined, p: Permission) => !!role && PERMISSIONS[role].includes(p);

export const JOB_STATUSES: JobStatus[] = ['new', 'in_progress', 'completed'];
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
};
export const JOB_STATUS_BADGE: Record<JobStatus, string> = {
  new: 'bg-sky-50 text-sky-800 ring-sky-200',
  in_progress: 'bg-amber-50 text-amber-900 ring-amber-300',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};
export const JOB_STATUS_DOT: Record<JobStatus, string> = {
  new: 'bg-sky-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
};

export const PRIORITIES: JobPriority[] = ['normal', 'urgent'];
export const PRIORITY_LABEL: Record<JobPriority, string> = {
  normal: 'Normal',
  urgent: 'Urgent',
};
