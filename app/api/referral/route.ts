// app/api/my-referrals/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ExternalReferralItem {
  id: number;
  name: string;
  created_at: string;
}

interface ExternalReferralsApiResponse {
  status: string;
  message: string;
  data: ExternalReferralItem[];
}

interface ApiRouteResponse {
  status: string;
  message: string;
  data: ExternalReferralItem[];
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

    const referralsApiUrl = 'https://app.conexmeet.live/api/v1/mis-referidos';

    const response = await fetch(referralsApiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `Error fetching referrals. Status: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status },
      );
    }

    const externalReferralsResult: ExternalReferralsApiResponse =
      await response.json();

    if (
      externalReferralsResult.status !== 'Success' ||
      !Array.isArray(externalReferralsResult.data)
    ) {
      console.error(
        'Unexpected format from referrals API or no data array:',
        externalReferralsResult,
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Unexpected format from referrals service or no data array.',
        },
        { status: 502 },
      );
    }

    const apiResponse: ApiRouteResponse = {
      status: externalReferralsResult.status,
      message: externalReferralsResult.message,
      data: externalReferralsResult.data,
    };

    return NextResponse.json(apiResponse, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/my-referrals route:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error parsing JSON response from the referrals service.',
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error processing your request for referrals.',
      },
      { status: 500 },
    );
  }
}
