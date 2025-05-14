import { RoomData } from '@/app/types/channels';
import { NextRequest, NextResponse } from 'next/server';

interface ApiRoomsResponse {
  status: string;
  message: string;
  data?: RoomData[];
}

export async function GET(request: NextRequest) {
  try {
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
    const endpoint = `${baseUrl}/rooms?filter[status]=waiting`;

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${authToken}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    let responseDataFromApi: ApiRoomsResponse;
    try {
      responseDataFromApi = await response.json();
    } catch (e) {
      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `Error en la API externa: ${response.statusText || 'Respuesta no válida'}`,
          },
          { status: response.status },
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

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromApi.message ||
            'Error al obtener el listado de salas desde la API externa.',
          errorDetails: responseDataFromApi,
        },
        { status: response.status },
      );
    }

    if (responseDataFromApi.status !== 'Success') {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromApi.message ||
            'La API externa indicó un problema pero devolvió status 200.',
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
          'Listado de salas obtenido exitosamente.',
        data: responseDataFromApi.data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error en la API Route (rooms):', error);
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
