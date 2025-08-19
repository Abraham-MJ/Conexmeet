import { NextRequest, NextResponse } from 'next/server';

interface CloseRoomPayload {
  user_id: number | string;
  host_id: string;
  id: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CloseRoomPayload = await request.json();
    const { user_id: maleUserId, host_id: targetHostId, id: roomId } = body;

    const authToken = request.cookies.get('auth_token')?.value;
    const isEmergencyCleanup =
      request.headers.get('x-emergency-cleanup') === 'true';

    if (!maleUserId) {
      console.error(
        '[API close-channel-male] Error: El user_id (del male) es requerido.',
      );
      return NextResponse.json(
        { success: false, message: 'El user_id (del male) es requerido.' },
        { status: 400 },
      );
    }

    if (!targetHostId) {
      console.error(
        '[API close-channel-male] Error: El host_id (del canal) es requerido.',
      );
      return NextResponse.json(
        { success: false, message: 'El host_id (del canal) es requerido.' },
        { status: 400 },
      );
    }

    if (!roomId) {
      console.error(
        '[API close-channel-male] Error: El id de la sala es requerido.',
      );
      return NextResponse.json(
        { success: false, message: 'El id de la sala es requerido.' },
        { status: 400 },
      );
    }

    const formdata = new FormData();
    formdata.append('user_id', String(maleUserId));
    formdata.append('host_id', String(targetHostId));
    formdata.append('id', String(roomId));

    const externalCloseRoomApiUrl =
      'https://app.conexmeet.live/api/v1/closed-room';

    const externalHeaders: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authToken) {
      externalHeaders['Authorization'] = `Bearer ${authToken}`;
    } else if (isEmergencyCleanup) {
      externalHeaders['X-Emergency-Cleanup'] = 'true';
    } else {
      console.warn(
        '[Close Channel Male] ⚠️ No hay token ni es emergencia, intentando sin auth',
      );
    }

    const externalApiResponse = await fetch(externalCloseRoomApiUrl, {
      method: 'POST',
      headers: externalHeaders,
      body: formdata,
    });

    let responseData;
    try {
      responseData = await externalApiResponse.json();
    } catch (jsonError: any) {
      if (externalApiResponse.ok) {
        console.warn(
          '[API close-channel-male] API externa respondió OK pero no era JSON. Asumiendo éxito con mensaje genérico.',
        );
        return NextResponse.json(
          {
            success: true,
            message: 'Operación de cierre exitosa (respuesta no JSON).',
            data: {},
          },
          { status: 200 },
        );
      }
      console.error(
        `[API close-channel-male] Error al parsear JSON de la API externa (${externalApiResponse.status}):`,
        jsonError,
      );
      return NextResponse.json(
        {
          success: false,
          message: `Error de la API externa de cierre (${externalApiResponse.status}): ${externalApiResponse.statusText}. La respuesta no fue un JSON válido.`,
        },
        { status: externalApiResponse.status || 502 },
      );
    }

    if (!externalApiResponse.ok || responseData.status !== 'Success') {
      console.error(
        `[API close-channel-male] Falló la llamada a la API externa de cierre (${externalApiResponse.status}):`,
        responseData,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message ||
            'Error al intentar cerrar la sala en el servicio externo.',
          details: responseData,
        },
        { status: externalApiResponse.status || 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: responseData.message || 'Cierre de sala exitoso.',
        data: responseData.data,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      '[API close-channel-male] Error general en API Route:',
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
          'Error interno del servidor al procesar la solicitud para cerrar la sala.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
