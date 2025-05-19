import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authToken = request.cookies.get('auth_token')?.value;

    const { chat_id, message_ids } = body;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado. Token no encontrado.' },
        { status: 401 },
      );
    }

    if (!chat_id) {
      return NextResponse.json(
        { success: false, message: 'El chat_id (ID de la sala) es requerido.' },
        { status: 400 },
      );
    }

    if (
      !message_ids ||
      !Array.isArray(message_ids) ||
      message_ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Se requiere un array no vacío de message_ids.',
        },
        { status: 400 },
      );
    }

    const latestMessageId = message_ids.reduce(
      (max, currentId) => Math.max(max, Number(currentId)),
      0,
    );

    if (latestMessageId === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No se pudo determinar un message_id válido del array proporcionado.',
        },
        { status: 400 },
      );
    }

    const formdata = new FormData();
    formdata.append('message_id', String(latestMessageId));

    const externalApiResponse = await fetch(
      `https://app.conexmeet.live/api/v1/read-message/${chat_id}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: formdata,
      },
    );

    const responseData = await externalApiResponse.json();

    if (!externalApiResponse.ok || responseData.status !== 'Success') {
      return NextResponse.json(
        {
          success: false,
          message:
            responseData.message ||
            'Error al marcar mensajes como leídos en el servicio externo.',
          details: responseData,
        },
        { status: externalApiResponse.status || 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          responseData.message || 'Mensajes marcados como leídos exitosamente.',
        data: {
          marked_up_to_message_id: responseData.data,
          requested_latest_message_id: latestMessageId,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error en API Route (mark-messages-read):', error);
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
          'Error interno del servidor al procesar la solicitud para marcar mensajes como leídos.',
      },
      { status: 500 },
    );
  }
}
