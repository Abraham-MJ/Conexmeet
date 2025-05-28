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
    const name = incomingFormData.get('name') as string | null;
    const email = incomingFormData.get('email') as string | null;
    const birthdate = incomingFormData.get('birthdate') as string | null;

    if (!name && !email && !birthdate) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No se proporcionaron datos (nombre, email o fecha de nacimiento) para actualizar.',
        },
        { status: 400 },
      );
    }

    const externalApiFormData = new FormData();
    let fieldsToUpdate = false;

    if (name) {
      externalApiFormData.append('name', name);
      fieldsToUpdate = true;
    }
    if (email) {
      externalApiFormData.append('email', email);
      fieldsToUpdate = true;
    }
    if (birthdate) {
      externalApiFormData.append('birthdate', birthdate);
      fieldsToUpdate = true;
    }

    if (!fieldsToUpdate) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se encontraron campos válidos para actualizar.',
        },
        { status: 400 },
      );
    }

    const externalApiResponse = await fetch(
      'https://app.conexmeet.live/api/v1/update-profile',
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
          'La API externa de datos no devolvió una respuesta JSON válida.',
        _rawResponse: responseTextFromExternalApi,
      };
    }

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromExternalApi.message ||
            'Error al actualizar los datos del perfil en el servicio externo.',
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
          'Datos del perfil actualizados exitosamente.',
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
            'Error de red al comunicarse con el servicio externo para actualizar datos.',
          errorDetails: error.message,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud de actualización de datos.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
