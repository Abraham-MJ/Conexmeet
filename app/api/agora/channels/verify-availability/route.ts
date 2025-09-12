import { NextRequest, NextResponse } from 'next/server';

interface RoomData {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostId = searchParams.get('host_id');

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { available: false, reason: 'No autorizado' },
        { status: 401 },
      );
    }

    if (!hostId) {
      return NextResponse.json(
        { available: false, reason: 'host_id requerido' },
        { status: 400 },
      );
    }

    const listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting&filter[host_id]=${hostId}`;
    const roomsListResponse = await fetch(listRoomsApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!roomsListResponse.ok) {
      return NextResponse.json(
        { available: false, reason: 'Error verificando estado del canal' },
        { status: 500 },
      );
    }

    const roomsListData = await roomsListResponse.json();

    if (
      roomsListData.status !== 'Success' ||
      !Array.isArray(roomsListData.data)
    ) {
      return NextResponse.json(
        { available: false, reason: 'Respuesta inválida del servicio' },
        { status: 500 },
      );
    }

    const targetRoom = roomsListData.data.find(
      (room: RoomData) => room.host_id === hostId,
    );

    if (!targetRoom) {
      return NextResponse.json({
        available: false,
        reason: 'Canal no encontrado o no disponible',
      });
    }

    if (targetRoom.another_user_id !== null) {
      return NextResponse.json({
        available: false,
        reason: 'Canal ocupado por otro usuario',
      });
    }

    if (targetRoom.status !== 'waiting') {
      return NextResponse.json({
        available: false,
        reason: `Canal en estado: ${targetRoom.status}`,
      });
    }

    return NextResponse.json({
      available: true,
      reason: 'Canal disponible',
    });
  } catch (error: any) {
    console.error('[API verify-availability] Error:', error);
    return NextResponse.json(
      { available: false, reason: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}