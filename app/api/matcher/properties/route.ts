import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import type { MatcherProperty } from '@/components/matcher/types';
import { databaseConnect } from '@/lib/db';

interface MatcherPropertyRow extends RowDataPacket {
  id: number;
  title: string;
  city: string;
  street_address: string;
  base_rent: string;
  utility_costs: string;
  rooms_count: string;
  area_sqm: string;
  heating_type: string;
  image_url: string | null;
}

const MATCHER_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80';

function mapHeatingType(value: string): MatcherProperty['heating'] {
  if (value === 'GAS' || value === 'DISTRICT' || value === 'ELECTRIC' || value === 'HEAT_PUMP') {
    return value;
  }
  return 'GAS';
}

export async function GET() {
  try {
    const [rows] = await databaseConnect.execute<MatcherPropertyRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.city,
          p.street_address,
          p.base_rent,
          p.utility_costs,
          p.rooms_count,
          p.area_sqm,
          p.heating_type,
          (
            SELECT pi.image_url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ) AS image_url
        FROM properties p
        WHERE p.status = 'AVAILABLE'
        ORDER BY p.created_at DESC, p.id DESC
      `
    );

    const properties: MatcherProperty[] = rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      city: row.city,
      address: row.street_address,
      baseRent: Number(row.base_rent) || 0,
      utilityCosts: Number(row.utility_costs) || 0,
      rooms: Number(row.rooms_count) || 0,
      area: Number(row.area_sqm) || 0,
      heating: mapHeatingType(row.heating_type),
      image: row.image_url || MATCHER_FALLBACK_IMAGE,
    }));

    return NextResponse.json({ properties }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error loading matcher properties via API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
