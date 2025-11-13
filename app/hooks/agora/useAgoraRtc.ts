import { useState, useEffect, useCallback, useRef } from 'react';
import {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng';
import {
  AgoraAction,
  AgoraActionType,
  UserInformation,
} from '@/app/types/streams';
import { useAgoraServer } from './useAgoraServer';
import { LOG_PREFIX_PROVIDER } from '@/lib/constants';
import { shouldShowPermissionsModal } from '@/lib/media-permissions';

export const useAgoraRtc = (
  dispatch: React.Dispatch<AgoraAction>,
  appID: string | null,
  initialRtcToken: string | null,
  localUser: UserInformation | null,
  initialRemoteUsers: UserInformation[],
  agoraBackend: ReturnType<typeof useAgoraServer>,
  broadcastLocalFemaleStatusUpdate: (
    statusInfo: Partial<UserInformation>,
  ) => Promise<void>,
) => {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false);
  const [isLocalVideoMuted, setIsLocalVideoMuted] = useState(false);
  const [isRtcJoined, setIsRtcJoined] = useState(false);
  const [rtcError, setRtcError] = useState<string | null>(null);
  const [requestingMediaPermissions, setRequestingMediaPermissions] =
    useState(false);

  const remoteUsersRef = useRef<UserInformation[]>(initialRemoteUsers);

  useEffect(() => {
    remoteUsersRef.current = initialRemoteUsers;
  }, [initialRemoteUsers]);

  const setupRtcClientListeners = useCallback(
    (currentRtcClient: IAgoraRTCClient) => {
      currentRtcClient.removeAllListeners();

      currentRtcClient.on('user-published', async (remoteUser, mediaType) => {
        if (mediaType !== 'audio' && mediaType !== 'video') return;

        console.log(`[Video Debug] user-published event - UID: ${remoteUser.uid}, mediaType: ${mediaType}`);

        try {
          await currentRtcClient!.subscribe(remoteUser, mediaType);
          console.log(`[Video Debug] Successfully subscribed to ${mediaType} from UID: ${remoteUser.uid}`);

          const track = mediaType === 'audio' ? remoteUser.audioTrack : remoteUser.videoTrack;
          
          if (!track) {
            console.warn(`[Video Debug] ${mediaType} track is null after subscription for UID: ${remoteUser.uid}`);
          } else {
            console.log(`[Video Debug] ${mediaType} track available for UID: ${remoteUser.uid}, track type: ${track.constructor.name}`);
          }

          dispatch({
            type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE,
            payload: {
              rtcUid: String(remoteUser.uid),
              mediaType,
              isPublishing: true,
              track: track,
            },
          });

          if (mediaType === 'audio' && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }

          if (mediaType === 'video') {
            console.log(`[Video Debug] Video track received from UID: ${remoteUser.uid}`, {
              hasTrack: !!remoteUser.videoTrack,
              trackState: remoteUser.videoTrack?.isPlaying,
              localUserRole: localUser?.role
            });
          }

          if (localUser?.role === 'female' && mediaType === 'video') {
            setTimeout(async () => {
              try {
                await broadcastLocalFemaleStatusUpdate({
                  in_call: 1,
                  status: 'in_call',
                  host_id: localUser.host_id,
                  is_active: 1,
                });
              } catch (error) {
                console.warn(
                  '[Female] ⚠️ Error actualizando estado después de video publicado:',
                  error,
                );
              }
            }, 200);
          }
        } catch (subError) {
          console.error(
            `${LOG_PREFIX_PROVIDER} RTC Error al suscribir ${mediaType} de UID ${remoteUser.uid}:`,
            subError,
          );
        }
      });

      currentRtcClient.on(
        'user-unpublished',
        (remoteUserUnpublishing, mediaType) => {
          if (mediaType !== 'audio' && mediaType !== 'video') return;
          dispatch({
            type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE,
            payload: {
              rtcUid: String(remoteUserUnpublishing.uid),
              mediaType,
              isPublishing: false,
            },
          });
        },
      );

      currentRtcClient.on('user-left', (remoteUserLeaving) => {
        const leavingUser = remoteUsersRef.current.find(
          (user) => String(user.rtcUid) === String(remoteUserLeaving.uid),
        );

        if (leavingUser) {
          if (leavingUser.videoTrack) {
            try {
              leavingUser.videoTrack.stop();
            } catch (videoError) {
              console.warn(`[RTC] ⚠️ Error limpiando video track:`, videoError);
            }
          }

          if (leavingUser.audioTrack) {
            try {
              leavingUser.audioTrack.stop();
            } catch (audioError) {
              console.warn(`[RTC] ⚠️ Error limpiando audio track:`, audioError);
            }
          }
        }

        dispatch({
          type: AgoraActionType.REMOVE_REMOTE_USER,
          payload: { rtcUid: String(remoteUserLeaving.uid) },
        });

        if (localUser?.role === 'female') {
          const remainingMales = remoteUsersRef.current.filter(
            (user) =>
              user.role === 'male' &&
              String(user.rtcUid) !== String(remoteUserLeaving.uid),
          );

          if (remainingMales.length === 0) {
            const isChannelHoppingActive =
              typeof window !== 'undefined' &&
              window.localStorage.getItem('channelHopping_in_progress') ===
                'true';

            if (isChannelHoppingActive) {
              return;
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('maleDisconnectedForceLeave', {
                  detail: {
                    reason: 'El usuario se desconectó inesperadamente',
                    timestamp: Date.now(),
                  },
                }),
              );
            }
          } else {
          }
        }
      });
    },
    [dispatch, localUser, broadcastLocalFemaleStatusUpdate],
  );

  const requestMediaPermissions = useCallback(async () => {
    const shouldShowModal = await shouldShowPermissionsModal();

    if (shouldShowModal) {
      dispatch({
        type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
        payload: true,
      });
    }

    setRequestingMediaPermissions(true);
    dispatch({
      type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
      payload: true,
    });

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      AgoraRTC.setLogLevel(4);
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);

      dispatch({
        type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
        payload: false,
      });
      setRequestingMediaPermissions(false);
      dispatch({
        type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
        payload: false,
      });

      return { audioTrack, videoTrack };
    } catch (permissionError: any) {
      console.error(
        `${LOG_PREFIX_PROVIDER} Error creando tracks locales (¿permisos denegados?):`,
        permissionError,
      );
      dispatch({
        type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL,
        payload: true,
      });
      setRequestingMediaPermissions(false);
      dispatch({
        type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
        payload: false,
      });
      throw permissionError;
    }
  }, [dispatch]);

  const initializeRtc = useCallback(
    async (
      channelName: string,
      rtcUid: string,
      roleForToken: 'publisher' | 'subscriber',
      publishTracksFlag: boolean,
      loadingMessage?: string,
      preCreatedTracks?: {
        audioTrack: IMicrophoneAudioTrack;
        videoTrack: ICameraVideoTrack;
      } | null,
    ) => {
      if (!appID) {
        const msg = 'AppID no disponible para RTC.';
        setRtcError(msg);
        dispatch({ type: AgoraActionType.RTC_SETUP_FAILURE, payload: msg });
        dispatch({
          type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
          payload: true,
        });
        throw new Error(msg);
      }

      dispatch({
        type: AgoraActionType.RTC_SETUP_START,
        payload: loadingMessage || 'Configurando audio y video...',
      });
      setRtcError(null);

      try {
        const rtcToken = await agoraBackend.fetchRtcToken(
          channelName,
          roleForToken,
          rtcUid,
        );

        dispatch({
          type: AgoraActionType.SET_TOKENS,
          payload: { tokenRtc: rtcToken, tokenRtm: null },
        });

        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        AgoraRTC.setLogLevel(4);
        const tempRtcClient = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8',
        });

        setupRtcClientListeners(tempRtcClient);

        await tempRtcClient.join(appID, channelName, rtcToken, rtcUid);
        setRtcClient(tempRtcClient);
        setIsRtcJoined(true);

        let audioTrack: IMicrophoneAudioTrack | null = null;
        let videoTrack: ICameraVideoTrack | null = null;

        if (publishTracksFlag) {
          if (preCreatedTracks) {
            audioTrack = preCreatedTracks.audioTrack;
            videoTrack = preCreatedTracks.videoTrack;
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);
          } else {
            const shouldShowModal = await shouldShowPermissionsModal();

            if (shouldShowModal) {
              dispatch({
                type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
                payload: true,
              });
            }

            setRequestingMediaPermissions(true);
            dispatch({
              type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
              payload: true,
            });

            try {
              [audioTrack, videoTrack] = await Promise.all([
                AgoraRTC.createMicrophoneAudioTrack(),
                AgoraRTC.createCameraVideoTrack(),
              ]);
              setLocalAudioTrack(audioTrack);
              setLocalVideoTrack(videoTrack);

              dispatch({
                type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
                payload: false,
              });
              setRequestingMediaPermissions(false);
              dispatch({
                type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
                payload: false,
              });
            } catch (permissionError: any) {
              console.error(
                `${LOG_PREFIX_PROVIDER} Error creando tracks locales (¿permisos denegados?):`,
                permissionError,
              );
              dispatch({
                type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
                payload: false,
              });
              dispatch({
                type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL,
                payload: true,
              });
              setRequestingMediaPermissions(false);
              dispatch({
                type: AgoraActionType.SET_REQUESTING_MEDIA_PERMISSIONS,
                payload: false,
              });
              throw permissionError;
            }
          }
          await tempRtcClient.publish([audioTrack, videoTrack]);
        }

        dispatch({
          type: AgoraActionType.RTC_SETUP_SUCCESS,
          payload: {
            rtcClient: tempRtcClient,
            localAudioTrack: audioTrack,
            localVideoTrack: videoTrack,
            channelName: channelName,
          },
        });
        return {
          rtcClient: tempRtcClient,
          localAudioTrack: audioTrack,
          localVideoTrack: videoTrack,
          rtcToken,
        };
      } catch (error: any) {
        console.error(`${LOG_PREFIX_PROVIDER} Error en initializeRtc:`, error);
        const errorMessage =
          error.message || 'Error desconocido al configurar RTC.';
        setRtcError(errorMessage);
        setIsRtcJoined(false);
        dispatch({
          type: AgoraActionType.RTC_SETUP_FAILURE,
          payload: errorMessage,
        });

        if (
          !error.name?.includes('NotAllowedError') &&
          !error.name?.includes('NotFoundError')
        ) {
          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });
        }
        throw error;
      }
    },
    [appID, dispatch, agoraBackend, setupRtcClientListeners],
  );

  const leaveRtcChannel = useCallback(async () => {
    if (rtcClient && isRtcJoined) {
      try {
        await rtcClient.leave();
        setIsRtcJoined(false);
        setRtcClient(null);
      } catch (error) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al salir del canal RTC:`,
          error,
        );
      }
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    setIsLocalAudioMuted(false);
    setIsLocalVideoMuted(false);
    setRtcError(null);
    setRequestingMediaPermissions(false);
    dispatch({ type: AgoraActionType.LEAVE_RTC_CHANNEL });
  }, [rtcClient, isRtcJoined, localAudioTrack, localVideoTrack, dispatch]);

  const toggleLocalAudio = useCallback(async () => {
    if (localAudioTrack) {
      const newMutedState = !isLocalAudioMuted;
      try {
        await localAudioTrack.setEnabled(!newMutedState);
        setIsLocalAudioMuted(newMutedState);
        dispatch({
          type: AgoraActionType.SET_LOCAL_AUDIO_MUTED,
          payload: newMutedState,
        });
      } catch (error) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al cambiar estado del audio local:`,
          error,
        );
      }
    } else {
      console.warn(
        `${LOG_PREFIX_PROVIDER} No hay track de audio local disponible para alternar mute.`,
      );
    }
  }, [localAudioTrack, isLocalAudioMuted, dispatch]);

  const toggleLocalVideo = useCallback(async () => {
    if (localVideoTrack) {
      const newMutedState = !isLocalVideoMuted;
      try {
        await localVideoTrack.setEnabled(!newMutedState);
        setIsLocalVideoMuted(newMutedState);
        dispatch({
          type: AgoraActionType.SET_LOCAL_VIDEO_MUTED,
          payload: newMutedState,
        });
      } catch (error) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al cambiar estado del video local:`,
          error,
        );
      }
    } else {
      console.warn(
        `${LOG_PREFIX_PROVIDER} No hay track de video local disponible para alternar encendido/apagado.`,
      );
    }
  }, [localVideoTrack, isLocalVideoMuted, dispatch]);

  const switchCamera = useCallback(async () => {
    if (!localVideoTrack) {
      console.warn(
        `${LOG_PREFIX_PROVIDER} No hay track de video local disponible para cambiar cámara.`,
      );
      return;
    }

    try {
      const currentDeviceId = localVideoTrack.getTrackLabel();
      
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const devices = await AgoraRTC.getCameras();
      
      if (devices.length < 2) {
        console.warn(
          `${LOG_PREFIX_PROVIDER} Solo hay una cámara disponible, no se puede cambiar.`,
        );
        return;
      }

      const currentIndex = devices.findIndex(
        (device) => device.label === currentDeviceId
      );
      
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];

      await localVideoTrack.setDevice(nextDevice.deviceId);
      
      console.log(
        `${LOG_PREFIX_PROVIDER} Cámara cambiada exitosamente a: ${nextDevice.label}`,
      );
    } catch (error) {
      console.error(
        `${LOG_PREFIX_PROVIDER} Error al cambiar de cámara:`,
        error,
      );
    }
  }, [localVideoTrack]);

  const closeMediaPermissionsDeniedModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL,
      payload: false,
    });
  }, [dispatch]);

  return {
    rtcClient,
    localAudioTrack,
    localVideoTrack,
    isLocalAudioMuted,
    isLocalVideoMuted,
    isRtcJoined,
    rtcError,
    requestingMediaPermissions,
    requestMediaPermissions,
    initializeRtc,
    leaveRtcChannel,
    toggleLocalAudio,
    toggleLocalVideo,
    switchCamera,
    closeMediaPermissionsDeniedModal,
  };
};
