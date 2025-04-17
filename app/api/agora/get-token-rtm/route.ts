interface GetRequest {
  url: string;
}

interface RtmTokenResponse {
  rtmToken: string;
}

export async function GET(request: GetRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const uid: string | null = searchParams.get('uid');

  if (!uid) {
    return new Response(JSON.stringify({ error: 'UID es requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response: Response = await fetch(
      `https://agora-tokens-lr9i.onrender.com/rtm/${uid}`,
    );
    const data: RtmTokenResponse = await response.json();

    return new Response(JSON.stringify({ rtmToken: data.rtmToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error al obtener token RTM' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
