import React from 'react';
import { Check, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { PERMISSIONS, PERMISSION_LABEL, ROLE_LABEL, USER_STATUS_LABEL } from '@/lib/constants';
import { fmtDate } from '@/lib/format';
import { Avatar, Button, Card, CardHeader, PageHeader, RoleBadge } from './ui';

export default function AccountView() {
  const { user, logout } = useAuth();
  const { go } = useUI();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="My account" subtitle="The account you’re signed in with." />
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-navy-950">{user.name}</div>
              <div className="mt-1"><RoleBadge role={user.role} /></div>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-stone-100 border-t border-stone-100 text-[15px]">
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between"><dt className="text-stone-500">Name</dt><dd className="font-medium text-navy-950">{user.name}</dd></div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between"><dt className="text-stone-500">Email</dt><dd className="break-all font-medium text-navy-950">{user.email}</dd></div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between"><dt className="text-stone-500">Role</dt><dd className="font-medium text-navy-950">{ROLE_LABEL[user.role]}</dd></div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between"><dt className="text-stone-500">Status</dt><dd className="font-medium text-navy-950">{USER_STATUS_LABEL[user.status]}</dd></div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between"><dt className="text-stone-500">Member since</dt><dd className="font-medium text-navy-950">{fmtDate(user.activatedAt ?? user.createdAt)}</dd></div>
          </dl>
          <Button variant="secondary" className="mt-5 w-full sm:w-auto" onClick={() => { logout(); go({ name: 'overview' }); toast.success('Logged out'); }}>
            <LogOut className="h-4 w-4" aria-hidden /> Log out
          </Button>
        </Card>

        <Card className="h-fit lg:col-span-2">
          <CardHeader title="What you can do" />
          <ul className="space-y-2 p-4 sm:p-5">
            {PERMISSIONS[user.role].map((p) => <li key={p} className="flex gap-2 text-sm text-stone-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{PERMISSION_LABEL[p]}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
