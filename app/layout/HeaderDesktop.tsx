'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMobile } from '../hooks/useMobile';
import { motion, useScroll } from 'framer-motion';
import { useUser } from '../context/useClientContext';
import UserDropdown from '../components/shared/UserDropDown';
import { MessageCircle, Video, Users, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalPackage from '../components/shared/modals/ModalPackage';

const HeaderDesktop: React.FC<HeaderProps> = ({ routes }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { state } = useUser();
  const pathname = usePathname();
  const isMobile = useMobile();

  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  const hiddenHeader = pathname.includes('/chat');

  const { minutes, gender, sales } = state?.user || {};

  const role = (gender as 'male' | 'female') ?? 'male';

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    return scrollY.onChange((latest) => {
      const currentScrollY = latest;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    });
  }, [scrollY, lastScrollY]);

  if (isMobile) {
    return (
      <motion.header
        className={cn(
          'fixed top-0 z-[50] flex h-[80px] w-full items-center justify-between border-b bg-[#fffffff0] px-4 py-3 text-white backdrop-blur-md transition-all duration-300',
        )}
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center rounded-full border bg-[#00000014] px-3 py-1">
            <span className="text-sm font-medium text-[#181a21]">
              Minutes: {minutes}
            </span>
          </div>
        </div>
        <UserDropdown />
      </motion.header>
    );
  }

  return (
    <header
      className={`fixed top-0 z-[50] flex h-[80px] w-full items-center justify-center border-b bg-[#fffffff0] px-4 py-3 text-white backdrop-blur-md transition-all duration-300`}
    >
      <div className="flex w-full max-w-[1536px] items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex cursor-default items-center rounded-full bg-[#0000000a] px-4 py-1.5 backdrop-blur-sm">
            <span className="text-sm font-medium text-[#181a21]">
              Minutes: {minutes}
            </span>
          </div>

          {role === 'female' ? (
            <div className="flex items-center rounded-full bg-[#00000014] px-4 py-1.5 backdrop-blur-sm">
              <span className="text-sm font-medium text-[#181a21]">
                Balance: ${sales.toFixed(2) || '0.00'}
              </span>
            </div>
          ) : (
            <div className="cursor-pointer rounded-full border bg-[#00000014] px-4 py-1 text-sm text-[#181a21]" onClick={() => {
              setIsOpen(true)
            }}>
              Recharge
            </div>
          )}
        </div>

        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-6">
          {role !== 'female' && (
            <>
              <Link
                href={routes[role]?.forYou}
                className={`flex flex-col items-center transition ${
                  isActive(routes[role]?.forYou)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Users size={20} className="text-black" />
                <span className="mt-1 text-sm font-medium text-[#181a21]">
                  For you
                </span>
              </Link>
            </>
          )}

          <Link
            href={routes?.[role].videoChat}
            className={`flex flex-col items-center transition ${
              isActive(routes?.[role].videoChat)
                ? 'opacity-100'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Video size={20} className="text-black" />
            <span className="mt-1 text-sm font-medium text-[#181a21]">
              Video Chat
            </span>
          </Link>

          <Link
            href={routes[role].chats}
            className={`flex flex-col items-center transition ${
              isActive(routes[role].chats)
                ? 'opacity-100'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <MessageCircle size={20} className="text-black" />
            <span className="mt-1 text-sm font-medium text-[#181a21]">
              Chats
            </span>
          </Link>

          {role === 'female' && (
            <>
              <Link
                href={routes[role].ranking}
                className={`flex flex-col items-center transition ${
                  isActive(routes[role].ranking)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <BarChart3 size={20} className="text-black" />
                <span className="mt-1 text-sm font-medium text-[#181a21]">
                  Ranking
                </span>
              </Link>
              <Link
                href={routes[role].contacts}
                className={`flex flex-col items-center transition ${
                  isActive(routes[role].contacts)
                    ? 'opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <User size={20} className="text-black" />
                <span className="mt-1 text-sm font-medium text-[#181a21]">
                  My Contacts
                </span>
              </Link>
            </>
          )}
        </nav>

        <UserDropdown />
      </div>
      <ModalPackage
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </header>
  );
};

export default HeaderDesktop;
