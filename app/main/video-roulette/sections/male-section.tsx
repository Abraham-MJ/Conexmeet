import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoRouletteMale } from '@/app/hooks/api/useVideoRouletteMale';
import { HistoryData } from '@/app/types/histories';
import { Camera, Play, Video } from 'lucide-react';

const MaleViewVideo = () => {
  const { currentDate, histories } = useVideoRouletteMale();

  const [currentStory, setCurrentStory] = useState<HistoryData | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    <div className="relative flex h-full items-center justify-center">
      {currentStory?.user?.profile_photo_path && (
        <img
          src={currentStory.user.profile_photo_path}
          alt="blur-img"
          className="relative z-10 h-full w-full object-fill blur-lg"
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
            className="h-full w-[45%] object-cover"
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
          <span>PLAY</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-red-500">●</span>
          <span>REC</span>
        </div>
      </div>
      <div className="absolute bottom-8 left-8 z-20 text-sm text-white/70">
        {currentDate}
      </div>
      <div className="absolute">
        <div className="relative z-20 w-full max-w-md px-4 py-16 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">El video chat</h1>
          <h2 className="mb-10 text-3xl font-bold text-white">
            con mujeres número 1
          </h2>
          <button
            onClick={() => {}}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-4 text-lg font-medium text-white transition-all hover:bg-blue-700"
          >
            <Video className="h-5 w-5" />
            Entrar al video chat
          </button>
          <p className="flex items-center justify-center gap-2 text-sm text-white/70">
            <Camera className="h-4 w-4" />
            Activa tu cámara para empezar la búsqueda
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaleViewVideo;
