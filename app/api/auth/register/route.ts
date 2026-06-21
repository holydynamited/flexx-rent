import { NextRequest, NextResponse } from 'next/server';
import { databaseConnect } from '@/lib/db'; 
import { hashPassword } from '@/utils/password';
import { generateToken } from '@/utils/jwt';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const [existingUsers] = await databaseConnect.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await databaseConnect.execute<ResultSetHeader>(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hashedPassword]
    );

    const newUserId = result.insertId;
    const assignedRole = 'CLIENT';

    const token = await generateToken({
      userId: newUserId,
      email: email,
      role: assignedRole
    });

    const response = NextResponse.json({ 
      message: 'Registration successful', 
      role: assignedRole 
    }, { status: 201 });

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Number(process.env.JWT_EXPIRES_IN) || 7200,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}