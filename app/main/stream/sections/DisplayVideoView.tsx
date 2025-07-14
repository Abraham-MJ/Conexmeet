import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import { IoMicOffOutline } from 'react-icons/io5';

interface DisplayProps {
  localUser: any;
  remoteUser: any;
  localVideoTrack: any;
  isAudioRemote: boolean;
  isVideoRemote: boolean;
  isAudioLocal: boolean;
  isVideoLocal: boolean;
  isMobile: boolean;
}

const DisplayVideoView: React.FC<DisplayProps> = ({
  localUser,
  remoteUser,
  localVideoTrack,
  isAudioRemote,
  isVideoRemote,
  isVideoLocal,
  isAudioLocal,
  isMobile,
}) => {
  const localVideoPlayerRef = useRef<HTMLDivElement>(null);
  const remoteVideoPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      localUser &&
      localUser.role !== 'admin' &&
      localVideoTrack &&
      localVideoPlayerRef.current
    ) {
      try {
        localVideoTrack.play(localVideoPlayerRef.current);
      } catch (error) {
        console.error(' Error al reproducir video local', error);
      }
      return () => {
        try {
          console.log('Deteniendo video local', localVideoTrack);
          localVideoTrack?.stop();
        } catch (cleanupError) {
          console.error('Error al detener video local', cleanupError);
        }
      };
    }
  }, [localVideoTrack, localUser]);

  useEffect(() => {
    const currentRemoteVideoTrack = remoteUser?.videoTrack;
    const videoContainer = remoteVideoPlayerRef.current;

    if (currentRemoteVideoTrack && remoteUser?.hasVideo && videoContainer) {
      try {
        currentRemoteVideoTrack.play(videoContainer);
      } catch (error) {
        console.error('Error al reproducir video remoto', error);
      }
      return () => {
        try {
          currentRemoteVideoTrack?.stop();
        } catch (cleanupError) {
          console.error('Error al detener video remoto', cleanupError);
        }
      };
    }
  }, [remoteUser?.rtcUid, remoteUser?.videoTrack, remoteUser?.hasVideo]);

  return (
    <div className="flex h-full items-center justify-center">
      <div
        ref={remoteVideoPlayerRef}
        id="remote-video-player-container"
        className={cn(
          'relative z-10 h-full overflow-y-auto rounded-[32px] bg-white/30',
          isMobile
            ? 'h-[100vh] w-full rounded-none'
            : 'h-full max-h-[70%] w-full max-w-[1250px]',
        )}
      >
        {!isAudioRemote && (
          <button
            className={cn(
              'absolute left-4 z-[25] m-0 box-border flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-none p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-2xl transition-all duration-300 ease-in-out',
              isMobile ? 'top-4' : 'bottom-4',
            )}
          >
            <IoMicOffOutline className="h-6 w-6 text-white" />
          </button>
        )}

        {localUser && localUser.role !== 'admin' && localVideoTrack && (
          <div
            ref={localVideoPlayerRef}
            id="local-video-player-container"
            className={cn(
              'absolute z-20 overflow-hidden rounded-[20px] bg-white/20',
              isMobile
                ? 'left-4 top-4 h-[130px] w-[130px]'
                : 'right-4 top-4 h-[85px] w-[100px] md:bottom-6 md:right-6 md:h-[127px] md:w-[150px] lg:h-[170px] lg:w-[200px]',
            )}
          >
            {isAudioLocal && (
              <button className="absolute bottom-2 left-2 z-[25] m-0 box-border flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-none p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-2xl transition-all duration-300 ease-in-out">
                <IoMicOffOutline className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayVideoView;
