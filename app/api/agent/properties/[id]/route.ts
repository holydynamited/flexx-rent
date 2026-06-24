import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getAgentProfileIdOrResponse } from '@/app/api/agent/_lib/auth';
import { databaseConnect } from '@/lib/db';
import { sanitizePropertyImageUrl } from '@/lib/shared/propertyImage';

interface PropertyOwnershipRow extends RowDataPacket {
  id: number;
  agent_id: number | null;
}

interface PropertyActiveBookingRow extends RowDataPacket {
  active_bookings_count: number;
}

interface PropertyResponseRow extends RowDataPacket {
  id: number;
  title: string;
  base_rent: string;
  utility_costs: string;
  rooms_count: string;
  area_sqm: string;
  status: string;
  street_address: string;
  postal_code: string;
  city: string;
  image_url: string | null;
}

interface UpdatePropertyBody {
  title?: unknown;
  baseRent?: unknown;
  utilityCosts?: unknown;
  rooms?: unknown;
  area?: unknown;
  status?: unknown;
}

function mapPropertyStatus(status: string): 'Available' | 'Pending payment' | 'Reserved' | 'Archived' {
  if (status === 'AVAILABLE') {
    return 'Available';
  }
  if (status === 'PENDING_PAYMENT') {
    return 'Pending payment';
  }
  if (status === 'RESERVED') {
    return 'Reserved';
  }
  return 'Archived';
}

function parsePositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
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
    const propertyId = Number(params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const [ownershipRows] = await databaseConnect.execute<PropertyOwnershipRow[]>(
      `
        SELECT id, agent_id
        FROM properties
        WHERE id = ?
        LIMIT 1
      `,
      [propertyId]
    );

    if (!ownershipRows.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (ownershipRows[0].agent_id !== agentProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as UpdatePropertyBody;
    const updates: string[] = [];
    const values: Array<string | number> = [];

    if (body.title !== undefined) {
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) {
        return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
      }
      updates.push('title = ?');
      values.push(title);
    }

    if (body.baseRent !== undefined) {
      const baseRent = parsePositiveNumber(body.baseRent);
      if (baseRent === null) {
        return NextResponse.json({ error: 'Invalid baseRent' }, { status: 400 });
      }
      updates.push('base_rent = ?');
      values.push(baseRent);
    }

    if (body.utilityCosts !== undefined) {
      const utilityCosts = parseNonNegativeNumber(body.utilityCosts);
      if (utilityCosts === null) {
        return NextResponse.json({ error: 'Invalid utilityCosts' }, { status: 400 });
      }
      updates.push('utility_costs = ?');
      values.push(utilityCosts);
    }

    if (body.rooms !== undefined) {
      const rooms = parsePositiveNumber(body.rooms);
      if (rooms === null) {
        return NextResponse.json({ error: 'Invalid rooms' }, { status: 400 });
      }
      updates.push('rooms_count = ?');
      values.push(rooms);
    }

    if (body.area !== undefined) {
      const area = parsePositiveNumber(body.area);
      if (area === null) {
        return NextResponse.json({ error: 'Invalid area' }, { status: 400 });
      }
      updates.push('area_sqm = ?');
      values.push(area);
    }

    if (body.status !== undefined) {
      if (body.status !== 'Available' && body.status !== 'Archived') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.push('status = ?');
      values.push(body.status === 'Available' ? 'AVAILABLE' : 'ARCHIVED');
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(propertyId);
    await databaseConnect.execute<ResultSetHeader>(
      `
        UPDATE properties
        SET ${updates.join(', ')}
        WHERE id = ?
      `,
      values
    );

    const [rows] = await databaseConnect.execute<PropertyResponseRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.base_rent,
          p.utility_costs,
          p.rooms_count,
          p.area_sqm,
          p.status,
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
        FROM properties p
        WHERE p.id = ?
        LIMIT 1
      `,
      [propertyId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Property not found after update' }, { status: 404 });
    }

    const row = rows[0];
    const property = {
      id: row.id,
      title: row.title,
      address: `${row.street_address}, ${row.postal_code} ${row.city}`,
      baseRent: Number(row.base_rent) || 0,
      utilityCosts: Number(row.utility_costs) || 0,
      rooms: Number(row.rooms_count) || 0,
      area: Number(row.area_sqm) || 0,
      status: mapPropertyStatus(row.status),
      dbStatus: row.status,
      imagePlaceholder: sanitizePropertyImageUrl(row.image_url),
    };

    return NextResponse.json({ message: 'Property updated', property }, { status: 200 });
  } catch (error) {
    console.error('Error updating property by agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const conn = await databaseConnect.getConnection();
  let transactionStarted = false;
  try {
    const profileIdOrResponse = await getAgentProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }
    const agentProfileId = profileIdOrResponse;

    const params = await context.params;
    const propertyId = Number(params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return NextResponse.json({ error: 'Invalid property id' }, { status: 400 });
    }

    const [ownershipRows] = await conn.execute<PropertyOwnershipRow[]>(
      `
        SELECT id, agent_id
        FROM properties
        WHERE id = ?
        LIMIT 1
      `,
      [propertyId]
    );

    if (!ownershipRows.length) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (ownershipRows[0].agent_id !== agentProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [bookingRows] = await conn.execute<PropertyActiveBookingRow[]>(
      `
        SELECT COUNT(*) AS active_bookings_count
        FROM bookings
        WHERE property_id = ?
          AND status IN ('NEW', 'PENDING', 'PENDING_PAYMENT', 'RESERVED')
      `,
      [propertyId]
    );

    if (Number(bookingRows[0]?.active_bookings_count || 0) > 0) {
      return NextResponse.json(
        { error: 'Property has active bookings and cannot be deleted' },
        { status: 409 }
      );
    }

    await conn.beginTransaction();
    transactionStarted = true;
    await conn.execute(
      `
        DELETE FROM property_images
        WHERE property_id = ?
      `,
      [propertyId]
    );

    const [deleteResult] = await conn.execute<ResultSetHeader>(
      `
        DELETE FROM properties
        WHERE id = ? AND agent_id = ?
      `,
      [propertyId, agentProfileId]
    );

    if (deleteResult.affectedRows === 0) {
      if (transactionStarted) {
        await conn.rollback();
      }
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await conn.commit();
    transactionStarted = false;
    return NextResponse.json({ message: 'Property deleted', propertyId }, { status: 200 });
  } catch (error) {
    if (transactionStarted) {
      await conn.rollback();
    }
    console.error('Error deleting property by agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
