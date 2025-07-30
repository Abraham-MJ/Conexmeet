'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/app/context/useClientContext';
import { useVideoRouletteFemale } from '@/app/hooks/api/useVideoRouletteFemale';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { StyledFloatAlert } from '@/app/components/UI/StyledFloatAlert';
import { useMobile } from '@/app/hooks/useMobile';
import { FaHeart } from 'react-icons/fa';
import { IoCloudUploadOutline } from 'react-icons/io5';
import ModalUploadStory from '@/app/components/shared/modals/ModalUploadStory';
import VerifyDocuments, {
  StatusType,
} from '@/app/components/shared/global/VerifyDocuments';
import { useTranslation } from '@/app/hooks/useTranslation';

import { useValidHoursStories } from '@/app/hooks/useValidHoursStories';

const FemaleViewVideo = () => {
  const { t } = useTranslation();
  const isMobile = useMobile(920);

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);


  const { handleVideoChatFemale, loadingStatus } = useAgoraContext();
  const { state: user } = useUser();
  const { histories, deleteHistoryById, isLoadingDelete } =
    useVideoRouletteFemale();

  const { has48HoursPassed, timeRemaining, isDeleting } = useValidHoursStories({
    date_history: histories?.[0]?.created_at || '',
    historyId: histories?.[0]?.id,
    onDeleteHistory: deleteHistoryById
  })

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        console.warn('Error al intentar reproducir el video:', error);
      });
    }
  }, [histories]);

  const handleVideoChat = async () => {
    if (isProcessing || loadingStatus.isLoading) return;
    
    setIsProcessing(true);
    try {
      await handleVideoChatFemale();
    } finally {
      setIsProcessing(false);
    }
  };

  if (user.user.confirmed !== 1) {
    return (
      <VerifyDocuments status={String(user.user.confirmed) as StatusType} />
    );
  }

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center bg-white',
        isMobile ? 'h-full' : 'h-full',
      )}
    >
      <StyledFloatAlert
        message={loadingStatus.message}
        isOpen={loadingStatus.isLoading}
        animationDirection="top"
        variant="loading"
      />
      {user.user.profile_photo_path && (
        <img
          src={user.user.profile_photo_path}
          alt="blur-img"
          className={cn(
            'relative z-10 h-full w-full object-cover',
            histories.length > 0 ? 'blur-2xl' : '',
          )}
        />
      )}
      <div className="absolute inset-0 z-20 bg-black/80"></div>

      {histories?.[0] === undefined && (
        <div
          className="absolute bottom-0 right-0 z-50 flex items-center justify-between p-3"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center gap-1 rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] text-xs font-medium text-white">
            <IoCloudUploadOutline className="h-6 w-6 text-white" />
          </div>
        </div>
      )}

      {(histories?.[0]?.like ?? 0) > 0 && (
        <div className="absolute right-0 top-0 z-20 flex select-none items-center justify-between p-3">
          <div className="flex gap-1 rounded-full bg-white/20 px-2 py-1 text-xs font-medium text-white">
            {t('videoRoulette.likes')} {histories?.[0]?.like ?? 0}
            <FaHeart className="h-4 w-4 text-red-500" />
          </div>
        </div>
      )}

      {histories.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <video
            ref={videoRef}
            key={histories[0]?.id}
            src={histories[0]?.url}
            autoPlay
            controlsList="nodownload"
            className="h-full w-full"
            muted
            loop
            playsInline
          ></video>
        </div>
      )}

      <div className="absolute">
        <div className="relative z-20 w-full max-w-md text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-5 select-none text-center text-3xl font-bold text-white"
          >
            {t('videoRoulette.female.title')}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md"
          >
            <Button
              className={cn(
                'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300',
              )}
              disabled={loadingStatus.isLoading || isProcessing}
              onClick={handleVideoChat}
            >
              {(loadingStatus.isLoading || isProcessing) ? (
                <div className="text-md flex items-center justify-center font-latosans">
                  {t('common.loading')}
                  {[1, 2, 3].map((index) => {
                    return (
                      <motion.span
                        key={index}
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        .
                      </motion.span>
                    );
                  })}
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('videoRoulette.male.enterVideoChat')}
                </span>
              )}
            </Button>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-light text-white">
              <span>{t('videoRoulette.female.instruction')}</span>
            </div>
          </motion.div>
        </div>
      </div>
      <ModalUploadStory
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export default FemaleViewVideo;
