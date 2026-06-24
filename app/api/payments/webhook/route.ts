import { NextRequest, NextResponse } from 'next/server';

import {
  type PaymentWebhookEventPayload,
  processPaymentWebhookEvent,
  verifyPaymentWebhookSignature,
} from '@/lib/server/payments';

function isValidEventPayload(value: unknown): value is PaymentWebhookEventPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Record<string, unknown>;
  const status = payload.status;
  return (
    typeof payload.eventId === 'string' &&
    typeof payload.transactionId === 'string' &&
    Number.isInteger(payload.bookingId) &&
    typeof payload.amount === 'number' &&
    Number.isFinite(payload.amount) &&
    (status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELED')
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-payment-signature');
    const validSignature = verifyPaymentWebhookSignature(rawBody, signature);
    if (!validSignature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const parsed: unknown = JSON.parse(rawBody);
    if (!isValidEventPayload(parsed)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    try {
      const result = await processPaymentWebhookEvent(parsed);
      return NextResponse.json(
        {
          message: 'Webhook processed',
          transactionId: result.transactionId,
          status: result.status,
          bookingStatus: result.bookingStatus,
        },
        { status: 200 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed';
      if (message === 'BOOKING_NOT_FOUND') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (message.includes('missing required columns')) {
        return NextResponse.json(
          { error: message, code: 'PAYMENTS_MIGRATION_REQUIRED' },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
