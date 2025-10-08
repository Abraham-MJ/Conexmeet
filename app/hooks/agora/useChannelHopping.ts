import { useCallback } from 'react';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
} from '@/app/types/streams';
import { deduplicateRequest } from '@/lib/requestDeduplication';
import useApi from '@/app/hooks/useAPi';
import { AGORA_API_CONFIGS } from '@/app/hooks/agora/configs';
import {
  connectToChannelWithRetry,
  findAvailableChannel,
  detectRaceCondition,
} from '@/app/hooks/agora/useConnectionHelpers';
import { connectionMonitor } from '@/lib/connection-monitor';

const setChannelHoppingFlag = (active: boolean, reason?: string) => {
  if (typeof window !== 'undefined') {
    if (active) {
      window.localStorage.setItem('channelHopping_in_progress', 'true');
    } else {
      window.localStorage.removeItem('channelHopping_in_progress');
    }
  }
};

const isChannelHoppingActive = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('channelHopping_in_progress') === 'true';
  }
  return false;
};

const handleNoChannelsAvailable = async (
  currentChannelName: string,
  state: AgoraState,
  sendCallSignal: (type: string, payload: Record<string, any>) => Promise<void>,
  handleLeaveCall: (isChannelHopping?: boolean) => Promise<void>,
  dispatch: React.Dispatch<AgoraAction>,
  router: any,
  reason: string,
) => {
  dispatch({
    type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
    payload: true,
  });

  try {
    if (state.isRtmChannelJoined) {
      const summaryPayload = {
        reason: 'Usuario finalizó la llamada',
        duration: '00:00',
        earnings: 0,
        host_id: currentChannelName,
      };
      await sendCallSignal('MALE_CALL_SUMMARY_SIGNAL', summaryPayload);

      await sendCallSignal('MALE_NO_CHANNELS_SIGNAL', {
        channelName: currentChannelName,
        reason: reason,
        message: 'El usuario no encontró más modelos disponibles',
      });
    }
  } catch (signalError) {
    console.warn(
      '[Channel Hopping] ⚠️ Error enviando señales de salida:',
      signalError,
    );
  }

  setChannelHoppingFlag(false, reason);

  try {
    console.log(
      '[Channel Hopping] 🔧 Ejecutando handleLeaveCall antes de redireccionar...',
    );
    await handleLeaveCall(true);
    console.log(
      '[Channel Hopping] ✅ handleLeaveCall completado, redireccionando...',
    );
  } catch (error) {
    console.warn(`[Channel Hopping] ⚠️ Error en cleanup: ${error}`);
  }

  setTimeout(() => {
    console.log(
      '[Channel Hopping] 🔧 Auto-redireccionando después de 3 segundos...',
    );
    router.push('/main/video-roulette');
  }, 3000);
};

