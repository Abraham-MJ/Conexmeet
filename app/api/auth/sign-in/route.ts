import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Faltan credenciales' },
        { status: 400 },
      );
    }

    const response = await fetchWithTimeout('https://app.conexmeet.live/api/v1/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      timeout: 15000,
      retries: 2,
    });

    const data = await response.json();

    if (data.status !== 'Success') {
      return NextResponse.json(
        { success: false, message: data.message || 'Error en el login' },
        { status: response.status },
      );
    }

    const token = data.data.access_token;

    return new Response(
      JSON.stringify({ success: true, message: 'Login exitoso' }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}; ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error en sign-in:', error);
    
    const isConnectionError = error instanceof Error && 
      (error.message.includes('fetch failed') || 
       error.message.includes('timeout') ||
       error.message.includes('CONNECT_TIMEOUT'));

    return NextResponse.json(
      { 
        success: false, 
        message: isConnectionError 
          ? 'Error de conexión con el servidor. Intenta nuevamente en unos momentos.'
          : 'Error en el servidor',
        isConnectionError,
      },
      { status: isConnectionError ? 503 : 500 },
    );
  }
}
