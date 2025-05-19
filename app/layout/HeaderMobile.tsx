'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useUser } from '../context/useClientContext';
import { DollarSign, MessageCircle, Search, Users, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const HeaderMobile: React.FC<HeaderProps> = ({ routes }) => {
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  const { state } = useUser();
  const pathname = usePathname();

  const hiddenHeader = pathname.includes('/chat');

  const role = (state?.user?.gender as 'male' | 'female') ?? 'male';

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

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-gray-200 bg-white py-2',
        hiddenHeader && 'hidden',
      )}
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={role === 'female' ? routes.female.videoChat : routes.male.forYou}
        className="flex flex-col items-center px-3 py-2"
      >
        <Users
          size={24}
          className={
            isActive(
              role === 'female' ? routes.female.videoChat : routes.male.forYou,
            )
              ? role === 'female'
                ? 'text-pink-500'
                : 'text-blue-500'
              : 'text-gray-500'
          }
        />
        <span className="mt-1 text-xs">
          {role === 'female' ? 'Explore' : 'For You'}
        </span>
      </Link>

      <Link
        href={role === 'female' ? routes.female.ranking : '#'}
        className="flex flex-col items-center px-3 py-2"
      >
        <Search
          size={24}
          className={
            isActive(role === 'female' ? routes.female.ranking : '#')
              ? role === 'female'
                ? 'text-pink-500'
                : 'text-blue-500'
              : 'text-gray-500'
          }
        />
        <span className="mt-1 text-xs">Video chat</span>
      </Link>

      <Link
        href={routes[role].videoChat}
        className="flex flex-col items-center px-3 py-2"
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            role === 'female' ? 'bg-pink-500' : 'bg-blue-500'
          }`}
        >
          <Video size={24} className="text-white" />
        </div>
      </Link>

      <div className="flex flex-col items-center px-3 py-2">
        <div className="relative">
          <DollarSign size={24} className="text-gray-500" />
        </div>
        <span className="mt-1 text-xs">Rechange</span>
      </div>

      <Link
        href={routes[role].chats}
        className="flex flex-col items-center px-3 py-2"
      >
        <div className="relative">
          <MessageCircle
            size={24}
            className={
              isActive(routes[role].chats)
                ? role === 'female'
                  ? 'text-pink-500'
                  : 'text-blue-500'
                : 'text-gray-500'
            }
          />
          <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </span>
        </div>
        <span className="mt-1 text-xs">Chats</span>
      </Link>
    </motion.nav>
  );
};

export default HeaderMobile;
