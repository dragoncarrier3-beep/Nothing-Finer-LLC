import React, { useCallback } from 'react';
import { auth, currentUser, useDb } from '@/lib/store';
import { can as canRole, Permission } from '@/lib/constants';

/** Kept as a provider so the app tree is unchanged; the session itself lives in the demo store. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export function useAuth() {
  const db = useDb();
  const user = currentUser(db);
  const can = useCallback((p: Permission) => canRole(user?.role, p), [user?.role]);
  return { user, can, logout: auth.logout };
}
