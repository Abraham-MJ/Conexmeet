'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useUser } from '../context/useClientContext';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import ModalPackage from '../components/shared/modals/ModalPackage';
import { useChat } from '../context/useChatContext';
import { BiLike, BiSolidLike } from 'react-icons/bi';
import { MdInsertChart, MdInsertChartOutlined } from 'react-icons/md';
import { HiOutlineVideoCamera, HiVideoCamera } from 'react-icons/hi2';
import { RiContactsFill, RiContactsLine } from 'react-icons/ri';
import {
  IoChatbubbleEllipses,
  IoChatbubbleEllipsesOutline,
} from 'react-icons/io5';

interface RouteConfig {
  icon: React.ElementType;
  label: string;
  href: (role: 'male' | 'female') => string;
  show?: (role: 'male' | 'female') => boolean;
  onClick?: () => void;
  badge?: (chatTotalUnreadCount: number) => number;
  isSpecialButton?: boolean;
  disabled?: boolean;
  iconActive?: React.ElementType;
}

const hiddenRoutes: RegExp[] = [/^\/main\/chat\/[^/]+$/];

const HeaderMobile: React.FC<HeaderProps> = ({ routes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  const { state: userState } = useUser();
  const { state: chatState } = useChat();

  const pathname = usePathname();
  const role = (userState?.user?.gender as 'male' | 'female') ?? 'male';

  const shouldHideHeader = hiddenRoutes.some((pattern) =>
    pattern.test(pathname),
  );

  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      const currentScrollY = latest;
      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    });
    return () => unsubscribe();
  }, [scrollY, lastScrollY]);

  if (shouldHideHeader) {
    return null;
  }

  const getLinkClasses = () => {
    return cn('flex flex-col items-center transition');
  };

  const getIconClasses = () => {
    return cn('h-[26px] w-[26px] text-[#181a21] mb-1');
  };

  const navRoutes: RouteConfig[] = [
    {
      icon: role === 'female' ? MdInsertChartOutlined : BiLike,
      iconActive: role === 'female' ? MdInsertChart : BiSolidLike,
      label: role === 'female' ? 'Ranking' : 'For You',
      href: (currentRole) =>
        currentRole === 'female' ? routes.female.ranking : routes.male.forYou,
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: HiOutlineVideoCamera,
      iconActive: HiVideoCamera,
      label: 'Video chat',
      href: (currentRole) =>
        currentRole === 'female'
          ? routes.female.videoChat
          : routes.male.videoChat,
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: RiContactsLine,
      iconActive: RiContactsFill,
      label: 'Contacts',
      href: (currentRole) =>
        'contacts' in routes[currentRole]
          ? (routes[currentRole] as { contacts: string }).contacts
          : '#',
      show: (currentRole) => currentRole === 'female',
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: DollarSign,
      label: 'Recharge',
      href: () => '#',
      show: (currentRole) => currentRole === 'male',
      onClick: () => setIsOpen(true),
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: IoChatbubbleEllipsesOutline,
      iconActive: IoChatbubbleEllipses,
      label: 'Chats',
      href: (currentRole) => routes[currentRole].chats,
      badge: (chatTotalUnreadCount) => chatTotalUnreadCount,
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
  ];

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 z-50 flex w-full justify-around border-b border-t bg-white py-2',
      )}
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      {navRoutes.map((route, index) => {
        if (route.show && !route.show(role)) {
          return null;
        }

        const href = route.disabled ? '' : route.href(role);
        const isActive = pathname === route.href(role);
        const Icon =
          isActive && route.iconActive ? route.iconActive : route.icon;
        const activeClass = 'text-[#181a21]';

        return (
          <Link
            key={index}
            href={href}
            className={getLinkClasses()}
            onClick={route.onClick}
          >
            <div className="relative">
              {Icon ? <Icon className={getIconClasses()} /> : null}
              {route.badge && route.badge(chatState.totalUnreadCount) > 0 && (
                <span className="absolute -right-1 -top-[6px] flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {route.badge(chatState.totalUnreadCount)}
                </span>
              )}
            </div>
            {route.label && (
              <span className={cn('mt-1 text-xs', activeClass)}>
                {route.label}
              </span>
            )}
          </Link>
        );
      })}

      <ModalPackage
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </motion.nav>
  );
};

export default HeaderMobile;
