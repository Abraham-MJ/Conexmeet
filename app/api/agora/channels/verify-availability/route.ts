import { NextRequest, NextResponse } from 'next/server';

interface RoomData {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  status: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('host_id');
    const userId = searchParams.get('user_id');

    if (!hostId || !userId) {
      return NextResponse.json(
        { 
          available: false, 
          reason: 'Parámetros host_id y user_id son requeridos.' 
        },
        { status: 400 }
      );
    }

    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { 
          available: false, 
          reason: 'No autorizado.' 
        },
        { status: 401 }
      );
    }

    // Verificación en tiempo real del estado del canal
    const listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting&filter[host_id]=${hostId}`;
    
    const roomsResponse = await fetch(listRoomsApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!roomsResponse.ok) {
      return NextResponse.json(
        { 
          available: false, 
          reason: 'Error al verificar disponibilidad del canal.' 
        },
        { status: 502 }
      );
    }

    const roomsData = await roomsResponse.json();

    if (roomsData.status !== 'Success' || !Array.isArray(roomsData.data)) {
      return NextResponse.json(
        { 
          available: false, 
          reason: 'Respuesta inválida del servicio de verificación.' 
        },
        { status: 502 }
      );
    }

    const targetRoom = roomsData.data.find(
      (room: RoomData) => room.host_id === hostId
    );

    if (!targetRoom) {
      return NextResponse.json(
        { 
          available: false, 
          reason: 'Canal no encontrado o no disponible.' 
        },
        { status: 404 }
      );
    }

    // Verificar si el canal está ocupado
    if (targetRoom.another_user_id !== null) {
      // Si es el mismo usuario, podría ser una reconexión
      if (String(targetRoom.another_user_id) === String(userId)) {
        return NextResponse.json(
          { 
            available: true, 
            reason: 'Canal disponible para reconexión.',
            isReconnection: true 
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { 
          available: false, 
          reason: 'Canal ocupado por otro usuario.' 
        },
        { status: 409 }
      );
    }

    // Verificar si el estado es válido para conexión
    if (targetRoom.status !== 'waiting') {
      return NextResponse.json(
        { 
          available: false, 
          reason: `Canal en estado: ${targetRoom.status}` 
        },
        { status: 409 }
      );
    }

    // Verificación adicional: tiempo desde última actualización
    const lastUpdate = new Date(targetRoom.updated_at).getTime();
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;

    // Si la última actualización fue hace más de 5 minutos, podría estar stale
    if (timeSinceUpdate > 5 * 60 * 1000) {
      return NextResponse.json(
        { 
          available: false, 
          reason: 'Canal posiblemente inactivo.' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        available: true, 
        reason: 'Canal disponible para conexión.',
        roomData: {
          id: targetRoom.id,
          status: targetRoom.status,
          lastUpdate: targetRoom.updated_at
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API verify-availability] Error:', error);
    
    return NextResponse.json(
      { 
        available: false, 
        reason: 'Error interno al verificar disponibilidad.',
        errorDetails: error.message 
      },
      { status: 500 }
    );
  }
}