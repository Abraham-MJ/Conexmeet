import { useState, useCallback } from 'react';
import { RtmClient } from 'agora-rtm-sdk';
import {
  AgoraAction,
  AgoraActionType,
  UserInformation,
} from '@/app/types/streams';
import { useAgoraServer } from './useAgoraServer';
import { LOG_PREFIX_PROVIDER, LOG_PREFIX_RTM_LISTEN } from '@/lib/constants';

export const useAgoraRtm = (
  dispatch: React.Dispatch<AgoraAction>,
  appID: string | null,
  initialRtmToken: string | null,
  localUser: UserInformation | null,
  agoraBackend: ReturnType<typeof useAgoraServer>,
) => {
  const [rtmClient, setRtmClient] = useState<RtmClient | null>(null);
  const [isRtmLoggedIn, setIsRtmLoggedIn] = useState(false);
  const [isLoadingRtm, setIsLoadingRtm] = useState(false);
  const [rtmError, setRtmError] = useState<string | null>(null);

  const initializeRtmClient = useCallback(
    async (loadingMessage?: string) => {
      if (!appID) {
        const msg = 'AppID no disponible para RTM.';
        setRtmError(msg);
        dispatch({ type: AgoraActionType.RTM_LOGIN_FAILURE, payload: msg });
        throw new Error(msg);
      }
      if (!localUser || !localUser.rtmUid) {
        const msg = 'Perfil local o RTM UID no disponible para RTM.';
        setRtmError(msg);
        dispatch({ type: AgoraActionType.RTM_LOGIN_FAILURE, payload: msg });
        throw new Error(msg);
      }

      if (isRtmLoggedIn && rtmClient) {
        return rtmClient;
      }

      if (isLoadingRtm) {
        return rtmClient;
      }

      setIsLoadingRtm(true);
      setRtmError(null);
      dispatch({
        type: AgoraActionType.RTM_SETUP_START,
        payload: loadingMessage || 'Conectando servicios de mensajería...',
      });

      let currentRtmClient = rtmClient;
      let rtmTokenToUse = initialRtmToken;

      try {
        if (!rtmTokenToUse) {
          const newRtmToken = await agoraBackend.fetchRtmToken(
            localUser.rtmUid,
          );
          rtmTokenToUse = newRtmToken;
          dispatch({
            type: AgoraActionType.SET_TOKENS,
            payload: { tokenRtc: null, tokenRtm: rtmTokenToUse },
          });
        }

        if (!currentRtmClient) {
          const AgoraRTM = (await import('agora-rtm-sdk')).default;
          currentRtmClient = AgoraRTM.createInstance(appID, {
            logFilter: AgoraRTM.LOG_FILTER_ERROR,
          });
          setRtmClient(currentRtmClient);
        }

        currentRtmClient.removeAllListeners('ConnectionStateChanged');

        currentRtmClient.on('ConnectionStateChanged', (newState, reason) => {
          console.log(
            `${LOG_PREFIX_RTM_LISTEN} RTM Estado cambió: ${newState} (${reason})`,
          );

          if (
            newState === 'ABORTED' ||
            (newState === 'DISCONNECTED' &&
              String(reason) === 'LOGIN_KICKED_BY_REMOTE')
          ) {
            console.error(
              `${LOG_PREFIX_RTM_LISTEN} RTM Kicked/Aborted: ${reason}. UID: ${localUser.rtmUid}`,
            );
            setRtmError(`RTM Kicked/Aborted: ${reason}`);
            setIsRtmLoggedIn(false);
            dispatch({
              type: AgoraActionType.RTM_LOGIN_FAILURE,
              payload: `RTM Kicked/Aborted: ${reason}`,
            });
          } else if (
            newState === 'DISCONNECTED' &&
            String(reason) === 'LOGOUT'
          ) {
            console.log(`${LOG_PREFIX_RTM_LISTEN} RTM Logout normal`);
            setIsRtmLoggedIn(false);
            dispatch({ type: AgoraActionType.RTM_LOGOUT_LEAVE_CHANNEL });
          } else if (
            newState === 'DISCONNECTED' &&
            String(reason) !== 'LOGOUT'
          ) {
            console.warn(
              `${LOG_PREFIX_RTM_LISTEN} RTM Desconectado inesperadamente: ${reason}`,
            );
            setIsRtmLoggedIn(false);
            setRtmError(`Desconectado: ${reason}`);

            // Categorizar el tipo de error para decidir si reconectar
            const shouldAttemptReconnect = ![
              'INVALID_TOKEN',
              'TOKEN_EXPIRED',
              'INVALID_ARGUMENT',
            ].includes(String(reason));

            if (shouldAttemptReconnect) {
              // Intentar reconectar después de un delay progresivo
              const reconnectDelay = Math.min(
                2000 + Math.random() * 1000,
                5000,
              );
              setTimeout(async () => {
                if (localUser && localUser.rtmUid && !isRtmLoggedIn) {
                  console.log(
                    `${LOG_PREFIX_RTM_LISTEN} Intentando reconectar RTM automáticamente...`,
                  );
                  try {
                    await initializeRtmClient(
                      'Reconectando servicios de mensajería...',
                    );
                  } catch (reconnectError) {
                    console.error(
                      `${LOG_PREFIX_RTM_LISTEN} Error en reconexión automática:`,
                      reconnectError,
                    );
                  }
                }
              }, reconnectDelay);
            } else {
              console.error(
                `${LOG_PREFIX_RTM_LISTEN} Error crítico RTM, no se intentará reconectar: ${reason}`,
              );
              dispatch({
                type: AgoraActionType.SET_SHOW_UNEXPECTED_ERROR_MODAL,
                payload: true,
              });
            }
          } else if (newState === 'CONNECTED') {
            console.log(`${LOG_PREFIX_RTM_LISTEN} RTM Conectado exitosamente`);
            setIsRtmLoggedIn(true);
            setRtmError(null);
          } else if (newState === 'RECONNECTING') {
            console.log(`${LOG_PREFIX_RTM_LISTEN} RTM Reconectando...`);
            setRtmError('Reconectando...');
          } else if (newState === 'CONNECTING') {
            console.log(`${LOG_PREFIX_RTM_LISTEN} RTM Conectando...`);
            setRtmError('Conectando...');
          }
        });

        await currentRtmClient.login({
          uid: String(localUser.rtmUid),
          token: rtmTokenToUse ?? undefined,
        });

        setIsRtmLoggedIn(true);
        setIsLoadingRtm(false);
        setRtmError(null);
        dispatch({
          type: AgoraActionType.RTM_LOGIN_SUCCESS,
          payload: { rtmClient: currentRtmClient },
        });

        return currentRtmClient;
      } catch (error: any) {
        console.error(
          `${LOG_PREFIX_PROVIDER} RTM Login FAILED for UID: ${localUser?.rtmUid}:`,
          error,
        );
        const errorMessage =
          error.message || 'Error desconocido al loguearse en RTM.';
        setRtmError(errorMessage);
        setIsLoadingRtm(false);
        setIsRtmLoggedIn(false);
        dispatch({
          type: AgoraActionType.RTM_LOGIN_FAILURE,
          payload: errorMessage,
        });
        throw error;
      }
    },
    [
      appID,
      localUser,
      initialRtmToken,
      dispatch,
      rtmClient,
      isRtmLoggedIn,
      isLoadingRtm,
      agoraBackend,
    ],
  );

  const logoutRtmClient = useCallback(async () => {
    if (rtmClient && isRtmLoggedIn) {
      try {
        await rtmClient.logout();
        setIsRtmLoggedIn(false);
        dispatch({ type: AgoraActionType.RTM_LOGOUT_LEAVE_CHANNEL });
      } catch (error) {
        console.error(
          `${LOG_PREFIX_PROVIDER} Error al desloguear RTM Client:`,
          error,
        );
      }
    }
  }, [rtmClient, isRtmLoggedIn, dispatch]);

  return {
    rtmClient,
    isRtmLoggedIn,
    isLoadingRtm,
    rtmError,
    initializeRtmClient,
    logoutRtmClient,
  };
};
