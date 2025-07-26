import { useCallback, useEffect, useRef } from 'react';
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
  FemaleCallSummaryInfo,
  UserInformation,
} from '@/app/types/streams';
import {
  LOG_PREFIX_FEMALE,
  LOG_PREFIX_MALE_ADMIN,
  LOG_PREFIX_PROVIDER,
} from '@/lib/constants';
import { useAgoraServer } from './useAgoraServer';
import { useUser } from '@/app/context/useClientContext';
import { converterMinutes } from '@/app/utils/converter-minutes';

interface CallOrchestratorFunctions {
  requestMediaPermissions: () => Promise<{
    audioTrack: IMicrophoneAudioTrack;
    videoTrack: ICameraVideoTrack;
  }>;
  initRtcClient: (
    channelName: string,
    rtcUid: string,
    roleForToken: 'publisher' | 'subscriber',
    publishTracksFlag: boolean,
    loadingMessage?: string,
    preCreatedTracks?: {
      audioTrack: IMicrophoneAudioTrack;
      videoTrack: ICameraVideoTrack;
    } | null,
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
  sendCallSignal: (type: string, payload: Record<string, any>) => Promise<void>;
  waitForUserProfile: (uidToWaitFor: string | number) => Promise<void>;
}

const getBalance = (
  item: { minutes: number; seconds: number },
  points: number,
) => {
  const { minutes, seconds } = item;

  let totalMinutes = minutes + seconds / 60;
  totalMinutes += points / 10;
  let result = totalMinutes * 0.096;

  return seconds < 15 ? 0 : parseFloat(result.toFixed(2));
};

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
    requestMediaPermissions,
    initRtcClient,
    leaveRtcChannel,
    joinCallChannel,
    leaveCallChannel,
    broadcastLocalFemaleStatusUpdate,
    sendCallSignal,
    waitForUserProfile,
  }: CallOrchestratorFunctions,
  hostEndedCallInfo: { message?: string; ended: boolean } | null,
  current_room_id: string | null,
  callTimer: string,
  maleInitialMinutesInCall: number | null,
  maleGiftMinutesSpent: number,
  femaleTotalPointsEarnedInCall: number,
  channelHoppingEntries: any[],
) => {
  const { handleGetInformation, state: user } = useUser();

  const hasTriggeredOutOfMinutesRef = useRef(false);

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
      dispatch({
        type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL,
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

        return 'RANDOM_SELECTION_NEEDED';
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

  const cleanupConnectionsOnError = useCallback(async (
    preCreatedTracks: {
      audioTrack: IMicrophoneAudioTrack;
      videoTrack: ICameraVideoTrack;
    } | null,
    localUserRole: string,
    channelToJoin: string | undefined,
    current_room_id: string | null,
    determinedChannelName: string,
    localUser: UserInformation,
    agoraBackend: ReturnType<typeof useAgoraServer>,
    leaveCallChannel: () => Promise<void>
  ) => {
    console.log('[Cleanup] Iniciando limpieza de conexiones...');

    if (preCreatedTracks) {
      try {
        preCreatedTracks.audioTrack?.close();
        preCreatedTracks.videoTrack?.close();
        console.log('[Cleanup] Tracks de media cerrados');
      } catch (cleanupError) {
        console.warn('[Cleanup] Error limpiando tracks:', cleanupError);
      }
    }

    try {
      await leaveCallChannel();
      console.log('[Cleanup] Canal RTM cerrado');
    } catch (cleanupError) {
      console.warn('[Cleanup] Error cerrando canal RTM:', cleanupError);
    }

    if (localUserRole === 'male' && channelToJoin && current_room_id) {
      try {
        await agoraBackend.closeMaleChannel(
          String(localUser.user_id),
          determinedChannelName,
          current_room_id,
        );
        console.log('[Cleanup] Canal backend cerrado');
      } catch (cleanupError) {
        console.warn('[Cleanup] Error cerrando canal backend:', cleanupError);
      }
    }

    console.log('[Cleanup] Limpieza completada');
  }, []);

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
      dispatch({
        type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
        payload: false,
      });
      dispatch({
        type: AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL,
        payload: false,
      });

      hasTriggeredOutOfMinutesRef.current = false;

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

      const minutesAvailable = converterMinutes(user.user?.minutes);

      const MIN_REQUIRED_MINUTES = 1;

      if (localUser.role === 'male' || localUser.role === 'admin') {
        if (
          minutesAvailable === null ||
          minutesAvailable < MIN_REQUIRED_MINUTES
        ) {
          console.warn(
            `[VideoChatMale] Minutos insuficientes para ${localUser.role}: ${minutesAvailable}`,
          );
          dispatch({
            type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
            payload: true,
          });
          dispatch({
            type: AgoraActionType.RTC_SETUP_FAILURE,
            payload: 'No tienes minutos suficientes para iniciar la llamada.',
          });
          return;
        }
      }

      const {
        rtcUid,
        rtmUid,
        role: localUserRole,
        user_id: appUserId,
      } = localUser;
      let determinedChannelName: string | undefined = undefined;
      let targetFemale: UserInformation | undefined = undefined;

      const publishTracksFlag = localUserRole !== 'admin';
      let preCreatedTracks = null;

      if (publishTracksFlag) {
        try {
          console.log('[Media Permissions] Solicitando permisos de cámara y micrófono...');
          preCreatedTracks = await requestMediaPermissions();
          console.log('[Media Permissions] Permisos concedidos exitosamente');
        } catch (permissionError: any) {
          console.error('[Media Permissions] Error en permisos:', permissionError);

          const errorName = permissionError?.name || '';
          const errorMessage = permissionError?.message || '';

          let userFriendlyMessage = 'Error desconocido con permisos de cámara/micrófono';
          let shouldShowPermissionsDeniedModal = true;

          if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
            userFriendlyMessage = 'Permisos de cámara y micrófono denegados. Por favor, permite el acceso y vuelve a intentar.';
          } else if (errorName === 'NotFoundError' || errorMessage.includes('not found')) {
            userFriendlyMessage = 'No se encontraron dispositivos de cámara o micrófono. Verifica que estén conectados.';
          } else if (errorName === 'NotReadableError' || errorMessage.includes('not readable') || errorMessage.includes('Could not start video source')) {
            userFriendlyMessage = 'Los dispositivos de cámara o micrófono están siendo usados por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
          } else if (errorName === 'OverconstrainedError') {
            userFriendlyMessage = 'Los dispositivos de cámara o micrófono no cumplen con los requisitos técnicos.';
          } else if (errorName === 'SecurityError') {
            userFriendlyMessage = 'Error de seguridad al acceder a cámara y micrófono. Verifica la configuración del navegador.';
          } else if (errorMessage.includes('timeout')) {
            userFriendlyMessage = 'Tiempo agotado al solicitar permisos. Intenta nuevamente.';
          } else {
            shouldShowPermissionsDeniedModal = false;
            dispatch({
              type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
              payload: true,
            });
          }

          if (shouldShowPermissionsDeniedModal) {
            dispatch({
              type: AgoraActionType.SET_SHOW_MEDIA_PERMISSIONS_DENIED_MODAL,
              payload: true,
            });
          }

          dispatch({
            type: AgoraActionType.RTC_SETUP_FAILURE,
            payload: userFriendlyMessage,
          });

          throw new Error(userFriendlyMessage);
        }
      }

      try {
        const channelResult = await determineJoinChannelName(
          channelToJoin,
          localUserRole,
        );

        if (channelToJoin || localUserRole === 'admin') {
          determinedChannelName = channelResult;
          targetFemale = onlineFemalesList.find(
            (female) => female.host_id === determinedChannelName,
          );
        }
        else if (localUserRole === 'male' && channelResult === 'RANDOM_SELECTION_NEEDED') {
          const availableFemales = onlineFemalesList.filter(
            (female) =>
              female.status === 'available_call' &&
              female.host_id &&
              typeof female.host_id === 'string' &&
              female.host_id.trim() !== '' &&
              female.is_active === 1,
          );

          let attemptedChannels = new Set<string>();
          let connectionSuccessful = false;
          const maxAttempts = Math.min(availableFemales.length, 5);
          let attemptCount = 0;

          while (attemptedChannels.size < maxAttempts && !connectionSuccessful && attemptCount < maxAttempts) {
            attemptCount++;
            const remainingFemales = availableFemales.filter(
              (female) => !attemptedChannels.has(female.host_id!)
            );

            if (remainingFemales.length === 0) {
              break;
            }

            const randomIndex = Math.floor(Math.random() * remainingFemales.length);
            const selectedFemale = remainingFemales[randomIndex];
            determinedChannelName = selectedFemale.host_id!;
            targetFemale = selectedFemale;

            attemptedChannels.add(determinedChannelName);

            const currentFemale = onlineFemalesList.find(
              (female) => female.host_id === determinedChannelName,
            );

            if (!currentFemale || currentFemale.status !== 'available_call') {
              console.log(`[Random Selection] Canal ${determinedChannelName} ya no disponible, intentando otro...`);
              continue;
            }

            try {
              const backendJoinResponse = await agoraBackend.notifyMaleJoining(
                determinedChannelName,
                String(appUserId),
              );

              if (backendJoinResponse.success) {
                connectionSuccessful = true;

                if (backendJoinResponse.data && backendJoinResponse.data.id) {
                  dispatch({
                    type: AgoraActionType.SET_CURRENT_ROOM_ID,
                    payload: String(backendJoinResponse.data.id),
                  });
                }

                dispatch({
                  type: AgoraActionType.SET_MALE_INITIAL_MINUTES_IN_CALL,
                  payload: minutesAvailable,
                });

                console.log(`[Random Selection] Conexión exitosa al canal ${determinedChannelName}`);
                break;
              } else {
                console.log(`[Random Selection] Backend rechazó canal ${determinedChannelName}, intentando otro...`);
                continue;
              }
            } catch (backendError) {
              console.log(`[Random Selection] Error en backend para canal ${determinedChannelName}, intentando otro...`, backendError);
              continue;
            }
          }

          if (!connectionSuccessful) {
            dispatch({
              type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
              payload: true,
            });
            throw new Error(
              'No hay modelos disponibles para llamar en este momento. ¡Intenta más tarde!',
            );
          }
        }

        if (channelToJoin && localUserRole === 'male') {
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
        }

        const rtcRoleForToken =
          localUserRole === 'admin' ? 'subscriber' : 'publisher';

        const rtcLoadingMsg =
          localUserRole === 'admin'
            ? 'Accediendo a la transmisión de video...'
            : '¡Un momento! Estableciendo la videollamada...';


        if (localUserRole === 'male' && channelToJoin && determinedChannelName) {
          try {
            console.log(`[Backend Connection] Notificando unión al canal específico: ${determinedChannelName}`);
            const backendJoinResponse = await agoraBackend.notifyMaleJoining(
              determinedChannelName,
              String(appUserId),
            );

            if (!backendJoinResponse.success) {
              if (
                backendJoinResponse.message?.toLowerCase().includes('ocupado') ||
                backendJoinResponse.message
                  ?.toLowerCase()
                  .includes('ya está ocupado') ||
                'El canal seleccionado ya no está disponible o no existe.'
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

            if (backendJoinResponse.data && backendJoinResponse.data.id) {
              dispatch({
                type: AgoraActionType.SET_CURRENT_ROOM_ID,
                payload: String(backendJoinResponse.data.id),
              });
            } else {
              console.warn(
                '[Male Join] No se recibió un ID de sala del backend al unirse.',
              );
            }

            dispatch({
              type: AgoraActionType.SET_MALE_INITIAL_MINUTES_IN_CALL,
              payload: minutesAvailable,
            });
            console.log(
              `[Male Join] Minutos iniciales del male en llamada guardados: ${minutesAvailable}`,
            );
          } catch (backendError) {
            console.error('[Backend Connection] Error en conexión al backend:', backendError);
            if (preCreatedTracks) {
              try {
                preCreatedTracks.audioTrack?.close();
                preCreatedTracks.videoTrack?.close();
              } catch (cleanupError) {
                console.warn('[Cleanup] Error limpiando tracks:', cleanupError);
              }
            }
            throw backendError;
          }
        }

        if (!determinedChannelName) {
          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });
          throw new Error('No se pudo determinar un canal válido.');
        }

        if (!targetFemale) {
          dispatch({
            type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
            payload: true,
          });
          throw new Error(
            'La modelo seleccionada ya no está disponible. Intenta con otra.',
          );
        }

        const channelName: string = determinedChannelName;

        try {
          console.log(`[RTM Connection] Conectando al canal RTM: ${channelName}`);
          await joinCallChannel(channelName);
          console.log(`[RTM Connection] Conexión RTM exitosa`);
        } catch (rtmError) {
          console.error('[RTM Connection] Error en conexión RTM:', rtmError);

          if (preCreatedTracks) {
            try {
              preCreatedTracks.audioTrack?.close();
              preCreatedTracks.videoTrack?.close();
            } catch (cleanupError) {
              console.warn('[Cleanup] Error limpiando tracks:', cleanupError);
            }
          }

          if (localUserRole === 'male' && channelToJoin && current_room_id) {
            try {
              await agoraBackend.closeMaleChannel(
                String(localUser.user_id),
                channelName,
                current_room_id,
              );
            } catch (cleanupError) {
              console.warn('[Cleanup] Error limpiando backend:', cleanupError);
            }
          }

          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });

          throw new Error(`Error de conexión de chat: ${(rtmError as any)?.message || rtmError}`);
        }

        if (localUserRole === 'male') {
          const finalFemaleCheck = onlineFemalesList.find(
            (female) => female.host_id === channelName,
          );

          if (!finalFemaleCheck || finalFemaleCheck.status !== 'available_call') {
            console.warn(`[Final Check] Modelo ${channelName} cambió de estado antes de RTC`);
            await leaveCallChannel();

            if (!channelToJoin) {
              dispatch({
                type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
                payload: true,
              });
            } else {
              dispatch({
                type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                payload: true,
              });
            }

            throw new Error('La modelo cambió de estado durante la conexión.');
          }
        }

        try {
          console.log(`[User Profile] Esperando perfil de usuario: ${targetFemale.rtcUid}`);
          await waitForUserProfile(targetFemale.rtcUid);
          console.log(`[User Profile] Perfil de usuario recibido`);
        } catch (profileError) {
          console.error('[User Profile] Error esperando perfil:', profileError);

          await cleanupConnectionsOnError(preCreatedTracks, localUserRole, channelToJoin, current_room_id, channelName, localUser, agoraBackend, leaveCallChannel);

          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });

          throw new Error(`Error esperando perfil de usuario: ${(profileError as any)?.message || profileError}`);
        }

        try {
          console.log(`[RTC Connection] Inicializando cliente RTC para canal: ${channelName}`);
          await initRtcClient(
            channelName,
            String(rtcUid),
            rtcRoleForToken,
            publishTracksFlag,
            rtcLoadingMsg,
            preCreatedTracks,
          );
          console.log(`[RTC Connection] Cliente RTC inicializado exitosamente`);
        } catch (rtcError) {
          console.error('[RTC Connection] Error en conexión RTC:', rtcError);

          await cleanupConnectionsOnError(preCreatedTracks, localUserRole, channelToJoin, current_room_id, channelName, localUser, agoraBackend, leaveCallChannel);

          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });

          throw new Error(`Error de conexión de video/audio: ${(rtcError as any)?.message || rtcError}`);
        }

        if (localUserRole === 'male' && targetFemale) {
          const femaleToUpdate = onlineFemalesList.find(
            (f) => f.host_id === channelName,
          );
          if (femaleToUpdate) {
            dispatch({
              type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
              payload: {
                ...femaleToUpdate,
                in_call: 1,
                status: 'in_call',
                host_id: channelName,
              },
            });
          }

          try {
            await sendCallSignal('MALE_JOINED_SIGNAL', {
              maleUserId: String(appUserId),
              channelName: channelName,
              timestamp: Date.now(),
            });
            console.log(
              `[Male Join] Señal MALE_JOINED_SIGNAL enviada a female`,
            );
          } catch (signalError) {
            console.error(
              '[Male Join] Error enviando MALE_JOINED_SIGNAL:',
              signalError,
            );
          }
        }

        router.push(`/main/stream/${channelName}`);
      } catch (error: any) {
        console.error('[handleVideoChatMale] Error general:', error);

        const isAlreadyHandledModal =
          error.message?.toLowerCase().includes('no hay modelos disponibles') ||
          error.message?.toLowerCase().includes('canal ya está ocupado') ||
          error.message?.toLowerCase().includes('permisos') ||
          error.message?.toLowerCase().includes('dispositivos') ||
          error.message?.toLowerCase().includes('error de conexión de chat') ||
          error.message?.toLowerCase().includes('error de conexión de video/audio') ||
          error.message?.toLowerCase().includes('error esperando perfil');

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
      requestMediaPermissions,
      initRtcClient,
      leaveRtcChannel,
      joinCallChannel,
      leaveCallChannel,
      determineJoinChannelName,
      waitForUserProfile,
      user.user?.minutes,
      cleanupConnectionsOnError,
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
    dispatch({
      type: AgoraActionType.SET_SHOW_INSUFFICIENT_MINUTES_MODAL,
      payload: false,
    });

    hasTriggeredOutOfMinutesRef.current = false;

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

      let preCreatedTracks = null;
      try {
        preCreatedTracks = await requestMediaPermissions();
      } catch (permissionError) {
        throw permissionError;
      }

      await initRtcClient(
        channel_name,
        String(rtcUid),
        'publisher',
        true,
        undefined,
        preCreatedTracks,
      );
      await joinCallChannel(channel_name);

      await agoraBackend.registerChannel(channel_name);

      dispatch({
        type: AgoraActionType.SET_LOCAL_USER_PROFILE,
        payload: {
          ...localUser,
          host_id: channel_name,
          status: 'available_call',
          in_call: 0,
          is_active: 1,
        },
      });

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
    requestMediaPermissions,
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

    hasTriggeredOutOfMinutesRef.current = true;

    let disconnectReason: FemaleCallSummaryInfo['reason'] =
      'Desconexión inesperada';
    let callDuration: string = callTimer;
    let callEarnings: number | string | null = null;

    try {
      if (currentUser.role === 'female' && currentChannel) {
        disconnectReason = 'Finalizada por ti';
        const [minutesStr, secondsStr] = callTimer.split(':');
        const parsedMinutes = parseInt(minutesStr, 10);
        const parsedSeconds = parseInt(secondsStr, 10);
        callEarnings = getBalance(
          { minutes: parsedMinutes, seconds: parsedSeconds },
          femaleTotalPointsEarnedInCall,
        );

        dispatch({
          type: AgoraActionType.SET_FEMALE_CALL_ENDED_INFO,
          payload: {
            reason: disconnectReason,
            duration: callDuration,
            earnings: callEarnings,
            host_id: currentChannel,
          },
        });
        dispatch({
          type: AgoraActionType.SET_FEMALE_CALL_ENDED_MODAL,
          payload: true,
        });

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
        const [minutesStr, secondsStr] = callTimer.split(':');
        const parsedMinutes = parseInt(minutesStr, 10);
        const parsedSeconds = parseInt(secondsStr, 10);
        const totalElapsedSeconds = parsedMinutes * 60 + parsedSeconds;

        const initialMinutesInSeconds = (maleInitialMinutesInCall || 0) * 60;
        const giftMinutesSpentInSeconds = maleGiftMinutesSpent * 60;

        if (
          initialMinutesInSeconds -
          totalElapsedSeconds -
          giftMinutesSpentInSeconds <=
          0 &&
          maleInitialMinutesInCall !== null
        ) {
          disconnectReason = 'Saldo agotado';
        } else {
          disconnectReason = 'Usuario finalizó la llamada';
        }

        callEarnings = getBalance(
          { minutes: parsedMinutes, seconds: parsedSeconds },
          femaleTotalPointsEarnedInCall,
        );

        const targetFemale = onlineFemalesList.find(
          (female) => female.host_id === currentChannel,
        );

        dispatch({
          type: AgoraActionType.SET_SHOW_MALE_RATING_MODAL,
          payload: {
            show: true,
            femaleInfo: {
              femaleId: targetFemale?.user_id || currentChannel,
              femaleName: targetFemale?.user_name,
              femaleAvatar: targetFemale?.avatar,
            },
          },
        });

        if (isRtmChannelJoined) {
          try {
            const summaryPayload: FemaleCallSummaryInfo = {
              reason: hostEndedCallInfo?.ended
                ? 'Finalizada por ti'
                : disconnectReason,
              duration: callDuration,
              earnings: callEarnings,
              host_id: currentChannel,
            };
            await sendCallSignal('MALE_CALL_SUMMARY_SIGNAL', summaryPayload);
            console.log(
              '[Male] Señal MALE_CALL_SUMMARY_SIGNAL enviada a la female:',
              summaryPayload,
            );
          } catch (error) {
            console.error(
              '[Male] Error enviando MALE_CALL_SUMMARY_SIGNAL:',
              error,
            );
          }
        }

        if (localUser.user_id && currentChannel && current_room_id) {
          try {
            console.log(
              `[Male] Llamando a closeMaleChannel para user ${String(localUser.user_id)}, channel ${currentChannel}, room ${current_room_id}`,
            );
            if (!hostEndedCallInfo?.ended) {
              await agoraBackend.closeChannel(currentChannel, 'waiting');
            }

            await agoraBackend.closeMaleChannel(
              String(localUser.user_id),
              currentChannel,
              current_room_id,
            );
            console.log('[Male] Canal cerrado en el backend.');
          } catch (error) {
            console.error(
              '[Male] Error al cerrar el canal en el backend:',
              error,
            );
          }
        }
      }

      await leaveRtcChannel();
      await leaveCallChannel();
      await handleGetInformation();
    } catch (error: any) {
      console.error(
        `${LOG_PREFIX_PROVIDER} Error durante handleLeaveCall para ${currentUser.role} (${String(currentUser.user_id)}):`,
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
    current_room_id,
    callTimer,
    maleInitialMinutesInCall,
    maleGiftMinutesSpent,
    femaleTotalPointsEarnedInCall,
    isRtmChannelJoined,
    handleGetInformation,
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

  useEffect(() => {
    if (!isRtcJoined && hasTriggeredOutOfMinutesRef.current) {
      console.log(
        '[useCallFlows] Resetting hasTriggeredOutOfMinutesRef.current as RTC is no longer joined.',
      );
      hasTriggeredOutOfMinutesRef.current = false;
    }
  }, [isRtcJoined]);

  useEffect(() => {
    if (hasTriggeredOutOfMinutesRef.current) {
      return;
    }

    if (
      localUser?.role !== 'male' ||
      !isRtcJoined ||
      maleInitialMinutesInCall === null
    ) {
      return;
    }

    const [minutesStr, secondsStr] = callTimer.split(':');
    const totalElapsedSeconds =
      parseInt(minutesStr, 10) * 60 + parseInt(secondsStr, 10);

    const initialMinutesInSeconds = (maleInitialMinutesInCall || 0) * 60;
    const giftMinutesInSeconds = maleGiftMinutesSpent * 60;

    const remainingSeconds =
      initialMinutesInSeconds - totalElapsedSeconds - giftMinutesInSeconds;

    if (remainingSeconds <= 0) {
      console.log(
        `[Minutos Agotados] Male (${String(localUser.user_id)}) agotó sus minutos. Segundos restantes: ${remainingSeconds}. Tiempo transcurrido: ${callTimer}, Minutos iniciales: ${maleInitialMinutesInCall}, Minutos gastados en regalos: ${maleGiftMinutesSpent}`,
      );

      hasTriggeredOutOfMinutesRef.current = true;

      dispatch({
        type: AgoraActionType.SET_SHOW_MINUTES_EXHAUSTED_MODAL,
        payload: true,
      });
      handleLeaveCall();
    }
  }, [
    callTimer,
    localUser,
    isRtcJoined,
    maleInitialMinutesInCall,
    maleGiftMinutesSpent,
    dispatch,
    handleLeaveCall,
  ]);

  return {
    handleVideoChatMale,
    handleVideoChatFemale,
    handleLeaveCall,
    closeNoChannelsAvailableModal,
    closeChannelIsBusyModal,
    closeUnexpectedErrorModal,
  };
};
