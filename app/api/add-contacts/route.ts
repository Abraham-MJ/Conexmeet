import { NextRequest, NextResponse } from 'next/server';

interface ToggleContactRequestBody {
  user_id: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ToggleContactRequestBody = await request.json();
    const { user_id } = body;

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'El user_id es requerido en el cuerpo de la solicitud.',
        },
        { status: 400 },
      );
    }

    const externalApiUrl = `https://app.conexmeet.live/api/v1/contacts`;

    const formdata = new FormData();
    formdata.append('user_id', String(user_id));

    const externalApiResponse = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: formdata,
    });

    const responseData = await externalApiResponse.json();

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message ||
            'Error al interactuar con contactos en el servicio externo.',
          details: responseData,
        },
        { status: externalApiResponse.status || 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          responseData.message || 'Acción de contacto completada exitosamente.',
        data: responseData.data || responseData,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error en API Route (toggle-contact):', error);
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
        message:
          'Error interno del servidor al procesar la solicitud de contacto.',
      },
      { status: 500 },
    );
  }
}
