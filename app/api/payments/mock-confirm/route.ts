import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireApiProfile } from '@/lib/server/apiAuth';
import {
  createEventId,
  processPaymentWebhookEvent,
  signPaymentWebhookPayload,
  type PaymentWebhookEventPayload,
} from '@/lib/server/payments';

interface MockConfirmBody {
  transactionId?: unknown;
}

interface PaymentOwnershipRow extends RowDataPacket {
  booking_id: number;
  amount: string;
  transaction_id: string;
  client_profile_id: number;
}

export async function POST(request: NextRequest) {
  try {
    const authProfileOrResponse = await requireApiProfile(request);
    if (authProfileOrResponse instanceof NextResponse) {
      return authProfileOrResponse;
    }
    const profileId = authProfileOrResponse.profileId;

    const body = (await request.json()) as MockConfirmBody;
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim() : '';
    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    const [rows] = await databaseConnect.execute<PaymentOwnershipRow[]>(
      `
        SELECT
          pay.booking_id,
          pay.amount,
          pay.transaction_id,
          b.client_profile_id
        FROM payments pay
        JOIN bookings b ON b.id = pay.booking_id
        WHERE pay.transaction_id = ?
        LIMIT 1
      `,
      [transactionId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    }

    const row = rows[0];
    if (row.client_profile_id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event: PaymentWebhookEventPayload = {
      eventId: createEventId(),
      transactionId: row.transaction_id,
      bookingId: row.booking_id,
      amount: Number(row.amount) || 0,
      status: 'SUCCESS',
      paidAt: new Date().toISOString(),
    };

    const rawPayload = JSON.stringify(event);
    const signature = signPaymentWebhookPayload(rawPayload);
    const result = await processPaymentWebhookEvent(event);

    return NextResponse.json(
      {
        message: 'Mock payment confirmed',
        mode: 'sandbox',
        webhookSignature: signature,
        transactionId: result.transactionId,
        bookingStatus: result.bookingStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm payment';
    if (message === 'BOOKING_NOT_FOUND') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (message.includes('missing required columns')) {
      return NextResponse.json(
        { error: message, code: 'PAYMENTS_MIGRATION_REQUIRED' },
        { status: 503 }
      );
    }
    console.error('Error confirming mock payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
