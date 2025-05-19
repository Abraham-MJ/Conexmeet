import { ChatUserExternal, ProcessedChatData } from '@/app/types/chat';
import { NextRequest, NextResponse } from 'next/server';

interface ChatRoomExternal {
  id: number;
  sender_id: number;
  receiver_id: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  receiver: ChatUserExternal;
  sender: ChatUserExternal;
  unread_messages_count: number;
}

interface ApiExternalChatListResponse {
  status: string;
  message: string;
  data?: ChatRoomExternal[];
}

function formatLastActivity(dateString: string): string {
  const activityDate = new Date(dateString);
  const now = new Date();

  const activityYear = activityDate.getFullYear();
  const activityMonth = activityDate.getMonth();
  const activityDay = activityDate.getDate();

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const hours = activityDate.getHours().toString().padStart(2, '0');
  const minutes = activityDate.getMinutes().toString().padStart(2, '0');
  const timeFormat = `${hours}:${minutes}`;

  if (
    activityYear === currentYear &&
    activityMonth === currentMonth &&
    activityDay === currentDay
  ) {
    return timeFormat;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayYear = yesterday.getFullYear();
  const yesterdayMonth = yesterday.getMonth();
  const yesterdayDay = yesterday.getDate();

  if (
    activityYear === yesterdayYear &&
    activityMonth === yesterdayMonth &&
    activityDay === yesterdayDay
  ) {
    return 'Ayer';
  }
  return activityDate.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
  });
}

export async function GET(request: NextRequest) {
  try {
    const userIdParam = request.nextUrl.searchParams.get('userId');

    if (!userIdParam) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bad Request - userId parameter is missing.',
        },
        { status: 400 },
      );
    }

    const currentUserId = parseInt(userIdParam, 10);
    if (isNaN(currentUserId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bad Request - userId parameter is not a valid number.',
        },
        { status: 400 },
      );
    }

    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - Authentication token not found in cookies.',
        },
        { status: 401 },
      );
    }

    const baseUrl = 'https://app.conexmeet.live/api/v1';
    const endpoint = `${baseUrl}/chats`;

    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${authToken}`);

    const externalApiResponse = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    let responseDataFromExternalApi: ApiExternalChatListResponse;
    try {
      responseDataFromExternalApi = await externalApiResponse.json();
    } catch (e) {
      if (!externalApiResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `Error from external chat API: ${externalApiResponse.statusText || 'Invalid response'}`,
            errorDetails: { statusCode: externalApiResponse.status },
          },
          { status: externalApiResponse.status },
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to parse response from external chat API as JSON.',
        },
        { status: 502 },
      );
    }

    if (!externalApiResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromExternalApi.message ||
            'External chat API returned an error.',
          errorDetails: responseDataFromExternalApi,
        },
        { status: externalApiResponse.status },
      );
    }

    if (responseDataFromExternalApi.status !== 'Success') {
      return NextResponse.json(
        {
          success: false,
          message:
            responseDataFromExternalApi.message ||
            'External chat API indicated an issue despite a 2xx HTTP status.',
          errorDetails: responseDataFromExternalApi,
        },
        { status: 200 },
      );
    }

    const chatRoomsData = responseDataFromExternalApi.data || [];

    chatRoomsData.sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return dateB - dateA;
    });

    const processedChats: ProcessedChatData[] = chatRoomsData
      .map((chatRoom: ChatRoomExternal) => {
        let otherUserInfo: ChatUserExternal;

        if (chatRoom.sender_id === currentUserId) {
          otherUserInfo = chatRoom.receiver;
        } else if (chatRoom.receiver_id === currentUserId) {
          otherUserInfo = chatRoom.sender;
        } else {
          console.warn(
            `Chat room ID ${chatRoom.id} does not seem to involve current user ID ${currentUserId}. Sender: ${chatRoom.sender_id}, Receiver: ${chatRoom.receiver_id}. Skipping.`,
          );
          return null;
        }

        if (!otherUserInfo || !otherUserInfo.id) {
          console.warn(
            `Missing other user info for chat room ID ${chatRoom.id}. Skipping.`,
          );
          return null;
        }

        return {
          chat_id: chatRoom.id,
          user_info: {
            id: otherUserInfo.id,
            name: otherUserInfo.name,
            email: otherUserInfo.email,
            profile_photo_path: otherUserInfo.profile_photo_path,
          },
          unread_messages_count: chatRoom.unread_messages_count,
          last_activity_at: formatLastActivity(chatRoom.updated_at),
        };
      })
      .filter((chat): chat is ProcessedChatData => chat !== null);

    return NextResponse.json(
      {
        success: true,
        message:
          responseDataFromExternalApi.message ||
          'Chat list retrieved successfully.',
        data: processedChats,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in /api/chats GET handler:', error);
    let errorMessage =
      'An internal server error occurred while fetching chats.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 },
    );
  }
}
