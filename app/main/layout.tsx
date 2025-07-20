import { UserProvider } from '@/app/context/useClientContext';
import LayoutWrapper from '../layout/LayoutWrapper';
import { Suspense } from 'react';
import FallBackSpinner from '../components/loading/fallback-spinner';

// Disable static generation for all pages in this layout
export const dynamic = 'force-dynamic';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<FallBackSpinner />}>
      <UserProvider>
        <LayoutWrapper children={children} />
      </UserProvider>
    </Suspense>
  );
}
