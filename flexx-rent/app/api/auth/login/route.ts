import { NextRequest, NextResponse } from 'next/server';
import { databaseComnnect } from '@/lib/db';
import { verifyPassword } from '@/utils/password';
import { generateToken } from '@/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const [rows] = await databaseComnnect.execute(
      'SELECT id, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    const users = rows as { id: number; password_hash: string; role: string }[];

    if (users.length === 0 || !(await verifyPassword(password, users[0].password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await generateToken({
      userId: users[0].id,
      email: email,
      role: users[0].role
    });

    const response = NextResponse.json({ 
      message: 'Login successful', 
      role: users[0].role 
    });

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Number(process.env.JWT_EXPIRES_IN) || 7200,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}