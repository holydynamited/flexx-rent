import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireApiProfile } from '@/lib/server/apiAuth';
import { sanitizePropertyImageUrl } from '@/lib/shared/propertyImage';
import type { HeatingType } from '@/components/matcher/types';

interface QuestionnaireRow extends RowDataPacket {
  id: number;
  city: string;
  max_total_rent: string;
  min_rooms: string;
  min_area_sqm: string;
  is_active: number;
}

interface OfferRow extends RowDataPacket {
  id: number;
  title: string;
  city: string;
  street_address: string;
  postal_code: string;
  base_rent: string;
  utility_costs: string;
  rooms_count: string;
  area_sqm: string;
  heating_type: string;
  status: string;
  image_url: string | null;
}

function mapHeatingType(value: string): HeatingType {
  if (value === 'GAS' || value === 'DISTRICT' || value === 'ELECTRIC' || value === 'HEAT_PUMP') {
    return value;
  }
  return 'GAS';
}

export async function GET(request: NextRequest) {
  try {
    const authProfileOrResponse = await requireApiProfile(request, { requiredRole: 'CLIENT' });
    if (authProfileOrResponse instanceof NextResponse) {
      return authProfileOrResponse;
    }
    const profileId = authProfileOrResponse.profileId;

    const [questionnaireRows] = await databaseConnect.execute<QuestionnaireRow[]>(
      `
        SELECT id, city, max_total_rent, min_rooms, min_area_sqm, is_active
        FROM search_questionnaire
        WHERE client_profile_id = ? AND is_active = 1
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `,
      [profileId]
    );

    if (!questionnaireRows.length) {
      return NextResponse.json({ hasQuestionnaire: false, offers: [] }, { status: 200 });
    }

    const questionnaire = questionnaireRows[0];
    const [offerRows] = await databaseConnect.execute<OfferRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.city,
          p.street_address,
          p.postal_code,
          p.base_rent,
          p.utility_costs,
          p.rooms_count,
          p.area_sqm,
          p.heating_type,
          p.status,
          (
            SELECT pi.image_url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ) AS image_url
        FROM properties p
        WHERE p.status = 'AVAILABLE'
          AND p.city = ?
          AND (p.base_rent + p.utility_costs) <= ?
          AND p.rooms_count >= ?
          AND p.area_sqm >= ?
        ORDER BY p.created_at DESC, p.id DESC
      `,
      [
        questionnaire.city,
        Number(questionnaire.max_total_rent),
        Number(questionnaire.min_rooms),
        Number(questionnaire.min_area_sqm),
      ]
    );

    const offers = offerRows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      address: `${row.street_address}, ${row.postal_code} ${row.city}`,
      city: row.city,
      baseRent: Number(row.base_rent) || 0,
      utilityCosts: Number(row.utility_costs) || 0,
      rooms: Number(row.rooms_count) || 0,
      area: Number(row.area_sqm) || 0,
      image: sanitizePropertyImageUrl(row.image_url),
      heating: mapHeatingType(row.heating_type),
      status: row.status,
    }));

    return NextResponse.json(
      {
        hasQuestionnaire: true,
        questionnaire: {
          id: questionnaire.id,
          city: questionnaire.city,
          maxTotalRent: Number(questionnaire.max_total_rent),
          minRooms: Number(questionnaire.min_rooms),
          minAreaSqm: Number(questionnaire.min_area_sqm),
          isActive: Boolean(questionnaire.is_active),
        },
        offers,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error loading my offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
