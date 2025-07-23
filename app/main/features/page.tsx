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
import { ContactData } from '@/app/types/my-contacts';
import { TabNavigation } from '@/app/components/UI/StyledTabs';
import { FemaleWithStatus } from '@/app/api/agora/host/route';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { StyledFloatAlert } from '@/app/components/UI/StyledFloatAlert';
import ContainerGlobal from '@/app/components/shared/global/ContainerGlobal';

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

export const dynamic = 'force-dynamic';

const FeaturesScreen = () => {
  const {
    handleVideoChatMale,
    loadingStatus,
    state: agora,
    channelHoppingBlockTimeRemaining,
    openChannelHoppingBlockedModal,
  } = useAgoraContext();

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ContainerGlobal classNames="max-w-[1536px] px-4 mx-auto">
      <StyledFloatAlert
        message={loadingStatus.message}
        isOpen={loadingStatus.isLoading}
        animationDirection="top"
        variant="loading"
      />
      <TabNavigation
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        items={itemsTabs}
      />

      <div className="mt-6 pb-12 md:px-0">
        {activeTab === 'online' && (
          <div>
            <h2 className="mb-8 text-xl font-medium text-gray-800">
              En línea ahora
              {`${agora.channelHopping.isBlocked ? `🚫 Bloqueado ${formatTime(channelHoppingBlockTimeRemaining)}` : ''}`}
            </h2>
            {online.loading ? (
              <FeaturesSkeleton />
            ) : (
              <motion.div
                className="relative grid grid-flow-dense auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {online?.data?.map((user: any) => {
                  const normalizedUser: FemaleWithStatus = {
                    ...user,
                    user_id:
                      typeof user.user_id === 'string'
                        ? Number(user.user_id)
                        : user.user_id,
                  };
                  return (
                    <motion.div
                      key={`online-${normalizedUser.user_id}`}
                      variants={cardItemVariants}
                    >
                      <ContentCardRooms
                        user={normalizedUser}
                        initialCall={(host_id: string) => {
                          if (agora.channelHopping.isBlocked) {
                            openChannelHoppingBlockedModal();
                          } else {
                            handleVideoChatMale(host_id);
                          }
                        }}
                        isLoadingCall={loadingStatus.isLoading}
                        rolUser={agora.localUser?.role ?? 'male'}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'stories' && (
          <div>
            <h2 className="mb-8 text-xl font-medium text-gray-800">
              Historias
            </h2>
            {stories.loading ? (
              <FeaturesSkeleton />
            ) : (
              <motion.div
                className="relative grid grid-flow-dense auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
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
                      stories={stories.data ?? []}
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
              Tus contactos
            </h2>
            {contacts.loading ? (
              <FeaturesSkeleton />
            ) : (
              <motion.div
                className="relative grid grid-flow-dense auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
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
    </ContainerGlobal>
  );
};

export default FeaturesScreen;
