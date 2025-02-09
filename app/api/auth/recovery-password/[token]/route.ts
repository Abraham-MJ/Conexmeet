import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { token?: string } },
) {
  const { token } = params;

  if (!token) {
    return NextResponse.json(
      { error: 'Token no proporcionado' },
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
      return NextResponse.json(
        { error: 'Error al obtener los datos' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
