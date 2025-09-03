import { useCallback } from 'react';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
} from '@/app/types/streams';

interface ChannelHoppingFunctions {
  handleLeaveCall: () => Promise<void>;
  leaveCallChannel: () => Promise<void>;
  joinCallChannel: (channelName: string) => Promise<any>;
  sendCallSignal: (type: string, payload: Record<string, any>) => Promise<void>;
}

interface ChannelHoppingResources {
  rtcClient: any;
  localAudioTrack: any;
  localVideoTrack: any;
  agoraBackend: any;
}

export const useChannelHopping = (
  dispatch: React.Dispatch<AgoraAction>,
  state: AgoraState,
  onlineFemalesList: UserInformation[],
  {
    handleLeaveCall,
    leaveCallChannel,
    joinCallChannel,
    sendCallSignal,
  }: ChannelHoppingFunctions,
  resources: ChannelHoppingResources,
) => {
  const hopToRandomChannel = useCallback(async () => {
    if (state.localUser?.role !== 'male') {
      console.warn(
        '[Channel Hopping] Solo los males pueden hacer channel hopping',
      );
      return;
    }

    if (!state.isRtcJoined || !state.channelName) {
      console.warn('[Channel Hopping] No está en una llamada activa');
      return;
    }

    if (
      !resources.rtcClient ||
      !resources.localAudioTrack ||
      !resources.localVideoTrack
    ) {
      console.warn('[Channel Hopping] Recursos RTC no disponibles');
      return;
    }

    const rtcConnectionState = resources.rtcClient.connectionState;

    if (rtcConnectionState !== 'CONNECTED') {
      console.error(
        '[Channel Hopping] ❌ RTC no está conectado:',
        rtcConnectionState,
      );
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
      return;
    }

    dispatch({
      type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
      payload: true,
    });

    const timeoutId = setTimeout(() => {
      console.error('[Channel Hopping] ❌ Timeout - operación cancelada');
      dispatch({
        type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
    }, 30000);

    const currentChannelName = state.channelName;
    let newChannelName: string | null = null;

    try {
      const availableChannels = onlineFemalesList.filter(
        (female) =>
          female.status === 'available_call' &&
          female.host_id &&
          female.host_id !== currentChannelName &&
          female.is_active === 1,
      );

      if (availableChannels.length === 0) {
        console.warn('[Channel Hopping] No hay canales disponibles');
        dispatch({
          type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
          payload: true,
        });
        await handleLeaveCall();
        return;
      }

      const randomIndex = Math.floor(Math.random() * availableChannels.length);
      const selectedChannel = availableChannels[randomIndex];
      newChannelName = selectedChannel.host_id!;

      if (
        state.localUser.user_id &&
        currentChannelName &&
        state.current_room_id
      ) {
        try {
          const cleanupResult =
            await resources.agoraBackend.cleanupAfterMaleDisconnect(
              String(state.localUser.user_id),
              currentChannelName,
              state.current_room_id,
            );

          if (cleanupResult.success) {
            try {
              await resources.agoraBackend.closeChannel(
                currentChannelName,
                'waiting',
              );
            } catch (forceCloseError) {
              console.warn(
                '[Channel Hopping] ⚠️ Error forzando cierre a waiting:',
                forceCloseError,
              );
            }
          } else {
            console.warn(
              `[Channel Hopping] ⚠️ Cleanup parcial del canal anterior: ${cleanupResult.message}`,
            );
            throw new Error('Cleanup no exitoso, usando fallback');
          }
        } catch (cleanupError) {
          console.error(
            '[Channel Hopping] ❌ Error en limpieza completa, intentando limpieza básica:',
            cleanupError,
          );

          try {
            await resources.agoraBackend.closeMaleChannel(
              String(state.localUser.user_id),
              currentChannelName,
              state.current_room_id,
            );

            await resources.agoraBackend.closeChannel(
              currentChannelName,
              'waiting',
            );
          } catch (fallbackError) {
            console.error(
              '[Channel Hopping] ❌ Error en limpieza básica también:',
              fallbackError,
            );
          }
        }
      } else {
        console.warn(
          '[Channel Hopping] ⚠️ Faltan datos para limpiar canal anterior:',
          {
            user_id: state.localUser.user_id,
            channel: currentChannelName,
            room_id: state.current_room_id,
          },
        );
      }

      try {
        const summaryPayload = {
          reason: 'Usuario finalizó la llamada',
          duration: '00:00',
          earnings: 0,
          host_id: currentChannelName,
        };

        if (state.isRtmChannelJoined) {
          await sendCallSignal('MALE_CALL_SUMMARY_SIGNAL', summaryPayload);

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (notifyError) {
        console.warn(
          '[Channel Hopping] ⚠️ Error notificando salida a female:',
          notifyError,
        );
      }

      if (state.isRtmChannelJoined) {
        try {
          await leaveCallChannel();
          console.log('[Channel Hopping] ✅ Canal RTM desconectado');
        } catch (rtmError: any) {
          console.warn(
            '[Channel Hopping] ⚠️ Error al salir del canal RTM:',
            rtmError?.message || rtmError,
          );
        }
      }

      dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL });

      if (state.isRtcJoined && resources.rtcClient) {
        try {
          await resources.rtcClient.leave();

          dispatch({ type: AgoraActionType.LEAVE_RTC_CHANNEL });
        } catch (rtcError: any) {
          console.warn(
            '[Channel Hopping] ⚠️ Error al salir del canal RTC:',
            rtcError?.message || rtcError,
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newRtcToken = await resources.agoraBackend.fetchRtcToken(
        newChannelName,
        'publisher',
        String(state.localUser.rtcUid),
      );

      let rtcJoinAttempts = 0;
      const maxRtcJoinAttempts = 3;

      while (rtcJoinAttempts < maxRtcJoinAttempts) {
        try {
          await resources.rtcClient.join(
            state.appID,
            newChannelName,
            newRtcToken,
            String(state.localUser.rtcUid),
          );

          break;
        } catch (rtcJoinError: any) {
          rtcJoinAttempts++;
          console.warn(
            `[Channel Hopping] ⚠️ Error uniendo al canal RTC (intento ${rtcJoinAttempts}/${maxRtcJoinAttempts}):`,
            rtcJoinError?.message || rtcJoinError,
          );

          if (rtcJoinAttempts >= maxRtcJoinAttempts) {
            throw new Error(
              `Failed to join RTC channel after ${maxRtcJoinAttempts} attempts: ${rtcJoinError?.message || rtcJoinError}`,
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      try {
        await resources.rtcClient.publish([
          resources.localAudioTrack,
          resources.localVideoTrack,
        ]);
      } catch (publishError: any) {
        console.error(
          '[Channel Hopping] ❌ Error republicando tracks:',
          publishError,
        );
        throw publishError;
      }

      try {
        const backendJoinResponse =
          await resources.agoraBackend.notifyMaleJoining(
            newChannelName,
            state.localUser.user_id,
          );

        if (backendJoinResponse.success && backendJoinResponse.data?.id) {
          dispatch({
            type: AgoraActionType.SET_CURRENT_ROOM_ID,
            payload: String(backendJoinResponse.data.id),
          });
        } else {
          console.warn(
            `[Channel Hopping] ⚠️ Respuesta inesperada del backend:`,
            backendJoinResponse,
          );
        }
      } catch (backendError) {
        console.warn(
          `[Channel Hopping] ⚠️ Error abriendo nuevo canal en backend:`,
          backendError,
        );
      }

      const handleUserJoined = async (user: any) => {
        await processRemoteUser(user);
      };

      const handleUserLeft = (user: any) => {
        console.log(
          `[Channel Hopping] 👋 Usuario se fue después del hopping: ${user.uid}`,
        );
      };

      const handleConnectionStateChanged = (curState: any, revState: any) => {
        if (curState === 'DISCONNECTED' || curState === 'FAILED') {
          console.error(
            '[Channel Hopping] ❌ Conexión RTC perdida después del hopping',
          );
        }
      };

      resources.rtcClient.on('user-joined', handleUserJoined);
      resources.rtcClient.on('user-left', handleUserLeft);
      resources.rtcClient.on(
        'connection-state-changed',
        handleConnectionStateChanged,
      );

      let rtmJoinAttempts = 0;
      const maxRtmJoinAttempts = 3;
      let rtmJoinSuccessful = false;

      while (rtmJoinAttempts < maxRtmJoinAttempts && !rtmJoinSuccessful) {
        try {
          rtmJoinAttempts++;
          console.log(
            `[Channel Hopping] 🔍 Intento RTM ${rtmJoinAttempts}/${maxRtmJoinAttempts}`,
          );

          await joinCallChannel(newChannelName);

          await new Promise((resolve) => setTimeout(resolve, 1500));

          if (state.isRtmChannelJoined) {
            console.log(
              '[Channel Hopping] ✅ Unido al nuevo canal RTM exitosamente',
            );
            rtmJoinSuccessful = true;
          } else {
            console.warn(
              `[Channel Hopping] ⚠️ RTM no confirmado en intento ${rtmJoinAttempts}`,
            );
            if (rtmJoinAttempts < maxRtmJoinAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        } catch (rtmError: any) {
          console.error(
            `[Channel Hopping] ❌ Error RTM intento ${rtmJoinAttempts}:`,
            rtmError,
          );
          if (rtmJoinAttempts >= maxRtmJoinAttempts) {
            throw rtmError;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!rtmJoinSuccessful) {
        throw new Error(
          'No se pudo establecer conexión RTM después de múltiples intentos',
        );
      }

      try {
        if (!state.isRtmChannelJoined) {
          console.warn('[Channel Hopping] ⚠️ RTM no está unido, esperando...');
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (!state.isRtmChannelJoined) {
            throw new Error('RTM no está conectado para enviar señales');
          }
        }

        await sendCallSignal('MALE_JOINED_SIGNAL', {
          maleUserId: String(state.localUser.user_id),
          maleRtcUid: String(state.localUser.rtcUid),
          maleRtmUid: String(state.localUser.rtmUid),
          maleName: state.localUser.user_name || 'Usuario Male',
          channelName: newChannelName,
          hasAudio: true,
          hasVideo: true,
          timestamp: Date.now(),
        });

        await sendCallSignal('CALL_STARTED_SIGNAL', {
          maleUserId: String(state.localUser.user_id),
          femaleChannelId: newChannelName,
          timestamp: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (resources.localAudioTrack && resources.localVideoTrack) {
          try {
            await resources.rtcClient.unpublish([
              resources.localAudioTrack,
              resources.localVideoTrack,
            ]);
            await new Promise((resolve) => setTimeout(resolve, 200));

            await resources.rtcClient.publish([
              resources.localAudioTrack,
              resources.localVideoTrack,
            ]);
          } catch (republishError) {
            console.warn(
              '[Channel Hopping] ⚠️ Error re-republicando tracks:',
              republishError,
            );
          }
        }
      } catch (joinSignalError) {
        console.warn(
          '[Channel Hopping] ⚠️ Error enviando signals a female:',
          joinSignalError,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const processRemoteUser = async (remoteUser: any) => {
        try {
          if (remoteUser.hasAudio) {
            await resources.rtcClient.subscribe(remoteUser, 'audio');
            if (remoteUser.audioTrack) {
              remoteUser.audioTrack.play();
            }
          }

          if (remoteUser.hasVideo) {
            await resources.rtcClient.subscribe(remoteUser, 'video');
          }
        } catch (subscribeError) {
          console.warn(
            `[Channel Hopping] ⚠️ Error suscribiendo a usuario ${remoteUser.uid}:`,
            subscribeError,
          );
        }

        const femaleInfo = onlineFemalesList.find(
          (female) =>
            String(female.user_id) === String(remoteUser.uid) ||
            String(female.rtcUid) === String(remoteUser.uid) ||
            female.host_id === newChannelName,
        );

        dispatch({
          type: AgoraActionType.ADD_REMOTE_USER,
          payload: {
            rtcUid: String(remoteUser.uid),
            rtmUid: String(remoteUser.uid),
            user_id: femaleInfo?.user_id || remoteUser.uid,
            user_name: femaleInfo?.user_name || `Usuario ${remoteUser.uid}`,
            avatar: femaleInfo?.avatar || null,
            role: femaleInfo?.role || 'female',
            hasAudio: remoteUser.hasAudio || false,
            hasVideo: remoteUser.hasVideo || false,
            audioTrack: remoteUser.audioTrack || null,
            videoTrack: remoteUser.videoTrack || null,
          } as any,
        });

        if (femaleInfo) {
          console.log(
            `[Channel Hopping] ✅ Información de female encontrada: ${femaleInfo.user_name}`,
          );
        } else {
          console.log(
            `[Channel Hopping] ⚠️ No se encontró información de female para UID ${remoteUser.uid}`,
          );
        }
      };

      try {
        const remoteUsers = resources.rtcClient.remoteUsers || [];

        for (const remoteUser of remoteUsers) {
          await processRemoteUser(remoteUser);
        }

        if (remoteUsers.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const remoteUsersAfterWait = resources.rtcClient.remoteUsers || [];

          if (remoteUsersAfterWait.length === 0) {
            console.warn(
              '[Channel Hopping] ⚠️ Canal parece estar vacío después de 2.5 segundos',
            );
          } else {
            console.log(
              `[Channel Hopping] ✅ Usuarios remotos detectados después de espera: ${remoteUsersAfterWait.length}`,
            );
            for (const lateUser of remoteUsersAfterWait) {
              if (!remoteUsers.find((u: any) => u.uid === lateUser.uid)) {
                console.log(
                  `[Channel Hopping] Procesando usuario tardío: ${lateUser.uid}`,
                );
                await processRemoteUser(lateUser);
              }
            }
          }
        }
      } catch (remoteUsersError) {
        console.warn(
          '[Channel Hopping] ⚠️ Error al procesar usuarios remotos:',
          remoteUsersError,
        );
      }

      console.log('[Channel Hopping] Limpiando estado del canal anterior...');

      state.remoteUsers.forEach((remoteUser) => {
        dispatch({
          type: AgoraActionType.REMOVE_REMOTE_USER,
          payload: { rtcUid: String(remoteUser.rtcUid) },
        });
      });

      dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });

      dispatch({
        type: AgoraActionType.RTC_SETUP_SUCCESS,
        payload: {
          rtcClient: resources.rtcClient,
          localAudioTrack: resources.localAudioTrack,
          localVideoTrack: resources.localVideoTrack,
          channelName: newChannelName!,
        },
      });

      console.log('[Channel Hopping] ✅ Estado RTC actualizado correctamente');

      setTimeout(() => {
        dispatch({
          type: AgoraActionType.RTC_SETUP_SUCCESS,
          payload: {
            rtcClient: resources.rtcClient,
            localAudioTrack: resources.localAudioTrack,
            localVideoTrack: resources.localVideoTrack,
            channelName: newChannelName!,
          },
        });
        console.log(
          '[Channel Hopping] ✅ Estado RTC re-actualizado para sincronización',
        );
      }, 500);

      console.log('[Channel Hopping] Esperando perfiles RTM...');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(
        '[Channel Hopping] ✅ Tiempo de espera para perfiles RTM completado',
      );

      const previousFemale = onlineFemalesList.find(
        (f) => f.host_id === currentChannelName,
      );
      if (previousFemale) {
        dispatch({
          type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
          payload: {
            ...previousFemale,
            in_call: 0,
            status: 'available_call',
          },
        });
        console.log(
          `[Channel Hopping] ✅ Female anterior ${currentChannelName} marcada como disponible`,
        );
      }

      const femaleToUpdate = onlineFemalesList.find(
        (f) => f.host_id === newChannelName,
      );

      if (femaleToUpdate) {
        dispatch({
          type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
          payload: {
            ...femaleToUpdate,
            in_call: 1,
            status: 'in_call',
          },
        });

        console.log(
          `[Channel Hopping] ✅ Female nueva ${newChannelName} marcada como ocupada`,
        );
      }

      console.log(
        '[Channel Hopping] Canal anterior procesado por cleanupAfterMaleDisconnect',
      );

      try {
        await resources.agoraBackend.fetchOnlineFemales();
        console.log(
          '[Channel Hopping] ✅ Lista de females actualizada desde backend',
        );
      } catch (fetchError) {
        console.warn(
          '[Channel Hopping] ⚠️ Error actualizando lista de females:',
          fetchError,
        );
      }

      console.log(
        `[Channel Hopping] ✅ Channel hopping exitoso a ${newChannelName}`,
      );

      clearTimeout(timeoutId);

      setTimeout(() => {
        dispatch({
          type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
          payload: false,
        });
      }, 3000);
    } catch (error: any) {
      console.error(
        '[Channel Hopping] ❌ Error crítico durante channel hopping:',
        error,
      );

      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });

      console.log('[Channel Hopping] Iniciando limpieza de emergencia...');
      try {
        await handleLeaveCall();
      } catch (cleanupError) {
        console.error(
          '[Channel Hopping] Error en limpieza de emergencia:',
          cleanupError,
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [
    state.localUser?.role,
    state.isRtcJoined,
    state.channelName,
    state.appID,
    state.localUser,
    state.current_room_id,
    onlineFemalesList,
    dispatch,
    handleLeaveCall,
    leaveCallChannel,
    joinCallChannel,

    resources,
  ]);

  return {
    hopToRandomChannel,
  };
};
