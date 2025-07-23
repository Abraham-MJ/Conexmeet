'use client';

import { SessionProvider } from 'next-auth/react';
import React, { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({ children }: Props) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args[0]?.toString() || '';
        if (
          message.includes('Skipping auto-scroll behavior') ||
          message.includes('position: sticky') ||
          message.includes('position: fixed')
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
