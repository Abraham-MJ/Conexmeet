import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, host_id } = body;

    const authToken = request.cookies.get('auth_token')?.value;
    const isEmergencyCleanup = request.headers.get('x-emergency-cleanup') === 'true';


    if (!authToken && !isEmergencyCleanup) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado: Falta el token de autenticación.',
        },
        { status: 401 },
      );
    }

    if (!status || !host_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Error: Faltan los campos "status" o "host_id" en la solicitud.',
        },
        { status: 400 },
      );
    }

    const formData = new FormData();
    formData.append('status', status);
    formData.append('host_id', host_id);

    const externalHeaders: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authToken) {
      externalHeaders.Authorization = `Bearer ${authToken}`;
    } else if (isEmergencyCleanup) {
      externalHeaders['X-Emergency-Cleanup'] = 'true';
    }

    const externalApiResponse = await fetch(
      'https://app.conexmeet.live/api/v1/status-room',
      {
        method: 'POST',
        headers: externalHeaders,
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
            'Error al actualizar el estado en el servicio externo.',
          errorDetails:
            responseDataFromExternalApi.errors ||
            responseDataFromExternalApi.data ||
            responseDataFromExternalApi,
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
    console.error('Error en API Route /api/update-room-status:', error);

    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Error: El cuerpo de la solicitud no es JSON válido o está malformado.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud de actualización de estado.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
