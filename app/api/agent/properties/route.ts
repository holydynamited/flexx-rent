import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getAgentProfileIdOrResponse } from '@/app/api/agent/_lib/auth';
import { databaseConnect } from '@/lib/db';
import { isAllowedPropertyImageUrl, sanitizePropertyImageUrl } from '@/lib/shared/propertyImage';

interface AgentPropertyRow extends RowDataPacket {
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

interface CreateAgentPropertyBody {
  title?: unknown;
  baseRent?: unknown;
  utilityCosts?: unknown;
  depositAmount?: unknown;
  rooms?: unknown;
  area?: unknown;
  streetAddress?: unknown;
  postalCode?: unknown;
  city?: unknown;
  status?: unknown;
  description?: unknown;
  amenitiesText?: unknown;
  heatingType?: unknown;
  imageUrl?: unknown;
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

export async function GET(request: NextRequest) {
  try {
    const profileIdOrResponse = await getAgentProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }
    const agentProfileId = profileIdOrResponse;

    const [rows] = await databaseConnect.execute<AgentPropertyRow[]>(
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
        WHERE p.agent_id = ?
        ORDER BY p.created_at DESC, p.id DESC
      `,
      [agentProfileId]
    );

    const properties = rows.map((row) => ({
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
    }));

    return NextResponse.json({ properties }, { status: 200 });
  } catch (error) {
    console.error('Error loading agent properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const conn = await databaseConnect.getConnection();
  try {
    const profileIdOrResponse = await getAgentProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }
    const agentProfileId = profileIdOrResponse;

    const body = (await request.json()) as CreateAgentPropertyBody;

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const streetAddress = typeof body.streetAddress === 'string' ? body.streetAddress.trim() : '';
    const postalCode = typeof body.postalCode === 'string' ? body.postalCode.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    const amenitiesText = typeof body.amenitiesText === 'string' ? body.amenitiesText.trim() : null;
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    const heatingType =
      body.heatingType === 'GAS' ||
      body.heatingType === 'DISTRICT' ||
      body.heatingType === 'ELECTRIC' ||
      body.heatingType === 'HEAT_PUMP'
        ? body.heatingType
        : 'GAS';

    const baseRent = parsePositiveNumber(body.baseRent);
    const utilityCosts = parseNonNegativeNumber(body.utilityCosts);
    const rooms = parsePositiveNumber(body.rooms);
    const area = parsePositiveNumber(body.area);
    const depositAmountInput = parseNonNegativeNumber(body.depositAmount);
    const depositAmount = depositAmountInput ?? (baseRent ? baseRent * 2 : null);
    const status = body.status === 'Available' ? 'AVAILABLE' : 'ARCHIVED';

    if (!title) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }
    if (!streetAddress || !postalCode || !city) {
      return NextResponse.json({ error: 'Street address, postal code and city are required' }, { status: 400 });
    }
    if (baseRent === null) {
      return NextResponse.json({ error: 'Invalid baseRent' }, { status: 400 });
    }
    if (utilityCosts === null) {
      return NextResponse.json({ error: 'Invalid utilityCosts' }, { status: 400 });
    }
    if (rooms === null) {
      return NextResponse.json({ error: 'Invalid rooms' }, { status: 400 });
    }
    if (area === null) {
      return NextResponse.json({ error: 'Invalid area' }, { status: 400 });
    }
    if (depositAmount === null) {
      return NextResponse.json({ error: 'Invalid depositAmount' }, { status: 400 });
    }
    if (imageUrl && !isAllowedPropertyImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL. Use a direct URL from images.unsplash.com.' },
        { status: 400 }
      );
    }

    await conn.beginTransaction();
    const [insertResult] = await conn.execute<ResultSetHeader>(
      `
        INSERT INTO properties (
          title,
          description,
          base_rent,
          utility_costs,
          deposit_amount,
          area_sqm,
          rooms_count,
          heating_type,
          city,
          postal_code,
          street_address,
          amenities_text,
          status,
          created_at,
          agent_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `,
      [
        title,
        description,
        baseRent,
        utilityCosts,
        depositAmount,
        area,
        rooms,
        heatingType,
        city,
        postalCode,
        streetAddress,
        amenitiesText,
        status,
        agentProfileId,
      ]
    );
    const propertyId = insertResult.insertId;

    if (imageUrl) {
      await conn.execute(
        `
          INSERT INTO property_images (property_id, image_url, sort_order)
          VALUES (?, ?, 0)
        `,
        [propertyId, imageUrl]
      );
    }

    const [rows] = await conn.execute<AgentPropertyRow[]>(
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

    await conn.commit();
    if (!rows.length) {
      return NextResponse.json({ error: 'Failed to load created property' }, { status: 500 });
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

    return NextResponse.json({ message: 'Property created', property }, { status: 201 });
  } catch (error) {
    await conn.rollback();
    console.error('Error creating property by agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
