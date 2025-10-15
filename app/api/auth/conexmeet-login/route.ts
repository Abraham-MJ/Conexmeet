import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No hay sesión activa de Google' },
        { status: 401 },
      );
    }

    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    
    const formdata = new FormData();
    formdata.append("email", session.user.email);
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
    };

    const response = await fetch("https://app.conexmeet.live/api/v1/login-otp", requestOptions);
    const result = await response.json();

    if (result.status === "Success" && result.data?.access_token) {
      const nextResponse = NextResponse.json(
        { 
          success: true, 
          message: result.message,
          user: result.data.user
        },
        { status: 200 }
      );

      nextResponse.cookies.set('auth_token', result.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, 
        path: '/'
      });

      return nextResponse;
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Error en la autenticación con ConexMeet' },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('[API conexmeet-login] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}