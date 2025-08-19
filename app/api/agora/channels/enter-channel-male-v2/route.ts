import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

interface RoomData {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  status: string;
}

const connectionAttempts = new Map<
  string,
  { userId: number; timestamp: number; locked: boolean }
>();
const LOCK_TIMEOUT = 10000;

setInterval(() => {
  const now = Date.now();
  for (const [hostId, attempt] of connectionAttempts.entries()) {
    if (now - attempt.timestamp > LOCK_TIMEOUT) {
      connectionAttempts.delete(hostId);
    }
  }
}, 30000);

export async function POST(request: NextRequest) {
  let targetHostId: string | undefined;

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

    const existingAttempt = connectionAttempts.get(targetHostId);
    const now = Date.now();

    if (existingAttempt) {
      if (
        now - existingAttempt.timestamp < LOCK_TIMEOUT &&
        existingAttempt.userId !== maleUserId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'CANAL_OCUPADO: Otro usuario está intentando conectarse a este canal.',
            errorType: 'CHANNEL_BUSY',
          },
          { status: 409 },
        );
      }

      if (existingAttempt.userId === maleUserId) {
        existingAttempt.timestamp = now;
        existingAttempt.locked = true;
      }
    } else {
      connectionAttempts.set(targetHostId, {
        userId: maleUserId,
        timestamp: now,
        locked: true,
      });
    }

    try {
      let listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting&filter[host_id]=${targetHostId}`;
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

      if (!targetRoom) {
        
        listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[host_id]=${targetHostId}`;
        roomsListResponse = await fetch(listRoomsApiUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (roomsListResponse.ok) {
          roomsListData = await roomsListResponse.json();
          if (roomsListData.status === 'Success' && Array.isArray(roomsListData.data)) {
            targetRoom = roomsListData.data.find(
              (room: RoomData) => room.host_id === targetHostId,
            );
            
            if (targetRoom && targetRoom.status !== 'waiting') {
              
              if (targetRoom.status === 'finished' || targetRoom.status === 'closed') {
                targetRoom = null; 
              } else if (targetRoom.another_user_id && targetRoom.another_user_id !== maleUserId) {
                targetRoom = null;
              }
            }
          }
        }
      }

      if (!targetRoom) {
        connectionAttempts.delete(targetHostId);
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

      if (targetRoom.another_user_id !== null) {
        connectionAttempts.delete(targetHostId);
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
        connectionAttempts.delete(targetHostId);
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
        connectionAttempts.delete(targetHostId);
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
          await fetchWithTimeout('https://app.conexmeet.live/api/v1/leave-room', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: formdata,
            timeout: 10000,
            retries: 1,
          }).catch(() => {});

          connectionAttempts.delete(targetHostId);
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

      setTimeout(() => {
        if (targetHostId) {
          connectionAttempts.delete(targetHostId);
        }
      }, 2000);

      return NextResponse.json(
        {
          success: true,
          message:
            enterRoomResponseData.message || 'Conexión exitosa al canal.',
          data: enterRoomResponseData.data,
        },
        { status: 200 },
      );
    } catch (error: any) {
      if (targetHostId) {
        connectionAttempts.delete(targetHostId);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('[API enter-channel-male-v2] Error:', error);

    if (targetHostId) {
      connectionAttempts.delete(targetHostId);
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
