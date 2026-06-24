import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getAgentProfileIdOrResponse } from '@/app/api/agent/_lib/auth';
import { databaseConnect } from '@/lib/db';
import type { BookingStatus } from '@/lib/types';

interface BookingOwnershipRow extends RowDataPacket {
  id: number;
  status: BookingStatus | 'PENDING';
  agent_id: number | null;
  property_agent_id: number | null;
  property_id: number;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profileIdOrResponse = await getAgentProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }
    const agentProfileId = profileIdOrResponse;

    const params = await context.params;
    const bookingId = Number(params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
    }

    const [rows] = await databaseConnect.execute<BookingOwnershipRow[]>(
      `
        SELECT
          b.id,
          b.status,
          b.agent_id,
          p.agent_id AS property_agent_id,
          p.id AS property_id
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = rows[0];
    if (
      booking.property_agent_id !== agentProfileId ||
      (booking.agent_id !== null && booking.agent_id !== agentProfileId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'NEW' && booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only NEW or PENDING_PAYMENT bookings can be cancelled' },
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
          WHERE id = ?
        `,
        [bookingId]
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
    console.error('Error cancelling booking by agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
