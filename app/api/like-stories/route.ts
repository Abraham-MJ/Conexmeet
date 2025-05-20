import { NextRequest, NextResponse } from 'next/server';

interface LikeStoryRequestBody {
  story_id: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LikeStoryRequestBody = await request.json();
    const authToken = request.cookies.get('auth_token')?.value;

    const { story_id } = body;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!story_id) {
      return NextResponse.json(
        { success: false, message: 'El story_id es requerido.' },
        { status: 400 },
      );
    }

    const externalApiUrl = `https://app.conexmeet.live/api/v1/like-history/${story_id}`;

    const externalApiResponse = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const responseData = await externalApiResponse.json();

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message ||
            'Error al interactuar con la historia en el servicio externo.',
          details: responseData,
        },
        { status: externalApiResponse.status || 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          responseData.message ||
          'Acción de like/unlike completada exitosamente.',
        data: responseData.data || responseData,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error en API Route (like-story):', error);
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error: El cuerpo de la solicitud no es un JSON válido.',
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor al procesar la solicitud de like.',
      },
      { status: 500 },
    );
  }
}
