'use client';

import React, { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';

const SessionContext = createContext<{ user: User | null }>({ user: null });

export function SessionProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ user }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionUser = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionUser must be used within a SessionProvider');
  }
  return context;
};
