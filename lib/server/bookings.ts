import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';

interface ExpiredBookingRow extends RowDataPacket {
  id: number;
  property_id: number;
}

export async function expireOverdueBookings(): Promise<number> {
  const conn = await databaseConnect.getConnection();
  let transactionStarted = false;
  try {
    await conn.beginTransaction();
    transactionStarted = true;

    const [expiredRows] = await conn.execute<ExpiredBookingRow[]>(
      `
        SELECT
          b.id,
          b.property_id
        FROM bookings b
        LEFT JOIN payments pay
          ON pay.booking_id = b.id
          AND pay.transaction_status = 'SUCCESS'
        WHERE b.status = 'PENDING_PAYMENT'
          AND b.expires_at < NOW()
          AND pay.id IS NULL
        FOR UPDATE
      `
    );

    if (!expiredRows.length) {
      await conn.commit();
      transactionStarted = false;
      return 0;
    }

    const bookingIds = expiredRows.map((row) => row.id);
    const bookingPlaceholders = bookingIds.map(() => '?').join(', ');

    await conn.execute<ResultSetHeader>(
      `
        UPDATE bookings
        SET status = 'CANCELLED'
        WHERE id IN (${bookingPlaceholders})
      `,
      bookingIds
    );

    const propertyIds = Array.from(new Set(expiredRows.map((row) => row.property_id)));
    if (propertyIds.length) {
      const propertyPlaceholders = propertyIds.map(() => '?').join(', ');
      await conn.execute<ResultSetHeader>(
        `
          UPDATE properties p
          SET p.status = 'AVAILABLE'
          WHERE p.id IN (${propertyPlaceholders})
            AND p.status = 'PENDING_PAYMENT'
            AND NOT EXISTS (
              SELECT 1
              FROM bookings b
              WHERE b.property_id = p.id
                AND b.status IN ('PENDING_PAYMENT', 'RESERVED')
            )
        `,
        propertyIds
      );
    }

    await conn.commit();
    transactionStarted = false;
    return bookingIds.length;
  } catch (error) {
    if (transactionStarted) {
      await conn.rollback();
    }
    throw error;
  } finally {
    conn.release();
  }
}
