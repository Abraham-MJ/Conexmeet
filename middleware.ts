import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;

  const publicRoutes = ['/main/auth/sign-in', '/main/auth/sign-up'];
  const protectedRoutes = ['/main/dashboard'];

  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/main/dashboard', req.url));
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/main/auth/sign-in', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/main/dashboard/:path*', '/main/auth/:path*'],
};
