import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { getAgentProfileIdOrResponse } from '@/app/api/agent/_lib/auth';
import { databaseConnect } from '@/lib/db';
import { expireOverdueBookings } from '@/lib/server/bookings';
import type { BookingStatus } from '@/lib/types';

type AgentBookingStatus = BookingStatus;

interface AgentBookingRow extends RowDataPacket {
  id: number;
  status: AgentBookingStatus | 'PENDING';
  created_at: string | Date;
  expires_at: string | Date;
  property_id: number;
  property_title: string;
  street_address: string;
  postal_code: string;
  city: string;
  image_url: string | null;
  client_profile_id: number;
  client_first_name: string | null;
  client_last_name: string | null;
  client_email: string;
  client_verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED' | null;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | null;
  payment_paid_at: string | Date | null;
}

const ALLOWED_STATUSES: AgentBookingStatus[] = ['NEW', 'PENDING_PAYMENT', 'RESERVED', 'CANCELLED'];
const CATALOG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80';

function toIsoDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    await expireOverdueBookings();

    const profileIdOrResponse = await getAgentProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }
    const agentProfileId = profileIdOrResponse;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search')?.trim();

    if (statusParam && !ALLOWED_STATUSES.includes(statusParam as AgentBookingStatus)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    const conditions: string[] = ['p.agent_id = ?'];
    const queryParams: Array<string | number> = [agentProfileId];

    if (statusParam) {
      conditions.push(
        statusParam === 'PENDING_PAYMENT'
          ? `b.status IN ('PENDING_PAYMENT', 'PENDING')`
          : 'b.status = ?'
      );
      if (statusParam !== 'PENDING_PAYMENT') {
        queryParams.push(statusParam);
      }
    } else {
      conditions.push(`b.status IN ('NEW', 'PENDING', 'PENDING_PAYMENT', 'RESERVED', 'CANCELLED')`);
    }

    if (searchParam) {
      conditions.push(
        `(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, '')) LIKE ? OR u.email LIKE ? OR p.title LIKE ?)`
      );
      const searchLike = `%${searchParam}%`;
      queryParams.push(searchLike, searchLike, searchLike);
    }

    const [rows] = await databaseConnect.execute<AgentBookingRow[]>(
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
          p.title AS property_title,
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
          cp.id AS client_profile_id,
          cp.first_name AS client_first_name,
          cp.last_name AS client_last_name,
          u.email AS client_email,
          cp.verification_status AS client_verification_status,
          (
            SELECT pay.transaction_status
            FROM payments pay
            WHERE pay.booking_id = b.id
            ORDER BY pay.id DESC
            LIMIT 1
          ) AS payment_status,
          (
            SELECT pay.paid_at
            FROM payments pay
            WHERE pay.booking_id = b.id
            ORDER BY pay.id DESC
            LIMIT 1
          ) AS payment_paid_at
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        JOIN profiles cp ON cp.id = b.client_profile_id
        JOIN users u ON u.id = cp.user_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY b.created_at DESC, b.id DESC
      `,
      queryParams
    );

    const bookings = rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: toIsoDate(row.created_at),
      expiresAt: toIsoDate(row.expires_at),
      property: {
        id: row.property_id,
        title: row.property_title,
        address: `${row.street_address}, ${row.postal_code} ${row.city}`,
        image: row.image_url || CATALOG_FALLBACK_IMAGE,
      },
      client: {
        id: row.client_profile_id,
        fullName: `${row.client_first_name || ''} ${row.client_last_name || ''}`.trim() || 'Unknown client',
        email: row.client_email,
        verificationStatus: row.client_verification_status || 'PENDING',
      },
      payment: {
        status: row.payment_status || 'PENDING',
        paidAt: row.payment_paid_at ? toIsoDate(row.payment_paid_at) : null,
      },
    }));

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error loading agent bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
