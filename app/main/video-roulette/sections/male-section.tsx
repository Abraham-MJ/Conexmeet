import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoRouletteMale } from '@/app/hooks/api/useVideoRouletteMale';
import { HistoryData } from '@/app/types/histories';
import { Camera, Play } from 'lucide-react';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { StyledFloatAlert } from '@/app/components/UI/StyledFloatAlert';
import { useMobile } from '@/app/hooks/useMobile';

const MaleViewVideo = () => {
  const isMobile = useMobile(920);
  const {
    handleVideoChatMale,
    loadingStatus,
    isChannelHoppingBlocked,
    channelHoppingBlockTimeRemaining,
  } = useAgoraContext();
  const { currentDate, histories } = useVideoRouletteMale();

  const [currentStory, setCurrentStory] = useState<HistoryData | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const selectRandomStory = useCallback(() => {
    if (histories && histories.length > 0) {
      const randomIndex = Math.floor(Math.random() * histories.length);
      setCurrentStory(histories[randomIndex]);
    } else {
      setCurrentStory(null);
    }
  }, [histories]);

  useEffect(() => {
    selectRandomStory();
  }, [selectRandomStory]);

  const handleVideoEnd = () => {
    selectRandomStory();
  };

  useEffect(() => {
    if (videoRef.current && currentStory?.url) {
      videoRef.current.load();
      videoRef.current.play().catch((error) => {});
    }
  }, [currentStory]);

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center bg-black',
        isMobile ? 'h-full' : 'h-full',
      )}
    >
      <StyledFloatAlert
        message={loadingStatus.message}
        isOpen={loadingStatus.isLoading}
        animationDirection="top"
        variant="loading"
      />
      {currentStory?.user?.profile_photo_path && (
        <img
          src={currentStory.user.profile_photo_path}
          alt="blur-img"
          className="relative z-10 h-full w-full object-cover blur-2xl"
        />
      )}
      <div className="absolute inset-0 z-20 bg-black/80"></div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {currentStory?.url && (
          <video
            ref={videoRef}
            key={currentStory.id || currentStory.url}
            src={currentStory.url}
            autoPlay
            controlsList="nodownload"
            className="h-full w-full"
            onEnded={handleVideoEnd}
            muted
            playsInline
          ></video>
        )}
      </div>
      <div className="absolute left-6 top-6 z-20 h-10 w-10 border-l-2 border-t-2 border-white/50"></div>
      <div className="absolute right-6 top-6 z-20 h-10 w-10 border-r-2 border-t-2 border-white/50"></div>
      <div className="absolute bottom-6 left-6 z-20 h-10 w-10 border-b-2 border-l-2 border-white/50"></div>
      <div className="absolute bottom-6 right-6 z-20 h-10 w-10 border-b-2 border-r-2 border-white/50"></div>
      <div className="absolute left-9 top-9 z-20 text-sm text-white/70">
        <div className="flex items-center">
          <Play className="mr-2 h-4 w-4 text-white/70" />
          <span>REPRODUCIR</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-red-500">●</span>
          <span>GRABAR</span>
        </div>
      </div>
      <div className="absolute bottom-8 left-8 z-20 text-sm text-white/70">
        {currentDate}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute"
      >
        <div className="relative z-20 w-full max-w-md text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">El video chat</h1>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 text-3xl font-bold text-white"
          >
            con mujeres número 1
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md"
          >
            <Button
              className={cn(
                'mb-6 w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300',
              )}
              disabled={loadingStatus.isLoading || isChannelHoppingBlocked}
              onClick={() => handleVideoChatMale()}
            >
              {loadingStatus.isLoading ? (
                <div className="text-md flex items-center justify-center font-latosans">
                  Cargando
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
                  {isChannelHoppingBlocked ? (
                    <>
                      🚫 Bloqueado (
                      {formatTime(channelHoppingBlockTimeRemaining)})
                    </>
                  ) : (
                    <>Entrar al video chat</>
                  )}
                </span>
              )}
            </Button>
          </motion.div>

          <p className="flex items-center justify-center gap-2 text-sm text-white/70">
            <Camera className="h-4 w-4" />
            Activa tu cámara para empezar la búsqueda
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MaleViewVideo;
