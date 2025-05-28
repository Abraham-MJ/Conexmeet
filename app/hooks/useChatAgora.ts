'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAgoraContext } from '../context/useAgoraContext';
import { useAgoraRtmToken } from './api/useAgoraRtmToken';
import type { RtmClient } from 'agora-rtm-sdk';
import { useUser } from '../context/useClientContext';
type RtmConfig = any;

interface AgoraRTMType {
  createInstance: (appId: string, config?: RtmConfig) => RtmClient;
  LOG_FILTER_OFF: number;
  LOG_FILTER_ERROR: number;
  LOG_FILTER_WARNING: number;
  LOG_FILTER_INFO: number;
}

export const useChatAgora = () => {
  const { state: agora } = useAgoraContext();
  const { state: user } = useUser();
  const { fetchRtmToken: getTokenRtm } = useAgoraRtmToken();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);

  const clientRef = useRef<RtmClient | null>(null);
  const AgoraRTMLibRef = useRef<AgoraRTMType | null>(null);

  useEffect(() => {
    const loadAndInitializeSdk = async () => {
      if (
        typeof window !== 'undefined' &&
        !AgoraRTMLibRef.current &&
        agora.appID
      ) {
        // try {
        //   const sdkModule = await import('agora-rtm-sdk');
        //   AgoraRTMLibRef.current = sdkModule.default as unknown as AgoraRTMType;
        //   if (AgoraRTMLibRef.current && !clientRef.current) {
        //     const client = AgoraRTMLibRef.current.createInstance(agora.appID, {
        //       logFilter: AgoraRTMLibRef.current.LOG_FILTER_ERROR,
        //     });
        //     clientRef.current = client;
        //     setIsSdkLoaded(true);
        //   }
        // } catch (e) {
        //   console.error('Error cargando o inicializando Agora RTM:', e);
        //   setError(new Error('Fallo al cargar el SDK de RTM.'));
        // }
      }
    };

    loadAndInitializeSdk();

    return () => {};
  }, [agora.appID]);

  const login = useCallback(async () => {
    // if (!clientRef.current) {
    //   setError(
    //     new Error(
    //       'Cliente RTM no está inicializado. SDK no cargado o AppID faltante.',
    //     ),
    //   );
    //   return;
    // }
    // if (!user.user.id) {
    //   setError(new Error('RTM UID del usuario no proporcionado.'));
    //   return;
    // }
    // if (isLoggedIn) {
    //   console.log('[useChatAgora] Usuario ya está logueado en RTM.');
    //   return;
    // }
    // setError(null);
    // try {
    //   const token = await getTokenRtm(user.user.id.toString());
    //   console.log(
    //     `[useChatAgora] Token RTM obtenido para UID ${user.user.id}:`,
    //     token ? 'Sí' : 'No',
    //   );
    //   await clientRef.current.login({
    //     uid: user.user.id.toString(),
    //     token: token ?? undefined,
    //   } as any);
    //   setIsLoggedIn(true);
    // } catch (loginError) {
    //   console.error(
    //     `[useChatAgora] FALLO LOGIN RTM para UID: ${user.user.id}`,
    //     loginError,
    //   );
    //   setError(loginError);
    //   setIsLoggedIn(false);
    // }
  }, [getTokenRtm, isLoggedIn, user.user.id, isSdkLoaded]);

  const logout = useCallback(async () => {
    // if (!clientRef.current || !isLoggedIn) {
    //   return;
    // }
    // try {
    //   await clientRef.current.logout();
    //   setIsLoggedIn(false);
    // } catch (logoutError) {
    //   console.error('[useChatAgora] Error durante logout de RTM:', logoutError);
    //   setError(logoutError);
    // }
  }, [isLoggedIn, user.user.id]);

  useEffect(() => {
    // const clientInstance = clientRef.current;
    // return () => {
    //   if (clientInstance) {
    //     clientInstance
    //       .logout()
    //       .then(() =>
    //         console.log('[useChatAgora] Logout en desmontaje completado.'),
    //       )
    //       .catch((err) =>
    //         console.error(
    //           '[useChatAgora] Error en logout durante desmontaje:',
    //           err,
    //         ),
    //       );
    //   }
    // };
  }, []);

  return {
    rtmClient: clientRef.current,
    isLoggedIn,
    error,
    login,
    logout,
    isSdkLoaded,
  };
};
