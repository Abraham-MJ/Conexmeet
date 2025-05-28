interface RtmTokenResponse {
  rtmToken: string;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const uid: string | null = searchParams.get('uid');

  if (!uid) {
    return new Response(JSON.stringify({ error: 'UID es requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const responseFromAgoraService: Response = await fetch(
      `https://agora-tokens-lr9i.onrender.com/rtm/${uid}`,
    );

    if (!responseFromAgoraService.ok) {
      const errorData = await responseFromAgoraService.text();
      console.error(
        `Error desde el servicio de Agora: ${responseFromAgoraService.status}`,
        errorData,
      );
      return new Response(
        JSON.stringify({
          error: `Error del servicio de tokens: ${responseFromAgoraService.status}`,
        }),
        {
          status: responseFromAgoraService.status,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const data: RtmTokenResponse = await responseFromAgoraService.json();

    return new Response(JSON.stringify({ rtmToken: data.rtmToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error interno al intentar obtener token RTM:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno al obtener token RTM' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
