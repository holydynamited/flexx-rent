import crypto from 'crypto';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';

import { databaseConnect } from '@/lib/db';
import { hasColumn } from '@/lib/server/dbSchema';

export type PaymentWebhookStatus = 'SUCCESS' | 'FAILED' | 'CANCELED';

export interface PaymentWebhookEventPayload {
  eventId: string;
  transactionId: string;
  bookingId: number;
  amount: number;
  status: PaymentWebhookStatus;
  paidAt?: string;
}

interface BookingStatusRow extends RowDataPacket {
  property_id: number;
  status: 'NEW' | 'PENDING' | 'PENDING_PAYMENT' | 'RESERVED' | 'CANCELLED';
}

function getPaymentWebhookSecret(): string {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error('PAYMENT_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

export function signPaymentWebhookPayload(rawPayload: string): string {
  const secret = getPaymentWebhookSecret();
  return crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
}

export function verifyPaymentWebhookSignature(rawPayload: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }
  const expected = signPaymentWebhookPayload(rawPayload);
  const provided = signature.trim();
  if (expected.length !== provided.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export function createTransactionId(): string {
  return `tx_${crypto.randomBytes(12).toString('hex')}`;
}

export function createEventId(): string {
  return `evt_${crypto.randomBytes(12).toString('hex')}`;
}

export async function ensurePaymentsColumnsOrThrow(): Promise<void> {
  const hasTransactionId = await hasColumn('payments', 'transaction_id');
  const hasTransactionStatus = await hasColumn('payments', 'transaction_status');
  const hasAmount = await hasColumn('payments', 'amount');
  const hasPaidAt = await hasColumn('payments', 'paid_at');

  if (!hasTransactionId || !hasTransactionStatus || !hasAmount || !hasPaidAt) {
    throw new Error(
      'payments table is missing required columns. Apply payments migration before using payment API.'
    );
  }
}

async function lockBookingRow(conn: PoolConnection, bookingId: number): Promise<BookingStatusRow | null> {
  const [rows] = await conn.execute<BookingStatusRow[]>(
    `
      SELECT property_id, status
      FROM bookings
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
    `,
    [bookingId]
  );
  return rows[0] ?? null;
}

export async function processPaymentWebhookEvent(event: PaymentWebhookEventPayload): Promise<{
  transactionId: string;
  status: PaymentWebhookStatus;
  bookingStatus?: string;
}> {
  await ensurePaymentsColumnsOrThrow();

  const conn = await databaseConnect.getConnection();
  let transactionStarted = false;
  try {
    await conn.beginTransaction();
    transactionStarted = true;

    const bookingRow = await lockBookingRow(conn, event.bookingId);
    if (!bookingRow) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const persistedStatus = event.status === 'CANCELED' ? 'FAILED' : event.status;
    const paidAt =
      persistedStatus === 'SUCCESS'
        ? event.paidAt && !Number.isNaN(new Date(event.paidAt).getTime())
          ? new Date(event.paidAt)
          : new Date()
        : null;

    await conn.execute<ResultSetHeader>(
      `
        INSERT INTO payments (
          booking_id,
          amount,
          transaction_status,
          transaction_id,
          paid_at
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          amount = VALUES(amount),
          transaction_status = VALUES(transaction_status),
          paid_at = VALUES(paid_at)
      `,
      [event.bookingId, event.amount, persistedStatus, event.transactionId, paidAt]
    );

    let resolvedBookingStatus = bookingRow.status;
    if (persistedStatus === 'SUCCESS') {
      if (bookingRow.status === 'NEW' || bookingRow.status === 'PENDING' || bookingRow.status === 'PENDING_PAYMENT') {
        await conn.execute<ResultSetHeader>(
          `
            UPDATE bookings
            SET status = 'RESERVED'
            WHERE id = ? AND status IN ('NEW', 'PENDING', 'PENDING_PAYMENT')
          `,
          [event.bookingId]
        );
        resolvedBookingStatus = 'RESERVED';
      }

      await conn.execute<ResultSetHeader>(
        `
          UPDATE properties
          SET status = 'RESERVED'
          WHERE id = ? AND status IN ('PENDING_PAYMENT', 'AVAILABLE')
        `,
        [bookingRow.property_id]
      );
    }

    await conn.commit();
    transactionStarted = false;

    return {
      transactionId: event.transactionId,
      status: persistedStatus,
      bookingStatus: resolvedBookingStatus,
    };
  } catch (error) {
    if (transactionStarted) {
      await conn.rollback();
    }
    throw error;
  } finally {
    conn.release();
  }
}
