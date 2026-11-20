import React, { useState } from 'react';
import { Check, RefreshCw, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { team, useDb, userById } from '@/lib/store';
import { PERMISSIONS, PERMISSION_LABEL } from '@/lib/constants';
import { relTime } from '@/lib/format';
import type { Role, User } from '@/lib/types';
import { AccessDenied, Avatar, Button, Card, CardHeader, ConfirmDialog, PageHeader, RoleBadge, UserStatusBadge } from './ui';

const ROLES: Role[] = ['owner', 'admin', 'tech'];
const ROLE_SUMMARY: Record<Role, string> = {
  owner: 'Full access, including deactivating team members.',
  admin: 'Runs the office. Can’t change the owner or grant owner/admin access.',
  tech: 'Works in the field. Sees only assigned jobs.',
};

export default function TeamView() {
  const db = useDb();
  const { user: me, can } = useAuth();
  const { go, openInvite, openInbox } = useUI();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<User | null>(null);

  if (!can('team.view')) return <AccessDenied action={<Button variant="secondary" onClick={() => go({ name: 'dashboard' })}>Back to dashboard</Button>} />;

  const statusOrder = { active: 0, pending: 1, inactive: 2 };
  const members = [...db.users].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.name.localeCompare(b.name));
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  const resend = async (u: User) => {
    setBusy(u.id);
    try {
      const msg = await team.resendInvitation(u.id);
      toast.success('Demo invitation re-sent', { description: `A new invitation for ${u.name} is in the demo inbox.`, action: { label: 'Open', onClick: () => openInbox(msg.id) } });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not resend.'); }
    finally { setBusy(null); }
  };

  const setActive = async (u: User, active: boolean) => {
    setBusy(u.id);
    try { await team.setActive(u.id, active); toast.success(active ? `${u.name} reactivated` : `${u.name} deactivated`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update.'); }
    finally { setBusy(null); setConfirm(null); }
  };

  return (
    <div>
      <PageHeader title="Team" subtitle={`${members.filter((m) => m.status === 'active').length} active${pendingCount ? ` · ${pendingCount} pending invitation${pendingCount > 1 ? 's' : ''}` : ''}`}
        action={can('team.invite') && <Button onClick={openInvite}><UserPlus className="h-4 w-4" aria-hidden /> Invite technician</Button>} />

      <Card>
        <CardHeader title="Members" icon={<Users className="h-4 w-4" />} count={members.length} />
        <ul className="divide-y divide-stone-100">
          {members.map((u) => {
            const inviter = userById(db, u.invitedBy);
            const manageable = can('team.manage') && u.role !== 'owner' && u.id !== me?.id;
            return (
              <li key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-navy-950">{u.name}</span>
                      {u.id === me?.id && <span className="text-xs text-stone-500">(you)</span>}
                    </div>
                    <div className="truncate text-sm text-stone-600">{u.email}</div>
                    {u.status === 'pending' && <div className="text-xs text-stone-500">Invited {relTime(u.createdAt)}{inviter ? ` by ${inviter.name}` : ''}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                  <RoleBadge role={u.role} />
                  <UserStatusBadge status={u.status} />
                  {u.status === 'pending' && can('team.invite') && (
                    <Button size="sm" variant="secondary" loading={busy === u.id} onClick={() => resend(u)}><RefreshCw className="h-4 w-4" aria-hidden /> Resend</Button>
                  )}
                  {manageable && u.status === 'active' && <Button size="sm" variant="danger" disabled={busy === u.id} onClick={() => setConfirm(u)}>Deactivate</Button>}
                  {manageable && u.status === 'inactive' && <Button size="sm" variant="secondary" loading={busy === u.id} onClick={() => setActive(u, true)}>Reactivate</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-5 sm:mt-6">
        <CardHeader title="Roles in this demo" icon={<ShieldCheck className="h-4 w-4" />} />
        <div className="grid grid-cols-1 gap-px bg-stone-200 sm:grid-cols-3 sm:rounded-b-xl">
          {ROLES.map((r) => (
            <div key={r} className="bg-white p-4 sm:p-5 sm:first:rounded-bl-xl sm:last:rounded-br-xl">
              <RoleBadge role={r} />
              <p className="mt-2 text-sm text-stone-600">{ROLE_SUMMARY[r]}</p>
              <ul className="mt-3 space-y-1.5">
                {PERMISSIONS[r].map((p) => <li key={p} className="flex gap-2 text-sm text-stone-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{PERMISSION_LABEL[p]}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-3 text-xs text-stone-500">Role rules are applied consistently throughout this demo. In the production build they would also be enforced on the server.</p>

      <ConfirmDialog open={!!confirm} title={`Deactivate ${confirm?.name}?`} confirmLabel="Deactivate" danger busy={busy === confirm?.id}
        body={<>{confirm?.name} won’t be able to log in or be assigned new jobs. Their existing jobs and notes stay on record. You can reactivate them at any time.</>}
        onConfirm={() => confirm && setActive(confirm, false)} onCancel={() => setConfirm(null)} />
    </div>
  );
}