const waitForRTMChannelReady = async (
  channel: any,
  maxWait = 2000,
): Promise<boolean> => {
  const startTime = Date.now();
  let attemptCount = 0;
  const maxAttempts = 5;

  while (Date.now() - startTime < maxWait && attemptCount < maxAttempts) {
    try {
      attemptCount++;
      await channel.sendMessage({ text: JSON.stringify({ type: 'PING' }) });
      return true;
    } catch (error: any) {
      if (error.code === 5) {
        const waitTime = Math.min(200 + attemptCount * 100, 500);

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      console.warn(`[RTM Ready Check] ❌ Error inesperado:`, error);
      throw error;
    }
  }

  return false;
};

const isRTMChannelConnected = (channel: any): boolean => {
  try {
    return (
      channel && channel.channelId && typeof channel.sendMessage === 'function'
    );
  } catch {
    return false;
  }
};

interface ChannelHoppingFunctions {
  handleLeaveCall: (
    isChannelHoppingOrEvent?: boolean | Event,
    endReason?: string,
  ) => Promise<void>;
  leaveCallChannel: () => Promise<void>;
  leaveRtcChannel: () => Promise<void>;
  joinCallChannel: (channelName: string) => Promise<any>;
  sendCallSignal: (type: string, payload: Record<string, any>) => Promise<void>;
  router?: any;
  validateChannelAvailability: (
    targetChannel: string,
    currentUserId: string,
    onlineFemalesList: UserInformation[],
  ) => Promise<{ isValid: boolean; reason?: string; shouldRetry?: boolean }>;
  clearChannelAttempt: (channelId: string) => void;
}

interface ChannelHoppingResources {
  rtcClient: any;
  localAudioTrack: any;
  localVideoTrack: any;
  agoraBackend: any;
}

export const channelHoppingUtils = {
  setChannelHoppingFlag,
  isChannelHoppingActive,
  clearChannelHoppingFlag: () =>
    setChannelHoppingFlag(false, 'limpieza externa'),
};

export const useChannelHopping = (
  dispatch: React.Dispatch<AgoraAction>,
  state: AgoraState,
  onlineFemalesList: UserInformation[],
  {
    handleLeaveCall,
    leaveCallChannel,
    leaveRtcChannel,
    joinCallChannel,
    sendCallSignal,
    router,
    validateChannelAvailability,
    clearChannelAttempt,
  }: ChannelHoppingFunctions,
  resources: ChannelHoppingResources,
) => {
  const { execute: enterChannelMaleApi } = useApi<{
    success: boolean;
    message?: string;
    data?: any;
  }>(
    '/api/agora/channels/enter-channel-male',
    AGORA_API_CONFIGS.channelManagement,
    false,
  );

  const hopToRandomChannel = useCallback(async () => {
    if (state.localUser?.role !== 'male') {
      console.warn(
        '[Channel Hopping] Solo los males pueden hacer channel hopping',
      );
      return;
    }

    if (isChannelHoppingActive()) {
      console.warn(
        '[Channel Hopping] ⚠️ Ya hay un channel hopping en progreso, ignorando nueva solicitud',
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

    setChannelHoppingFlag(true, 'inicio de hopping');

    dispatch({
      type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
      payload: true,
    });

    const timeoutId = setTimeout(() => {
      console.error(
        '[Channel Hopping] ❌ Timeout - operación cancelada después de 45 segundos',
      );

      setChannelHoppingFlag(false, 'timeout');

      dispatch({
        type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });
    }, 45000);

    const currentChannelName = state.channelName;
    let newChannelName: string | null = null;

    try {
      const availableChannels = onlineFemalesList.filter(
        (female) =>
          female.status === 'available_call' &&
          female.host_id &&
          female.host_id !== currentChannelName &&
          female.is_active === 1 &&
          !state.channelHopping.visitedChannelsInSession.has(female.host_id),
      );

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
                'finished',
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
              'finished',
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

      if (availableChannels.length === 0) {
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
        }

        await leaveCallChannel();
        await leaveRtcChannel();
        dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });
        dispatch({ type: AgoraActionType.LEAVE_RTC_CHANNEL });
        dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL });

        await handleNoChannelsAvailable(
          currentChannelName,
          state,
          sendCallSignal,
          handleLeaveCall,
          dispatch,
          router,
          'No hay canales disponibles',
        );
        return;
      }

      console.log(
        `[Channel Hopping] 🔍 Iniciando búsqueda automática de canal disponible. Canales candidatos: ${availableChannels.length}`,
      );

      const availableChannelIds = availableChannels.map((f) => f.host_id!);

      let selectedChannel = null;
      let connectionSuccessful = false;

      try {
        const channelSearchResult = await findAvailableChannel(
          enterChannelMaleApi,
          state.localUser.user_id,
          availableChannelIds,
          Math.min(availableChannels.length, 5), 
        );

        if (!channelSearchResult.success) {
          console.warn(
            '[Channel Hopping] ❌ No se encontró ningún canal disponible después de búsqueda automática',
          );

          dispatch({
            type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
            payload: true,
          });

          setChannelHoppingFlag(false, 'no hay canales verificados');
          await handleLeaveCall(true);
          return;
        }

        newChannelName = channelSearchResult.channelId!;
        selectedChannel = availableChannels.find(
          (f) => f.host_id === newChannelName,
        );
        connectionSuccessful = true;

        console.log(
          `[Channel Hopping] ✅ Reconexión automática exitosa a canal: ${newChannelName}`,
        );

        if (channelSearchResult.data && channelSearchResult.data.id) {
          dispatch({
            type: AgoraActionType.SET_CURRENT_ROOM_ID,
            payload: String(channelSearchResult.data.id),
          });
        }
      } catch (searchError: any) {
        console.error(
          '[Channel Hopping] ❌ Error en búsqueda automática de canal:',
          searchError,
        );

        dispatch({
          type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
          payload: true,
        });

        setChannelHoppingFlag(false, 'error en búsqueda');
        await handleLeaveCall(true);
        return;
      }

      if (!connectionSuccessful || !selectedChannel) {
        console.warn(
          '[Channel Hopping] ❌ No se pudo establecer reconexión automática',
        );
        dispatch({
          type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
          payload: true,
        });

        setChannelHoppingFlag(false, 'no hay canales verificados');
        await handleLeaveCall(true);
        return;
      }



      console.log(
        '[Channel Hopping] ⚡ Iniciando desconexión paralela y fetch de token...',
      );

      const disconnectionPromises: Promise<any>[] = [];

      const tokenPromise = resources.agoraBackend.fetchRtcToken(
        newChannelName,
        'publisher',
        String(state.localUser.rtcUid),
      );

      if (state.isRtmChannelJoined && state.localUser) {
        const signalsPromise = (async () => {
          try {
            const summaryPayload = {
              reason: 'Usuario finalizó la llamada',
              duration: '00:00',
              earnings: 0,
              host_id: currentChannelName,
            };

            await Promise.all([
              sendCallSignal('MALE_CALL_SUMMARY_SIGNAL', summaryPayload).catch(
                () => {},
              ),
              sendCallSignal('MALE_DISCONNECTED_SIGNAL', {
                maleUserId: String(state.localUser!.user_id),
                channelName: currentChannelName,
                reason: 'channel_hopping',
                timestamp: Date.now(),
              }).catch(() => {}),
            ]);
          } catch (error) {
            console.warn('[Channel Hopping] ⚠️ Error en señales:', error);
          }
        })();

        disconnectionPromises.push(signalsPromise);
      }

      const rtmLeavePromise = state.isRtmChannelJoined
        ? leaveCallChannel().catch((error) => {
            console.warn('[Channel Hopping] ⚠️ Error saliendo RTM:', error);
          })
        : Promise.resolve();

      const rtcLeavePromise = (async () => {
        if (state.isRtcJoined && resources.rtcClient) {
          try {
            const unpublishPromise = (async () => {
              if (resources.localAudioTrack || resources.localVideoTrack) {
                const tracksToUnpublish = [];
                if (resources.localAudioTrack)
                  tracksToUnpublish.push(resources.localAudioTrack);
                if (resources.localVideoTrack)
                  tracksToUnpublish.push(resources.localVideoTrack);

                try {
                  await resources.rtcClient.unpublish(tracksToUnpublish);
                } catch (error) {
                  console.warn(
                    '[Channel Hopping] ⚠️ Error despublicando:',
                    error,
                  );
                }
              }
            })();

            await Promise.all([unpublishPromise, resources.rtcClient.leave()]);
            dispatch({ type: AgoraActionType.CHANNEL_HOPPING_RTC_LEAVE });
          } catch (error) {
            console.warn('[Channel Hopping] ⚠️ Error saliendo RTC:', error);
          }
        }
      })();

      disconnectionPromises.push(rtmLeavePromise, rtcLeavePromise);

      await Promise.allSettled(disconnectionPromises);

      dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL });

      const newRtcToken = await tokenPromise;
      console.log(
        '[Channel Hopping] ⚡ Token obtenido, conectando inmediatamente...',
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

          const connectionState = resources.rtcClient.connectionState;

          if (connectionState === 'CONNECTED') {
            break;
          } else {
            throw new Error(
              `Estado de conexión inesperado: ${connectionState}`,
            );
          }
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

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      try {
        const enablePromises: Promise<any>[] = [];

        if (resources.localAudioTrack && !resources.localAudioTrack.enabled) {
          enablePromises.push(resources.localAudioTrack.setEnabled(true));
        }

        if (resources.localVideoTrack && !resources.localVideoTrack.enabled) {
          enablePromises.push(resources.localVideoTrack.setEnabled(true));
        }

        if (enablePromises.length > 0) {
          await Promise.all(enablePromises);
        }

        const tracksToPublish = [];
        if (resources.localAudioTrack)
          tracksToPublish.push(resources.localAudioTrack);
        if (resources.localVideoTrack)
          tracksToPublish.push(resources.localVideoTrack);

        if (tracksToPublish.length > 0) {
          await resources.rtcClient.publish(tracksToPublish);
        }
      } catch (publishError: any) {
        console.error(
          '[Channel Hopping] ❌ Error republicando tracks:',
          publishError,
        );

        if (
          publishError.code === 'TRACK_IS_DISABLED' ||
          publishError.code === 'INVALID_OPERATION'
        ) {
          try {
            console.warn(
              '[Channel Hopping] ⚠️ Continuando sin republicar tracks, se intentará más tarde',
            );
          } catch (recoveryError) {
            console.error(
              '[Channel Hopping] ❌ Error en recuperación:',
              recoveryError,
            );
          }
        } else {
          throw publishError;
        }
      }

      console.log(
        `[Channel Hopping] ✅ Canal ${newChannelName} ya reservado, continuando con conexión RTC/RTM...`,
      );

      const handleUserJoined = async (user: any) => {
        await processRemoteUser(user);
      };

      const handleUserLeft = (user: any) => {};

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

      resources.rtcClient.on(
        'user-published',
        async (user: any, mediaType: string) => {
          if (mediaType === 'video') {
            try {
              await resources.rtcClient.subscribe(user, 'video');

              dispatch({
                type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
                payload: false,
              });
            } catch (subscribeError) {
              console.warn(
                `[Channel Hopping] ⚠️ Error suscribiendo al video de ${user.uid}:`,
                subscribeError,
              );
              dispatch({
                type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
                payload: false,
              });
            }
          }
        },
      );

      let rtmJoinAttempts = 0;
      const maxRtmJoinAttempts = 3;
      let rtmJoinSuccessful = false;

      while (rtmJoinAttempts < maxRtmJoinAttempts && !rtmJoinSuccessful) {
        try {
          rtmJoinAttempts++;

          await joinCallChannel(newChannelName!);

          await new Promise((resolve) => setTimeout(resolve, 400));

          if (state.isRtmChannelJoined) {
            rtmJoinSuccessful = true;
          } else {
            console.warn(
              `[Channel Hopping] ⚠️ RTM no confirmado en intento ${rtmJoinAttempts}`,
            );
            if (rtmJoinAttempts < maxRtmJoinAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 200));
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
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      if (!rtmJoinSuccessful) {
        throw new Error(
          'No se pudo establecer conexión RTM después de múltiples intentos',
        );
      }

      try {
        if (!state.isRtmChannelJoined) {
          console.warn(
            '[Channel Hopping] ⚠️ RTM no está unido según el estado, esperando...',
          );
          await new Promise((resolve) => setTimeout(resolve, 300));

          if (!state.isRtmChannelJoined) {
            throw new Error('RTM no está conectado para enviar señales');
          }
        }

        const rtmChannel = state.rtmChannel;
        if (rtmChannel && isRTMChannelConnected(rtmChannel)) {
          const isReady = await waitForRTMChannelReady(rtmChannel, 500);
          if (!isReady) {
            console.warn(
              '[Channel Hopping] ⚠️ RTM no confirmó ready, continuando de todos modos...',
            );
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const sendSignalWithRetry = async (
          signalType: string,
          payload: any,
          maxRetries = 2,
        ) => {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              await sendCallSignal(signalType, payload);
              return true;
            } catch (signalError: any) {
              if (signalError.code === 5 && attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 150));
                continue;
              } else if (signalError.code === 5) {
                return false;
              } else {
                throw signalError;
              }
            }
          }
          return false;
        };

        await Promise.allSettled([
          sendSignalWithRetry('MALE_JOINED_SIGNAL', {
            maleUserId: String(state.localUser.user_id),
            maleRtcUid: String(state.localUser.rtcUid),
            maleRtmUid: String(state.localUser.rtmUid),
            maleName: state.localUser.user_name || 'Usuario Male',
            channelName: newChannelName,
            hasAudio: true,
            hasVideo: true,
            timestamp: Date.now(),
          }),
          sendSignalWithRetry('CALL_STARTED_SIGNAL', {
            maleUserId: String(state.localUser.user_id),
            femaleChannelId: newChannelName,
            timestamp: Date.now(),
          }),
        ]);

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (resources.localAudioTrack && resources.localVideoTrack) {
          try {
            const audioEnabled = resources.localAudioTrack.enabled;
            const videoEnabled = resources.localVideoTrack.enabled;

            if (!audioEnabled || !videoEnabled) {
              await resources.rtcClient.unpublish([
                resources.localAudioTrack,
                resources.localVideoTrack,
              ]);

              const enablePromises = [];
              if (!audioEnabled) {
                enablePromises.push(resources.localAudioTrack.setEnabled(true));
              }
              if (!videoEnabled) {
                enablePromises.push(resources.localVideoTrack.setEnabled(true));
              }

              if (enablePromises.length > 0) {
                await Promise.all(enablePromises);
              }

              await resources.rtcClient.publish([
                resources.localAudioTrack,
                resources.localVideoTrack,
              ]);
            }
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
          if (remoteUser.hasVideo && remoteUser.videoTrack) {
            dispatch({
              type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
              payload: false,
            });
          } else if (remoteUser.hasVideo) {
          } else {
          }
        } else {
        }
      };

      try {
        const remoteUsers = resources.rtcClient.remoteUsers || [];

        for (const remoteUser of remoteUsers) {
          await processRemoteUser(remoteUser);
        }

        if (remoteUsers.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          const remoteUsersAfterWait = resources.rtcClient.remoteUsers || [];

          if (remoteUsersAfterWait.length === 0) {
            console.warn(
              '[Channel Hopping] ⚠️ Canal parece estar vacío después de 600ms',
            );
          } else {
            for (const lateUser of remoteUsersAfterWait) {
              if (!remoteUsers.find((u: any) => u.uid === lateUser.uid)) {
                await processRemoteUser(lateUser);
              }
            }
          }
        }

        setTimeout(() => {
          dispatch({
            type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
            payload: false,
          });
        }, 800);
      } catch (remoteUsersError) {
        console.warn(
          '[Channel Hopping] ⚠️ Error al procesar usuarios remotos:',
          remoteUsersError,
        );

        setTimeout(() => {
          dispatch({
            type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
            payload: false,
          });
        }, 300);
      }

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

      if (router) {
        router.replace(`/main/stream/${newChannelName}`, undefined, {
          shallow: true,
        });
      }

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
      }

      try {
        await resources.agoraBackend.fetchOnlineFemales();
      } catch (fetchError) {
        console.warn(
          '[Channel Hopping] ⚠️ Error actualizando lista de females:',
          fetchError,
        );
      }

      dispatch({ type: AgoraActionType.REMOTE_HOST_ENDED_CALL, payload: null });

      setTimeout(() => {
        setChannelHoppingFlag(false, 'hopping exitoso');
      }, 500);

      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error(
        '[Channel Hopping] ❌ Error crítico durante channel hopping:',
        error,
      );

      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: true,
      });

      try {
        await handleLeaveCall(true);
      } catch (cleanupError) {
        console.error(
          '[Channel Hopping] Error en limpieza de emergencia:',
          cleanupError,
        );
      }

      setChannelHoppingFlag(false, 'error en hopping');
    } finally {
      clearTimeout(timeoutId);

      setChannelHoppingFlag(false, 'cleanup final');
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
    validateChannelAvailability,
    clearChannelAttempt,
    enterChannelMaleApi,
    resources,
  ]);

  return {
    hopToRandomChannel,
  };
};
