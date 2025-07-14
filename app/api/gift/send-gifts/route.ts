import { NextRequest, NextResponse } from 'next/server';

interface SendGiftPayload {
  user_id_sends: string | number;
  user_id_receives: string | number;
  gif_id: string | number;
  host_id: string;
  gift_cost_in_minutes: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendGiftPayload = await request.json();
    const {
      user_id_sends,
      user_id_receives,
      gif_id,
      host_id,
      gift_cost_in_minutes,
    } = body;

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      console.error(
        '[API send-gift] Error: Token de autorización no encontrado.',
      );
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!user_id_sends || !user_id_receives || !gif_id || !host_id) {
      console.error('[API send-gift] Error: Campos requeridos incompletos.', {
        body,
      });
      return NextResponse.json(
        { success: false, message: 'Datos del regalo incompletos.' },
        { status: 400 },
      );
    }

    if (typeof gift_cost_in_minutes !== 'number' || gift_cost_in_minutes < 0) {
      console.error('[API send-gift] Error: Costo del regalo inválido.', {
        gift_cost_in_minutes,
      });
      return NextResponse.json(
        { success: false, message: 'Costo del regalo inválido.' },
        { status: 400 },
      );
    }

    const formdata = new FormData();
    formdata.append('user_id_sends', String(user_id_sends));
    formdata.append('user_id_receives', String(user_id_receives));
    formdata.append('gif_id', String(gif_id));
    formdata.append('host_id', String(host_id));

    const externalSendGiftApiUrl =
      'https://app.conexmeet.live/api/v1/send-gifs';
    console.log(
      `[API send-gift] Intentando enviar regalo ${gif_id} de ${user_id_sends} a ${user_id_receives} en canal ${host_id}.`,
    );

    const externalApiResponse = await fetch(externalSendGiftApiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: formdata,
    });

    let responseData;
    try {
      responseData = await externalApiResponse.json();
    } catch (jsonError: any) {
      if (externalApiResponse.ok) {
        console.warn(
          '[API send-gift] API externa respondió OK pero no era JSON. Asumiendo éxito con mensaje genérico.',
        );
        return NextResponse.json(
          {
            success: true,
            message:
              'Operación de envío de regalo exitosa (respuesta no JSON).',
            data: {},
            cost_in_minutes: gift_cost_in_minutes,
          },
          { status: 200 },
        );
      }
      console.error(
        `[API send-gift] Error al parsear JSON de la API externa (${externalApiResponse.status}):`,
        jsonError,
      );
      return NextResponse.json(
        {
          success: false,
          message: `Error de la API externa de envío de regalo (${externalApiResponse.status}): ${externalApiResponse.statusText}. La respuesta no fue un JSON válido.`,
        },
        { status: externalApiResponse.status || 502 },
      );
    }

    if (!externalApiResponse.ok || responseData.status !== 'Success') {
      console.error(
        `[API send-gift] Falló la llamada a la API externa de envío de regalo (${externalApiResponse.status}):`,
        responseData,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message ||
            'Error al intentar enviar el regalo en el servicio externo.',
          details: responseData,
        },
        { status: externalApiResponse.status || 500 },
      );
    }

    console.log(
      `[API send-gift] Éxito al enviar regalo ${gif_id} de ${user_id_sends} a ${user_id_receives}. Costo: ${gift_cost_in_minutes} minutos.`,
    );
    return NextResponse.json(
      {
        success: true,
        message: responseData.message || 'Regalo enviado exitosamente.',
        data: responseData.data,
        cost_in_minutes: gift_cost_in_minutes,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[API send-gift] Error general en API Route:', error);
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
          'Error interno del servidor al procesar la solicitud para enviar el regalo.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
