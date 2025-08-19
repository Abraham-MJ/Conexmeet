import { NextRequest, NextResponse } from 'next/server';

interface CleanupPayload {
  user_id: number | string;
  host_id: string;
  room_id: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CleanupPayload = await request.json();
    const { user_id: maleUserId, host_id: targetHostId, room_id: roomId } = body;

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!maleUserId || !targetHostId || !roomId) {
      return NextResponse.json(
        {
          success: false,
          message: 'El user_id, host_id y room_id son requeridos.',
        },
        { status: 400 },
      );
    }


    const closeMaleFormData = new FormData();
    closeMaleFormData.append('user_id', String(maleUserId));
    closeMaleFormData.append('host_id', String(targetHostId));
    closeMaleFormData.append('id', String(roomId));

    try {
      const closeMaleResponse = await fetch(
        'https://app.conexmeet.live/api/v1/closed-room',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: closeMaleFormData,
        },
      );

      const closeMaleData = await closeMaleResponse.json();
    } catch (error) {
      console.error(`[Cleanup] Error cerrando sala del male:`, error);
    }

    try {
      const listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting&filter[host_id]=${targetHostId}`;
      const roomsListResponse = await fetch(listRoomsApiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (roomsListResponse.ok) {
        const roomsListData = await roomsListResponse.json();
        
        if (roomsListData.status === 'Success' && Array.isArray(roomsListData.data)) {
          const targetRoom = roomsListData.data.find(
            (room: any) => room.host_id === targetHostId,
          );

          if (targetRoom) {
            
            if (!targetRoom.another_user_id || targetRoom.another_user_id === maleUserId) {
              const updateStatusFormData = new FormData();
              updateStatusFormData.append('status', 'waiting');
              updateStatusFormData.append('host_id', String(targetHostId));

              const updateStatusResponse = await fetch(
                'https://app.conexmeet.live/api/v1/status-room',
                {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                  },
                  body: updateStatusFormData,
                },
              );

              const updateStatusData = await updateStatusResponse.json();
            }
          } else {
          }
        }
      }
    } catch (error) {
      console.error(`[Cleanup] Error verificando/actualizando estado del canal:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(
      {
        success: true,
        message: 'Limpieza completada exitosamente.',
        data: {
          maleUserId,
          targetHostId,
          roomId,
          timestamp: Date.now(),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[API cleanup-after-male-disconnect] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno al procesar la limpieza.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}