'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await fetch('/api/auth/logout', {
                    method: 'GET',
                    credentials: 'include',
                });

                await signOut({ redirect: false });

                router.push('/auth/sign-in');
            } catch (error) {
                console.error('Error during logout:', error);
                router.push('/auth/sign-in');
            }
        };

        performLogout();
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fc3d6b] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cerrando sesión...</p>
            </div>
        </div>
    );
}