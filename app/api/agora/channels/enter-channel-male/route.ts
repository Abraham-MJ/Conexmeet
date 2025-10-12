import { NextRequest, NextResponse } from 'next/server';

// ✅ Sistema de reserva atómica mejorado
const channelReservations = new Map<
  string,
  {
    userId: number;
    timestamp: number;
    expiresAt: number;
    status: 'pending' | 'confirmed' | 'failed';
    attemptId: string; // ID único para cada intento
  }
>();

const RESERVATION_DURATION = 15000; // 15 segundos para completar la conexión
const CLEANUP_INTERVAL = 10000; // Limpieza cada 10 segundos
const ATOMIC_LOCK_TIMEOUT = 5000; // Timeout para operaciones atómicas

// ✅ Limpieza automática de reservas expiradas
setInterval(() => {
  const now = Date.now();
  for (const [channelId, reservation] of channelReservations.entries()) {
    if (now > reservation.expiresAt || reservation.status === 'failed') {
      channelReservations.delete(channelId);
      console.log(
        `[Reservation Cleanup] Reserva expirada/fallida removida para canal: ${channelId}`,
      );
    }
  }
}, CLEANUP_INTERVAL);

interface RoomData {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  status: string;
}

export async function POST(request: NextRequest) {
  let targetHostId: string | undefined;
  let reservationAcquired = false;
  let attemptId: string | undefined;

  try {
    const body = await request.json();
    const { user_id: maleUserId, host_id: hostId } = body;
    targetHostId = hostId;
    attemptId = `${maleUserId}-${hostId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!maleUserId || !targetHostId) {
      return NextResponse.json(
        {
          success: false,
          message: 'El user_id y host_id son requeridos.',
        },
        { status: 400 },
      );
    }

    const now = Date.now();

    // ✅ PASO 1: Verificar reserva existente (ATÓMICO)
    const existingReservation = channelReservations.get(targetHostId);

    if (existingReservation) {
      if (now < existingReservation.expiresAt) {
        if (existingReservation.userId !== maleUserId) {
          console.warn(
            `[Enter Channel Male] ⚠️ Canal ${targetHostId} RESERVADO por usuario ${existingReservation.userId}. Solicitante: ${maleUserId}. Status: ${existingReservation.status}`,
          );
          return NextResponse.json(
            {
              success: false,
              message:
                'CANAL_OCUPADO: Otro usuario está conectándose a este canal en este momento.',
              errorType: 'CHANNEL_BUSY',
              reservedBy: existingReservation.userId,
              retryAfter: Math.ceil(
                (existingReservation.expiresAt - now) / 1000,
              ),
            },
            { status: 409 },
          );
        }
        console.log(
          `[Enter Channel Male] Usuario ${maleUserId} renovando reserva en canal ${targetHostId}`,
        );
      } else {
        channelReservations.delete(targetHostId);
        console.log(
          `[Enter Channel Male] Reserva expirada removida para canal ${targetHostId}`,
        );
      }
    }

    // ✅ PASO 2: Crear reserva ANTES de cualquier operación externa
    channelReservations.set(targetHostId, {
      userId: maleUserId,
      timestamp: now,
      expiresAt: now + RESERVATION_DURATION,
      status: 'pending',
      attemptId: attemptId,
    });
    reservationAcquired = true;
    console.log(
      `[Enter Channel Male] 🔒 RESERVA ATÓMICA adquirida para canal ${targetHostId} por usuario ${maleUserId} (ID: ${attemptId})`,
    );

    try {
      // ✅ PASO 3: Verificar disponibilidad en backend externo
      let listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting`;
      let roomsListResponse = await fetch(listRoomsApiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!roomsListResponse.ok) {
        throw new Error(
          `Error al verificar disponibilidad: ${roomsListResponse.status}`,
        );
      }

      let roomsListData = await roomsListResponse.json();

      if (
        roomsListData.status !== 'Success' ||
        !Array.isArray(roomsListData.data)
      ) {
        throw new Error('Respuesta inválida del servicio de verificación');
      }

      let targetRoom = roomsListData.data.find(
        (room: RoomData) => room.host_id === targetHostId,
      );

      // ✅ PASO 4: Verificar que nuestra reserva sigue activa (puede haber expirado)
      const currentReservation = channelReservations.get(targetHostId);
      if (!currentReservation || currentReservation.attemptId !== attemptId) {
        console.error(
          `[Enter Channel Male] ❌ Reserva perdida durante verificación. Canal: ${targetHostId}, Usuario: ${maleUserId}`,
        );
        throw new Error('Reserva perdida durante verificación');
      }

      if (!targetRoom) {
        listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms`;
        roomsListResponse = await fetch(listRoomsApiUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (roomsListResponse.ok) {
          roomsListData = await roomsListResponse.json();
          if (
            roomsListData.status === 'Success' &&
            Array.isArray(roomsListData.data)
          ) {
            targetRoom = roomsListData.data.find(
              (room: RoomData) => room.host_id === targetHostId,
            );

            if (targetRoom && targetRoom.status !== 'waiting') {
              if (
                targetRoom.status === 'finished' ||
                targetRoom.status === 'closed'
              ) {
                targetRoom = null;
              } else if (
                targetRoom.another_user_id &&
                targetRoom.another_user_id !== maleUserId
              ) {
                targetRoom = null;
              }
            }
          }
        }
      }

      if (!targetRoom) {
        if (reservationAcquired && targetHostId) {
          const reservation = channelReservations.get(targetHostId);
          if (reservation && reservation.attemptId === attemptId) {
            reservation.status = 'failed';
            channelReservations.delete(targetHostId);
          }
          reservationAcquired = false;
        }

        return NextResponse.json(
          {
            success: false,
            message:
              'CANAL_NO_DISPONIBLE: El canal seleccionado ya no está disponible.',
            errorType: 'CHANNEL_NOT_AVAILABLE',
          },
          { status: 404 },
        );
      }

      // ✅ PASO 5: Verificación estricta de ocupación
      if (
        targetRoom.another_user_id !== null &&
        targetRoom.another_user_id !== maleUserId
      ) {
        console.warn(
          `[Enter Channel Male] ⚠️ Canal ${targetHostId} ya ocupado por usuario ${targetRoom.another_user_id}. Solicitante: ${maleUserId}`,
        );

        if (reservationAcquired && targetHostId) {
          const reservation = channelReservations.get(targetHostId);
          if (reservation && reservation.attemptId === attemptId) {
            reservation.status = 'failed';
            channelReservations.delete(targetHostId);
          }
          reservationAcquired = false;
        }

        return NextResponse.json(
          {
            success: false,
            message:
              'CANAL_OCUPADO: El canal ya está ocupado por otro usuario.',
            errorType: 'CHANNEL_BUSY',
            occupiedBy: targetRoom.another_user_id,
          },
          { status: 409 },
        );
      }

      // ✅ PASO 6: Verificar reserva una vez más ANTES de enter-room
      const preEnterReservation = channelReservations.get(targetHostId);
      if (!preEnterReservation || preEnterReservation.attemptId !== attemptId) {
        console.error(
          `[Enter Channel Male] ❌ RACE CONDITION: Reserva perdida antes de enter-room. Canal: ${targetHostId}, Usuario: ${maleUserId}`,
        );
        throw new Error('Reserva perdida antes de enter-room');
      }

      console.log(
        `[Enter Channel Male] 🚀 Ejecutando enter-room para canal ${targetHostId} por usuario ${maleUserId}`,
      );

      const formdata = new FormData();
      formdata.append('user_id', String(maleUserId));
      formdata.append('host_id', String(targetHostId));
      formdata.append('timestamp', String(now));

      const externalEnterRoomApiResponse = await fetch(
        'https://app.conexmeet.live/api/v1/enter-room',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: formdata,
        },
      );

      let enterRoomResponseData;
      try {
        enterRoomResponseData = await externalEnterRoomApiResponse.json();
      } catch (jsonError) {
        if (!externalEnterRoomApiResponse.ok) {
          throw new Error(
            `API externa falló: ${externalEnterRoomApiResponse.status}`,
          );
        }
        enterRoomResponseData = {
          status: 'Success',
          message: 'Operación exitosa',
          data: {},
        };
      }

      if (
        enterRoomResponseData.status === 'Error' ||
        enterRoomResponseData.data === 'Host no disponible' ||
        (enterRoomResponseData.message &&
          enterRoomResponseData.message.toLowerCase().includes('ocupado')) ||
        (enterRoomResponseData.message &&
          enterRoomResponseData.message.toLowerCase().includes('no disponible'))
      ) {
        if (reservationAcquired && targetHostId) {
          const reservation = channelReservations.get(targetHostId);
          if (reservation && reservation.attemptId === attemptId) {
            reservation.status = 'failed';
            channelReservations.delete(targetHostId);
          }
          reservationAcquired = false;
        }

        return NextResponse.json(
          {
            success: false,
            message:
              'CANAL_OCUPADO: El canal fue ocupado por otro usuario durante la conexión.',
            errorType: 'CHANNEL_BUSY',
          },
          { status: 409 },
        );
      }

      if (
        !externalEnterRoomApiResponse.ok ||
        enterRoomResponseData.status !== 'Success'
      ) {
        if (reservationAcquired && targetHostId) {
          const reservation = channelReservations.get(targetHostId);
          if (reservation && reservation.attemptId === attemptId) {
            reservation.status = 'failed';
            channelReservations.delete(targetHostId);
          }
          reservationAcquired = false;
        }

        return NextResponse.json(
          {
            success: false,
            message:
              enterRoomResponseData.message || 'Error al conectar al canal.',
          },
          { status: externalEnterRoomApiResponse.status || 500 },
        );
      }

      // ✅ PASO 7: Verificación FINAL post-enter-room (CRÍTICO)
      console.log(
        `[Enter Channel Male] 🔍 Verificación final post-enter-room para canal ${targetHostId}`,
      );

      // Pequeño delay para asegurar que el backend externo se actualizó
      await new Promise((resolve) => setTimeout(resolve, 200));

      const finalVerificationResponse = await fetch(listRoomsApiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (finalVerificationResponse.ok) {
        const finalData = await finalVerificationResponse.json();
        const finalRoom = finalData.data?.find(
          (room: RoomData) => room.host_id === targetHostId,
        );

        if (
          finalRoom &&
          finalRoom.another_user_id &&
          finalRoom.another_user_id !== maleUserId
        ) {
          console.error(
            `[Enter Channel Male] ❌ RACE CONDITION DETECTADA: Canal ${targetHostId}. Male ${maleUserId} vs ${finalRoom.another_user_id}`,
          );

          // ✅ Rollback: Limpiar nuestra conexión
          try {
            const cleanupFormData = new FormData();
            cleanupFormData.append('user_id', String(maleUserId));
            cleanupFormData.append('host_id', String(targetHostId));
            cleanupFormData.append('id', String(finalRoom.id));

            await fetch('https://app.conexmeet.live/api/v1/closed-room', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: cleanupFormData,
            });

            console.log(
              `[Enter Channel Male] 🧹 Rollback ejecutado para usuario ${maleUserId} en canal ${targetHostId}`,
            );
          } catch (cleanupError) {
            console.error(
              '[Enter Channel Male] Error en cleanup:',
              cleanupError,
            );
          }

          if (reservationAcquired && targetHostId) {
            const reservation = channelReservations.get(targetHostId);
            if (reservation && reservation.attemptId === attemptId) {
              reservation.status = 'failed';
              channelReservations.delete(targetHostId);
            }
            reservationAcquired = false;
          }

          return NextResponse.json(
            {
              success: false,
              message:
                'CANAL_OCUPADO: Conexión simultánea detectada. Otro usuario se conectó primero.',
              errorType: 'CHANNEL_BUSY',
              raceConditionDetected: true,
            },
            { status: 409 },
          );
        }
      }

      // ✅ PASO 8: Confirmar reserva exitosa
      const finalReservation = channelReservations.get(targetHostId);
      if (finalReservation && finalReservation.attemptId === attemptId) {
        finalReservation.status = 'confirmed';
        console.log(
          `[Enter Channel Male] ✅ Reserva CONFIRMADA para canal ${targetHostId} por usuario ${maleUserId}`,
        );
      }

      console.log(
        `[Enter Channel Male] ✅ Conexión exitosa para canal ${targetHostId} por usuario ${maleUserId}`,
      );

      return NextResponse.json(
        {
          success: true,
          message:
            enterRoomResponseData.message || 'Conexión exitosa al canal.',
          data: enterRoomResponseData.data,
          reservationExpiresAt: now + RESERVATION_DURATION,
          attemptId: attemptId,
        },
        { status: 200 },
      );
    } catch (error: any) {
      if (reservationAcquired && targetHostId) {
        const reservation = channelReservations.get(targetHostId);
        if (reservation && reservation.attemptId === attemptId) {
          reservation.status = 'failed';
          channelReservations.delete(targetHostId);
        }
        reservationAcquired = false;
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[Enter Channel Male] Error:', error);

    if (reservationAcquired && targetHostId) {
      const reservation = channelReservations.get(targetHostId);
      if (reservation && reservation.attemptId === attemptId) {
        reservation.status = 'failed';
        channelReservations.delete(targetHostId);
      }
      reservationAcquired = false;
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno al procesar la conexión al canal.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
