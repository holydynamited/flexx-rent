import { NextResponse, NextRequest } from "next/server";
import { databaseConnect } from "@/lib/db";
import { verifyToken } from '@/utils/jwt';
import { RowDataPacket } from 'mysql2';


interface VerificationRow extends RowDataPacket { verification_status: string }


export async function GET(request:NextRequest) {
    

    try{

        const token = request.cookies.get('session_token')?.value;


        if(!token ){

            return NextResponse.json({error:"Unauthorized"},{status:401})
        }
 
        const payload = await verifyToken(token);

        if(!payload){

            return NextResponse.json({error:"Invalid session"},{status:401})
        }

        const userId = payload.userId;

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