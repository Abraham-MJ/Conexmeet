'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Users, BookOpen, Phone, BarChart3 } from 'lucide-react';
import { IoGiftOutline } from 'react-icons/io5';
import { GrUserManager } from 'react-icons/gr';

interface TabNavigationProps {
  activeTab?:
    | 'online'
    | 'stories'
    | 'contacts'
    | 'Ranking'
    | 'Referrals'
    | 'Gifts';
  handleTabChange: (
    tab: 'online' | 'stories' | 'contacts' | 'Ranking' | 'Referrals' | 'Gifts',
  ) => void;
  items: (
    | 'online'
    | 'stories'
    | 'contacts'
    | 'Ranking'
    | 'Referrals'
    | 'Gifts'
  )[];
}

export function TabNavigation({
  activeTab = 'online',
  handleTabChange,
  items,
}: TabNavigationProps) {
  const getTabIcon = (
    tab: 'online' | 'stories' | 'contacts' | 'Ranking' | 'Referrals' | 'Gifts',
  ) => {
    const iconSize = 20;

    switch (tab) {
      case 'online':
        return <Users size={iconSize} />;
      case 'stories':
        return <BookOpen size={iconSize} />;
      case 'contacts':
        return <Phone size={iconSize} />;
      case 'Ranking':
        return <BarChart3 size={iconSize} />;
      case 'Referrals':
        return <GrUserManager size={iconSize} />;
      case 'Gifts':
        return <IoGiftOutline size={iconSize} />;
    }
  };

  return (
    <div className={cn('bg-white transition-all duration-300')}>
      <div className="flex border-b border-gray-200">
        {items.map(
          (
            tab:
              | 'online'
              | 'stories'
              | 'contacts'
              | 'Ranking'
              | 'Referrals'
              | 'Gifts',
          ) => (
            <button
              key={tab}
              className={cn(
                'relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300',
                activeTab === tab
                  ? 'text-[#fc3d6b]'
                  : 'text-gray-500 hover:text-gray-700',
              )}
              onClick={() => handleTabChange(tab)}
            >
              <div className="flex items-center gap-2">
                {activeTab === tab && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      duration: 0.3,
                    }}
                    className="text-[#fc3d6b]"
                  >
                    {getTabIcon(tab)}
                  </motion.div>
                )}
                <span className="uppercase tracking-wide">
                  {tab === 'online' ? 'EN LÍNEA' : 
                   tab === 'stories' ? 'HISTORIAS' : 
                   tab === 'contacts' ? 'CONTACTOS' : 
                   tab === 'Ranking' ? 'RANKING' : 
                   tab === 'Referrals' ? 'REFERIDOS' : 
                   tab === 'Gifts' ? 'REGALOS' : tab}
                </span>
              </div>

              {activeTab === tab && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-[#fc3d6b]"
                  initial={{ width: 0, left: '50%', opacity: 0 }}
                  animate={{ width: '100%', left: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
