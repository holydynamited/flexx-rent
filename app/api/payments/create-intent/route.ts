import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireApiProfile } from '@/lib/server/apiAuth';
import { expireOverdueBookings } from '@/lib/server/bookings';
import {
  createTransactionId,
  ensurePaymentsColumnsOrThrow,
} from '@/lib/server/payments';

interface CreateIntentBody {
  bookingId?: unknown;
}

interface BookingOwnerRow extends RowDataPacket {
  id: number;
  status: 'NEW' | 'PENDING' | 'PENDING_PAYMENT' | 'RESERVED' | 'CANCELLED';
  client_profile_id: number;
  base_rent: string;
  utility_costs: string;
  deposit_amount: string;
}

interface ExistingPaymentRow extends RowDataPacket {
  id: number;
  transaction_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  transaction_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const authProfileOrResponse = await requireApiProfile(request);
    if (authProfileOrResponse instanceof NextResponse) {
      return authProfileOrResponse;
    }
    const profileId = authProfileOrResponse.profileId;
    await expireOverdueBookings();

    try {
      await ensurePaymentsColumnsOrThrow();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'payments table is not ready. Apply migrations first.',
          code: 'PAYMENTS_MIGRATION_REQUIRED',
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as CreateIntentBody;
    const bookingId = Number(body.bookingId);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Invalid bookingId' }, { status: 400 });
    }

    const [bookingRows] = await databaseConnect.execute<BookingOwnerRow[]>(
      `
        SELECT
          b.id,
          b.status,
          b.client_profile_id,
          p.base_rent,
          p.utility_costs,
          p.deposit_amount
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    if (!bookingRows.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingRows[0];
    if (booking.client_profile_id !== profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.status === 'NEW') {
      return NextResponse.json(
        { error: 'Booking must be approved by agent before payment' },
        { status: 409 }
      );
    }
    if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking is not payable' }, { status: 409 });
    }

    const [existingPayments] = await databaseConnect.execute<ExistingPaymentRow[]>(
      `
        SELECT id, transaction_status, transaction_id
        FROM payments
        WHERE booking_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [bookingId]
    );

    const latestPayment = existingPayments[0];
    if (latestPayment?.transaction_status === 'SUCCESS') {
      return NextResponse.json(
        {
          message: 'Booking already paid',
          alreadyPaid: true,
          transactionId: latestPayment.transaction_id,
        },
        { status: 200 }
      );
    }

    const baseRent = Number(booking.base_rent) || 0;
    const utilityCosts = Number(booking.utility_costs) || 0;
    const depositAmount = Number(booking.deposit_amount) || 0;
    const amount = Number((baseRent + utilityCosts + depositAmount).toFixed(2));

    const transactionId = createTransactionId();
    await databaseConnect.execute(
      `
        INSERT INTO payments (
          booking_id,
          amount,
          transaction_status,
          transaction_id,
          paid_at
        )
        VALUES (?, ?, 'PENDING', ?, NULL)
      `,
      [bookingId, amount, transactionId]
    );

    return NextResponse.json(
      {
        message: 'Payment intent created',
        bookingId,
        amount,
        currency: 'EUR',
        transactionId,
        checkoutUrl: `/my-bookings?pay=${transactionId}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
