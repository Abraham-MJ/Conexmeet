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

interface ExternalUserItem {
  id: number;
  name: string;
  profile_photo_path: string | null;
}

interface ExternalUsersApiResponse {
  status: string;
  message: string;
  data: ExternalUserItem[];
}

export interface AugmentedGifItem extends ExternalGifItem {
  sender_name: string | null;
  sender_profile_photo_path?: string | null;
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

    const gifsApiUrl = 'https://app.conexmeet.live/api/v1/mygif';
    const usersApiUrl =
      'https://app.conexmeet.live/api/v1/list-users?gender=male';

    const commonHeaders = {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    const [gifsResponse, usersResponse] = await Promise.all([
      fetch(gifsApiUrl, { method: 'GET', headers: commonHeaders }),
      fetch(usersApiUrl, { method: 'GET', headers: commonHeaders }),
    ]);

    if (!gifsResponse.ok) {
      let gifsErrorMessage = `Error fetching GIFs. Status: ${gifsResponse.status}`;
      try {
        const errorBody = await gifsResponse.json();
        gifsErrorMessage = errorBody.message || gifsErrorMessage;
      } catch (e) {}
      return NextResponse.json(
        { success: false, message: gifsErrorMessage },
        { status: gifsResponse.status },
      );
    }
    const externalGifsResult: ExternalGifsApiResponse =
      await gifsResponse.json();
    if (
      externalGifsResult.status !== 'Success' ||
      !Array.isArray(externalGifsResult.data)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unexpected format from GIFs API or no data array.',
        },
        { status: 502 },
      );
    }

    if (!usersResponse.ok) {
      let usersErrorMessage = `Error fetching users. Status: ${usersResponse.status}`;
      try {
        const errorBody = await usersResponse.json();
        usersErrorMessage = errorBody.message || usersErrorMessage;
      } catch (e) {}
      return NextResponse.json(
        { success: false, message: usersErrorMessage },
        { status: usersResponse.status },
      );
    }
    const externalUsersResult: ExternalUsersApiResponse =
      await usersResponse.json();
    if (
      externalUsersResult.status !== 'Success' ||
      !Array.isArray(externalUsersResult.data)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unexpected format from Users API or no data array.',
        },
        { status: 502 },
      );
    }

    const usersMap = new Map<number, ExternalUserItem>();
    externalUsersResult.data.forEach((user) => {
      usersMap.set(user.id, user);
    });

    const augmentedGifs: AugmentedGifItem[] = externalGifsResult.data.map(
      (gif) => {
        const sender = usersMap.get(gif.id);
        return {
          ...gif,
          sender_name: sender ? sender.name : 'Unknown User',
          sender_profile_photo_path: sender ? sender.profile_photo_path : null,
        };
      },
    );

    return NextResponse.json(
      {
        status: 'Success',
        message: 'GIFs list with sender information successfully retrieved.',
        data: augmentedGifs,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error in /api/my-gifts route:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error parsing JSON response from an external service.',
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error processing your request for GIFs.',
      },
      { status: 500 },
    );
  }
}
