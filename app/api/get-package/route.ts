import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticación no encontrado.' },
        { status: 401 },
      );
    }

    const response = await fetchWithTimeout('https://app.conexmeet.live/api/v1/packages', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      timeout: 15000,
      retries: 2,
    });

    const externalApiResponse = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            externalApiResponse.message ||
            'Error al obtener los paquetes desde el servicio externo.',
        },
        { status: response.status },
      );
    }

    if (externalApiResponse.status === 'Success') {
      return NextResponse.json(
        {
          success: true,
          data: externalApiResponse.data,
          message: externalApiResponse.message,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            externalApiResponse.message ||
            'El servicio externo indicó un error no esperado.',
          data: externalApiResponse.data,
        },
        { status: response.status || 400 },
      );
    }
  } catch (error: any) {
    console.error('Error en get-package:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Respuesta inválida del servicio externo (formato no es JSON).',
        },
        { status: 502 },
      );
    }

    const isConnectionError = error instanceof Error && 
      (error.message.includes('fetch failed') || 
       error.message.includes('timeout') ||
       error.message.includes('CONNECT_TIMEOUT'));

    return NextResponse.json(
      {
        success: false,
        message: isConnectionError 
          ? 'Error de conexión con el servidor. Intenta nuevamente en unos momentos.'
          : 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.',
        isConnectionError,
      },
      { status: isConnectionError ? 503 : 500 },
    );
  }
}
