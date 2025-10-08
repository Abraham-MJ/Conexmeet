import { NextRequest, NextResponse } from 'next/server';

const channelLocks = new Map<
  string,
  {
    userId: number;
    timestamp: number;
    expiresAt: number;
  }
>();

const LOCK_DURATION = 10000; 
const CLEANUP_INTERVAL = 15000; 


setInterval(() => {
  const now = Date.now();
  for (const [channelId, lock] of channelLocks.entries()) {
    if (now > lock.expiresAt) {
      channelLocks.delete(channelId);
      console.log(
        `[Lock Cleanup] Lock expirado removido para canal: ${channelId}`,
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
  let lockAcquired = false;

  try {
    const body = await request.json();
    const { user_id: maleUserId, host_id: hostId } = body;
    targetHostId = hostId;

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

    const existingLock = channelLocks.get(targetHostId);

    if (existingLock) {
      if (now < existingLock.expiresAt) {
        if (existingLock.userId !== maleUserId) {
          console.warn(
            `[Reserve Channel] Canal ${targetHostId} bloqueado por usuario ${existingLock.userId}. Solicitante: ${maleUserId}`,
          );
          return NextResponse.json(
            {
              success: false,
              message:
                'CANAL_OCUPADO: Otro usuario está conectándose a este canal.',
              errorType: 'CHANNEL_BUSY',
              lockedBy: existingLock.userId,
            },
            { status: 409 },
          );
        }
        console.log(
          `[Reserve Channel] Usuario ${maleUserId} renovando lock en canal ${targetHostId}`,
        );
      } else {
        channelLocks.delete(targetHostId);
        console.log(
          `[Reserve Channel] Lock expirado removido para canal ${targetHostId}`,
        );
      }
    }

    channelLocks.set(targetHostId, {
      userId: maleUserId,
      timestamp: now,
      expiresAt: now + LOCK_DURATION,
    });
    lockAcquired = true;
    console.log(
      `[Reserve Channel] Lock adquirido para canal ${targetHostId} por usuario ${maleUserId}`,
    );

    try {
      const listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting&filter[host_id]=${targetHostId}`;
      const roomsListResponse = await fetch(listRoomsApiUrl, {
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

      const roomsListData = await roomsListResponse.json();

      if (
        roomsListData.status !== 'Success' ||
        !Array.isArray(roomsListData.data)
      ) {
        throw new Error('Respuesta inválida del servicio de verificación');
      }

      const targetRoom = roomsListData.data.find(
        (room: RoomData) => room.host_id === targetHostId,
      );

      if (!targetRoom) {
        channelLocks.delete(targetHostId);
        lockAcquired = false;

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

      if (targetRoom.status !== 'waiting') {
        channelLocks.delete(targetHostId);
        lockAcquired = false;

        return NextResponse.json(
          {
            success: false,
            message: `CANAL_NO_DISPONIBLE: El canal está en estado ${targetRoom.status}.`,
            errorType: 'CHANNEL_NOT_AVAILABLE',
          },
          { status: 409 },
        );
      }

      if (
        targetRoom.another_user_id !== null &&
        targetRoom.another_user_id !== maleUserId
      ) {
        channelLocks.delete(targetHostId);
        lockAcquired = false;

        return NextResponse.json(
          {
            success: false,
            message:
              'CANAL_OCUPADO: El canal ya está ocupado por otro usuario.',
            errorType: 'CHANNEL_BUSY',
          },
          { status: 409 },
        );
      }

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
        channelLocks.delete(targetHostId);
        lockAcquired = false;

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
        channelLocks.delete(targetHostId);
        lockAcquired = false;

        return NextResponse.json(
          {
            success: false,
            message:
              enterRoomResponseData.message || 'Error al conectar al canal.',
          },
          { status: externalEnterRoomApiResponse.status || 500 },
        );
      }

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
            `[Reserve Channel] ❌ RACE CONDITION DETECTADA: Canal ${targetHostId}. Male ${maleUserId} vs ${finalRoom.another_user_id}`,
          );

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
          } catch (cleanupError) {
            console.error('[Reserve Channel] Error en cleanup:', cleanupError);
          }

          channelLocks.delete(targetHostId);
          lockAcquired = false;

          return NextResponse.json(
            {
              success: false,
              message:
                'CANAL_OCUPADO: Conexión simultánea detectada. Otro usuario se conectó primero.',
              errorType: 'CHANNEL_BUSY',
            },
            { status: 409 },
          );
        }
      }

      console.log(
        `[Reserve Channel] ✅ Reserva exitosa para canal ${targetHostId} por usuario ${maleUserId}`,
      );

      return NextResponse.json(
        {
          success: true,
          message:
            enterRoomResponseData.message || 'Canal reservado exitosamente.',
          data: enterRoomResponseData.data,
          lockExpiresAt: now + LOCK_DURATION,
        },
        { status: 200 },
      );
    } catch (error: any) {
      if (lockAcquired && targetHostId) {
        channelLocks.delete(targetHostId);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[Reserve Channel] Error:', error);

    if (lockAcquired && targetHostId) {
      channelLocks.delete(targetHostId);
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno al procesar la reserva del canal.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agora/channels/reserve-channel
 *
 * Liberar un lock de canal manualmente
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('host_id');
    const userId = searchParams.get('user_id');

    if (!hostId || !userId) {
      return NextResponse.json(
        { success: false, message: 'host_id y user_id son requeridos' },
        { status: 400 },
      );
    }

    const existingLock = channelLocks.get(hostId);

    if (!existingLock) {
      return NextResponse.json(
        { success: true, message: 'No hay lock activo para este canal' },
        { status: 200 },
      );
    }

    if (existingLock.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, message: 'No tienes permiso para liberar este lock' },
        { status: 403 },
      );
    }

    channelLocks.delete(hostId);
    console.log(
      `[Reserve Channel] Lock liberado manualmente para canal ${hostId} por usuario ${userId}`,
    );

    return NextResponse.json(
      { success: true, message: 'Lock liberado exitosamente' },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[Reserve Channel DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error al liberar lock' },
      { status: 500 },
    );
  }
}
