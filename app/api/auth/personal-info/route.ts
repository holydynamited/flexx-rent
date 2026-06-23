import { NextRequest, NextResponse } from 'next/server';
import { databaseConnect } from '@/lib/db'; 
import { verifyToken } from '@/utils/jwt';
import { RowDataPacket } from 'mysql2';


export async function PATCH(request:NextRequest){
    try{
        const token = request.cookies.get('session_token')?.value;
        

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
          const payload = await verifyToken(token);
          
          if (!payload) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
          }

          const userId = payload.userId;

        const {first_name, last_name, phone_number} = await request.json();

          if(!first_name.trim() || !last_name.trim() || !phone_number.trim()) {
            return NextResponse.json({ error: 'First name, last name and phone number are required' }, { status: 400 });
          }

        const [existingUser] = await databaseConnect.execute<RowDataPacket[]>(
            'SELECT id FROM users WHERE id = ?',
            [userId]
          );

          if (existingUser.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          await databaseConnect.execute(
            'UPDATE users SET first_name = ?, last_name = ?, phone_number = ? WHERE id = ?',
            [first_name, last_name, phone_number, userId]
          );

          return NextResponse.json({ message: 'Personal info updated successfully' }, { status: 200 });
      

    }
        catch(error){
        console.error('Error updating personal info:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }


}                           