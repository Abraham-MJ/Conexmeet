import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://app.conexmeet.live/api/v1/countries',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Error al obtener países' },
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
