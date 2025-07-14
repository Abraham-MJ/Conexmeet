import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, {
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

AgoraRTC.setLogLevel(4);

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
        try {
          await currentRtcClient!.subscribe(remoteUser, mediaType);

          dispatch({
            type: AgoraActionType.UPDATE_REMOTE_USER_TRACK_STATE,
            payload: {
              rtcUid: String(remoteUser.uid),
              mediaType,
              isPublishing: true,
              track:
                mediaType === 'audio'
                  ? remoteUser.audioTrack
                  : remoteUser.videoTrack,
            },
          });

          if (mediaType === 'audio' && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }
        } catch (subError) {
          console.error(
            `${LOG_PREFIX_PROVIDER} RTC Error al suscribir:`,
            subError,
          );
        }
      });

      currentRtcClient.on(
        'user-unpublished',
        (remoteUserUnpublishing, mediaType) => {
          console.log(
            `[Female Client - RTC Event] User Unpublished: UID ${remoteUserUnpublishing.uid}, Media Type: ${mediaType}`,
          );
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
        console.log(
          `[Female Client - RTC Event] User Left: UID ${remoteUserLeaving.uid}`,
        );

        dispatch({
          type: AgoraActionType.REMOVE_REMOTE_USER,
          payload: { rtcUid: String(remoteUserLeaving.uid) },
        });
      });
    },
    [dispatch, localUser, broadcastLocalFemaleStatusUpdate],
  );

  const initializeRtc = useCallback(
    async (
      channelName: string,
      rtcUid: string,
      roleForToken: 'publisher' | 'subscriber',
      publishTracksFlag: boolean,
      loadingMessage?: string,
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
          dispatch({
            type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_MODAL,
            payload: true,
          });
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
    initializeRtc,
    leaveRtcChannel,
    toggleLocalAudio,
    toggleLocalVideo,
    closeMediaPermissionsDeniedModal,
  };
};
