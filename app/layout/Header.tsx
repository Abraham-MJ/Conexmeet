'use client';

import { MessageCircle, Video, Users, BarChart3, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserDropdown from '../components/shared/UserDropDown';
import { useUser } from '../context/useClientContext';

interface HeaderProps {
  minutes: string;
  balance?: string;
}

export default function Header({ minutes = '00:00:00', balance }: HeaderProps) {
  const { state } = useUser();

  const pathname = usePathname();
  const role = (state?.user?.gender as 'male' | 'female') ?? 'male';

  const baseRoutes = {
    female: {
      videoChat: '/main/video-roulette',
      chats: '/main/chats',
      ranking: '/main/host/ranking',
      contacts: '/main/host/contacts',
    },
    male: {
      forYou: '/main/male/for-you',
      videoChat: '/main/video-roulette',
      chats: '/main/chats',
    },
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header
      className={`flex w-full items-center justify-center px-4 py-3 text-white shadow-md ${
        role === 'female'
          ? 'bg-gradient-to-r from-pink-500 to-pink-600'
          : 'bg-gradient-to-r from-blue-500 to-blue-600'
      }`}
    >
      <div className="flex w-full max-w-[1536px] items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
            <span className="text-sm font-medium">Minutes: {minutes}</span>
          </div>

          {role === 'female' ? (
            <div className="flex items-center rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-sm font-medium">
                Balance: {balance || '0.00'}$
              </span>
            </div>
          ) : (
            <div className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30">
              Recharge
            </div>
          )}
        </div>

        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-6">
          {role !== 'female' && (
            <>
              <Link
                href={baseRoutes[role]?.forYou}
                className={`flex flex-col items-center transition ${
                  isActive(baseRoutes[role]?.forYou)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Users size={20} />
                <span className="mt-1 text-xs">For you</span>
              </Link>
            </>
          )}

          <Link
            href={baseRoutes?.[role].videoChat}
            className={`flex flex-col items-center transition ${
              isActive(baseRoutes?.[role].videoChat)
                ? 'opacity-100'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Video size={20} />
            <span className="mt-1 text-xs">Video Chat</span>
          </Link>

          <Link
            href={baseRoutes[role].chats}
            className={`flex flex-col items-center transition ${
              isActive(baseRoutes[role].chats)
                ? 'opacity-100'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <MessageCircle size={20} />
            <span className="mt-1 text-xs">Chats</span>
          </Link>

          {role === 'female' && (
            <>
              <Link
                href={baseRoutes[role].ranking}
                className={`flex flex-col items-center transition ${
                  isActive(baseRoutes[role].ranking)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <BarChart3 size={20} />
                <span className="mt-1 text-xs">Ranking</span>
              </Link>
              <Link
                href={baseRoutes[role].contacts}
                className={`flex flex-col items-center transition ${
                  isActive(baseRoutes[role].contacts)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <User size={20} />
                <span className="mt-1 text-xs">My Contacts</span>
              </Link>
            </>
          )}
        </nav>

        <UserDropdown />
      </div>
    </header>
  );
}
