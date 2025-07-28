import { NextRequest, NextResponse } from 'next/server';

interface HostData {
  host_id: string;
  user_id: number;
  another_user_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  updated_at: string;
  created_at: string;
  id: number;
}

interface ApiHostResponse {
  status: string;
  message: string;
  data?: HostData;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      host_id: searchParams.get('host_id'),
    };

    const { host_id } = params;

    if (!host_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Parámetro host_id (newChannelName) no encontrado en la URL.',
        },
        { status: 400 },
      );
    }

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado - Token no encontrado en cookies',
        },
        { status: 401 },
      );
    }

    const baseUrl = 'https://app.conexmeet.live/api/v1';
    const endpoint = `${baseUrl}/user-host/${host_id}`;

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${authToken}`);

    const externalApiResponse = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    let responseDataFromApi: ApiHostResponse;
    try {
      responseDataFromApi = await externalApiResponse.json();
    } catch (e) {
      if (!externalApiResponse.ok) {
        const errorBody = await externalApiResponse
          .text()
          .catch(() => 'No se pudo leer el cuerpo del error.');
        return NextResponse.json(
          {
            success: false,
            message: `Error en la API externa: ${externalApiResponse.statusText || 'Respuesta no válida'}`,
            details: errorBody,
          },
          { status: externalApiResponse.status },
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: 'La respuesta de la API externa no es un JSON válido.',
        },
        { status: 502 },
      );
    }

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromApi.message ||
            'Error al obtener datos del host desde la API externa.',
          errorDetails: responseDataFromApi,
        },
        { status: externalApiResponse.status },
      );
    }

    if (responseDataFromApi.status !== 'Success') {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromApi.message ||
            'La API externa indicó un problema pero devolvió un status HTTP exitoso.',
          errorDetails: responseDataFromApi,
        },

        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          responseDataFromApi.message ||
          'Datos del host obtenidos exitosamente.',
        data: responseDataFromApi.data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `Error en la API Route (create-channel/${(error as any)?.params?.host_id || 'dynamic'}):`,
      error,
    );
    let errorMessage = 'Error interno del servidor al procesar la solicitud.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 },
    );
  }
}
