import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json(
    { success: true, message: 'Logout exitoso' },
    { status: 200 },
  );

  const cookiesToClear = [
    'auth_token', 
    'session', 
    'refresh_token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token'
  ];

  cookiesToClear.forEach((cookie) => {
    response.cookies.set(cookie, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return response;
}
