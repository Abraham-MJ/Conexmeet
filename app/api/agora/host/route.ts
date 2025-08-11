import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

interface FemaleUserFromApi {
  id: number;
  name: string;
  profile_photo_path: string | null;
  is_active: 0 | 1;
  gender: string;
  type?: string;
  in_call?: 0 | 1;
  host?: string | null;
}

interface RoomFromApi {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  status: 'waiting' | 'call' | string;
}

export interface FemaleWithStatus {
  user_id: number;
  rtcUid: string;
  rtmUid: string;
  user_name: string;
  avatar: string | null;
  role: 'female';
  is_active: 0 | 1;
  in_call?: 0 | 1;
  host_id: string | null;
  status: 'online' | 'available_call' | 'in_call' | 'offline';
}

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status');

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado - Token no encontrado' },
        { status: 401 },
      );
    }

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${authToken}`);

    const [femalesResponse, roomsResponse] = await Promise.all([
      fetchWithTimeout('https://app.conexmeet.live/api/v1/list-users?gender=female', {
        headers,
        cache: 'no-store',
        timeout: 15000,
        retries: 2,
      }),
      fetchWithTimeout('https://app.conexmeet.live/api/v1/rooms', {
        headers,
        cache: 'no-store',
        timeout: 15000,
        retries: 2,
      }),
    ]);

    if (!femalesResponse.ok) {
      const errorText = await femalesResponse.text();
      return NextResponse.json(
        {
          success: false,
          message: `Error al obtener usuarias female: ${femalesResponse.statusText}`,
          details: errorText,
        },
        { status: femalesResponse.status },
      );
    }
    if (!roomsResponse.ok) {
      const errorText = await roomsResponse.text();
      return NextResponse.json(
        {
          success: false,
          message: `Error al obtener salas: ${roomsResponse.statusText}`,
          details: errorText,
        },
        { status: roomsResponse.status },
      );
    }

    const femalesData = await femalesResponse.json();
    const roomsData = await roomsResponse.json();

    if (femalesData.status !== 'Success' || !Array.isArray(femalesData.data)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Respuesta inválida de API de usuarias female',
          details: femalesData.message || null,
        },
        { status: 502 },
      );
    }
    if (roomsData.status !== 'Success' || !Array.isArray(roomsData.data)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Respuesta inválida de API de salas',
          details: roomsData.message || null,
        },
        { status: 502 },
      );
    }

    const allFemales: FemaleUserFromApi[] = femalesData.data;
    const allRooms: RoomFromApi[] = roomsData.data;

    const activeRoomsByHostUserId = new Map<
      number,
      { channelName: string; status: string; isBusy: boolean }
    >();
    allRooms.forEach((room) => {
      if (room.status === 'waiting' || room.status === 'call') {
        activeRoomsByHostUserId.set(room.user_id, {
          channelName: room.host_id,
          status: room.status,
          isBusy: room.status === 'call' || room.another_user_id !== null,
        });
      }
    });

    let processedFemales: FemaleWithStatus[] = allFemales
      .filter((female) => female.is_active === 1 && female.gender === 'female')
      .map((female) => {
        const rtcUid = String(female.id);
        const rtmUid = String(female.id);

        let derivedStatus: FemaleWithStatus['status'] = 'offline';
        let currentChannelName: string | null = female.host || null;
        let inCallFlag = female.in_call === 1;

        const activeRoomDetails = activeRoomsByHostUserId.get(female.id);

        if (activeRoomDetails) {
          currentChannelName = activeRoomDetails.channelName;
          if (activeRoomDetails.isBusy) {
            derivedStatus = female.is_active === 1 ? 'in_call' : 'offline';
            inCallFlag = true;
          } else if (activeRoomDetails.status === 'waiting') {
            derivedStatus = female.is_active === 1 ? 'available_call' : 'offline';
            inCallFlag = false;
          }
        } else {
          if (inCallFlag && currentChannelName && female.is_active === 1) {
            derivedStatus = 'in_call';
          } else {
            derivedStatus = 'offline';
            currentChannelName = null;
          }
        }

        if (female.is_active !== 1) {
          derivedStatus = 'offline';
        }

        return {
          user_id: female.id,
          rtcUid: rtcUid,
          rtmUid: rtmUid,
          user_name: female.name,
          avatar: female.profile_photo_path,
          role: 'female',
          is_active: female.is_active,
          in_call: inCallFlag ? 1 : 0,
          host_id: currentChannelName,
          status: derivedStatus,
        };
      });

    if (filterStatus === 'available_call') {
      processedFemales = processedFemales.filter(
        (female) => female.status === 'available_call',
      );
    }

    processedFemales.sort((a, b) => {
      const statusOrder = {
        available_call: 1,
        in_call: 2,
        online: 3,
        offline: 4,
      };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

    return NextResponse.json(
      { success: true, data: processedFemales },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error en host API:', error);
    
    const isConnectionError = error instanceof Error && 
      (error.message.includes('fetch failed') || 
       error.message.includes('timeout') ||
       error.message.includes('CONNECT_TIMEOUT'));

    let errorMessage = isConnectionError 
      ? 'Error de conexión con el servidor. Intenta nuevamente en unos momentos.'
      : 'Error interno del servidor al obtener el directorio de females.';
    
    if (error instanceof Error && !isConnectionError) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        isConnectionError,
      },
      { status: isConnectionError ? 503 : 500 },
    );
  }
}
