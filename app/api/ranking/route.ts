import { NextRequest, NextResponse } from 'next/server';

interface RankingItemExternal {
  id: number;
  name: string;
  points: number;
  profile_photo_path: string;
  minutes: number;
}

interface ExternalApiResponse {
  status: string;
  message: string;
  data: RankingItemExternal[];
}

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticación no encontrado.' },
        { status: 401 },
      );
    }

    const externalApiUrl = 'https://app.conexmeet.live/api/v1/ranking';

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const externalApiResponse: ExternalApiResponse = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            externalApiResponse.message ||
            'Error al obtener el ranking desde el servicio externo.',
        },
        { status: response.status },
      );
    }

    if (!externalApiResponse.data || !Array.isArray(externalApiResponse.data)) {
      console.error(
        'Respuesta inesperada de la API externa de ranking. Falta el array de datos:',
        externalApiResponse,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de respuesta inesperado del servicio de ranking.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          externalApiResponse.message || 'Ranking obtenido exitosamente.',
        data: externalApiResponse.data,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error en la ruta API /api/ranking:', error);

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Error al procesar la respuesta del servicio externo. No es un JSON válido.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor al procesar la solicitud de ranking.',
      },
      { status: 500 },
    );
  }
}
