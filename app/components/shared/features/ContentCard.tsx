'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaHeart, FaPause, FaPlay } from 'react-icons/fa';
import { HistoryData } from '@/app/types/histories';
import { ContactData } from '@/app/types/my-contacts';
import { LuMessageSquareShare } from 'react-icons/lu';
import { TbPointFilled } from 'react-icons/tb';
import AvatarImage from '../../UI/StyledAvatarImage';
import { useRouter } from 'next/navigation';
import { FiArrowUpRight } from 'react-icons/fi';
import ModalStories from '../modals/ModalStories';
import { FemaleWithStatus } from '@/app/api/agora/host/route';
import { cn } from '@/lib/utils';

interface ContentStoriesProps {
  user: HistoryData;
  activeVideoUrl: string | null;
  onSetPlayingVideoUrl: (url: string | null) => void;
  stories: HistoryData[];
}

interface ContentContactProps {
  user: ContactData;
}

interface ContentRoomsProps {
  user: FemaleWithStatus;
  initialCall: (host_id: string) => void;
  isLoadingCall: boolean;
  rolUser: 'admin' | 'male' | 'female';
}

export const ContentCardStories = React.memo(function ContentCardStories({
  user,
  activeVideoUrl,
  onSetPlayingVideoUrl,
  stories,
}: ContentStoriesProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (activeVideoUrl === user.url) {
        if (videoElement.paused && showVideo) {
          videoElement
            .play()
            .catch((error) =>
              console.error(
                'Error al intentar reproducir video (useEffect):',
                error,
              ),
            );
        }
      } else {
        if (!videoElement.paused) {
          videoElement.pause();
        }
      }
    }
  }, [activeVideoUrl, user.url, showVideo]);

  const handleInteraction = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const videoElement = videoRef.current;
      if (!videoElement) return;

      if (!showVideo) {
        setShowVideo(true);
      }

      if (videoElement.paused) {
        if (activeVideoUrl === user.url) {
          videoElement
            .play()
            .catch((error) =>
              console.error(
                'Error al reproducir video (handleInteraction):',
                error,
              ),
            );
        } else {
          onSetPlayingVideoUrl(user.url);
        }
      } else {
        videoElement.pause();
      }
    },
    [user.url, activeVideoUrl, onSetPlayingVideoUrl, showVideo],
  );

  const onVideoPlay = useCallback(() => setIsPlaying(true), []);
  const onVideoPause = useCallback(() => setIsPlaying(false), []);

  const onVideoEnded = useCallback(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    if (activeVideoUrl === user.url) {
      onSetPlayingVideoUrl(null);
    }
  }, [activeVideoUrl, user.url, onSetPlayingVideoUrl]);

  if (!user) return null;

  return (
    <>
      <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-3xl bg-gray-900 shadow-lg transition-transform duration-300 ease-in-out hover:scale-105">
        {!showVideo && (
          <img
            src={user.user.profile_photo_path}
            alt={`Vista previa de la historia de ${user.user.name}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <video
          ref={videoRef}
          src={user.url}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
          playsInline
          onPlay={onVideoPlay}
          onPause={onVideoPause}
          onEnded={onVideoEnded}
          loop={false}
          muted={false}
          preload="metadata"
          poster={
            user.type === 'video' ? user.user.profile_photo_path : undefined
          }
        />

        <div
          onClick={handleInteraction}
          className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/50 group-hover:opacity-100"
        >
          {!isPlaying ? (
            <FaPlay className="h-9 w-9 text-white/90 opacity-80 drop-shadow-xl transition-transform group-hover:scale-110 md:h-9 md:w-9" />
          ) : (
            <FaPause className="h-9 w-9 text-white/90 opacity-80 drop-shadow-xl transition-transform group-hover:scale-110 md:h-9 md:w-9" />
          )}
        </div>

        {user.like > 0 && (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <FaHeart className="h-3.5 w-3.5 text-red-500" />
            {user.like}
          </div>
        )}

        <div
          onClick={() => {
            onVideoEnded();
            setIsOpen(true);
          }}
          className="absolute right-4 top-4 z-10 flex items-center rounded-full bg-black/30 p-2 text-xs font-medium text-white backdrop-blur-sm hover:border-white hover:bg-black/10"
        >
          <FiArrowUpRight className="h-4 w-4 text-white" />
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-black/40 to-transparent p-3 transition-opacity duration-300 group-hover:from-black/60 group-hover:via-black/30 ${
            isPlaying ? 'opacity-80 group-hover:opacity-50' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white/50 bg-gray-700">
              <img
                src={user.user.profile_photo_path}
                alt={`${user.user.name}'s profile`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="truncate text-sm font-semibold text-white shadow-sm">
                {user.user.name}
              </p>
            </div>
          </div>
        </div>
      </div>
      <ModalStories
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        stories={stories}
        active_stories={user}
      />
    </>
  );
});

export function ContentCardContacts({ user }: ContentContactProps) {
  const router = useRouter();
  const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://avatar.iran.liara.run/`;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-3xl bg-gray-100">
      <AvatarImage
        primarySrc={user.user.profile_photo_path}
        defaultPlaceholderSrc={`https://avatar.iran.liara.run/`}
        errorPlaceholderSrc={GENERIC_IMAGE_ERROR_PLACEHOLDER}
        alt={user.user.profile_photo_path}
        className="h-full w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
      />

      <div
        onClick={() => {
          router.push(`/main/chat/${user.chat_id}`);
        }}
        className="absolute right-4 top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-black/20 p-2 font-medium transition-transform duration-300 ease-in-out hover:scale-105"
      >
        <LuMessageSquareShare className="h-6 w-6 text-white" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white">{user.user.name}</p>
        </div>
      </div>
    </div>
  );
}

