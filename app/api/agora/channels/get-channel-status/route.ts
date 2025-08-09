import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host_id } = body;

    if (!host_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'host_id es requerido',
        },
        { status: 400 },
      );
    }

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token de autenticación requerido',
        },
        { status: 401 },
      );
    }

    const externalApiResponse = await fetch(
      'https://app.conexmeet.live/api/v1/get-room-status',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host_id: host_id,
        }),
      },
    );

    if (!externalApiResponse.ok) {
      console.error(
        `[Get Channel Status] Error de API externa: ${externalApiResponse.status}`,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Error consultando estado del canal en API externa',
          status: externalApiResponse.status,
        },
        { status: externalApiResponse.status },
      );
    }

    const responseData = await externalApiResponse.json();

    return NextResponse.json({
      success: true,
      status: responseData.status || 'unknown',
      data: responseData,
      host_id: host_id,
    });
  } catch (error) {
    console.error('[Get Channel Status] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno consultando estado del canal',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
