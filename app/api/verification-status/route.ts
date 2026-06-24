import { NextResponse, NextRequest } from "next/server";
import { databaseConnect } from "@/lib/db";
import { requireApiUser } from '@/lib/server/apiAuth';
import { RowDataPacket } from 'mysql2';


interface VerificationRow extends RowDataPacket { verification_status: string }


export async function GET(request:NextRequest) {
    

    try{

        const authUserOrResponse = await requireApiUser(request);
        if (authUserOrResponse instanceof NextResponse) {
            return authUserOrResponse;
        }

        const userId = authUserOrResponse.userId;

        const [rows] = await databaseConnect.execute<VerificationRow[]>(
            'SELECT verification_status FROM profiles WHERE user_id = ?',
            [userId]
          );
          
          if (!rows.length) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
          }
          
          return NextResponse.json(
            { verificationStatus: rows[0].verification_status },
            { status: 200 }
          );




    }

    catch(error){
        console.error('Error getting the verification status:', error);
   
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }


}