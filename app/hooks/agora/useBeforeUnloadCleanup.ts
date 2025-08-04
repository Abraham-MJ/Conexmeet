'use client';

import { useEffect, useCallback, useRef } from 'react';
import { UserInformation } from '@/app/types/streams';

interface BeforeUnloadCleanupOptions {
  localUser: UserInformation | null;
  isRtcJoined: boolean;
  isRtmChannelJoined: boolean;
  currentChannelName: string | null;
  current_room_id: string | null;
  leaveCallChannel: () => Promise<void>;
  leaveRtcChannel: () => Promise<void>;
  broadcastLocalFemaleStatusUpdate: (statusInfo: Partial<UserInformation>) => Promise<void>;
  // Configuración opcional para controlar cuándo activar
  enableVisibilityCleanup?: boolean;
  visibilityCleanupDelay?: number;
}

export const useBeforeUnloadCleanup = ({
  localUser,
  isRtcJoined,
  isRtmChannelJoined,
  currentChannelName,
  current_room_id,
  leaveCallChannel,
  leaveRtcChannel,
  broadcastLocalFemaleStatusUpdate,
  enableVisibilityCleanup = false, // Por defecto deshabilitado
  visibilityCleanupDelay = 30000, // 30 segundos por defecto
}: BeforeUnloadCleanupOptions) => {
  const cleanupExecutedRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Mover aquí

  const performCleanup = useCallback(async (reason: 'beforeunload' | 'pagehide' | 'visibilitychange') => {
    // Evitar múltiples ejecuciones simultáneas
    if (isCleaningUpRef.current || cleanupExecutedRef.current) {
      return;
    }

    isCleaningUpRef.current = true;
    
    try {
      console.log(`[BeforeUnload] Iniciando limpieza por ${reason}...`);

      // Solo limpiar si hay conexiones activas
      if (!localUser || (!isRtcJoined && !isRtmChannelJoined)) {
        console.log('[BeforeUnload] No hay conexiones activas para limpiar');
        return;
      }

      const cleanupPromises: Promise<void>[] = [];

      // 1. Si es female, actualizar estado en el lobby PRIMERO
      if (localUser.role === 'female') {
        console.log('[BeforeUnload] Actualizando estado de female en lobby...');
        cleanupPromises.push(
          broadcastLocalFemaleStatusUpdate({
            status: 'offline',
            in_call: 0,
            host_id: null,
            is_active: 0,
          }).catch(error => {
            console.warn('[BeforeUnload] Error actualizando estado female:', error);
          })
        );
      }

      // 2. Cerrar canal RTM si está conectado
      if (isRtmChannelJoined) {
        console.log('[BeforeUnload] Cerrando canal RTM...');
        cleanupPromises.push(
          leaveCallChannel().catch(error => {
            console.warn('[BeforeUnload] Error cerrando canal RTM:', error);
          })
        );
      }

      // 3. Cerrar canal RTC si está conectado
      if (isRtcJoined) {
        console.log('[BeforeUnload] Cerrando canal RTC...');
        cleanupPromises.push(
          leaveRtcChannel().catch(error => {
            console.warn('[BeforeUnload] Error cerrando canal RTC:', error);
          })
        );
      }

      // 4. Backend cleanup temporalmente deshabilitado
      if (currentChannelName && current_room_id) {
        console.log('[BeforeUnload] ℹ️ Limpieza de backend temporalmente deshabilitada');
        // TODO: Implementar lógica correcta de cierre de canal en backend
      }

      // Ejecutar todas las limpiezas en paralelo con timeout
      await Promise.race([
        Promise.allSettled(cleanupPromises),
        new Promise(resolve => setTimeout(resolve, 1000)) // Timeout de 1 segundo
      ]);

      cleanupExecutedRef.current = true;
      console.log(`[BeforeUnload] Limpieza completada por ${reason}`);

    } catch (error) {
      console.error(`[BeforeUnload] Error durante limpieza por ${reason}:`, error);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, [
    localUser,
    isRtcJoined,
    isRtmChannelJoined,
    currentChannelName,
    current_room_id,
    leaveCallChannel,
    leaveRtcChannel,
    broadcastLocalFemaleStatusUpdate,
  ]);

  useEffect(() => {
    // Solo activar para usuarios con conexiones activas Y que estén realmente en una llamada
    if (!localUser || (!isRtcJoined && !isRtmChannelJoined)) {
      return;
    }

    // Solo activar para females que tienen un canal activo o males que están en llamada
    const shouldActivateCleanup = 
      (localUser.role === 'female' && currentChannelName && isRtcJoined) ||
      (localUser.role === 'male' && isRtcJoined);

    if (!shouldActivateCleanup) {
      console.log('[BeforeUnload] Cleanup no activado - usuario no está en llamada activa', {
        role: localUser.role,
        hasChannel: !!currentChannelName,
        isRtcJoined,
        isRtmChannelJoined
      });
      return;
    }

    console.log('[BeforeUnload] Activando cleanup para usuario en llamada', {
      role: localUser.role,
      channelName: currentChannelName,
      isRtcJoined,
      isRtmChannelJoined
    });

    // Reset del flag cuando cambian las dependencias
    cleanupExecutedRef.current = false;

    // Evento beforeunload - se ejecuta antes de que la página se descargue
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('[BeforeUnload] 🚨 beforeunload event disparado');
      
      // IMPORTANTE: No usar preventDefault() porque bloquea la limpieza
      
      // 1. Backend cleanup temporalmente deshabilitado
      if (currentChannelName && current_room_id && localUser) {
        console.log('[BeforeUnload] ℹ️ Limpieza síncrona de backend temporalmente deshabilitada');
        // TODO: Implementar lógica correcta de cierre de canal en backend
      }

      // 2. Si es female, notificar desconexión
      if (localUser?.role === 'female' && typeof window !== 'undefined') {
        console.log('[BeforeUnload] 📢 Notificando desconexión de female');
        window.dispatchEvent(
          new CustomEvent('femaleDisconnectedFromCall', {
            detail: {
              femaleName: localUser.user_name || 'La modelo',
              femaleId: localUser.user_id,
              channelId: currentChannelName,
              reason: 'refresh'
            }
          })
        );
      }

      // 3. Ejecutar limpieza asíncrona en paralelo (no bloquear)
      performCleanup('beforeunload').catch(error => {
        console.warn('[BeforeUnload] ⚠️ Error en limpieza asíncrona:', error);
      });

      // TEMPORALMENTE DESHABILITADO: No mostrar confirmación para no interferir con la limpieza
      // Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('[BeforeUnload] 🛑 Desarrollo - limpieza ejecutada, no mostrando confirmación');
      }
    };

    // Evento pagehide - más confiable que beforeunload en móviles
    const handlePageHide = (event: PageTransitionEvent) => {
      console.log('[BeforeUnload] 🚨 pagehide event disparado', { persisted: event.persisted });
      
      if (!event.persisted) {
        // Backend cleanup temporalmente deshabilitado
        if (currentChannelName && current_room_id && localUser) {
          console.log('[BeforeUnload] ℹ️ pagehide - Limpieza de backend temporalmente deshabilitada');
          // TODO: Implementar lógica correcta de cierre de canal en backend
        }
        
        // Limpieza asíncrona
        performCleanup('pagehide');
      }
    };

    // Evento visibilitychange - SOLO para casos extremos con delay largo
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Limpiar timeout anterior si existe
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }
        
        // Solo ejecutar limpieza si la página permanece oculta por el tiempo configurado
        // Esto indica una posible desconexión real, no solo cambio de pestaña
        visibilityTimeoutRef.current = setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            console.log(`[BeforeUnload] Página oculta por ${visibilityCleanupDelay/1000}+ segundos, ejecutando limpieza...`);
            performCleanup('visibilitychange');
          }
        }, visibilityCleanupDelay);
      } else if (document.visibilityState === 'visible') {
        // Si la página vuelve a ser visible, cancelar la limpieza
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
          console.log('[BeforeUnload] Página visible de nuevo, cancelando limpieza por visibilitychange');
        }
      }
    };

    // Registrar event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    // Solo activar visibilitychange si está habilitado explícitamente
    if (enableVisibilityCleanup) {
      console.log('[BeforeUnload] Activando visibilitychange cleanup con delay de', visibilityCleanupDelay, 'ms');
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      if (enableVisibilityCleanup) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      // Limpiar timeout si existe
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [
    localUser,
    isRtcJoined,
    isRtmChannelJoined,
    currentChannelName,
    current_room_id,
    performCleanup,
    enableVisibilityCleanup,
    visibilityCleanupDelay,
  ]);

  // Función manual para forzar limpieza (útil para testing o casos especiales)
  const forceCleanup = useCallback(() => {
    cleanupExecutedRef.current = false;
    return performCleanup('beforeunload');
  }, [performCleanup]);

  return {
    forceCleanup,
    isCleaningUp: isCleaningUpRef.current,
    cleanupExecuted: cleanupExecutedRef.current,
  };
};