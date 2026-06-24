import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { verifyToken } from '@/utils/jwt';
import type { BookingStatus } from '@/lib/types';

interface ProfileRow extends RowDataPacket {
  id: number;
}

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
}

const CATALOG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80';

async function getUserProfileIdOrResponse(request: NextRequest): Promise<number | NextResponse> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const [profiles] = await databaseConnect.execute<ProfileRow[]>(
    'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
    [payload.userId]
  );

  if (!profiles.length) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return profiles[0].id;
}

export async function GET(request: NextRequest) {
  try {
    const profileIdOrResponse = await getUserProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }

    const profileId = profileIdOrResponse;

    const [rows] = await databaseConnect.execute<BookingListRow[]>(
      `
        SELECT
          b.id,
          b.status,
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
          ) AS image_url
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.client_profile_id = ?
          AND b.status IN ('NEW', 'PENDING', 'CANCELLED')
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
    }));

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error loading user bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
