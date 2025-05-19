import { NextRequest, NextResponse } from 'next/server';

interface ContactUserDetail {
  id: number;
  name: string;
  email: string;
  profile_photo_path: string | null;
}

interface ExternalContactItem {
  id: number;
  name: string | null;
  user_id: number;
  contact_id: number;
  created_at: string;
  updated_at: string;
  request_status: string;
  contact_status: string;
  user: ContactUserDetail;
}

interface ExternalContactsApiResponse {
  status: string;
  message: string;
  data: ExternalContactItem[];
}

interface ExternalChatCreationData {
  chat_id: number;
}

interface ExternalChatApiResponse {
  status: string;
  message: string;
  data: ExternalChatCreationData;
}

export interface AugmentedContactItem extends ExternalContactItem {
  chat_id: number | null;
}

interface ApiRouteSuccessResponse {
  success: true;
  status: string;
  message: string;
  data: AugmentedContactItem[];
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

    const commonHeaders = {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    const contactsApiUrl = 'https://app.conexmeet.live/api/v1/my-contacts';
    const contactsResponse = await fetch(contactsApiUrl, {
      method: 'GET',
      headers: commonHeaders,
      cache: 'no-store',
    });

    if (!contactsResponse.ok) {
      let errorMessage = `Error fetching contacts. Status: ${contactsResponse.status}`;

      try {
        const errorBody = await contactsResponse.json();
        errorMessage = errorBody.message || errorMessage;
      } catch (e) {}
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: contactsResponse.status },
      );
    }

    const externalContactsResult: ExternalContactsApiResponse =
      await contactsResponse.json();

    if (
      externalContactsResult.status !== 'Success' ||
      !Array.isArray(externalContactsResult.data)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unexpected format from contacts API or no data array.',
        },
        { status: 502 },
      );
    }

    const augmentedContactsPromises = externalContactsResult.data.map(
      async (contactItem) => {
        let chatId: number | null = null;
        try {
          const chatIdApiUrl = `https://app.conexmeet.live/api/v1/chats/${String(contactItem.contact_id)}`;

          const chatResponse = await fetch(chatIdApiUrl, {
            method: 'POST',
            headers: commonHeaders,
          });

          if (chatResponse.ok) {
            const chatResult: ExternalChatApiResponse =
              await chatResponse.json();

            if (
              chatResult.status === 'Success' &&
              chatResult.data &&
              typeof chatResult.data.chat_id === 'number'
            ) {
              chatId = chatResult.data.chat_id;
            } else {
              console.warn(
                `Could not get chat_id for contact ${contactItem.contact_id}: ${chatResult.message || 'Status not Success or chat_id missing'}`,
              );
            }
          } else {
            console.warn(
              `Failed to fetch chat_id for contact ${contactItem.contact_id}. Status: ${chatResponse.status}`,
            );
          }
        } catch (error) {
          console.error(
            `Error fetching chat_id for contact ${contactItem.contact_id}:`,
            error,
          );
        }
        return {
          ...contactItem,
          chat_id: chatId,
        };
      },
    );

    const augmentedContacts: AugmentedContactItem[] = await Promise.all(
      augmentedContactsPromises,
    );

    const successResponse: ApiRouteSuccessResponse = {
      success: true,
      status: 'Success',
      message: 'Contacts with chat_id retrieved successfully.',
      data: augmentedContacts,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/my-contacts-with-chatid route:', error);
    if (
      error instanceof SyntaxError &&
      error.message.toLowerCase().includes('json')
    ) {
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
        message: 'Internal server error processing your request for contacts.',
      },
      { status: 500 },
    );
  }
}
