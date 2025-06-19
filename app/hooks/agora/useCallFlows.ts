import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RtmChannel } from 'agora-rtm-sdk';
import {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng';
import { createHost } from '@/lib/generate-token';
import {
  AgoraAction,
  AgoraActionType,
  UserInformation,
} from '@/app/types/streams';
import {
  LOG_PREFIX_FEMALE,
  LOG_PREFIX_MALE_ADMIN,
  LOG_PREFIX_PROVIDER,
} from '@/lib/constants';
import { useAgoraServer } from './useAgoraServer';

interface CallOrchestratorFunctions {
  initRtcClient: (
    channelName: string,
    rtcUid: string,
    roleForToken: 'publisher' | 'subscriber',
    publishTracksFlag: boolean,
    loadingMessage?: string,
  ) => Promise<{
    rtcClient: IAgoraRTCClient;
    localAudioTrack: IMicrophoneAudioTrack | null;
    localVideoTrack: ICameraVideoTrack | null;
    rtcToken: string;
  }>;
  leaveRtcChannel: () => Promise<void>;
  joinCallChannel: (channelName: string) => Promise<RtmChannel>;
  leaveCallChannel: () => Promise<void>;
  broadcastLocalFemaleStatusUpdate: (
    statusInfo: Partial<UserInformation>,
  ) => Promise<void>;
  sendCallSignal: (type: string, payload: any) => Promise<void>;
  waitForUserProfile: (uidToWaitFor: string | number) => Promise<void>;
}

export const useCallFlows = (
  router: ReturnType<typeof useRouter>,
  dispatch: React.Dispatch<AgoraAction>,
  localUser: UserInformation | null,
  appID: string | null,
  currentChannelName: string | null,
  isRtcJoined: boolean,
  isRtmChannelJoined: boolean,
  onlineFemalesList: UserInformation[],
  agoraBackend: ReturnType<typeof useAgoraServer>,
  {
    initRtcClient,
    leaveRtcChannel,
    joinCallChannel,
    leaveCallChannel,
    broadcastLocalFemaleStatusUpdate,
    sendCallSignal,
    waitForUserProfile,
  }: CallOrchestratorFunctions,
  hostEndedCallInfo: { message?: string; ended: boolean } | null,
) => {
  const determineJoinChannelName = useCallback(
    async (
      passedChannel?: string,
      role?: 'male' | 'admin' | 'female',
    ): Promise<string> => {
      dispatch({
        type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
        payload: false,
      });

      if (passedChannel) {
        return passedChannel;
      }

      if (!onlineFemalesList || onlineFemalesList.length === 0) {
        dispatch({
          type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
          payload: true,
        });
        throw new Error(
          'No hay modelos disponibles para llamar en este momento. ¡Intenta más tarde!',
        );
      }

      if (role === 'admin') {
        const adminSuitableChannels = onlineFemalesList.filter(
          (female) =>
            (female.status === 'available_call' ||
              female.status === 'in_call') &&
            female.host_id &&
            typeof female.host_id === 'string' &&
            female.host_id.trim() !== '' &&
            female.is_active === 1,
        );

        if (adminSuitableChannels.length === 0) {
          dispatch({
            type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
            payload: true,
          });
          throw new Error(
            'No hay canales activos (disponibles o en llamada) para que el admin se una aleatoriamente.',
          );
        }

        const randomIndex = Math.floor(
          Math.random() * adminSuitableChannels.length,
        );
        const selectedChannel = adminSuitableChannels[randomIndex];

        return selectedChannel.host_id!;
      }

      if (role === 'male') {
        const availableFemales = onlineFemalesList.filter(
          (female) =>
            female.status === 'available_call' &&
            female.host_id &&
            typeof female.host_id === 'string' &&
            female.host_id.trim() !== '' &&
            female.is_active === 1,
        );

        if (availableFemales.length === 0) {
          dispatch({
            type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
            payload: true,
          });
          throw new Error(
            'No hay modelos disponibles para llamar en este momento. ¡Intenta más tarde!',
          );
        }

        const randomIndex = Math.floor(Math.random() * availableFemales.length);
        const selectedFemale = availableFemales[randomIndex];

        return selectedFemale.host_id!;
      }

      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
      throw new Error(
        'No se pudo determinar el canal. Rol no válido para selección aleatoria o canal no especificado.',
      );
    },
    [dispatch, onlineFemalesList],
  );

  const handleVideoChatMale = useCallback(
    async (channelToJoin?: string) => {
      dispatch({
        type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: false,
      });

      if (
        !localUser ||
        !localUser.rtcUid ||
        !localUser.rtmUid ||
        !localUser.role ||
        !appID
      ) {
        dispatch({
          type: AgoraActionType.RTC_SETUP_FAILURE,
          payload:
            'Perfil local, AppID o UID(s) no cargado/s o incompleto/s para iniciar video chat.',
        });
        dispatch({
          type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
          payload: true,
        });
        return;
      }

      const {
        rtcUid,
        rtmUid,
        role: localUserRole,
        user_id: appUserId,
      } = localUser;
      let determinedChannelName: string | undefined = undefined;

      try {
        determinedChannelName = await determineJoinChannelName(
          channelToJoin,
          localUserRole,
        );
        const targetFemale = onlineFemalesList.find(
          (female) => female.host_id === determinedChannelName,
        );

        if (localUserRole === 'male') {
          if (!targetFemale) {
            const errMsg =
              'La modelo seleccionada ya no está disponible. Intenta con otra.';
            dispatch({
              type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
              payload: true,
            });
            dispatch({
              type: AgoraActionType.RTC_SETUP_FAILURE,
              payload: errMsg,
            });
            return;
          }

          if (targetFemale.status !== 'available_call') {
            let message = 'Esta modelo ya no está disponible en este momento.';
            if (targetFemale.status === 'in_call') {
              message = 'Esta modelo ya se encuentra en otra llamada.';
              dispatch({
                type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                payload: true,
              });
            } else if (targetFemale.status === 'offline') {
              message = 'Esta modelo se ha desconectado.';
              dispatch({
                type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
                payload: true,
              });
            }
            dispatch({
              type: AgoraActionType.RTC_SETUP_FAILURE,
              payload: message,
            });
            return;
          }

          const backendJoinResponse = await agoraBackend.notifyMaleJoining(
            determinedChannelName,
            String(appUserId),
          );

          if (!backendJoinResponse.success) {
            if (
              backendJoinResponse.message?.toLowerCase().includes('ocupado') ||
              backendJoinResponse.message
                ?.toLowerCase()
                .includes('ya está ocupado')
            ) {
              dispatch({
                type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                payload: true,
              });
            } else {
              dispatch({
                type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
                payload: true,
              });
            }

            throw new Error(
              backendJoinResponse.message ||
                'El servidor rechazó la entrada al canal.',
            );
          }
        }

        const rtcRoleForToken =
          localUserRole === 'admin' ? 'subscriber' : 'publisher';

        const publishTracksFlag = localUserRole !== 'admin';

        const rtcLoadingMsg =
          localUserRole === 'admin'
            ? 'Accediendo a la transmisión de video...'
            : '¡Un momento! Estableciendo la videollamada...';

        await joinCallChannel(determinedChannelName);

        if (!targetFemale) {
          throw new Error(
            'La modelo seleccionada ya no está disponible. Intenta con otra.',
          );
        }

        await waitForUserProfile(targetFemale.rtcUid);

        await initRtcClient(
          determinedChannelName,
          String(rtcUid),
          rtcRoleForToken,
          publishTracksFlag,
          rtcLoadingMsg,
        );

        router.push(`/main/stream/${determinedChannelName}`);
      } catch (error: any) {
        const isAlreadyHandledModal =
          error.message?.toLowerCase().includes('no hay modelos disponibles') ||
          error.message?.toLowerCase().includes('canal ya está ocupado') ||
          error.message?.toLowerCase().includes('permisos denegados') ||
          error.message?.toLowerCase().includes('dispositivos no encontrados');

        if (!isAlreadyHandledModal) {
          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });
        }

        dispatch({
          type: AgoraActionType.RTC_SETUP_FAILURE,
          payload: `${error.message || 'Error desconocido al intentar unirse al canal.'}`,
        });

        try {
          await leaveCallChannel();
        } catch (e) {
          console.error(
            `${LOG_PREFIX_MALE_ADMIN} Error leaving RTM channel on cleanup:`,
            e,
          );
        }
        try {
          await leaveRtcChannel();
        } catch (e) {
          console.error(
            `${LOG_PREFIX_MALE_ADMIN} Error leaving RTC client on cleanup:`,
            e,
          );
        }
      }
    },
    [
      router,
      dispatch,
      localUser,
      appID,
      onlineFemalesList,
      agoraBackend,
      initRtcClient,
      leaveRtcChannel,
      joinCallChannel,
      leaveCallChannel,
      determineJoinChannelName,
      waitForUserProfile,
    ],
  );

  const handleVideoChatFemale = useCallback(async () => {
    dispatch({
      type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
      payload: false,
    });
    dispatch({
      type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
      payload: false,
    });

    if (!localUser || !localUser.rtcUid || !localUser.rtmUid || !appID) {
      dispatch({
        type: AgoraActionType.RTC_SETUP_FAILURE,
        payload:
          'Perfil local, AppID o UID(s) no cargado/s o incompleto/s para iniciar video chat.',
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
      return;
    }

    const { rtcUid } = localUser;
    let channel_name: string = '';

    try {
      channel_name = createHost() ?? '';

      await initRtcClient(channel_name, String(rtcUid), 'publisher', true);
      await joinCallChannel(channel_name);

      await agoraBackend.registerChannel(channel_name);

      await broadcastLocalFemaleStatusUpdate({
        host_id: channel_name,
        status: 'available_call',
        in_call: 0,
        is_active: 1,
      });

      router.push(`/main/stream/${channel_name}`);
    } catch (error: any) {
      console.error(
        `${LOG_PREFIX_FEMALE} Error en handleVideoChatFemale:`,
        error,
      );
      dispatch({
        type: AgoraActionType.RTC_SETUP_FAILURE,
        payload: `Err RTC F: ${error.message || '?'}`,
      });
      dispatch({
        type: AgoraActionType.RTM_LOGIN_FAILURE,
        payload: `Err RTM F: ${error.message || '?'}`,
      });

      const isPermissionsError =
        error.name?.includes('NotAllowedError') ||
        error.name?.includes('NotFoundError');
      if (!isPermissionsError) {
        dispatch({
          type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
          payload: true,
        });
      }

      try {
        await leaveCallChannel();
      } catch (e) {
        console.error(
          `${LOG_PREFIX_FEMALE} Error leaving RTM channel on female flow cleanup:`,
          e,
        );
      }
      try {
        await leaveRtcChannel();
      } catch (e) {
        console.error(
          `${LOG_PREFIX_FEMALE} Error leaving RTC client on female flow cleanup:`,
          e,
        );
      }

      if (localUser.role === 'female') {
        await broadcastLocalFemaleStatusUpdate({
          host_id: null,
          status: 'online',
          in_call: 0,
        });
      }
    }
  }, [
    router,
    dispatch,
    localUser,
    appID,
    agoraBackend,
    initRtcClient,
    leaveRtcChannel,
    joinCallChannel,
    leaveCallChannel,
    broadcastLocalFemaleStatusUpdate,
  ]);

  const handleLeaveCall = useCallback(async () => {
    const currentUser = localUser;
    const currentChannel = currentChannelName;

    if (!currentUser) {
      console.warn(
        `${LOG_PREFIX_PROVIDER} handleLeaveCall: No hay usuario local. Redirigiendo...`,
      );
      router.push('/main/video-roulette');
      return;
    }

    const isHostEndedCall = !!hostEndedCallInfo?.ended;

    try {
      if (currentUser.role === 'female' && currentChannel) {
        await sendCallSignal('HOST_ENDED_CALL', {
          channelName: currentChannel,
        });

        await broadcastLocalFemaleStatusUpdate({
          status: 'online',
          host_id: null,
          in_call: 0,
          is_active: 1,
        });
        await agoraBackend.closeChannel(currentChannel, 'finished');
      } else if (currentUser.role === 'male' && currentChannel) {
        if (!isHostEndedCall) {
          await agoraBackend.closeChannel(currentChannel, 'waiting');
        }
      }

      await leaveRtcChannel();
      await leaveCallChannel();
    } catch (error: any) {
      console.error(
        `${LOG_PREFIX_PROVIDER} Error durante handleLeaveCall para ${currentUser.role} (${currentUser.user_id}):`,
        error,
      );
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
    } finally {
      router.push('/main/video-roulette');
    }
  }, [
    router,
    dispatch,
    localUser,
    currentChannelName,
    agoraBackend,
    leaveRtcChannel,
    leaveCallChannel,
    broadcastLocalFemaleStatusUpdate,
    sendCallSignal,
    hostEndedCallInfo,
  ]);

  const closeNoChannelsAvailableModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
      payload: false,
    });
  }, [dispatch]);

  const closeChannelIsBusyModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
      payload: false,
    });
  }, [dispatch]);

  const closeUnexpectedErrorModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
      payload: false,
    });
  }, [dispatch]);

  return {
    handleVideoChatMale,
    handleVideoChatFemale,
    handleLeaveCall,
    closeNoChannelsAvailableModal,
    closeChannelIsBusyModal,
    closeUnexpectedErrorModal,
  };
};
