import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticación no encontrado.' },
        { status: 401 },
      );
    }

    const response = await fetch(
      "https://app.conexmeet.live/api/v1/my-history",
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
      },
    );

    const externalApiResponse = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: externalApiResponse.message || 'Error al obtener el historial desde el servicio externo.',
        },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { success: true, data: externalApiResponse },
      { status: 200 },
    );

  } catch (error: any) {
    console.error("Error en la ruta API GET /my-history:", error.message);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: 'Respuesta inválida del servicio externo (formato no es JSON).' },
        { status: 502 }, 
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.',
      },
      { status: 500 },
    );
  }
}