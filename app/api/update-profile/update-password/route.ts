import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado: Falta el token de autenticación.',
        },
        { status: 401 },
      );
    }

    const incomingFormData = await request.formData();
    const password_old = incomingFormData.get('password_old') as string | null;
    const password = incomingFormData.get('password') as string | null;
    const password_confirmation = incomingFormData.get('password_confirmation') as string | null;

    if (!password_old || !password || !password_confirmation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Todos los campos de contraseña son requeridos.',
        },
        { status: 400 },
      );
    }

    if (password !== password_confirmation) {
      return NextResponse.json(
        {
          success: false,
          message: 'La nueva contraseña y su confirmación no coinciden.',
          errorDetails: {
            password_confirmation: ['Las contraseñas no coinciden.']
          }
        },
        { status: 400 },
      );
    }

    const externalApiFormData = new FormData();
    externalApiFormData.append('password_old', password_old);
    externalApiFormData.append('password', password);
    externalApiFormData.append('password_confirmation', password_confirmation);

    const externalApiResponse = await fetch(
      'https://app.conexmeet.live/api/v1/update-password',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: externalApiFormData,
      },
    );

    const responseTextFromExternalApi = await externalApiResponse.text();

    let responseDataFromExternalApi: any;
    try {
      responseDataFromExternalApi = JSON.parse(responseTextFromExternalApi);
    } catch (e) {
      responseDataFromExternalApi = {
        message:
          responseTextFromExternalApi ||
          'La API externa no devolvió una respuesta JSON válida.',
        _rawResponse: responseTextFromExternalApi,
      };
    }

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromExternalApi.message ||
            'Error al actualizar la contraseña en el servicio externo.',
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
        message:
          responseDataFromExternalApi.message ||
          'Contraseña actualizada exitosamente.',
        data: responseDataFromExternalApi.data || responseDataFromExternalApi,
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (
      error.name === 'TypeError' &&
      error.message &&
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
    if (
      error.name === 'TypeError' &&
      error.message &&
      error.message.toLowerCase().includes('fetch failed')
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Error de red al comunicarse con el servicio externo para actualizar la contraseña.',
          errorDetails: error.message,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud de actualización de contraseña.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}