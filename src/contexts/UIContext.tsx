import { createContext, useContext } from 'react';
import type { Customer, Job, Site, View } from '@/lib/types';

/** Guided next step shown after creating a customer or site. */
export type NextStep =
  | { kind: 'add-site'; customerId: string }
  | { kind: 'create-job'; customerId: string; siteId: string }
  | null;

export interface UIActions {
  go: (v: View) => void;
  openJobForm: (opts?: { job?: Job; customerId?: string; siteId?: string }) => void;
  openCustomerForm: (customer?: Customer) => void;
  openSiteForm: (opts: { customerId?: string; site?: Site }) => void;
  openInvite: () => void;
  openInbox: (messageId?: string) => void;
  nextStep: NextStep;
  setNextStep: (s: NextStep) => void;
}

export const UICtx = createContext<UIActions | null>(null);

export function useUI() {
  const c = useContext(UICtx);
  if (!c) throw new Error('useUI must be used inside the app layout');
  return c;
}
