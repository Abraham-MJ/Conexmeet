import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Faltan credenciales' },
        { status: 400 },
      );
    }

    const response = await fetch('https://app.conexmeet.live/api/v1/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
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
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 },
    );
  }
}
