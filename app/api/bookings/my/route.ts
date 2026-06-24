import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireApiProfile } from '@/lib/server/apiAuth';
import { expireOverdueBookings } from '@/lib/server/bookings';
import type { BookingStatus } from '@/lib/types';

interface BookingListRow extends RowDataPacket {
  id: number;
  status: BookingStatus;
  created_at: string | Date;
  expires_at: string | Date;
  property_id: number;
  title: string;
  base_rent: string;
  street_address: string;
  postal_code: string;
  city: string;
  image_url: string | null;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | null;
  payment_transaction_id: string | null;
}

const CATALOG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80';

export async function GET(request: NextRequest) {
  try {
    await expireOverdueBookings();

    const authProfileOrResponse = await requireApiProfile(request);
    if (authProfileOrResponse instanceof NextResponse) {
      return authProfileOrResponse;
    }

    const profileId = authProfileOrResponse.profileId;

    const [rows] = await databaseConnect.execute<BookingListRow[]>(
      `
        SELECT
          b.id,
          CASE
            WHEN b.status = 'PENDING' THEN 'PENDING_PAYMENT'
            ELSE b.status
          END AS status,
          b.created_at,
          b.expires_at,
          p.id AS property_id,
          p.title,
          p.base_rent,
          p.street_address,
          p.postal_code,
          p.city,
          (
            SELECT pi.image_url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ) AS image_url,
          (
            SELECT pay.transaction_status
            FROM payments pay
            WHERE pay.booking_id = b.id
            ORDER BY pay.id DESC
            LIMIT 1
          ) AS payment_status,
          (
            SELECT pay.transaction_id
            FROM payments pay
            WHERE pay.booking_id = b.id
            ORDER BY pay.id DESC
            LIMIT 1
          ) AS payment_transaction_id
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.client_profile_id = ?
          AND b.status IN ('NEW', 'PENDING', 'PENDING_PAYMENT', 'RESERVED', 'CANCELLED')
        ORDER BY b.created_at DESC, b.id DESC
      `,
      [profileId]
    );

    const bookings = rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
      expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : new Date(row.expires_at).toISOString(),
      property: {
        id: row.property_id,
        title: row.title,
        address: `${row.street_address}, ${row.postal_code} ${row.city}`,
        price: Number(row.base_rent) || 0,
        image: row.image_url || CATALOG_FALLBACK_IMAGE,
      },
      payment: {
        status: row.payment_status || 'PENDING',
        transactionId: row.payment_transaction_id,
      },
    }));

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error loading user bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
