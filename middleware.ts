import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;

  const protectedRoutes = ["/main/dashboard"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/main/auth/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/main/dashboard/:path*"],
};
