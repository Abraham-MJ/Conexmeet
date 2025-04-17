import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json(
    { success: true, message: 'Logout exitoso' },
    { status: 200 },
  );

  ['auth_token', 'session', 'refresh_token'].forEach((cookie) => {
    response.cookies.set(cookie, '', {
      expires: new Date(0),
      path: '/',
    });
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}
