import { useCallback } from 'react';
import {
  AgoraAction,
  AgoraActionType,
  AgoraState,
  UserInformation,
} from '@/app/types/streams';

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
  handleLeaveCall: () => Promise<void>;
  leaveCallChannel: () => Promise<void>;
  leaveRtcChannel: () => Promise<void>;
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
    leaveRtcChannel,
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
      console.error(
        '[Channel Hopping] ❌ Timeout - operación cancelada después de 45 segundos',
      );
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
          console.log(`[Channel Hopping] 🧹 Limpiando canal anterior: ${currentChannelName}`);
          
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
              console.log(`[Channel Hopping] ✅ Canal ${currentChannelName} cerrado a 'waiting'`);
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
            console.log(`[Channel Hopping] ✅ Canal ${currentChannelName} cerrado a 'waiting' (fallback)`);
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
        console.warn('[Channel Hopping] No hay canales disponibles');
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
          }
        } catch (signalError) {
          console.warn('[Channel Hopping] ⚠️ Error enviando señal de salida:', signalError);
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
          console.log(`[Channel Hopping] ✅ Estado de female ${currentChannelName} actualizado a 'available_call' en lobby`);
        }
        
        await leaveCallChannel();
        await leaveRtcChannel();
        
        dispatch({ type: AgoraActionType.CLEAR_CHAT_MESSAGES });
        dispatch({ type: AgoraActionType.LEAVE_RTC_CHANNEL });
        dispatch({ type: AgoraActionType.LEAVE_RTM_CALL_CHANNEL });
        
        console.log(`[Channel Hopping] ✅ Limpieza completa realizada - canal ${currentChannelName} debe estar en 'waiting' en backend`);
        
        return;
      }

      let selectedChannel = null;
      let verificationAttempts = 0;
      const maxVerificationAttempts = Math.min(availableChannels.length, 3);

      while (!selectedChannel && verificationAttempts < maxVerificationAttempts) {
        const randomIndex = Math.floor(Math.random() * availableChannels.length);
        const candidateChannel = availableChannels[randomIndex];
        
        console.log(`[Channel Hopping] 🔍 Verificando disponibilidad de ${candidateChannel.host_id}...`);
        
        try {
          const availability = await resources.agoraBackend.verifyChannelAvailability(candidateChannel.host_id!);
          
          if (availability.available) {
            selectedChannel = candidateChannel;
            console.log(`[Channel Hopping] ✅ Canal ${candidateChannel.host_id} verificado como disponible`);
            break;
          } else {
            console.log(`[Channel Hopping] ❌ Canal ${candidateChannel.host_id} no disponible: ${availability.reason}`);
            const channelIndex = availableChannels.findIndex(c => c.host_id === candidateChannel.host_id);
            if (channelIndex > -1) {
              availableChannels.splice(channelIndex, 1);
            }
          }
        } catch (verificationError) {
          console.warn(`[Channel Hopping] ⚠️ Error verificando ${candidateChannel.host_id}:`, verificationError);
        }
        
        verificationAttempts++;
      }

      if (!selectedChannel) {
        console.warn('[Channel Hopping] ❌ No se encontró ningún canal disponible después de verificaciones');
        dispatch({
          type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
          payload: true,
        });
        await handleLeaveCall();
        return;
      }

      newChannelName = selectedChannel.host_id!;
      console.log(`[Channel Hopping] 🎯 Canal seleccionado para hopping: ${newChannelName}`);

      try {
        if (state.isRtmChannelJoined) {
          console.log(`[Channel Hopping] 📨 Enviando señal de salida a female en ${currentChannelName}`);
          
          const summaryPayload = {
            reason: 'Usuario finalizó la llamada',
            duration: '00:00',
            earnings: 0,
            host_id: currentChannelName,
            isChannelHopping: true, // Indicar que es channel hopping
          };

          await sendCallSignal('MALE_CALL_SUMMARY_SIGNAL', summaryPayload);

          // Enviar señal adicional para asegurar limpieza
          await sendCallSignal('MALE_DISCONNECTED_SIGNAL', {
            maleUserId: String(state.localUser.user_id),
            channelName: currentChannelName,
            reason: 'channel_hopping',
            timestamp: Date.now(),
          });

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
          if (resources.localAudioTrack || resources.localVideoTrack) {
            const tracksToUnpublish = [];
            if (resources.localAudioTrack)
              tracksToUnpublish.push(resources.localAudioTrack);
            if (resources.localVideoTrack)
              tracksToUnpublish.push(resources.localVideoTrack);

            try {
              await resources.rtcClient.unpublish(tracksToUnpublish);
            } catch (unpublishError) {
              console.warn(
                '[Channel Hopping] ⚠️ Error despublicando tracks:',
                unpublishError,
              );
            }
          }

          await resources.rtcClient.leave();

          dispatch({ type: AgoraActionType.CHANNEL_HOPPING_RTC_LEAVE });
        } catch (rtcError: any) {
          console.warn(
            '[Channel Hopping] ⚠️ Error al salir del canal RTC:',
            rtcError?.message || rtcError,
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

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

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      try {
        if (resources.localAudioTrack && !resources.localAudioTrack.enabled) {
          await resources.localAudioTrack.setEnabled(true);
        }

        if (resources.localVideoTrack && !resources.localVideoTrack.enabled) {
          await resources.localVideoTrack.setEnabled(true);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

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
          const errorMessage = backendJoinResponse.message || '';
          const isChannelBusy = 
            backendJoinResponse.errorType === 'CHANNEL_BUSY' ||
            errorMessage.toLowerCase().includes('canal_ocupado') ||
            errorMessage.toLowerCase().includes('ocupado') ||
            errorMessage.toLowerCase().includes('otro usuario') ||
            errorMessage.toLowerCase().includes('simultánea detectada');

          if (isChannelBusy) {
            console.warn(
              `[Channel Hopping] ❌ Canal ${newChannelName} ocupado durante hopping, intentando otro canal...`,
            );
            
            dispatch({
              type: AgoraActionType.CHANNEL_HOP_JOIN,
              payload: { hostId: newChannelName, joinTime: Date.now() },
            });
            
            const remainingChannels = availableChannels.filter(
              (channel) => 
                channel.host_id !== newChannelName && 
                !state.channelHopping.visitedChannelsInSession.has(channel.host_id!)
            );
            
            if (remainingChannels.length > 0) {
              console.log(`[Channel Hopping] 🔄 Intentando con otro canal, ${remainingChannels.length} disponibles...`);
              
              dispatch({
                type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
                payload: false,
              });
              
              setTimeout(() => {
                hopToRandomChannel();
              }, 1000);
              
              return;
            } else {
              console.warn('[Channel Hopping] ❌ No hay más canales disponibles después de conflicto');
              dispatch({
                type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
                payload: true,
              });
              await handleLeaveCall();
              return;
            }
          } else {
            console.warn(
              `[Channel Hopping] ⚠️ Respuesta inesperada del backend:`,
              backendJoinResponse,
            );
          }
        }
      } catch (backendError: any) {
        console.warn(
          `[Channel Hopping] ⚠️ Error abriendo nuevo canal en backend:`,
          backendError,
        );
        
        const errorMessage = backendError.message || '';
        const isChannelBusy = 
          errorMessage.toLowerCase().includes('canal_ocupado') ||
          errorMessage.toLowerCase().includes('ocupado') ||
          errorMessage.toLowerCase().includes('otro usuario') ||
          errorMessage.toLowerCase().includes('simultánea detectada') ||
          errorMessage.includes('409');

        if (isChannelBusy) {
          console.warn(
            `[Channel Hopping] ❌ Error de canal ocupado durante hopping, intentando otro canal...`,
          );
          
          dispatch({
            type: AgoraActionType.CHANNEL_HOP_JOIN,
            payload: { hostId: newChannelName, joinTime: Date.now() },
          });
          
          const remainingChannels = availableChannels.filter(
            (channel) => 
              channel.host_id !== newChannelName && 
              !state.channelHopping.visitedChannelsInSession.has(channel.host_id!)
          );
          
          if (remainingChannels.length > 0) {
            console.log(`[Channel Hopping] 🔄 Reintentando con otro canal después de error, ${remainingChannels.length} disponibles...`);
            
            dispatch({
              type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
              payload: false,
            });
            
            setTimeout(() => {
              hopToRandomChannel();
            }, 1000);
            
            return;
          } else {
            console.warn('[Channel Hopping] ❌ No hay más canales disponibles después de error de ocupado');
            dispatch({
              type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
              payload: true,
            });
            await handleLeaveCall();
            return;
          }
        }
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

          await joinCallChannel(newChannelName);

          await new Promise((resolve) => setTimeout(resolve, 1500));

          if (state.isRtmChannelJoined) {
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
          console.warn(
            '[Channel Hopping] ⚠️ RTM no está unido según el estado, esperando...',
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (!state.isRtmChannelJoined) {
            throw new Error('RTM no está conectado para enviar señales');
          }
        }

        const rtmChannel = state.rtmChannel;
        if (rtmChannel && isRTMChannelConnected(rtmChannel)) {
          const isReady = await waitForRTMChannelReady(rtmChannel, 2000);
          if (!isReady) {
            console.log(
              '[Channel Hopping] ⚠️ Canal RTM no confirmado como listo, pero continuando (esto es normal)...',
            );
          } else {
            console.log('[Channel Hopping] ✅ Canal RTM confirmado como listo');
          }
        } else {
          console.log(
            '[Channel Hopping] ⏳ Esperando tiempo fijo para estabilización RTM...',
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
                await new Promise((resolve) => setTimeout(resolve, 500));
                continue;
              } else if (signalError.code === 5) {
                console.log(
                  `[Channel Hopping] ⚠️ ${signalType} no se pudo enviar después de ${maxRetries} intentos, continuando...`,
                );
                return false;
              } else {
                throw signalError;
              }
            }
          }
          return false;
        };

        await sendSignalWithRetry('MALE_JOINED_SIGNAL', {
          maleUserId: String(state.localUser.user_id),
          maleRtcUid: String(state.localUser.rtcUid),
          maleRtmUid: String(state.localUser.rtmUid),
          maleName: state.localUser.user_name || 'Usuario Male',
          channelName: newChannelName,
          hasAudio: true,
          hasVideo: true,
          timestamp: Date.now(),
        });

        await sendSignalWithRetry('CALL_STARTED_SIGNAL', {
          maleUserId: String(state.localUser.user_id),
          femaleChannelId: newChannelName,
          timestamp: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (resources.localAudioTrack && resources.localVideoTrack) {
          try {
            const audioEnabled = resources.localAudioTrack.enabled;
            const videoEnabled = resources.localVideoTrack.enabled;

            await resources.rtcClient.unpublish([
              resources.localAudioTrack,
              resources.localVideoTrack,
            ]);

            await new Promise((resolve) => setTimeout(resolve, 500));

            if (!audioEnabled) {
              await resources.localAudioTrack.setEnabled(true);
            }
            if (!videoEnabled) {
              await resources.localVideoTrack.setEnabled(true);
            }

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
          if (remoteUser.hasVideo && remoteUser.videoTrack) {
            dispatch({
              type: AgoraActionType.SET_CHANNEL_HOPPING_LOADING,
              payload: false,
            });
          } else if (remoteUser.hasVideo) {
            console.log(
              '[Channel Hopping] 📹 Female tiene video pero track no disponible aún, manteniendo loading...',
            );
          } else {
            console.log(
              '[Channel Hopping] 📷 Female sin video, manteniendo loading...',
            );
          }
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
        }, 3000);
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
        }, 1000);
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

      await new Promise((resolve) => setTimeout(resolve, 1000));

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
