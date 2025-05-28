import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_TIMEOUT_MS = 20000; 

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
    const photoFile = incomingFormData.get('profile_photo') as File | null;

    if (!photoFile) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No se proporcionó ningún archivo de foto de perfil (campo "profile_photo" esperado).',
        },
        { status: 400 },
      );
    }

    const externalApiFormData = new FormData();
    externalApiFormData.append('profile_photo', photoFile, photoFile.name);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      EXTERNAL_API_TIMEOUT_MS,
    );

    let externalApiResponse;
    try {
      externalApiResponse = await fetch(
        'https://app.conexmeet.live/api/v1/profile-photo',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: externalApiFormData,
          signal: controller.signal,
        },
      );
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            message:
              'Error: El servicio externo de fotos tardó demasiado en responder.',
          },
          { status: 504 }, 
        );
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

    const responseTextFromExternalApi = await externalApiResponse.text();
    let responseDataFromExternalApi: any;

    try {
      responseDataFromExternalApi = JSON.parse(responseTextFromExternalApi);
    } catch (e) {
      responseDataFromExternalApi = {
        message:
          responseTextFromExternalApi ||
          'La API externa de fotos no devolvió una respuesta JSON válida.',
        _rawResponse: responseTextFromExternalApi,
      };
    }

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromExternalApi.message ||
            'Error al actualizar la foto de perfil en el servicio externo.',
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
          'Foto de perfil actualizada exitosamente.',
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
            'Error de red al comunicarse con el servicio externo para actualizar la foto.',
          errorDetails: error.message,
        },
        { status: 503 }, 
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud de actualización de foto.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
