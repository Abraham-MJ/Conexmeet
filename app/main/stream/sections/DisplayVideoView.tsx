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
          'relative z-10 h-full overflow-y-auto rounded-3xl bg-white/20',
          isMobile
            ? 'h-[90dvh] w-full rounded-none'
            : 'max-h-[90vh] min-h-[200px] w-full max-w-full sm:max-h-[85vh] sm:max-w-2xl md:max-h-[80vh] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl',
        )}
      >
        {!isAudioRemote && (
          <button className="absolute bottom-4 left-4 z-[25] m-0 box-border flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-none bg-red-300 p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-md transition-all duration-300 ease-in-out [-webkit-tap-highlight-color:transparent] hover:scale-105">
            <IoMicOffOutline className="h-6 w-6 text-red-800" />
          </button>
        )}
        {localUser && localUser.role !== 'admin' && localVideoTrack && (
          <div
            ref={localVideoPlayerRef}
            id="local-video-player-container"
            className={cn(
              'absolute right-4 z-20 overflow-hidden rounded-3xl bg-black/20',
              isMobile
                ? 'top-12 h-[150px] w-[150px]'
                : 'bottom-4 h-[85px] w-[100px] md:bottom-6 md:right-6 md:h-[127px] md:w-[150px] lg:h-[170px] lg:w-[200px]',
            )}
          >
            {isAudioLocal && (
              <button className="absolute bottom-4 left-4 z-[25] m-0 box-border flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-none bg-red-300 p-0 text-white no-underline opacity-100 shadow-none backdrop-blur-md transition-all duration-300 ease-in-out [-webkit-tap-highlight-color:transparent] hover:scale-105">
                <IoMicOffOutline className="h-6 w-6 text-red-800" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayVideoView;
