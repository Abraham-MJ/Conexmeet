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
import useApi from '@/app/hooks/useAPi';
import {
  AGORA_API_CONFIGS,
  AGORA_LOG_PREFIXES,
} from '@/app/hooks/agora/configs';
import { deduplicateRequest } from '@/lib/requestDeduplication';
import { useAgoraServer } from './useAgoraServer';
import { useUser } from '@/app/context/useClientContext';
import { converterMinutes } from '@/app/utils/converter-minutes';
import { useChannelValidation } from './useChannelValidation';
import {
  logConnectionError,
  shouldShowChannelBusyModal,
  shouldShowChannelNotAvailableModal,
} from '@/app/utils/errorLogger';
import { isUserBlockedFromChannelHopping } from '@/app/utils/channelHoppingValidation';

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
  channelHoppingFunctions?: {
    registerChannelLeave: (hostId: string, isChannelHopping?: boolean) => void;
  },
  connectionMonitor?: {
    registerConnectionAttempt: (channelId: string, userId: string) => void;
    markConnectionSuccessful: (channelId: string) => void;
    markConnectionFailed: (channelId: string) => void;
    hasActiveConnectionConflict: (channelId: string, userId: string) => boolean;
  },
  isChannelHoppingLoading?: boolean,
) => {
  const { handleGetInformation, state: user } = useUser();
  const { validateChannelAvailability, clearChannelAttempt } =
    useChannelValidation();

  const { execute: enterChannelMaleApi } = useApi<{
    success: boolean;
    message?: string;
    data?: any;
  }>(
    '/api/agora/channels/enter-channel-male-v2',
    AGORA_API_CONFIGS.channelManagement,
    false,
  );

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

  const cleanupConnectionsOnError = useCallback(
    async (
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
      leaveCallChannel: () => Promise<void>,
    ) => {
      if (preCreatedTracks) {
        try {
          preCreatedTracks.audioTrack?.close();
          preCreatedTracks.videoTrack?.close();
        } catch (cleanupError) {
          console.warn('[Cleanup] Error limpiando tracks:', cleanupError);
        }
      }

      try {
        await leaveCallChannel();
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
        } catch (cleanupError) {
          console.warn('[Cleanup] Error cerrando canal backend:', cleanupError);
        }
      }
    },
    [],
  );

  const handleVideoChatMale = useCallback(
    async (channelToJoin?: string) => {
      if (localUser?.role === 'male' && isUserBlockedFromChannelHopping()) {
        dispatch({
          type: AgoraActionType.SET_SHOW_CHANNEL_HOPPING_BLOCKED_MODAL,
          payload: true,
        });
        return;
      }

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
            payload: 'No tienes monedas suficientes para iniciar la llamada.',
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

      const publishTracksFlag = localUserRole !== 'admin';
      let preCreatedTracks = null;

      // 🔥 RACE CONDITION FIX: Solicitar permisos de medios PRIMERO
      // Esto evita que dos males compitan por el mismo canal mientras uno espera permisos
      if (publishTracksFlag) {
        console.log(`[Race Condition Fix] Solicitando permisos de medios ANTES de validaciones de canal para usuario ${appUserId}`);
        try {
          preCreatedTracks = await requestMediaPermissions();
          console.log(`[Race Condition Fix] Permisos obtenidos exitosamente para usuario ${appUserId}, continuando con validaciones...`);
        } catch (permissionError: any) {
          console.error(
            '[Media Permissions] Error en permisos:',
            permissionError,
          );

          const errorName = permissionError?.name || '';
          const errorMessage = permissionError?.message || '';

          let userFriendlyMessage =
            'Error desconocido con permisos de cámara/micrófono';
          let shouldShowPermissionsDeniedModal = true;

          if (
            errorName === 'NotAllowedError' ||
            errorMessage.includes('Permission denied')
          ) {
            userFriendlyMessage =
              'Permisos de cámara y micrófono denegados. Por favor, permite el acceso y vuelve a intentar.';
          } else if (
            errorName === 'NotFoundError' ||
            errorMessage.includes('not found')
          ) {
            userFriendlyMessage =
              'No se encontraron dispositivos de cámara o micrófono. Verifica que estén conectados.';
          } else if (
            errorName === 'NotReadableError' ||
            errorMessage.includes('not readable') ||
            errorMessage.includes('Could not start video source')
          ) {
            userFriendlyMessage =
              'Los dispositivos de cámara o micrófono están siendo usados por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.';
          } else if (errorName === 'OverconstrainedError') {
            userFriendlyMessage =
              'Los dispositivos de cámara o micrófono no cumplen con los requisitos técnicos.';
          } else if (errorName === 'SecurityError') {
            userFriendlyMessage =
              'Error de seguridad al acceder a cámara y micrófono. Verifica la configuración del navegador.';
          } else if (errorMessage.includes('timeout')) {
            userFriendlyMessage =
              'Tiempo agotado al solicitar permisos. Intenta nuevamente.';
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

      // Ahora que tenemos los permisos, continuamos con la lógica de canal
      let determinedChannelName: string | undefined = undefined;
      let targetFemale: UserInformation | undefined = undefined;

      console.log(`[Race Condition Fix] Iniciando validaciones de canal para usuario ${appUserId} ${channelToJoin ? `con canal específico: ${channelToJoin}` : 'con selección aleatoria'}`);

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
        } else if (
          localUserRole === 'male' &&
          channelResult === 'RANDOM_SELECTION_NEEDED'
        ) {
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

          while (
            attemptedChannels.size < maxAttempts &&
            !connectionSuccessful &&
            attemptCount < maxAttempts
          ) {
            attemptCount++;
            const remainingFemales = availableFemales.filter(
              (female) => !attemptedChannels.has(female.host_id!),
            );

            if (remainingFemales.length === 0) {
              break;
            }

            const randomIndex = Math.floor(
              Math.random() * remainingFemales.length,
            );
            const selectedFemale = remainingFemales[randomIndex];
            determinedChannelName = selectedFemale.host_id!;
            targetFemale = selectedFemale;

            attemptedChannels.add(determinedChannelName);

            if (
              connectionMonitor?.hasActiveConnectionConflict(
                determinedChannelName,
                String(appUserId),
              )
            ) {
              console.warn(
                `[Channel Selection] Canal ${determinedChannelName} tiene conflicto de conexión activo`,
              );
              continue;
            }

            const validationResult = await validateChannelAvailability(
              determinedChannelName,
              String(appUserId),
              onlineFemalesList,
            );

            if (!validationResult.isValid) {
              console.warn(
                `[Channel Selection] Canal ${determinedChannelName} no válido: ${validationResult.reason}`,
              );
              continue;
            }

            const currentFemale = onlineFemalesList.find(
              (female) => female.host_id === determinedChannelName,
            );

            if (!currentFemale || currentFemale.status !== 'available_call') {
              continue;
            }

            try {
              connectionMonitor?.registerConnectionAttempt(
                determinedChannelName,
                String(appUserId),
              );

              const requestOptions = {
                method: 'POST' as const,
                body: {
                  user_id: appUserId,
                  host_id: determinedChannelName,
                },
              };

              const backendJoinResponse = await deduplicateRequest(
                '/api/agora/channels/enter-channel-male-v2',
                () =>
                  enterChannelMaleApi(
                    '/api/agora/channels/enter-channel-male-v2',
                    requestOptions,
                  ),
                requestOptions,
              );

              if (backendJoinResponse.success) {
                connectionSuccessful = true;

                connectionMonitor?.markConnectionSuccessful(
                  determinedChannelName,
                );

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

                break;
              } else {
                connectionMonitor?.markConnectionFailed(determinedChannelName);
                clearChannelAttempt(determinedChannelName);

                const message =
                  backendJoinResponse.message?.toLowerCase() || '';
                const errorType = backendJoinResponse.errorType;

                if (
                  errorType === 'CHANNEL_BUSY' ||
                  message.includes('canal_ocupado') ||
                  message.includes('ocupado') ||
                  message.includes('otro usuario') ||
                  message.includes('simultánea detectada')
                ) {
                  console.warn(
                    `[Channel Selection] Canal ${determinedChannelName} ocupado: ${backendJoinResponse.message}`,
                  );
                } else {
                  console.warn(
                    `[Channel Selection] Error en ${determinedChannelName}: ${backendJoinResponse.message}`,
                  );
                }
                continue;
              }
            } catch (backendError) {
              connectionMonitor?.markConnectionFailed(determinedChannelName);
              clearChannelAttempt(determinedChannelName);
              console.error(
                `[Channel Selection] Error en conexión a ${determinedChannelName}:`,
                backendError,
              );
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

        if (
          localUserRole === 'male' &&
          channelToJoin &&
          determinedChannelName
        ) {
          try {
            if (
              connectionMonitor?.hasActiveConnectionConflict(
                determinedChannelName,
                String(appUserId),
              )
            ) {
              dispatch({
                type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                payload: true,
              });
              throw new Error('Canal ocupado por conexión simultánea');
            }

            const validationResult = await validateChannelAvailability(
              determinedChannelName,
              String(appUserId),
              onlineFemalesList,
            );

            if (!validationResult.isValid) {
              if (validationResult.reason?.includes('ocupado')) {
                dispatch({
                  type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                  payload: true,
                });
              } else {
                dispatch({
                  type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
                  payload: true,
                });
              }
              throw new Error(validationResult.reason || 'Canal no disponible');
            }

            connectionMonitor?.registerConnectionAttempt(
              determinedChannelName,
              String(appUserId),
            );

            const requestOptions = {
              method: 'POST' as const,
              body: {
                user_id: appUserId,
                host_id: determinedChannelName,
              },
            };

            const backendJoinResponse = await deduplicateRequest(
              '/api/agora/channels/enter-channel-male-v2',
              () =>
                enterChannelMaleApi(
                  '/api/agora/channels/enter-channel-male-v2',
                  requestOptions,
                ),
              requestOptions,
            );

            if (!backendJoinResponse.success) {
              connectionMonitor?.markConnectionFailed(determinedChannelName);
              clearChannelAttempt(determinedChannelName);

              logConnectionError(
                'Channel Connection Failed',
                backendJoinResponse,
                determinedChannelName,
                String(appUserId),
              );

              if (shouldShowChannelBusyModal(backendJoinResponse)) {
                dispatch({
                  type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                  payload: true,
                });
              } else if (
                shouldShowChannelNotAvailableModal(backendJoinResponse)
              ) {
                dispatch({
                  type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
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

            connectionMonitor?.markConnectionSuccessful(determinedChannelName);

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
          } catch (backendError: any) {
            console.error(
              '[Backend Connection] Error en conexión al backend:',
              backendError,
            );
            connectionMonitor?.markConnectionFailed(determinedChannelName);
            clearChannelAttempt(determinedChannelName);

            logConnectionError(
              'Backend Connection Exception',
              backendError,
              determinedChannelName,
              String(appUserId),
            );

            if (shouldShowChannelBusyModal(backendError)) {
              dispatch({
                type: AgoraActionType.SET_SHOW_CHANNEL_IS_BUSY_MODAL,
                payload: true,
              });
            }

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
          await joinCallChannel(channelName);
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

          throw new Error(
            `Error de conexión de chat: ${(rtmError as any)?.message || rtmError}`,
          );
        }

        if (localUserRole === 'male') {
          const finalFemaleCheck = onlineFemalesList.find(
            (female) => female.host_id === channelName,
          );

          if (
            !finalFemaleCheck ||
            finalFemaleCheck.status !== 'available_call'
          ) {
            console.warn(
              `[Final Check] Modelo ${channelName} cambió de estado antes de RTC`,
            );
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
          await waitForUserProfile(targetFemale.rtcUid);
        } catch (profileError) {
          console.error('[User Profile] Error esperando perfil:', profileError);

          await cleanupConnectionsOnError(
            preCreatedTracks,
            localUserRole,
            channelToJoin,
            current_room_id,
            channelName,
            localUser,
            agoraBackend,
            leaveCallChannel,
          );

          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });

          throw new Error(
            `Error esperando perfil de usuario: ${(profileError as any)?.message || profileError}`,
          );
        }

        try {
          await initRtcClient(
            channelName,
            String(rtcUid),
            rtcRoleForToken,
            publishTracksFlag,
            rtcLoadingMsg,
            preCreatedTracks,
          );
        } catch (rtcError) {
          await cleanupConnectionsOnError(
            preCreatedTracks,
            localUserRole,
            channelToJoin,
            current_room_id,
            channelName,
            localUser,
            agoraBackend,
            leaveCallChannel,
          );

          dispatch({
            type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
            payload: true,
          });

          throw new Error(
            `Error de conexión de video/audio: ${(rtcError as any)?.message || rtcError}`,
          );
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
          error.message
            ?.toLowerCase()
            .includes('error de conexión de video/audio') ||
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
      validateChannelAvailability,
      clearChannelAttempt,
      connectionMonitor,
      current_room_id,
      sendCallSignal,
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

      await agoraBackend.registerChannel(channel_name);

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

  const handleLeaveCall = useCallback(
    async (
      isChannelHoppingOrEvent: boolean | Event = false,
      endReason?: string,
    ) => {
      const isChannelHopping =
        typeof isChannelHoppingOrEvent === 'boolean'
          ? isChannelHoppingOrEvent
          : false;

      const currentUser = localUser;
      const currentChannel = currentChannelName;

      const isChannelHoppingActiveLS =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('channelHopping_in_progress') === 'true';

      if (
        !isChannelHopping &&
        (isChannelHoppingLoading || isChannelHoppingActiveLS)
      ) {
        return;
      }

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
          disconnectReason = 'La llamada ha finalizado';

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

          if (!isChannelHopping) {
            router.push('/main/video-roulette');
          }

          setTimeout(async () => {
            try {
              if (!isChannelHopping) {
                await sendCallSignal('HOST_ENDED_CALL', {
                  channelName: currentChannel,
                });
              } else {
              }
            } catch (error) {
              console.warn(
                '[Female Background Cleanup] Error enviando HOST_ENDED_CALL:',
                error,
              );
            }
          }, 100);

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

          if (endReason === 'female_ended_call') {
            disconnectReason = 'La llamada ha finalizado';
          } else if (
            initialMinutesInSeconds -
              totalElapsedSeconds -
              giftMinutesSpentInSeconds <=
              0 &&
            maleInitialMinutesInCall !== null
          ) {
            disconnectReason = 'Saldo agotado';
          } else {
            disconnectReason = 'La llamada ha finalizado';
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

          if (!isChannelHopping) {
            router.push('/main/video-roulette');
          }

          setTimeout(async () => {
            try {
              if (isRtmChannelJoined) {
                try {
                  const summaryPayload: FemaleCallSummaryInfo = {
                    reason: disconnectReason,
                    duration: callDuration,
                    earnings: callEarnings,
                    host_id: currentChannel,
                  };

                  const signalPromise = sendCallSignal(
                    'MALE_CALL_SUMMARY_SIGNAL',
                    summaryPayload,
                  );
                  const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Signal timeout')), 5000),
                  );

                  await Promise.race([signalPromise, timeoutPromise]);
                } catch (error) {
                  console.error(
                    '[Male] Error enviando MALE_CALL_SUMMARY_SIGNAL (continuando con cleanup):',
                    error,
                  );
                }
              }

              if (localUser.user_id && currentChannel && current_room_id) {
                try {
                  await agoraBackend.cleanupAfterMaleDisconnect(
                    String(localUser.user_id),
                    currentChannel,
                    current_room_id,
                  );
                } catch (error) {
                  console.error(
                    '[Male] ❌ Error en limpieza completa, intentando limpieza básica:',
                    error,
                  );

                  try {
                    await agoraBackend.closeMaleChannel(
                      String(localUser.user_id),
                      currentChannel,
                      current_room_id,
                    );

                    if (!hostEndedCallInfo?.ended) {
                      await agoraBackend.closeChannel(
                        currentChannel,
                        'finished',
                      );
                    }
                  } catch (fallbackError) {
                    console.error(
                      '[Male] ❌ Error en limpieza básica también:',
                      fallbackError,
                    );
                  }
                }
              }
            } catch (error) {
              console.warn(
                '[Male Background Cleanup] Error en cleanup:',
                error,
              );
            }
          }, 100);
        }

        setTimeout(async () => {
          try {
            const rtcPromise = leaveRtcChannel();
            const rtcTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('RTC leave timeout')), 3000),
            );
            await Promise.race([rtcPromise, rtcTimeoutPromise]);
          } catch (error) {
            console.warn('[Background Cleanup] Error cerrando RTC:', error);
          }

          try {
            const rtmPromise = leaveCallChannel();
            const rtmTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('RTM leave timeout')), 3000),
            );
            await Promise.race([rtmPromise, rtmTimeoutPromise]);
          } catch (error) {
            console.warn('[Background Cleanup] Error cerrando RTM:', error);
          }

          if (
            currentUser.role === 'male' &&
            currentChannel &&
            channelHoppingFunctions?.registerChannelLeave
          ) {
            channelHoppingFunctions.registerChannelLeave(currentChannel, false);
          }

          try {
            await handleGetInformation();
          } catch (error) {
            console.warn(
              '[Background Cleanup] Error actualizando información:',
              error,
            );
          }
        }, 200);
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
      }
    },
    [
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
      channelHoppingFunctions,
      leaveRtcChannel,
      leaveCallChannel,
      sendCallSignal,
      broadcastLocalFemaleStatusUpdate,
      hostEndedCallInfo,
      onlineFemalesList,
    ],
  );

  const closeNoChannelsAvailableModal = useCallback(() => {
    dispatch({
      type: AgoraActionType.SET_SHOW_NO_CHANNELS_AVAILABLE_MODAL_FOR_MALE,
      payload: false,
    });
    
    // 🔥 FIX: Redireccionar automáticamente cuando se cierra el modal de "no channels available"
    console.log('[No Channels Modal] 🔧 Redireccionando a video-roulette después de cerrar modal...');
    router.push('/main/video-roulette');
  }, [dispatch, router]);

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

    if (isChannelHoppingLoading) {
      return;
    }

    const isChannelHoppingActive =
      typeof window !== 'undefined' &&
      window.localStorage.getItem('channelHopping_in_progress') === 'true';

    if (isChannelHoppingActive) {
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
    isChannelHoppingLoading,
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
