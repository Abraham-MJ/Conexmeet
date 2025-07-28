import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'El email es requerido' },
        { status: 400 },
      );
    }

    const formData = new FormData();
    formData.append('email', email);

    const response = await fetch(
      'https://app.conexmeet.live/api/v1/request-otp',
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Error en la solicitud OTP',
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error en la solicitud OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 },
    );
  }
}
