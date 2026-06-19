import { NextRequest, NextResponse } from 'next/server';
import { databaseComnnect } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await databaseComnnect.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, password]
    );

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('ER_DUP_ENTRY')) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
