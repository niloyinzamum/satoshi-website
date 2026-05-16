import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/manager')) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/manager/login') {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.redirect(new URL('/manager/login', request.url));
    }

    try {
      await decrypt(session);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/manager/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/manager/:path*'],
};
