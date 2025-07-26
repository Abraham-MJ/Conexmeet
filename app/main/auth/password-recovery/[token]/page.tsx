'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PasswordRecoveryRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = Array.isArray(params.token) ? params.token[0] : params.token;
    if (token) {
      router.replace(`/auth/password-recovery/${token}`);
    }
  }, [params.token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}