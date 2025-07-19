'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IoMicOffOutline } from 'react-icons/io5';

interface StreamsVideoProps {
  localUser: any;
  remoteUser: any;
  localVideoTrack: any;
  isAudioRemote?: boolean;
  isVideoRemote?: boolean;
  isAudioLocal?: boolean;
  isVideoLocal?: boolean;
}

const StreamsVideo: React.FC<StreamsVideoProps> = ({
  localVideoTrack,
  remoteUser,
  isAudioRemote,
  isAudioLocal,
}) => {
  const [isLocalVideoMain, setIsLocalVideoMain] = useState<boolean>(false);

  const localVideoPlayerRef = useRef<HTMLDivElement>(null);
  const remoteVideoPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const localTrack = localVideoTrack;
    const remoteTrack = remoteUser?.videoTrack;

    const localPlayerDiv = localVideoPlayerRef.current;
    const remotePlayerDiv = remoteVideoPlayerRef.current;

    try {
      localTrack?.stop();
    } catch (e) {
      console.warn('No se pudo detener la pista local:', e);
    }
    try {
      remoteTrack?.stop();
    } catch (e) {
      console.warn('No se pudo detener la pista remota:', e);
    }

    if (isLocalVideoMain) {
      if (localTrack && remotePlayerDiv) {
        localTrack.play(remotePlayerDiv);
      }
      if (remoteTrack && localPlayerDiv) {
        remoteTrack.play(localPlayerDiv);
      }
    } else {
      if (remoteTrack && remotePlayerDiv) {
        remoteTrack.play(remotePlayerDiv);
      }
      if (localTrack && localPlayerDiv) {
        localTrack.play(localPlayerDiv);
      }
    }

    return () => {
      try {
        localTrack?.stop();
      } catch (e) {
        console.warn('No se pudo detener la pista local en la limpieza:', e);
      }
      try {
        remoteTrack?.stop();
      } catch (e) {
        console.warn('No se pudo detener la pista remota en la limpieza:', e);
      }
    };
  }, [
    localVideoTrack,
    remoteUser?.videoTrack,
    remoteUser?.rtcUid,
    isLocalVideoMain,
  ]);

  const handleVideoSwap = () => {
    setIsLocalVideoMain((prev) => !prev);
  };

  return (
    <div
      className="relative flex h-screen max-h-full w-[100vh] items-center justify-center bg-transparent transition-all duration-75"
      data-testid="content-stream"
    >
      <div
        className="relative h-full w-full bg-[#ffffff14] object-cover"
        ref={remoteVideoPlayerRef}
      >
        {isLocalVideoMain
          ? isAudioLocal && (
              <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
                <IoMicOffOutline className="h-6 w-6 text-white" />
              </div>
            )
          : isAudioRemote && (
              <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
                <IoMicOffOutline className="h-6 w-6 text-white" />
              </div>
            )}
      </div>

      <div className="absolute right-4 top-4">
        <div
          className="relative h-[150px] w-[150px] bg-[#ffffff14]"
          ref={localVideoPlayerRef}
          onClick={handleVideoSwap}
        >
          {isLocalVideoMain
            ? isAudioRemote && (
                <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
                  <IoMicOffOutline className="h-6 w-6 text-white" />
                </div>
              )
            : isAudioLocal && (
                <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
                  <IoMicOffOutline className="h-6 w-6 text-white" />
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default StreamsVideo;
