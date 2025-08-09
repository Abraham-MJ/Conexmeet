import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let body;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = JSON.parse(text);
    }

    const { user_id, channel_name, room_id, role, reason } = body;

    const authToken = request.cookies.get('auth_token')?.value;

    const { backend_action } = body;

    if (backend_action === 'close_channel_finished' && role === 'female') {
      const formData = new FormData();
      formData.append('status', 'finished');
      formData.append('host_id', channel_name);

      const externalHeaders: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      const externalApiResponse = await fetch(
        'https://app.conexmeet.live/api/v1/status-room',
        {
          method: 'POST',
          headers: externalHeaders,
          body: formData,
        },
      );

      const responseDataFromExternalApi = await externalApiResponse.json();
      return responseDataFromExternalApi;
    } else if (
      backend_action === 'close_channel_waiting_and_male' &&
      role === 'male'
    ) {
      try {
        const formdata = new FormData();
        formdata.append('user_id', String(user_id));
        formdata.append('host_id', String(channel_name));
        formdata.append('id', String(room_id));

        const externalHeaderS: Record<string, string> = {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        };

        const closeMaleResponse = await fetch(
          'https://app.conexmeet.live/api/v1/closed-room',
          {
            method: 'POST',
            headers: externalHeaderS,
            body: formdata,
          },
        );

        const closeMaleData = await closeMaleResponse.json();

        const formData = new FormData();
        formData.append('status', 'waiting');
        formData.append('host_id', channel_name);

        const externalHeaders: Record<string, string> = {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        };

        const changeStatusResponse = await fetch(
          'https://app.conexmeet.live/api/v1/status-room',
          {
            method: 'POST',
            headers: externalHeaders,
            body: formData,
          },
        );

        const changeStatusData = await changeStatusResponse.json();

        return NextResponse.json({
          success: true,
          message: 'Male desconectado - canal cambiado a waiting exitosamente',
          details: {
            close_male_result: closeMaleData,
            change_status_result: changeStatusData,
            backend_action: backend_action,
            role: role,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error(
          '[Emergency Cleanup] ❌ Error en limpieza directa para male:',
          error,
        );

        return NextResponse.json(
          {
            success: false,
            message: 'Error en limpieza directa para male',
            error: error instanceof Error ? error.message : 'Unknown error',
            backend_action: backend_action,
            role: role,
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Acción de backend no reconocida: ${backend_action}`,
          details: {
            backend_action: backend_action,
            role: role,
            reason: reason,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error(
      '[Emergency Cleanup] Error en limpieza de emergencia:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Error interno durante la limpieza de emergencia',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Emergency cleanup endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
