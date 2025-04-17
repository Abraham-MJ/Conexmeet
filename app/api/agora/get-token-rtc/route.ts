interface GetTokenRequestParams {
  channel: string | null;
  rol: string | null;
  type: string | null;
  uid: string | null;
}

interface TokenResponse {
  rtcToken: string;
}

interface ErrorResponse {
  error: string;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const params: GetTokenRequestParams = {
    channel: searchParams.get('channel'),
    rol: searchParams.get('rol'),
    type: searchParams.get('type'),
    uid: searchParams.get('uid'),
  };

  if (!params.channel || !params.rol || !params.type || !params.uid) {
    const errorResponse: ErrorResponse = { error: 'Parámetros incompletos' };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(
      `https://agora-tokens-lr9i.onrender.com/rtc/${params.channel}/${params.rol}/${params.type}/${params.uid}`,
    );
    const data: TokenResponse = await response.json();

    return new Response(JSON.stringify({ rtcToken: data.rtcToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: 'Error al obtener token RTC',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
