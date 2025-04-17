import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado - Token no encontrado' },
        { status: 401 },
      );
    }

    const apiUrl = 'https://app.conexmeet.live/api/v1/histories';

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${authToken}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Error en API externa: ${response.statusText}`,
      );
    }

    const data = await response.json();

    return NextResponse.json(
      { success: true, data: data.data },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error al obtener historiales:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Error desconocido al obtener historiales',
      },
      { status: 500 },
    );
  }
}
