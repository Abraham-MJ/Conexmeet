import { NextRequest, NextResponse } from 'next/server';

interface ExternalGifItem {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number;
  gif_id: number;
  created_at: string;
  updated_at: string;
  gif_name: string;
  points: number;
}

interface ExternalGifsApiResponse {
  status: string;
  message: string;
  data: ExternalGifItem[];
}

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication token not found.' },
        { status: 401 },
      );
    }

    const externalApiUrl = 'https://app.conexmeet.live/api/v1/gifs';

    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    myHeaders.append('Authorization', `Bearer ${authToken}`);

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow' as RequestRedirect,
    };

    const response = await fetch(externalApiUrl, requestOptions);

    if (!response.ok) {
      let errorMessage = `Error fetching GIFs from external API. Status: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorMessage;
      } catch (e) {}
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status },
      );
    }

    const result: ExternalGifsApiResponse = await response.json();

    if (result.status !== 'Success' || !Array.isArray(result.data)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unexpected format from external GIFs API or no data array.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/gifs route:', error);

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error parsing JSON response from external GIF service.',
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while fetching GIFs.',
      },
      { status: 500 },
    );
  }
}
