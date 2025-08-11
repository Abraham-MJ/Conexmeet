import { NextResponse, NextRequest } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const externalApiUrl = 'https://app.conexmeet.live/api/v1/users/auth';

    const response = await fetchWithTimeout(externalApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      timeout: 15000, 
      retries: 2,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener datos del usuario' },
        { status: response.status },
      );
    }

    const userData = await response.json();

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error en API user:', error);
    
    const isConnectionError = error instanceof Error && 
      (error.message.includes('fetch failed') || 
       error.message.includes('timeout') ||
       error.message.includes('CONNECT_TIMEOUT'));

    return NextResponse.json(
      { 
        error: isConnectionError 
          ? 'Error de conexión con el servidor de autenticación. Intenta nuevamente en unos momentos.'
          : 'Error interno del servidor',
        isConnectionError,
      },
      { status: isConnectionError ? 503 : 500 },
    );
  }
}
