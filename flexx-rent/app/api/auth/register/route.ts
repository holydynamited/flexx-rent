import { NextRequest, NextResponse } from 'next/server';
import { databaseComnnect } from '@/lib/db';
import { hashPassword } from '@/utils/password';
import { generateToken } from '@/utils/jwt';

import { RowDataPacket, ResultSetHeader } from 'mysql2'; 

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Check for required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const [existingUsers] = await databaseComnnect.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash the provided password
    const hashedPassword = await hashPassword(password);

    // Insert new user with hashed password, role defaults to 'CLIENT' in DB
    const [result] = await databaseComnnect.execute<ResultSetHeader>(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hashedPassword]
    );

    // Get new user's ID
    const newUserId = result.insertId;
    
    // Default role as set in the database
    const assignedRole = 'CLIENT';

    // Generate JWT for new user
    const token = await generateToken({
      userId: newUserId,
      email: email,
      role: assignedRole // Provide assigned role in token
    });

    // Respond with registration success and set session token cookie
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