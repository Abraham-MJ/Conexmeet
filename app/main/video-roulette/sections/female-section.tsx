'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, Video } from 'lucide-react';
import { useUser } from '@/app/context/useClientContext';
import { useVideoRouletteFemale } from '@/app/hooks/api/useVideoRouletteFemale';
import PlayStoriesView from './play-stories';
import AddStoriesView from './add-stories';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { StyledFloatAlert } from '@/app/components/UI/StyledFloatAlert';
import { useMobile } from '@/app/hooks/useMobile';
import { FaHeart } from 'react-icons/fa';
import { IoCloudUploadOutline } from 'react-icons/io5';
import ModalUploadStory from '@/app/components/shared/modals/ModalUploadStory';
import VerifyDocuments, {
  StatusType,
} from '@/app/components/shared/global/VerifyDocuments';

const FemaleViewVideo = () => {
  const isMobile = useMobile(920);

  const [isOpen, setIsOpen] = useState(false);

  const { handleVideoChatFemale, loadingStatus } = useAgoraContext();
  const { state: user } = useUser();
  const { histories, deleteHistoryById, isLoadingDelete } =
    useVideoRouletteFemale();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        console.warn('Error al intentar reproducir el video:', error);
      });
    }
  }, [histories]);

  if (user.user.confirmed !== 1) {
    return (
      <VerifyDocuments status={String(user.user.confirmed) as StatusType} />
    );
  }

  if (isMobile) {
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
              Likes {histories?.[0]?.like ?? 0}
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
              Quiero encontrar chicos para chatear.
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full max-w-md"
            >
              <Button
                className={cn(
                  'w-[90%] rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80',
                )}
                disabled={loadingStatus.isLoading}
                onClick={handleVideoChatFemale}
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
                    Video Chat
                  </span>
                )}
              </Button>
              <div className="mt-5 flex items-center justify-center gap-2 text-sm font-light text-white">
                <span>Activa tu cámara para empezar la búsqueda.</span>
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
  }

  return (
    <div className="flex h-[calc(100%-64px)] w-full items-center justify-center">
      <div
        className={cn(
          'relative h-[80%] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0px_20px_46px_0px_#B1B1B1]',
        )}
      >
        <div className="relative h-full w-full">
          <StyledFloatAlert
            message={loadingStatus.message}
            isOpen={loadingStatus.isLoading}
            animationDirection="top"
            variant="loading"
          />
          <div className="flex h-full flex-col md:flex-row">
            <div className="relative h-full flex-1">
              <div className="flex h-full flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="my-14 flex w-full justify-center"
                >
                  <div className="group relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#fc3d6b] via-[#fc3d6b] to-[#fc3d6b] opacity-70 blur-sm transition duration-1000 group-hover:opacity-100 group-hover:blur-md"></div>
                    <div className="animate-spin-slow absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#fc3d6b] via-[#fc3d6b] to-[#fc3d6b] opacity-50 blur-[1px]"></div>
                    <div className="relative h-40 w-40 overflow-hidden rounded-full bg-white p-1 md:h-48 md:w-48">
                      <div className="h-full w-full overflow-hidden rounded-full">
                        <img
                          src={
                            user.user.profile_photo_path ??
                            '/images/banner-female.png'
                          }
                          alt="Profile"
                          width={200}
                          height={200}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-green-400"></div>
                    </div>
                  </div>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-5 text-center text-3xl font-bold text-gray-800"
                >
                  Quiero encontrar chicos para chatear.
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-full max-w-md"
                >
                  <Button
                    className={cn(
                      'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80',
                    )}
                    disabled={loadingStatus.isLoading}
                    onClick={handleVideoChatFemale}
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
                        <Video
                          className={cn(
                            'h-5 w-5 transition-transform duration-300',
                          )}
                        />
                        Video Chat
                      </span>
                    )}
                  </Button>
                  <div className="mt-5 flex items-center justify-center gap-2 text-sm font-light text-gray-500">
                    <Camera className="h-4 w-4" />
                    <span>Activa tu cámara para empezar la búsqueda.</span>
                  </div>
                </motion.div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative h-full w-full md:w-1/3"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full w-full p-2">
                  {histories.length > 0 ? (
                    <PlayStoriesView
                      histories={histories}
                      onDelete={(storie_id) => {
                        deleteHistoryById(storie_id);
                      }}
                      isLoadingDelete={isLoadingDelete}
                    />
                  ) : (
                    <AddStoriesView
                      handleOpen={() => {
                        setIsOpen(true);
                      }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
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
