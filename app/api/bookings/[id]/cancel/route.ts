import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireApiProfile } from '@/lib/server/apiAuth';
import type { BookingStatus } from '@/lib/types';

interface BookingRow extends RowDataPacket {
  id: number;
  status: BookingStatus | 'PENDING';
  property_id: number;
}

interface PaymentStatusRow extends RowDataPacket {
  transaction_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authProfileOrResponse = await requireApiProfile(request);
    if (authProfileOrResponse instanceof NextResponse) {
      return authProfileOrResponse;
    }
    const profileId = authProfileOrResponse.profileId;

    const params = await context.params;
    const bookingId = Number(params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
    }

    const [rows] = await databaseConnect.execute<BookingRow[]>(
      `
        SELECT id, status, property_id
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
    if (booking.status !== 'NEW' && booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only NEW or PENDING_PAYMENT bookings can be cancelled' }, { status: 409 });
    }

    const [paymentRows] = await databaseConnect.execute<PaymentStatusRow[]>(
      `
        SELECT transaction_status
        FROM payments
        WHERE booking_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [bookingId]
    );
    if (paymentRows[0]?.transaction_status === 'SUCCESS') {
      return NextResponse.json(
        { error: 'Paid booking cannot be cancelled' },
        { status: 409 }
      );
    }

    const conn = await databaseConnect.getConnection();
    let transactionStarted = false;
    try {
      await conn.beginTransaction();
      transactionStarted = true;

      await conn.execute<ResultSetHeader>(
        `
          UPDATE bookings
          SET status = 'CANCELLED'
          WHERE id = ? AND client_profile_id = ?
        `,
        [bookingId, profileId]
      );

      if (booking.status === 'PENDING_PAYMENT' || booking.status === 'PENDING') {
        await conn.execute<ResultSetHeader>(
          `
            UPDATE properties p
            SET p.status = 'AVAILABLE'
            WHERE p.id = ?
              AND p.status = 'PENDING_PAYMENT'
              AND NOT EXISTS (
                SELECT 1
                FROM bookings b
                WHERE b.property_id = p.id
                  AND b.status IN ('PENDING_PAYMENT', 'RESERVED')
              )
          `,
          [booking.property_id]
        );
      }

      await conn.commit();
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        await conn.rollback();
      }
      throw error;
    } finally {
      conn.release();
    }

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
