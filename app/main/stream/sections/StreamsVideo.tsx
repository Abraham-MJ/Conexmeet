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
  isChannelHoppingLoading?: boolean;
}

const StreamsVideo: React.FC<StreamsVideoProps> = ({
  localUser,
  localVideoTrack,
  remoteUser,
  isAudioRemote,
  isAudioLocal,
  isChannelHoppingLoading = false,
}) => {
  const [isLocalVideoMain, setIsLocalVideoMain] = useState<boolean>(false);

  const localVideoPlayerRef = useRef<HTMLDivElement>(null);
  const remoteVideoPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mainTrack = null;
    let smallTrack = null;

    if (localUser?.role === 'admin') {
      const femaleUser = Array.isArray(remoteUser)
        ? remoteUser.find((user) => user.role === 'female')
        : remoteUser?.role === 'female'
          ? remoteUser
          : null;

      const maleUser = Array.isArray(remoteUser)
        ? remoteUser.find((user) => user.role === 'male')
        : remoteUser?.role === 'male'
          ? remoteUser
          : null;

      mainTrack = femaleUser?.videoTrack;
      smallTrack = maleUser?.videoTrack;

      // Debug logging para admin
      console.log('[Video Debug] Admin mode - Female track:', !!femaleUser?.videoTrack, 'Male track:', !!maleUser?.videoTrack);
    } else {
      const localTrack = localVideoTrack;
      const remoteTrack = Array.isArray(remoteUser)
        ? remoteUser[0]?.videoTrack
        : remoteUser?.videoTrack;

      // Debug logging detallado
      const remoteUserData = Array.isArray(remoteUser) ? remoteUser[0] : remoteUser;
      console.log('[Video Debug] Remote user state:', {
        hasRemoteUser: !!remoteUserData,
        hasVideoTrack: !!remoteUserData?.videoTrack,
        hasVideo: remoteUserData?.hasVideo,
        rtcUid: remoteUserData?.rtcUid,
        role: remoteUserData?.role,
        trackType: remoteUserData?.videoTrack?.constructor?.name,
        isLocalVideoMain
      });

      if (isLocalVideoMain) {
        mainTrack = localTrack;
        smallTrack = remoteTrack;
      } else {
        mainTrack = remoteTrack;
        smallTrack = localTrack;
      }
    }

    const localPlayerDiv = localVideoPlayerRef.current;
    const remotePlayerDiv = remoteVideoPlayerRef.current;

    // Detener tracks anteriores de forma segura
    try {
      if (mainTrack && typeof mainTrack.stop === 'function') {
        mainTrack.stop();
      }
    } catch (e) {
      console.warn('[Video Debug] No se pudo detener la pista principal:', e);
    }
    try {
      if (smallTrack && typeof smallTrack.stop === 'function') {
        smallTrack.stop();
      }
    } catch (e) {
      console.warn('[Video Debug] No se pudo detener la pista pequeña:', e);
    }

    // Función para reproducir track con reintentos
    const playTrackWithRetry = (track: any, playerDiv: HTMLDivElement, trackName: string, maxRetries: number = 3) => {
      if (!track || !playerDiv) return;

      const attemptPlay = (attempt: number) => {
        try {
          console.log(`[Video Debug] Intentando reproducir ${trackName} (intento ${attempt})`);
          track.play(playerDiv);
          console.log(`[Video Debug] ${trackName} reproducido exitosamente`);
        } catch (error) {
          console.error(`[Video Debug] Error reproduciendo ${trackName} (intento ${attempt}):`, error);
          
          if (attempt < maxRetries) {
            // Reintentar después de un delay
            setTimeout(() => {
              attemptPlay(attempt + 1);
            }, 500 * attempt); // Delay incremental: 500ms, 1000ms, 1500ms
          } else {
            console.error(`[Video Debug] Falló reproducir ${trackName} después de ${maxRetries} intentos`);
          }
        }
      };

      attemptPlay(1);
    };

    // Reproducir tracks con manejo robusto
    if (mainTrack && remotePlayerDiv) {
      playTrackWithRetry(mainTrack, remotePlayerDiv, 'main track');
    }
    if (smallTrack && localPlayerDiv) {
      playTrackWithRetry(smallTrack, localPlayerDiv, 'small track');
    }

    return () => {
      try {
        if (mainTrack && typeof mainTrack.stop === 'function') {
          mainTrack.stop();
        }
      } catch (e) {
        console.warn('[Video Debug] No se pudo detener la pista principal en la limpieza:', e);
      }
      try {
        if (smallTrack && typeof smallTrack.stop === 'function') {
          smallTrack.stop();
        }
      } catch (e) {
        console.warn('[Video Debug] No se pudo detener la pista pequeña en la limpieza:', e);
      }
    };
  }, [localUser, localVideoTrack, remoteUser, isLocalVideoMain]);

  const handleVideoSwap = () => {
    if (localUser?.role !== 'admin') {
      setIsLocalVideoMain((prev) => !prev);
    }
  };

  let mainAudioMuted = false;
  let smallAudioMuted = false;

  if (localUser?.role === 'admin') {
    const femaleUser = Array.isArray(remoteUser)
      ? remoteUser.find((user) => user.role === 'female')
      : remoteUser?.role === 'female'
        ? remoteUser
        : null;

    const maleUser = Array.isArray(remoteUser)
      ? remoteUser.find((user) => user.role === 'male')
      : remoteUser?.role === 'male'
        ? remoteUser
        : null;

    mainAudioMuted = !femaleUser?.hasAudio;
    smallAudioMuted = !maleUser?.hasAudio;
  } else {
    if (isLocalVideoMain) {
      mainAudioMuted = isAudioLocal ?? false;
      smallAudioMuted = !(isAudioRemote ?? false);
    } else {
      mainAudioMuted = !(isAudioRemote ?? false);
      smallAudioMuted = isAudioLocal ?? false;
    }
  }

  return (
    <div
      className="relative flex h-screen max-h-full w-[100vh] items-center justify-center bg-transparent transition-all duration-75"
      data-testid="content-stream"
    >
      {isChannelHoppingLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[#fc3d6b]"></div>
            <p className="text-center text-white text-lg font-medium">
              Cambiando de canal...
            </p>
          </div>
        </div>
      )}

      <div
        className="relative h-full w-full bg-[#ffffff14] object-cover"
        ref={remoteVideoPlayerRef}
      >
        {mainAudioMuted && (
          <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
            <IoMicOffOutline className="h-6 w-6 text-white" />
          </div>
        )}
        {localUser?.role === 'admin' && (
          <div className="absolute left-2 top-2 z-50 rounded bg-[#0000007a] px-2 py-1 text-xs text-white">
            Mujer
          </div>
        )}
      </div>

      <div className="absolute right-4 top-4">
        <div
          className="relative h-[150px] w-[150px] bg-[#ffffff14]"
          ref={localVideoPlayerRef}
          onClick={handleVideoSwap}
          style={{
            cursor: localUser?.role === 'admin' ? 'default' : 'pointer',
          }}
        >
          {smallAudioMuted && (
            <div className="absolute bottom-2 left-2 z-50 rounded-full bg-[#0000007a] p-1 backdrop:blur-2xl">
              <IoMicOffOutline className="h-6 w-6 text-white" />
            </div>
          )}
          {localUser?.role === 'admin' && (
            <div className="absolute left-2 top-2 z-50 rounded bg-[#0000007a] px-2 py-1 text-xs text-white">
              Hombre
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamsVideo;
