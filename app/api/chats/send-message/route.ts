import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const authToken = request.cookies.get('auth_token')?.value;

    const { file, message, room_id, translate, type, user_id } = body;

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado: Falta el token de autenticación.',
        },
        { status: 401 },
      );
    }

    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('body', message);
    formData.append('body_traslate', translate ?? '');
    formData.append('type', type);

    if (file) {
      formData.append('file', file, file.name);
    }

    const externalApiResponse = await fetch(
      `https://app.conexmeet.live/api/v1/send-message/${room_id}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      },
    );

    const responseDataFromExternalApi = await externalApiResponse.json();

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromExternalApi.message ||
            'Error al enviar el mensaje al servicio externo.',
          errorDetails:
            responseDataFromExternalApi.errors ||
            responseDataFromExternalApi.data,
        },
        { status: externalApiResponse.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: responseDataFromExternalApi.message,
        data: responseDataFromExternalApi.data,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      'Error en API Route /api/send-message/[conversation_id]:',
      error,
    );

    if (
      error.name === 'TypeError' &&
      error.message.includes('could not parse content as FormData')
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Error: El cuerpo de la solicitud no es FormData válido o está malformado.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud de envío de mensaje.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
