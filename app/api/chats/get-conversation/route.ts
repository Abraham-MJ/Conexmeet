import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'them';
  time: string;
  read?: boolean;
  translate?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authToken = request.cookies.get('auth_token')?.value;

    const { room_id, current_sender_id } = body;

    if (!room_id) {
      return NextResponse.json(
        { success: false, message: 'room_id es requerido.' },
        { status: 400 },
      );
    }

    if (current_sender_id === undefined || current_sender_id === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            'current_sender_id es requerido en el cuerpo de la solicitud para determinar el remitente del mensaje.',
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://app.conexmeet.live/api/v1/chat-sala/${room_id}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    const externalApiResponse = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            externalApiResponse.message ||
            'Error al obtener la conversación desde el servicio externo.',
        },
        { status: response.status },
      );
    }

    if (!externalApiResponse.data || !Array.isArray(externalApiResponse.data)) {
      console.error(
        'Respuesta inesperada de la API externa. Falta el array de datos:',
        externalApiResponse,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de respuesta inesperado del servicio de chat.',
        },
        { status: 500 },
      );
    }

    const transformedMessages: Message[] = externalApiResponse.data.map(
      (msg: any) => {
        const messageDate = new Date(msg.created_at);
        const formattedTime = `${String(messageDate.getHours()).padStart(2, '0')}:${String(messageDate.getMinutes()).padStart(2, '0')}`;

        const senderType =
          msg.sender_id === Number(current_sender_id) ? 'me' : 'them';

        const messageObject: Message = {
          id: msg.id,
          text: msg.body,
          sender: senderType,
          time: formattedTime,
          translate: msg.body_traslate || '',
        };

        if (senderType === 'me') {
          messageObject.read =
            msg.read_at !== null && msg.read_at !== undefined;
        }

        return messageObject;
      },
    );

    const finalResponseData = {
      status: externalApiResponse.status,
      message: externalApiResponse.message,
      data: transformedMessages,
    };

    return NextResponse.json(
      { success: true, data: finalResponseData },
      { status: 200 },
    );
  } catch (error: any) {
    if (
      error.message.toLowerCase().includes('unexpected token') ||
      error.message.toLowerCase().includes('invalid json')
    ) {
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
          'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.',
      },
      { status: 500 },
    );
  }
}
