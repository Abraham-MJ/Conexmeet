'use client';

import { HistoryData } from '@/app/types/histories';
import { Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { FaHeart, FaPause, FaPlay } from 'react-icons/fa';

interface PlayStoriesProps {
  histories: HistoryData[];
  onDelete: (storie_id: any) => void;
  isLoadingDelete: any;
}

interface TogglePlayPauseEvent
  extends React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent> {}

const PlayStoriesView: React.FC<PlayStoriesProps> = ({
  histories,
  isLoadingDelete,
  onDelete,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVideoData =
    histories && histories.length > 0 ? histories[0] : null;

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !currentVideoData) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleLoadedMetadata = () => {
      if (videoElement.autoplay && !videoElement.paused) {
        setIsPlaying(true);
      } else {
        setIsPlaying(videoElement.paused ? false : true);
      }
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (videoElement.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef, currentVideoData]);

  const togglePlayPause = (e: TogglePlayPauseEvent): void => {
    e.stopPropagation();
    const videoElement = videoRef.current;
    if (videoElement) {
      if (videoElement.paused || videoElement.ended) {
        videoElement
          .play()
          .catch((error: Error) =>
            console.error('Error al reproducir video:', error),
          );
      } else {
        videoElement.pause();
      }
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative h-full w-full"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {currentVideoData?.url && (
            <video
              ref={videoRef}
              src={currentVideoData.url}
              autoPlay
              loop
              muted
              controlsList="nodownload"
              className="h-full w-full object-cover"
              playsInline
            ></video>
          )}
          {isHovering && currentVideoData?.url && (
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/40"
              onClick={togglePlayPause}
            >
              <button
                onClick={togglePlayPause}
                className="z-20 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition-opacity hover:opacity-80"
                aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
              >
                {isPlaying ? (
                  <FaPause className="h-6 w-6" />
                ) : (
                  <FaPlay className="h-6 w-6" />
                )}
              </button>
            </div>
          )}
          <div className="absolute left-0 right-0 top-0 z-50 p-3">
            <button
              className="rounded-full bg-white/90 p-2 text-gray-600 shadow-md transition duration-300 hover:bg-white hover:text-pink-500"
              onClick={() => {
                onDelete(currentVideoData?.id);
                console.log('Deleting story with ID:', currentVideoData?.id);
              }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {(currentVideoData?.like ?? 0) > 0 && (
        <div className="absolute right-0 top-0 z-20 flex items-center justify-between p-3">
          <div className="flex gap-1 rounded-full bg-black/20 px-2 py-1 text-xs font-medium text-white">
            Likes {currentVideoData?.like ?? 0}
            <FaHeart className="h-4 w-4 text-red-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayStoriesView;
