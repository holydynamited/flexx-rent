import { NextRequest, NextResponse } from 'next/server';
import { databaseConnect } from '@/lib/db'; 
import { requireApiUser } from '@/lib/server/apiAuth';
import { RowDataPacket } from 'mysql2';


export async function PATCH(request:NextRequest){
    try{
          const authUserOrResponse = await requireApiUser(request);
          if (authUserOrResponse instanceof NextResponse) {
            return authUserOrResponse;
          }

          const userId = authUserOrResponse.userId;

        const {first_name, last_name, phone} = await request.json();

        if (
          typeof first_name !== 'string' ||
          typeof last_name !== 'string' ||
          typeof phone !== 'string'
        ) { return NextResponse.json({ error: 'Invalid data type' }, { status: 400 }); }

          if(!first_name.trim() || !last_name.trim() || !phone.trim()) {
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
            'UPDATE profiles SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?',
            [first_name, last_name, phone, userId]
          );

          return NextResponse.json({ message: 'Personal info updated successfully' }, { status: 200 });
      

    }
        catch(error){
        console.error('Error updating personal info:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }


}                           