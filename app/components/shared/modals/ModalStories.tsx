'use client';

import React, { useRef, useState, useEffect } from 'react';
import StyledModal from '../../UI/StyledModal';
import { Heart, User, Volume2, VolumeX, X } from 'lucide-react';
import { HistoryData } from '@/app/types/histories';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useLikeStory } from '@/app/hooks/api/useLikeStories';
import { useAddContacts } from '@/app/hooks/api/useAddContacts';
import { useTranslation } from '../../../hooks/useTranslation';
import { cn } from '@/lib/utils';
import { useMobile } from '@/app/hooks/useMobile';
import { getChatMessages } from '@/app/public/stories/messages';
import ModalNotStories from '@/app/public/stories/ModalNotStories';

const ModalStories = ({
  isOpen,
  onClose,
  stories,
  active_stories,
  lockToStory = false,
  messages = false,
  onStoryChange
}: {
  isOpen: boolean;
  onClose: () => void;
  stories: HistoryData[];
  active_stories: HistoryData;
  lockToStory?: boolean;
  messages?: boolean;
  onStoryChange?: () => boolean;
}) => {

  const isMobile = useMobile(1024);


  const { t } = useTranslation();
  const {
    error: errorLike,
    toggleLike,
    isLoading: isLikeLoading,
  } = useLikeStory();

  const {
    toggleContact: toggleContactApi,
    isLoading: isContactLoading,
    error: contactError,
  } = useAddContacts();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentStory, setCurrentStory] = useState<HistoryData | null>(null);

  const [isContactAddedLocal, setIsContactAddedLocal] = useState(false);
  const [isLikedLocal, setIsLikedLocal] = useState(false);

  const [showContactPulse, setShowContactPulse] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Estados para el sistema de mensajes aleatorios
  const [currentMessage, setCurrentMessage] = useState<any>(null);
  const [usedMessageIds, setUsedMessageIds] = useState<Set<string>>(new Set());
  const [showMessage, setShowMessage] = useState(false);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (stories && stories.length > 0) {
      const initialIndex = stories.findIndex(
        (story) => story.id === active_stories.id,
      );
      const validInitialIndex = initialIndex !== -1 ? initialIndex : 0;
      setCurrentIndex(validInitialIndex);
      setCurrentStory(stories[validInitialIndex]);
    } else {
      setCurrentStory(null);
    }
  }, [stories, active_stories]);

  useEffect(() => {
    if (currentStory) {
      setIsLikedLocal(
        currentStory.like_user !== null && currentStory.like_user !== undefined,
      );

      if (currentStory.type === 'video' && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.load();
        videoRef.current.play().catch((error) => {
          console.error(
            'Error al intentar reproducir el video automáticamente:',
            error,
          );
        });
      }
    }
  }, [currentStory]);

  // Separate useEffect for message logic to avoid dependency issues
  useEffect(() => {
    if (currentStory && messages) {
      // Reset message state for new story
      setCurrentMessage(null);
      setShowMessage(false);

      const timer = setTimeout(() => {
        const allMessages = getChatMessages(currentStory);

        const availableMessages = allMessages.filter(msg => !usedMessageIds.has(msg.rtmUid));

        let selectedMessage: any;

        if (availableMessages.length === 0) {
          setUsedMessageIds(new Set());
          const randomIndex = Math.floor(Math.random() * allMessages.length);
          selectedMessage = allMessages[randomIndex];
          setUsedMessageIds(new Set([selectedMessage.rtmUid]));
        } else {
          const randomIndex = Math.floor(Math.random() * availableMessages.length);
          selectedMessage = availableMessages[randomIndex];
          setUsedMessageIds(prev => new Set([...prev, selectedMessage.rtmUid]));
        }

        setCurrentMessage(selectedMessage);
        setShowMessage(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentStory, messages]);

  const handleNextStory = () => {
    if (!stories || stories.length === 0) return;

    // Verificar límite de historias si hay callback
    if (onStoryChange && !onStoryChange()) {
      return; // No cambiar historia si se alcanzó el límite
    }

    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % stories.length;
      setCurrentStory(stories[nextIndex]);
      return nextIndex;
    });
  };

  const handlePrevStory = () => {
    if (!stories || stories.length === 0) return;

    // Verificar límite de historias si hay callback
    if (onStoryChange && !onStoryChange()) {
      return; // No cambiar historia si se alcanzó el límite
    }

    setCurrentIndex((prevIndex) => {
      const prevStoryIndex = (prevIndex - 1 + stories.length) % stories.length;
      setCurrentStory(stories[prevStoryIndex]);
      return prevStoryIndex;
    });
  };

  const handleVideoEnded = () => {
    if (!lockToStory) {
      handleNextStory();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleToggleLike = async () => {
    if (!currentStory || isLikeLoading) {
      return;
    }

    const originalIsLiked = isLikedLocal;
    const newIsLikedState = !originalIsLiked;

    setIsLikedLocal(newIsLikedState);
    if (newIsLikedState) {
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 1800);
    }

    try {
      const response = await toggleLike(currentStory.id);
      if (!response || !response.success) {
        console.error(
          'Fallo al dar like/unlike:',
          response?.message || errorLike || 'Error desconocido',
        );
        setIsLikedLocal(originalIsLiked);
        if (newIsLikedState) setShowHearts(false);
      }
    } catch (e) {
      console.error('Excepción al dar like/unlike:', e);
      setIsLikedLocal(originalIsLiked);
      if (newIsLikedState) setShowHearts(false);
    }
  };

  const handleToggleContact = async () => {
    if (!currentStory || !currentStory.user || isContactLoading) {
      return;
    }

    const originalIsContactAdded = isContactAddedLocal;
    const newIsContactState = !originalIsContactAdded;

    setIsContactAddedLocal(newIsContactState);
    if (newIsContactState) {
      setShowContactPulse(true);
      setTimeout(() => setShowContactPulse(false), 700);
    }

    try {
      const response = await toggleContactApi(currentStory.user.id);

      if (!response || !response.success) {
        console.error(
          'Fallo al agregar/quitar contacto:',
          response?.message || contactError || 'Error desconocido',
        );
        setIsContactAddedLocal(originalIsContactAdded);
        if (newIsContactState) setShowContactPulse(false);
      }
    } catch (e) {
      console.error('Excepción al agregar/quitar contacto:', e);
      setIsContactAddedLocal(originalIsContactAdded);
      if (newIsContactState) setShowContactPulse(false);
    }
  };

  if (!isOpen || !currentStory) {
    return null;
  }



  return (
    <StyledModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      position="center"
      width="900px"
      height="640px"
      noClose
      noPadding
    >
      <div className="relative h-full w-full overflow-hidden bg-black">
        <div
          className="absolute inset-0 scale-110 bg-center blur-md"
          style={{
            backgroundImage: `url('${currentStory.user.profile_photo_path}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative flex h-full w-full items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative mx-auto h-full w-full max-w-md">
              {currentStory.type === 'video' ? (
                <video
                  ref={videoRef}
                  key={currentStory.id + '_' + currentStory.url}
                  src={currentStory.url}
                  className={`h-full w-full object-cover transition-opacity duration-300`}
                  playsInline
                  autoPlay
                  loop={false}
                  muted={isMuted}
                  preload="metadata"
                  onEnded={handleVideoEnded}
                  poster={currentStory.user.profile_photo_path}
                />
              ) : (
                <img
                  src={currentStory.url}
                  alt={t('video.storyContent')}
                  className="h-full w-full object-contain"
                />
              )}

              <div className="absolute left-4 right-4 top-4 flex items-center justify-between sm:left-6 sm:top-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-white">
                    <img
                      src={currentStory.user.profile_photo_path}
                      alt={currentStory.user.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-white drop-shadow-md">
                        {currentStory.user.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-4 sm:bottom-10 sm:gap-6">
                <div className="relative">
                  {showContactPulse && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  )}
                  <button
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 sm:h-14 sm:w-14 ${isContactAddedLocal
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'border border-blue-500 bg-black/30 text-blue-500 backdrop-blur-sm hover:bg-black/40'
                      } ${isContactLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={handleToggleContact}
                    disabled={isContactLoading}
                    aria-label={
                      isContactAddedLocal
                        ? t('video.contactAdded')
                        : t('video.addContact')
                    }
                  >
                    <User
                      className={`transition-all duration-300 ${isContactAddedLocal ? 'h-5 w-5 text-white sm:h-6 sm:w-6' : 'h-6 w-6 sm:h-7 sm:w-7'}`}
                    />
                  </button>
                </div>

                <div className="relative flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
                  {showHearts && (
                    <>
                      <Heart
                        className="absolute left-1/2 top-1/2 h-4 w-4 animate-[float1_1.5s_ease-out_forwards] fill-red-500 text-red-500 opacity-0"
                        style={{ transform: 'translate(-50%, -50%)' }}
                      />
                      <Heart
                        className="absolute left-1/2 top-1/2 h-3 w-3 animate-[float2_1.8s_ease-out_forwards_0.1s] fill-red-500 text-red-500 opacity-0"
                        style={{ transform: 'translate(-50%, -50%)' }}
                      />
                      <Heart
                        className="absolute left-1/2 top-1/2 h-5 w-5 animate-[float3_1.2s_ease-out_forwards_0.2s] fill-red-500 text-red-500 opacity-0"
                        style={{ transform: 'translate(-50%, -50%)' }}
                      />
                    </>
                  )}
                  <button
                    className={`flex h-full w-full items-center justify-center rounded-full transition-all duration-300 ${isLikedLocal
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'border border-red-500 bg-black/30 text-red-500 backdrop-blur-sm hover:bg-black/40'
                      } ${isLikeLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={handleToggleLike}
                    disabled={isLikeLoading}
                    aria-label={
                      isLikedLocal
                        ? t('video.storyLiked')
                        : t('video.likeStory')
                    }
                  >
                    <Heart
                      className={`transition-all duration-500 ${isLikedLocal
                        ? 'animate-[heartBeat_0.6s_ease-in-out] fill-white'
                        : ''
                        }`}
                      style={{
                        height: isLikedLocal ? '22px' : '24px',
                        width: isLikedLocal ? '22px' : '24px',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div className="absolute right-6 top-6 z-10">
                <button
                  onClick={toggleMute}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-all duration-300 hover:bg-black/70"
                  aria-label={isMuted ? t('video.unmute') : t('video.mute')}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>


            {!!messages && (
              <div className="absolute bottom-6 left-4 right-4  flex h-80 flex-col sm:bottom-10">
                <div className="hide-scrollbar-on-hover mask-gradient-bottom flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain">
                  <div className="box-border flex min-h-full flex-col justify-end pb-2">
                    {showMessage && currentMessage ? (
                      <div
                        className={cn(
                          'my-1 animate-fade-in-right bg-[#0000007a] rounded-lg p-2',
                          isMobile && 'mr-4',
                        )}
                        key={`${currentMessage.rtmUid}-${currentMessage.timestamp}`}
                      >
                        <div className="text-white text-sm">
                          <span className="font-medium">{currentMessage.user_name}:</span>
                          <span className="ml-1">{currentMessage.display_text}</span>
                        </div>
                      </div>
                    ) : (
                      false
                    )}
                  </div>
                </div>

                <div className="mt-2 z-20 box-border flex min-h-12 max-w-[300px] flex-row items-end rounded-3xl bg-[#ffffff29] p-2 ps-1 backdrop-blur-[12px] transition-colors duration-300 ease-in-out">
                  <input
                    className="m-0 mx-3 box-border h-[20px] w-full flex-1 resize-none self-center border-none bg-transparent pr-3 text-sm leading-tight text-white outline-none placeholder:text-white"
                    placeholder={t('video.saySomething')}
                    data-testid="textarea"
                    value={''}
                    onClick={() => {
                      setShowModal(true)
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {stories && stories.length > 1 && (
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-between gap-4 px-2 sm:px-4">
              <button
                onClick={handlePrevStory}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-all duration-300 hover:scale-105 hover:bg-black/70 sm:h-12 sm:w-12"
                aria-label={t('video.previousStory')}
              >
                <IoIosArrowBack className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                onClick={handleNextStory}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white transition-all duration-300 hover:scale-105 hover:bg-black/70 sm:h-12 sm:w-12"
                aria-label={t('video.nextStory')}
              >
                <IoIosArrowForward className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalNotStories isOpen={showModal} onClose={() => {
        setShowModal(false)
      }} />
    </StyledModal>
  );
};

export default ModalStories;
