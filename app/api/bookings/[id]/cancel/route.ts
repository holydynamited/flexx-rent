import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { verifyToken } from '@/utils/jwt';
import type { BookingStatus } from '@/lib/types';

interface ProfileRow extends RowDataPacket {
  id: number;
}

interface BookingRow extends RowDataPacket {
  id: number;
  status: BookingStatus;
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

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const profileIdOrResponse = await getUserProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }
    const profileId = profileIdOrResponse;

    const bookingId = Number(context.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
    }

    const [rows] = await databaseConnect.execute<BookingRow[]>(
      `
        SELECT id, status
        FROM bookings
        WHERE id = ? AND client_profile_id = ?
        LIMIT 1
      `,
      [bookingId, profileId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = rows[0];
    if (booking.status !== 'NEW' && booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only NEW or PENDING bookings can be cancelled' }, { status: 409 });
    }

    await databaseConnect.execute<ResultSetHeader>(
      `
        UPDATE bookings
        SET status = 'CANCELLED'
        WHERE id = ? AND client_profile_id = ?
      `,
      [bookingId, profileId]
    );

    return NextResponse.json(
      {
        message: 'Booking cancelled',
        booking: {
          id: bookingId,
          status: 'CANCELLED',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
