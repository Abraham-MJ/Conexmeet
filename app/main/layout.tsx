import { AgoraProvider } from '@/app/context/useAgoraContext';
import { UserProvider } from '@/app/context/useClientContext';
import Header from '@/app/layout/Header';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AgoraProvider>
        <div className="flex min-h-screen flex-col">
          <Header minutes="00:00:00" balance="0.00" />
          <main
            className={cn(
              'container relative mx-auto h-[calc(100dvh-64px)] flex-grow px-4 py-8',
            )}
          >
            {children}
          </main>
        </div>
      </AgoraProvider>
    </UserProvider>
  );
}
