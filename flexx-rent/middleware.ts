import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_PAGES = ['/login', '/register'];
const PROTECTED_PAGES = ['/dashboard'];

async function isAuthenticated(token?: string): Promise<boolean> {
  if (!token || !process.env.JWT_SECRET) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const authenticated = await isAuthenticated(token);
  const { pathname } = request.nextUrl;

  if (AUTH_PAGES.includes(pathname) && authenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isProtectedPath = PROTECTED_PAGES.some((path) => pathname.startsWith(path));
  if (isProtectedPath && !authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/dashboard/:path*'],
};