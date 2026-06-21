import { NextRequest, NextResponse } from 'next/server';

import { databaseConnect } from '@/lib/db'; 
import { verifyPassword } from '@/utils/password';
import { generateToken } from '@/utils/jwt';

import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  password_hash: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, password } = body;
    
    const cleanEmail = email.trim();


    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }


    const [users] = await databaseConnect.execute<UserRow[]>(
      'SELECT id, password_hash, role FROM users WHERE email = ?',
      [cleanEmail]
    );

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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}