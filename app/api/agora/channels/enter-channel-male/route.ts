import { NextRequest, NextResponse } from 'next/server';

interface RoomData {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number | null;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id: maleUserId, host_id: targetHostId } = body;

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!maleUserId) {
      return NextResponse.json(
        { success: false, message: 'El user_id (del male) es requerido.' },
        { status: 400 },
      );
    }

    if (!targetHostId) {
      return NextResponse.json(
        { success: false, message: 'El host_id (del canal) es requerido.' },
        { status: 400 },
      );
    }

    const listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting`;
    const roomsListResponse = await fetch(listRoomsApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!roomsListResponse.ok) {
      console.error(
        `[API enter-channel-male] Error al obtener lista de salas (pre-check): ${roomsListResponse.status}`,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            'Error al verificar la disponibilidad del canal (servicio externo de listas).',
        },
        { status: roomsListResponse.status || 502 },
      );
    }

    const roomsListData = await roomsListResponse.json();

    if (
      roomsListData.status !== 'Success' ||
      !Array.isArray(roomsListData.data)
    ) {
      console.error(
        `[API enter-channel-male] Respuesta inesperada de la API de lista de salas (pre-check):`,
        roomsListData,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Error al procesar la disponibilidad del canal.',
        },
        { status: 500 },
      );
    }

    const targetRoomPreCheck = roomsListData.data.find(
      (room: RoomData) => room.host_id === targetHostId,
    );

    if (!targetRoomPreCheck) {
     
      return NextResponse.json(
        {
          success: false,
          message: 'El canal seleccionado ya no está disponible o no existe.',
        },
        { status: 404 },
      );
    }

    if (targetRoomPreCheck.another_user_id !== null) {
  
      return NextResponse.json(
        {
          success: false,
          message: 'El canal ya está ocupado por otro usuario.',
        },
        { status: 409 },
      );
    }
 
    const formdata = new FormData();
    formdata.append('user_id', String(maleUserId));
    formdata.append('host_id', String(targetHostId));

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
        return NextResponse.json(
          {
            success: false,
            message: `Error de la API externa de entrada (${externalEnterRoomApiResponse.status}): ${externalEnterRoomApiResponse.statusText}. La respuesta no fue un JSON válido.`,
          },
          { status: externalEnterRoomApiResponse.status || 502 },
        );
      }
      console.warn(
        '[API enter-channel-male] API /enter-room respondió OK pero no era JSON. Asumiendo éxito inicial con mensaje genérico.',
      );
      enterRoomResponseData = {
        status: 'Success',
        message: 'Operación de entrada exitosa (respuesta no JSON).',
        data: {},
      };
    }

    if (
      enterRoomResponseData.status === 'Error' &&
      enterRoomResponseData.data === 'Host no disponible'
    ) {
      console.warn(
        `[API enter-channel-male] La API externa indicó que el Host no está disponible:`,
        enterRoomResponseData,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'El canal ya fue ocupado por otro usuario.',
          details: enterRoomResponseData,
        },
        { status: 409 },
      );
    }

    if (
      !externalEnterRoomApiResponse.ok ||
      enterRoomResponseData.status !== 'Success'
    ) {
      console.error(
        `[API enter-channel-male] Falló la llamada a /api/v1/enter-room o la API externa indicó un error:`,
        enterRoomResponseData,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            enterRoomResponseData.message ||
            'Error al intentar entrar a la sala en el servicio externo.',
          details: enterRoomResponseData,
        },
        { status: externalEnterRoomApiResponse.status || 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: enterRoomResponseData.message || 'Ingreso a la sala exitoso.',
        data: enterRoomResponseData.data,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      '[API enter-channel-male] Error general en API Route:',
      error,
    );
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error: El cuerpo de la solicitud no es un JSON válido.',
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud para entrar a la sala.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
