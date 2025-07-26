'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PasswordRecoveryMainRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/password-recovery');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}