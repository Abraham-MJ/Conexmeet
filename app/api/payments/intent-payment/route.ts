import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticación no encontrado.' },
        { status: 401 },
      );
    }

    let requestPayload;
    try {
      requestPayload = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cuerpo de la solicitud inválido. Se esperaba JSON.',
        },
        { status: 400 },
      );
    }

    const { package_id } = requestPayload;

    if (!package_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'El campo "package_id" es requerido en el cuerpo de la solicitud.',
        },
        { status: 400 },
      );
    }

    const formdata = new FormData();
    formdata.append('package_id', String(package_id));

    const externalApiResponse = await fetch(
      'https://app.conexmeet.live/api/v1/create-payment',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: formdata,
        redirect: 'follow',
      },
    );

    let externalApiResult;
    const responseContentType = externalApiResponse.headers.get('content-type');

    if (
      responseContentType &&
      responseContentType.includes('application/json')
    ) {
      try {
        externalApiResult = await externalApiResponse.json();
      } catch (e) {
        const textError = await externalApiResponse.text();
        return NextResponse.json(
          {
            success: false,
            message: 'Respuesta JSON inválida del servicio externo.',
            details: textError,
          },
          { status: 502 },
        );
      }
    } else {
      externalApiResult = await externalApiResponse.text();
      if (externalApiResponse.ok) {
        return NextResponse.json(
          { success: true, data: { rawResponse: externalApiResult } },
          { status: externalApiResponse.status },
        );
      }
    }

    if (!externalApiResponse.ok) {
      const errorMessage =
        typeof externalApiResult === 'object' &&
        externalApiResult !== null &&
        'message' in externalApiResult
          ? (externalApiResult as any).message
          : typeof externalApiResult === 'string'
            ? externalApiResult
            : 'Error al crear el pago en el servicio externo.';

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          details:
            typeof externalApiResult === 'object' && externalApiResult !== null
              ? externalApiResult
              : undefined,
        },
        { status: externalApiResponse.status },
      );
    }

    return NextResponse.json(
      { success: true, data: externalApiResult },
      { status: externalApiResponse.status },
    );
  } catch (error: any) {
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cuerpo de la solicitud inválido. Se esperaba JSON.',
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
