import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireApiProfile } from '@/lib/server/apiAuth';
import type { UserRole, VerificationStatus } from '@/lib/types';

interface PropertyRow extends RowDataPacket {
  id: number;
}

interface BookingRow extends RowDataPacket {
  id: number;
  status: 'NEW' | 'PENDING_PAYMENT' | 'RESERVED' | 'CANCELLED';
}

interface CreateBookingBody {
  propertyId?: unknown;
}

interface ProfileVerificationRow extends RowDataPacket {
  verification_status: VerificationStatus | null;
}

export async function POST(request: NextRequest) {
  try {
    const authProfileOrResponse = await requireApiProfile(request);
    if (authProfileOrResponse instanceof NextResponse) {
      return authProfileOrResponse;
    }

    const role = authProfileOrResponse.user.role as UserRole;
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Only clients can create bookings' }, { status: 403 });
    }

    const profileId = authProfileOrResponse.profileId;
    const body = (await request.json()) as CreateBookingBody;
    const propertyId = Number(body.propertyId);

    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json({ error: 'Invalid propertyId' }, { status: 400 });
    }

    const [profileRows] = await databaseConnect.execute<ProfileVerificationRow[]>(
      `
        SELECT verification_status
        FROM profiles
        WHERE id = ?
        LIMIT 1
      `,
      [profileId]
    );
    const verificationStatus = profileRows[0]?.verification_status || 'PENDING';
    if (verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Only verified clients can create bookings' },
        { status: 403 }
      );
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
        WHERE client_profile_id = ? AND property_id = ? AND status IN ('NEW', 'PENDING_PAYMENT', 'RESERVED')
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [profileId, propertyId]
    );

    if (existingRows.length) {
      return NextResponse.json(
        {
          message: 'Booking already exists',
          booking: {
            id: existingRows[0].id,
            status: existingRows[0].status,
          },
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
