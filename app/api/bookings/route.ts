import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { verifyToken } from '@/utils/jwt';

interface ProfileRow extends RowDataPacket {
  id: number;
}

interface PropertyRow extends RowDataPacket {
  id: number;
}

interface BookingRow extends RowDataPacket {
  id: number;
  status: 'NEW' | 'PENDING' | 'CANCELLED';
}

interface CreateBookingBody {
  propertyId?: unknown;
}

async function getUserProfileIdOrResponse(request: NextRequest): Promise<number | NextResponse> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const [profiles] = await databaseConnect.execute<ProfileRow[]>(
    'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
    [payload.userId]
  );

  if (!profiles.length) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return profiles[0].id;
}

export async function POST(request: NextRequest) {
  try {
    const profileIdOrResponse = await getUserProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }

    const profileId = profileIdOrResponse;
    const body = (await request.json()) as CreateBookingBody;
    const propertyId = Number(body.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json({ error: 'Invalid propertyId' }, { status: 400 });
    }

    const [propertyRows] = await databaseConnect.execute<PropertyRow[]>(
      `
        SELECT id
        FROM properties
        WHERE id = ? AND status = 'AVAILABLE'
        LIMIT 1
      `,
      [propertyId]
    );

    if (!propertyRows.length) {
      return NextResponse.json({ error: 'Property is not available for booking' }, { status: 409 });
    }

    const [existingRows] = await databaseConnect.execute<BookingRow[]>(
      `
        SELECT id, status
        FROM bookings
        WHERE client_profile_id = ? AND property_id = ? AND status IN ('NEW', 'PENDING')
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [profileId, propertyId]
    );

    if (existingRows.length) {
      return NextResponse.json(
        {
          message: 'Booking already exists',
          booking: { id: existingRows[0].id, status: existingRows[0].status },
        },
        { status: 200 }
      );
    }

    const [result] = await databaseConnect.execute<ResultSetHeader>(
      `
        INSERT INTO bookings (
          client_profile_id,
          property_id,
          agent_id,
          status,
          created_at,
          expires_at
        )
        VALUES (?, ?, NULL, 'NEW', NOW(), DATE_ADD(NOW(), INTERVAL 48 HOUR))
      `,
      [profileId, propertyId]
    );

    return NextResponse.json(
      {
        message: 'Booking request created',
        booking: {
          id: result.insertId,
          status: 'NEW',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
