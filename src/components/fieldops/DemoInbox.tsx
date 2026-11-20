import React, { useEffect, useState } from 'react';
import { ArrowLeft, Inbox, KeyRound, Mail, UserPlus } from 'lucide-react';
import { inbox as inboxApi, useDb, userById } from '@/lib/store';
import { BRAND, ROLE_LABEL } from '@/lib/constants';
import { fmtDateTime, relTime } from '@/lib/format';
import type { InboxMessage } from '@/lib/types';
import { Button, Modal, cx } from './ui';

/** Simulated transactional email. Nothing is delivered outside this browser. */
export default function DemoInbox({ open, initialMessageId, onClose, onOpenLink }: {
  open: boolean; initialMessageId?: string; onClose: () => void; onOpenLink: (kind: InboxMessage['kind'], messageId: string) => void;
}) {
  const db = useDb();
  const mails = db.inbox;
  const [sel, setSel] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSel(initialMessageId ?? null);
    setMobileDetail(!!initialMessageId);
  }, [open, initialMessageId]);

  const current = mails.find((m) => m.id === sel) ?? mails[0];
  useEffect(() => { if (open && current && !current.read) inboxApi.markRead(current.id); }, [open, current]);

  const select = (id: string) => { setSel(id); setMobileDetail(true); };
  const user = userById(db, current?.userId);
  const inviter = userById(db, user?.invitedBy);
  const linkUsable = current && !current.usedAt && (current.kind === 'reset' || user?.status === 'pending');

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Demo inbox"
      subtitle="Simulated email for this demo. Messages are created in this browser and nothing is actually sent.">
      {mails.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 rounded-full bg-stone-100 p-3 text-stone-500"><Inbox className="h-6 w-6" aria-hidden /></div>
          <p className="font-semibold text-navy-950">No messages yet</p>
          <p className="mt-1 max-w-xs text-sm text-stone-600">Invite a technician or use “Forgot password?” and the message will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          <ul className={cx('space-y-1 md:block', mobileDetail ? 'hidden' : 'block')}>
            {mails.map((m) => {
              const Icon = m.kind === 'invite' ? UserPlus : KeyRound;
              return (
                <li key={m.id}>
                  <button onClick={() => select(m.id)} className={cx('flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors', current?.id === m.id ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-stone-50')}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cx('truncate text-sm', m.read ? 'text-stone-700' : 'font-semibold text-navy-950')}>{m.kind === 'invite' ? 'Invitation' : 'Password reset'}</span>
                        {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-label="Unread" />}
                      </span>
                      <span className="block truncate text-xs text-stone-500">To {m.to}</span>
                      <span className="block text-xs text-stone-400">{relTime(m.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {current && (
            <article className={cx('min-w-0 rounded-xl border border-stone-200 md:block', mobileDetail ? 'block' : 'hidden')}>
              <div className="border-b border-stone-200 p-4">
                <button onClick={() => setMobileDetail(false)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 md:hidden"><ArrowLeft className="h-4 w-4" aria-hidden /> All messages</button>
                <h3 className="text-base font-semibold text-navy-950">{current.subject}</h3>
                <dl className="mt-2 space-y-0.5 text-xs text-stone-600">
                  <div className="flex gap-1"><dt className="w-10 shrink-0 text-stone-400">From</dt><dd className="truncate">{BRAND.product} &lt;no-reply@nothingfiner.example&gt;</dd></div>
                  <div className="flex gap-1"><dt className="w-10 shrink-0 text-stone-400">To</dt><dd className="break-all">{current.to}</dd></div>
                  <div className="flex gap-1"><dt className="w-10 shrink-0 text-stone-400">Sent</dt><dd>{fmtDateTime(current.createdAt)}</dd></div>
                </dl>
              </div>
              <div className="space-y-3 p-4 text-[15px] leading-relaxed text-stone-800">
                {current.kind === 'invite' ? (
                  <>
                    <p>Hi {user?.name ?? 'there'},</p>
                    <p>{inviter?.name ?? 'Your team'} has invited you to join <b>{BRAND.name} {BRAND.product}</b> as a <b>{ROLE_LABEL[user?.role ?? 'tech']}</b>. Accept the invitation to set your password and see the jobs assigned to you.</p>
                  </>
                ) : (
                  <>
                    <p>Hi {user?.name ?? 'there'},</p>
                    <p>We received a request to reset the password for <b className="break-all">{current.to}</b>. This link can be used once. If you didn’t ask for this, you can ignore this message.</p>
                  </>
                )}
                <div className="pt-1">
                  {linkUsable ? (
                    <Button onClick={() => onOpenLink(current.kind, current.id)} className="w-full sm:w-auto">
                      <Mail className="h-4 w-4" aria-hidden /> {current.kind === 'invite' ? 'Accept invitation' : 'Choose a new password'}
                    </Button>
                  ) : (
                    <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
                      {current.kind === 'invite' ? (user?.status === 'pending' ? 'This link has been replaced by a newer invitation.' : 'This invitation has already been accepted.') : 'This reset link has already been used.'}
                    </p>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      )}
    </Modal>
  );
}
