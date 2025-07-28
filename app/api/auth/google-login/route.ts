import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';

interface ConexMeetLoginResponseData {
  access_token: string;
  access_type: string;
  user: any;
}

interface ConexMeetLoginResponse {
  status: string;
  message: string;
  data: ConexMeetLoginResponseData;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: 'Usuario no autenticado con Google.' },
      { status: 401 },
    );
  }

  const userEmail = session.user.email;

  try {
    const conexMeetLoginUrl = 'https://app.conexmeet.live/api/v1/login-otp';
    const apiHeaders = new Headers();
    apiHeaders.append('Accept', 'application/json');

    const formdata = new FormData();
    formdata.append('email', userEmail);

    const requestOptions = {
      method: 'POST',
      headers: apiHeaders,
      body: formdata,
    };

    const conexMeetResponse = await fetch(conexMeetLoginUrl, requestOptions);
    const responseBody: ConexMeetLoginResponse = await conexMeetResponse.json();

    if (
      !conexMeetResponse.ok ||
      responseBody.status !== 'Success' ||
      !responseBody.data?.access_token
    ) {
      console.error(
        'Error en login con ConexMeet:',
        responseBody.message || 'Respuesta no exitosa de la API',
      );
      return NextResponse.json(
        {
          success: false,
          message: responseBody.message || 'Error al autenticar con ConexMeet.',
        },
        { status: conexMeetResponse.status },
      );
    }

    const conexMeetAccessToken = responseBody.data.access_token;

    (await cookies()).set('auth_token', conexMeetAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message:
        'Autenticación con ConexMeet exitosa y token guardado en cookie.',
      userData: responseBody.data.user,
    });
  } catch (error: any) {
    console.error('Error en /api/auth/login-conexmeet:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor.',
        errorDetails: error.message,
      },
      { status: 500 },
    );
  }
}
