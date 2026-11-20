import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FlaskConical, Inbox, RotateCcw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { auth, currentUser, useDb } from '@/lib/store';
import { DEMO_LABEL, ROLE_LABEL } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { Avatar, RoleBadge, cx } from './ui';

const ROLE_ORDER: Role[] = ['owner', 'admin', 'tech'];

/** Presenter controls. Clearly separated from the product UI. */
export default function DemoBar({ onOpenInbox, onReset, onSwitched }: { onOpenInbox: () => void; onReset: () => void; onSwitched: () => void }) {
  const db = useDb();
  const me = currentUser(db);
  const unread = db.inbox.filter((m) => !m.read).length;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const accounts = db.users.filter((u) => u.status === 'active').sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name));

  const switchTo = (uid: string) => {
    const u = auth.switchTo(uid);
    setOpen(false);
    onSwitched();
    toast.success(`Now viewing as ${u.name}`, { description: ROLE_LABEL[u.role] });
  };

  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-200/70 active:bg-amber-200';

  return (
    <div className="sticky top-0 z-40 border-b border-amber-300 bg-amber-100">
      <div className="flex h-11 items-center gap-1 px-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-amber-950">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate"><span className="hidden md:inline">{DEMO_LABEL}</span><span className="md:hidden">Demo · sample data</span></span>
        </div>

        <div className="relative" ref={ref}>
          <button className={btn} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
            <Users className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{me ? 'Switch account' : 'Enter as…'}</span>
            <span className="sm:hidden">Switch</span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
              <div className="border-b border-stone-200 bg-stone-50 px-4 py-2.5">
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">Presentation feature</div>
                <div className="text-xs text-stone-600">Switches accounts instantly, without a password. Not part of the product.</div>
              </div>
              <ul className="max-h-[60dvh] overflow-y-auto py-1">
                {accounts.map((u) => (
                  <li key={u.id}>
                    <button role="menuitem" onClick={() => switchTo(u.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50">
                      <Avatar name={u.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy-950">{u.name}</span>
                        <span className="block truncate text-xs text-stone-500">{u.email}</span>
                      </span>
                      {me?.id === u.id ? <Check className="h-4 w-4 text-emerald-600" aria-label="Current account" /> : <RoleBadge role={u.role} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button className={btn} onClick={onOpenInbox} aria-label={`Open demo inbox${unread ? `, ${unread} unread` : ''}`}>
          <Inbox className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Demo inbox</span>
          <span className="sm:hidden">Inbox</span>
          {unread > 0 && <span className="ml-0.5 inline-flex min-w-[20px] justify-center rounded-full bg-navy-900 px-1.5 text-xs font-bold text-white">{unread}</span>}
        </button>

        <button className={cx(btn, 'px-2')} onClick={onReset} aria-label="Reset demo">
          <RotateCcw className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Reset demo</span>
        </button>
      </div>
    </div>
  );
}
