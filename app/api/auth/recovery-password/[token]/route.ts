import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json(
      { error: 'Token no proporcionado o inválido' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://app.conexmeet.live/api/v1/password/find/${token}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    );

    if (!response.ok) {
      let errorBody = {
        error: 'Error al obtener los datos del servicio externo',
      };
      try {
        errorBody = await response.json();
      } catch (e) {}
      return NextResponse.json(errorBody, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error interno del servidor en recovery-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
