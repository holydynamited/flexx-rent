import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getAgentProfileIdOrResponse } from '@/app/api/agent/_lib/auth';
import { databaseConnect } from '@/lib/db';
import type { BookingStatus } from '@/lib/types';

interface BookingOwnershipRow extends RowDataPacket {
  id: number;
  status: BookingStatus | 'PENDING_PAYMENT' | 'RESERVED';
  agent_id: number | null;
  property_agent_id: number | null;
  property_id: number;
  property_status: 'AVAILABLE' | 'PENDING_PAYMENT' | 'RESERVED' | 'ARCHIVED';
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
          p.id AS property_id,
          p.status AS property_status
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

    if (booking.status !== 'NEW') {
      return NextResponse.json({ error: 'Only NEW bookings can be approved' }, { status: 409 });
    }
    if (booking.property_status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Property is not available for hold' },
        { status: 409 }
      );
    }

    const holdMinutesRaw = Number(process.env.BOOKING_HOLD_MINUTES || 120);
    const holdMinutes = Number.isFinite(holdMinutesRaw) && holdMinutesRaw > 0 ? holdMinutesRaw : 120;
    const conn = await databaseConnect.getConnection();
    let transactionStarted = false;
    try {
      await conn.beginTransaction();
      transactionStarted = true;

      await conn.execute<ResultSetHeader>(
        `
          UPDATE bookings
          SET
            status = 'PENDING_PAYMENT',
            expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
            agent_id = COALESCE(agent_id, ?)
          WHERE id = ?
            AND status = 'NEW'
        `,
        [holdMinutes, agentProfileId, bookingId]
      );

      await conn.execute<ResultSetHeader>(
        `
          UPDATE properties
          SET status = 'PENDING_PAYMENT'
          WHERE id = ?
            AND status = 'AVAILABLE'
        `,
        [booking.property_id]
      );

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
        message: 'Booking approved. Waiting for payment.',
        booking: {
          id: bookingId,
          status: 'PENDING_PAYMENT',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error approving booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
