'use client';

import React from 'react';
import { motion } from 'framer-motion';
import FeaturesSkeleton from '@/app/components/loading/features-skeleton';
import {
  ContentCardContacts,
  ContentCardRooms,
  ContentCardStories,
} from '@/app/components/shared/features/ContentCard';
import useFeatures from '@/app/hooks/api/useFeatures';
import { HistoryData } from '@/app/types/histories';
import { UserData } from '@/app/types/list-user';
import { ContactData } from '@/app/types/my-contacts';
import { TabNavigation } from '@/app/components/UI/StyledTabs';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const FeaturesScreen = () => {
  const {
    activeTab,
    handleTabChange,
    stories,
    online,
    contacts,
    onSetPlayingVideoUrl,
    activeVideoUrl,
  } = useFeatures({ activeTabs: 'online' });
  const itemsTabs: ('online' | 'stories' | 'contacts')[] = [
    'online',
    'stories',
    'contacts',
  ];

  return (
    <div className="w-full">
      <TabNavigation
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        items={itemsTabs}
      />

      <div className="mt-6 px-4 pb-12 md:px-0">
        {activeTab === 'online' && (
          <div>
            <h2 className="mb-8 text-xl font-medium text-gray-800">
              Online now
            </h2>
            {online.loading ? (
              <FeaturesSkeleton />
            ) : (
              <motion.div
                className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {online?.data?.map((user: UserData) => (
                  <motion.div
                    key={`online-${user.id}`}
                    variants={cardItemVariants}
                  >
                    <ContentCardRooms user={user} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'stories' && (
          <div>
            <h2 className="mb-8 text-xl font-medium text-gray-800">
              Histories
            </h2>
            {stories.loading ? (
              <FeaturesSkeleton />
            ) : (
              <motion.div
                className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {stories?.data?.map((user: HistoryData) => (
                  <motion.div
                    key={`story-${user.id}`}
                    variants={cardItemVariants}
                  >
                    <ContentCardStories
                      activeVideoUrl={activeVideoUrl}
                      onSetPlayingVideoUrl={onSetPlayingVideoUrl}
                      user={user}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <h2 className="mb-8 text-xl font-medium text-gray-800">
              Your contacts
            </h2>
            {contacts.loading ? (
              <FeaturesSkeleton />
            ) : (
              <motion.div
                className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {contacts?.data?.map((user: ContactData) => (
                  <motion.div
                    key={`contact-${user.id}`}
                    variants={cardItemVariants}
                  >
                    <ContentCardContacts user={user} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesScreen;
