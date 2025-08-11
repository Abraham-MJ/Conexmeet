import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      email,
      password,
      password_confirmation,
      name,
      gender,
      terms,
      phone,
      referral_code,
      country_id,
      otp,
      birthdate,
    } = body;

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', password_confirmation);
    formData.append('name', name);
    formData.append('gender', gender);
    formData.append('terms', terms);
    formData.append('phone', phone || '');
    formData.append('referral_code', referral_code || '');
    formData.append('country_id', country_id);
    formData.append('otp', otp || '');
    formData.append('birthdate', birthdate);

    const response = await fetchWithTimeout('https://app.conexmeet.live/api/v1/register', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
      timeout: 15000,
      retries: 2,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Error al registrar usuario',
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error en la API de registro:', error);
    
    const isConnectionError = error instanceof Error && 
      (error.message.includes('fetch failed') || 
       error.message.includes('timeout') ||
       error.message.includes('CONNECT_TIMEOUT'));

    return NextResponse.json(
      { 
        success: false, 
        message: isConnectionError 
          ? 'Error de conexión con el servidor. Intenta nuevamente en unos momentos.'
          : 'Error interno del servidor',
        isConnectionError,
      },
      { status: isConnectionError ? 503 : 500 },
    );
  }
}
