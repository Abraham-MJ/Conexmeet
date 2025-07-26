import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/auth'];
const PROTECTED_ROUTES = ['/main'];
const PASSWORD_RECOVERY_ROUTES = ['/main/auth/password-recovery'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                       request.cookies.get('__Secure-next-auth.session-token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const isPasswordRecoveryRoute = PASSWORD_RECOVERY_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  ) && !isPasswordRecoveryRoute;

  const isAuthRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!token && !nextAuthToken && isAuthRoute) {
    return NextResponse.next();
  }

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  if (isAuthRoute && token && !pathname.includes('/logout') && !pathname.includes('/sign-in') && !pathname.includes('/password-recovery')) {
    return NextResponse.redirect(new URL('/main/video-roulette', request.url));
  }

  if (pathname.startsWith('/auth/password-recovery')) {
    return NextResponse.next();
  }

  if (pathname === '/' && !token) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
