import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'El email y el OTP son requeridos' },
        { status: 400 },
      );
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('otp', otp);

    const response = await fetch(
      'https://app.conexmeet.live/api/v1/verify-otp',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Error en la verificación del OTP',
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 },
    );
  }
}
