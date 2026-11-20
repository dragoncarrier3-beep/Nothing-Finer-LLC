export type Role = 'owner' | 'admin' | 'tech';
export type UserStatus = 'active' | 'pending' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  /** Demo only — stored in the browser so the simulated login works. Never do this in production. */
  password: string;
  createdAt: string;
  activatedAt?: string;
  invitedBy?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Site {
  id: string;
  customerId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  accessInstructions?: string;
  createdAt: string;
}

export type JobStatus = 'new' | 'in_progress' | 'completed';
export type JobPriority = 'normal' | 'urgent';

export interface Job {
  id: string;
  /** Human-readable job number, e.g. NF-1042 */
  number: string;
  title: string;
  customerId: string;
  siteId: string;
  assignedTo?: string;
  description?: string;
  priority: JobPriority;
  status: JobStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface JobNote {
  id: string;
  jobId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export type ActivityAction =
  | 'user.invited'
  | 'user.invite_resent'
  | 'user.activated'
  | 'user.deactivated'
  | 'user.reactivated'
  | 'customer.created'
  | 'customer.updated'
  | 'site.created'
  | 'site.updated'
  | 'job.created'
  | 'job.updated'
  | 'job.assigned'
  | 'job.status_changed'
  | 'note.added';

export type RecordType = 'job' | 'customer' | 'site' | 'user';

export interface Activity {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  /** e.g. "created job", "added a note to" */
  verb: string;
  targetType?: RecordType;
  targetId?: string;
  targetLabel?: string;
  /** Trailing text, e.g. "to Marcus Webb" */
  detail?: string;
  /** For sites: the parent customer, so the entry can link somewhere useful */
  customerId?: string;
}

export interface InboxMessage {
  id: string;
  kind: 'invite' | 'reset';
  userId: string;
  to: string;
  subject: string;
  createdAt: string;
  read: boolean;
  usedAt?: string;
}

export interface Db {
  schema: number;
  users: User[];
  customers: Customer[];
  sites: Site[];
  jobs: Job[];
  notes: JobNote[];
  activity: Activity[];
  inbox: InboxMessage[];
  nextJobNumber: number;
  sessionUserId: string | null;
  /** Start of the current acceptance-script run (seed time, or when the presenter restarts the run). */
  runStartedAt: string;
  /** Last time an owner signed in — drives the "Owner logs in" acceptance step. */
  lastOwnerSignInAt?: string;
}

export type View =
  | { name: 'overview' }
  | { name: 'dashboard' }
  | { name: 'jobs'; status?: JobStatus }
  | { name: 'job'; id: string }
  | { name: 'customers' }
  | { name: 'customer'; id: string }
  | { name: 'team' }
  | { name: 'activity' }
  | { name: 'account' };
