import { NextResponse } from 'next/server';

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

    const response = await fetch('https://app.conexmeet.live/api/v1/register', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
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
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
