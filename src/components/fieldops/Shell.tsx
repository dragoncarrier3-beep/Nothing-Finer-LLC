import React, { useEffect, useRef, useState } from 'react';
import { Activity, Briefcase, Building2, ClipboardCheck, LayoutDashboard, LogOut, UserCircle, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import { BRAND, Permission } from '@/lib/constants';
import type { View } from '@/lib/types';
import { Avatar, RoleBadge, cx } from './ui';

type NavItem = { name: View['name']; label: string; short?: string; icon: React.ElementType; perm?: Permission };
const NAV: NavItem[] = [
  { name: 'overview', label: 'Sprint 1 review', short: 'Review', icon: ClipboardCheck, perm: 'activity.view' },
  { name: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { name: 'jobs', label: 'Jobs', icon: Briefcase },
  { name: 'customers', label: 'Customers', icon: Building2, perm: 'customers.manage' },
  { name: 'team', label: 'Team', icon: Users, perm: 'team.view' },
  { name: 'activity', label: 'Activity', icon: Activity, perm: 'activity.view' },
];

const activeFor = (v: View): View['name'] => (v.name === 'job' ? 'jobs' : v.name === 'customer' ? 'customers' : v.name);

export function BrandMark({ inverted = true }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-navy-950"><Zap className="h-5 w-5" fill="currentColor" aria-hidden /></div>
      <div className="min-w-0 leading-tight">
        <div className={cx('truncate text-[15px] font-bold', inverted ? 'text-white' : 'text-navy-950')}>{BRAND.name}</div>
        <div className={cx('truncate text-xs font-medium', inverted ? 'text-navy-300' : 'text-stone-500')}>{BRAND.product}</div>
      </div>
    </div>
  );
}

export default function Shell({ view, children }: { view: View; children: React.ReactNode }) {
  const { user, can, logout } = useAuth();
  const { go } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  if (!user) return null;
  const active = activeFor(view);
  const items = NAV.filter((n) => !n.perm || can(n.perm)).map((n) => (n.name === 'jobs' && !can('jobs.view_all') ? { ...n, label: 'My jobs' } : n));

  const signOut = () => { setMenuOpen(false); logout(); go({ name: 'overview' }); toast.success('Logged out'); };

  return (
    <div className="lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-11 hidden h-[calc(100dvh-2.75rem)] w-64 shrink-0 flex-col bg-navy-950 lg:flex">
        <div className="px-5 py-5"><BrandMark /></div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {items.map((n) => {
            const isActive = active === n.name;
            return (
              <button key={n.name} onClick={() => go({ name: n.name } as View)} aria-current={isActive ? 'page' : undefined}
                className={cx('relative flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-navy-200 hover:bg-white/5 hover:text-white')}>
                {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-amber-400" aria-hidden />}
                <n.icon className={cx('h-5 w-5', isActive ? 'text-amber-400' : 'text-navy-300')} aria-hidden />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={() => go({ name: 'account' })} aria-current={active === 'account' ? 'page' : undefined}
            className={cx('flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors', active === 'account' ? 'bg-white/10' : 'hover:bg-white/5')}>
            <Avatar name={user.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="block truncate text-xs text-navy-300">My account</span>
            </span>
            <RoleBadge role={user.role} />
          </button>
          <button onClick={signOut} className="mt-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-navy-200 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" aria-hidden /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile header */}
        <header className="sticky top-11 z-30 flex h-14 items-center justify-between bg-navy-950 px-4 lg:hidden">
          <BrandMark />
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-transparent hover:ring-white/20" aria-label="Account menu" aria-expanded={menuOpen}>
              <Avatar name={user.name} size="sm" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                <div className="border-b border-stone-200 px-4 py-3">
                  <div className="truncate text-sm font-semibold text-navy-950">{user.name}</div>
                  <div className="truncate text-xs text-stone-500">{user.email}</div>
                  <div className="mt-1.5"><RoleBadge role={user.role} /></div>
                </div>
                <button onClick={() => { setMenuOpen(false); go({ name: 'account' }); }} className="flex h-12 w-full items-center gap-3 px-4 text-[15px] text-navy-900 hover:bg-stone-50"><UserCircle className="h-5 w-5 text-stone-500" aria-hidden /> My account</button>
                <button onClick={signOut} className="flex h-12 w-full items-center gap-3 border-t border-stone-100 px-4 text-[15px] text-red-700 hover:bg-red-50"><LogOut className="h-5 w-5" aria-hidden /> Log out</button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((n) => {
            const isActive = active === n.name;
            return (
              <button key={n.name} onClick={() => go({ name: n.name } as View)} aria-current={isActive ? 'page' : undefined}
                className={cx('flex h-16 min-w-0 flex-col items-center justify-center gap-1 font-semibold', items.length > 5 ? 'text-[11px]' : 'text-xs', isActive ? 'text-navy-950' : 'text-stone-500')}>
                <span className={cx('flex h-7 w-12 items-center justify-center rounded-full', isActive && 'bg-amber-100')}>
                  <n.icon className={cx('h-5 w-5', isActive ? 'text-amber-700' : '')} aria-hidden />
                </span>
                <span className="max-w-full truncate px-0.5">{n.short ?? n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
