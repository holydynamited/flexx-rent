import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId));
    requestHeaders.set('x-user-email', String(payload.email));
    requestHeaders.set('x-user-role', String(payload.role));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
}

export const config = {
  matcher: [
    '/api/((?!auth/login|auth/register).*)', 
  ],
};