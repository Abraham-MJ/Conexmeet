'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMobile } from '../hooks/useMobile';
import { motion } from 'framer-motion';
import { useUser } from '../context/useClientContext';
import UserDropdown from '../components/shared/UserDropDown';
import { cn } from '@/lib/utils';
import ModalPackage from '../components/shared/modals/ModalPackage';
import { useChat } from '../context/useChatContext';
import { converterMinutes } from '../utils/converter-minutes';
import { BiLike, BiSolidLike } from 'react-icons/bi';
import { HiVideoCamera, HiOutlineVideoCamera } from 'react-icons/hi2';
import {
  IoChatbubbleEllipsesOutline,
  IoChatbubbleEllipses,
} from 'react-icons/io5';
import { RiContactsLine, RiContactsFill } from 'react-icons/ri';
import { MdInsertChartOutlined, MdInsertChart } from 'react-icons/md';
import { useTranslation } from '../hooks/useTranslation';

interface RouteConfig {
  icon: React.ElementType;
  iconActive?: React.ElementType;
  label: string;
  href: (role: 'male' | 'female') => string;
  show?: (role: 'male' | 'female') => boolean;
  onClick?: () => void;
  badge?: (chatTotalUnreadCount: number) => number;
  disabled?: boolean;
}

interface UserInfoConfig {
  label: (
    role: 'male' | 'female',
    minutes: number | undefined,
    sales: number | undefined,
  ) => string;
  bgColor: (role: 'male' | 'female') => string;
  action?: (
    role: 'male' | 'female',
    setIsOpen: (open: boolean) => void,
  ) => React.ReactNode;
}

const hiddenRoutes: RegExp[] = [/^\/main\/stream\/[^/]+$/];

const HeaderDesktop: React.FC<HeaderProps> = ({ routes }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { state: userState } = useUser();
  const { state: chatState } = useChat();
  const pathname = usePathname();
  const isMobile = useMobile(920);

  const { minutes, gender, sales } = userState?.user || {};
  const role = (gender as 'male' | 'female') ?? 'male';

  const getLinkClasses = () => {
    return cn('flex flex-col items-center transition');
  };

  const getIconClasses = () => {
    return cn('h-[26px] w-[26px] text-[#181a21] mb-1');
  };

  const getSpanClasses = () => {
    return cn('text-[12px] text-[#181a21]');
  };

  const shouldHideHeader = hiddenRoutes.some((pattern) =>
    pattern.test(pathname),
  );

  const navRoutes: RouteConfig[] = [
    {
      icon: BiLike,
      iconActive: BiSolidLike,
      label: t('header.forYou'),
      href: (currentRole) => routes.male.forYou,
      show: (currentRole) => currentRole === 'male',
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: HiOutlineVideoCamera,
      iconActive: HiVideoCamera,
      label: t('header.videoChat'),
      href: (currentRole) => routes[currentRole].videoChat,
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: IoChatbubbleEllipsesOutline,
      iconActive: IoChatbubbleEllipses,
      label: t('header.chats'),
      href: (currentRole) => routes[currentRole].chats,
      badge: (totalUnreadCount) => totalUnreadCount,
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: MdInsertChartOutlined,
      iconActive: MdInsertChart,
      label: t('header.ranking'),
      href: (currentRole) =>
        (routes[currentRole] as { ranking?: string }).ranking ?? '',
      show: (currentRole) => currentRole === 'female',
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
    {
      icon: RiContactsLine,
      iconActive: RiContactsFill,
      label: t('header.myContacts'),
      href: (currentRole) =>
        (routes[currentRole] as { contacts?: string }).contacts ?? '',
      show: (currentRole) => currentRole === 'female',
      disabled: role === 'female' && userState.user.confirmed !== 1,
    },
  ];

  const userInfoConfig: UserInfoConfig[] = [
    {
      label: (currentRole, currentMinutes, currentSales) =>
        currentRole === 'female'
          ? `${t('header.balance')}: $${currentSales?.toFixed(2) || '0.00'}`
          : `${t('header.minutes')}: ${converterMinutes(typeof currentMinutes === 'number' ? String(currentMinutes) : (currentMinutes ?? '00:00:00'))}`,
      bgColor: (currentRole) =>
        currentRole === 'female'
          ? 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)]'
          : 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)]',
    },
    {
      label: (currentRole, currentMinutes, currentSales) => '',
      bgColor: (currentRole) =>
        currentRole === 'female'
          ? 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)]'
          : 'bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)]',
      action: (currentRole, setIsModalOpen) => {
        if (currentRole === 'male') {
          return (
            <div
              className="cursor-pointer rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] px-4 py-2 text-sm font-medium text-white"
              onClick={() => setIsModalOpen(true)}
            >
              {t('header.recharge')}
            </div>
          );
        } else {
          return (
            <div className="flex items-center rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] px-4 py-2">
              <span className="text-sm font-medium text-white">
                {t('header.minutes')}: {converterMinutes(minutes) || '0.00'}
              </span>
            </div>
          );
        }
      },
    },
  ];

  if (isMobile) {
    return (
      <motion.header
        className={cn(
          'fixed top-0 z-[50] flex h-[80px] w-full items-center justify-between border-b bg-[#fffffff0] px-4 py-3 text-white backdrop-blur-3xl transition-all duration-300',
          shouldHideHeader && 'hidden',
        )}
      >
        {userInfoConfig.map((config, index) => {
          if (index === 0) {
            const bgColorClass = config.bgColor(role);
            const labelText = config.label(role, minutes, sales);
            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2',
                  bgColorClass,
                )}
              >
                <span className="text-sm font-medium text-white">
                  {labelText}
                </span>
              </div>
            );
          }
          return null;
        })}
        <UserDropdown />
      </motion.header>
    );
  }

  return (
    <header
      className={cn(
        `fixed top-0 z-[50] flex h-[80px] w-full items-center justify-center border-b bg-[#FFFFFF] px-4 py-3 text-white backdrop-blur-3xl transition-all duration-300`,
        shouldHideHeader && 'hidden',
      )}
    >
      <div className="flex w-full max-w-[1536px] items-center justify-between">
        <div className="flex items-center space-x-3">
          {userInfoConfig.map((config, index) => {
            const bgColorClass = config.bgColor(role);
            const labelText = config.label(role, minutes, sales);

            if (config.action) {
              return <div key={index}>{config.action(role, setIsOpen)}</div>;
            }

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2',
                  bgColorClass,
                )}
              >
                <span className="text-sm font-medium text-white">
                  {labelText}
                </span>
              </div>
            );
          })}
        </div>
        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-6">
          {navRoutes.map((route, index) => {
            if (route.show && !route.show(role)) {
              return null;
            }
            const isActive = pathname === route.href(role);
            const href = route.disabled ? '' : route.href(role);
            const Icon =
              isActive && route.iconActive ? route.iconActive : route.icon;

            return (
              <Link key={index} href={href} className={getLinkClasses()}>
                <div className="relative">
                  {Icon ? <Icon className={getIconClasses()} /> : null}
                  {route.badge &&
                    route.badge(chatState.totalUnreadCount) > 0 && (
                      <span className="absolute -right-1 -top-[6px] flex items-center justify-center rounded-full bg-[#fc3d6b] px-[5px] py-0 text-[10px] font-medium text-white">
                        {route.badge(chatState.totalUnreadCount)}
                      </span>
                    )}
                </div>
                {route.label && (
                  <span className={getSpanClasses()}>{route.label}</span>
                )}
              </Link>
            );
          })}
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
