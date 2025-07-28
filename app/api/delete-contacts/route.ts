import { NextRequest, NextResponse } from 'next/server';

interface DeleteContactRequestBody {
  user_id: number | string;
}

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteContactRequestBody = await request.json();
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

    const externalApiUrl = `https://app.conexmeet.live/api/v1/contacts/${user_id}`;

    const formdata = new FormData();

    const externalApiResponse = await fetch(externalApiUrl, {
      method: 'DELETE',
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
            'Error al eliminar contacto en el servicio externo.',
          details: responseData,
        },
        { status: externalApiResponse.status || 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          responseData.message || 'Contacto eliminado exitosamente.',
        data: responseData.data || responseData,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error en API Route (delete-contact):', error);
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
          'Error interno del servidor al procesar la solicitud de eliminación de contacto.',
      },
      { status: 500 },
    );
  }
}