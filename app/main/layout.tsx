import { AgoraProvider } from '@/app/context/useAgoraContext';
import { UserProvider } from '@/app/context/useClientContext';
import LayoutWrapper from '../layout/LayoutWrapper';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AgoraProvider>
        <div className="flex flex-col">
          <LayoutWrapper children={children} />
        </div>
      </AgoraProvider>
    </UserProvider>
  );
}