export function ContentCardRooms({
  user,
  initialCall,
  isLoadingCall,
  rolUser,
}: ContentRoomsProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const GENERIC_IMAGE_ERROR_PLACEHOLDER = `https://avatar.iran.liara.run/`;

  return (
    <div
      className={cn(
        'group relative aspect-square overflow-hidden rounded-3xl bg-current shadow-lg',
        user.status === 'available_call' && 'cursor-pointer',
      )}
      onClick={() => {
        if (
          user.status === 'available_call' &&
          user.host_id !== null &&
          !isLoadingCall &&
          rolUser !== 'admin'
        ) {
          setSelectedCard(String(user.user_id));
          initialCall(user.host_id);
        } else if (
          user.status === 'available_call' ||
          (user.status === 'in_call' &&
            user.host_id !== null &&
            !isLoadingCall &&
            rolUser === 'admin')
        ) {
          setSelectedCard(String(user.user_id));
          initialCall(user?.host_id ?? '');
        }
      }}
    >
      {isLoadingCall && selectedCard === String(user.user_id) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 transition-all duration-300">
          <div className="h-24 w-24 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-r-[#ff00ff] border-t-[#ff00ff]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Conexmeet"
              className="h-auto w-16"
            />
          </div>
        </div>
      )}

      <div className="absolute left-3 top-3 z-10 flex items-center rounded-full bg-black/5 px-2 text-xs text-white backdrop-blur-xl">
        {user.status === 'online' ? (
          <>
            <TbPointFilled className="h-8 w-8 text-green-500" />
            Online
          </>
        ) : user.status === 'available_call' ? (
          <>
            <TbPointFilled className="h-8 w-8 text-yellow-500" />
            Available for call
          </>
        ) : user.status === 'in_call' ? (
          <>
            <TbPointFilled className="h-8 w-8 text-red-500" />
            On call with another user
          </>
        ) : (
          <>
            <TbPointFilled className="h-8 w-8 text-gray-500" />
            Offline
          </>
        )}
      </div>

      <AvatarImage
        primarySrc={user.avatar}
        defaultPlaceholderSrc={`https://avatar.iran.liara.run/`}
        errorPlaceholderSrc={GENERIC_IMAGE_ERROR_PLACEHOLDER}
        alt={user.avatar ?? 'User avatar'}
        className="h-full w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
      />

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-black/40 to-transparent p-3 transition-opacity duration-300 group-hover:from-black/60 group-hover:via-black/30`}
      >
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white shadow-sm">
            {user.user_name}
          </p>
        </div>
      </div>
    </div>
  );
}
