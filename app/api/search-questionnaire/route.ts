import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { verifyToken } from '@/utils/jwt';

interface ProfileRow extends RowDataPacket {
  id: number;
}

interface SearchQuestionnaireRow extends RowDataPacket {
  id: number;
  city: string;
  max_total_rent: string;
  min_rooms: string;
  min_area_sqm: string;
  is_active: number;
}

interface SaveQuestionnaireBody {
  city?: unknown;
  maxTotalRent?: unknown;
  minRooms?: unknown;
  minAreaSqm?: unknown;
  isActive?: unknown;
}

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
    const [rows] = await databaseConnect.execute<SearchQuestionnaireRow[]>(
      `
        SELECT id, city, max_total_rent, min_rooms, min_area_sqm, is_active
        FROM search_questionnaire
        WHERE client_profile_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [profileId]
    );

    if (!rows.length) {
      return NextResponse.json({ questionnaire: null }, { status: 200 });
    }

    const row = rows[0];
    return NextResponse.json(
      {
        questionnaire: {
          id: row.id,
          city: row.city,
          maxTotalRent: Number(row.max_total_rent),
          minRooms: Number(row.min_rooms),
          minAreaSqm: Number(row.min_area_sqm),
          isActive: Boolean(row.is_active),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error loading questionnaire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const profileIdOrResponse = await getUserProfileIdOrResponse(request);
    if (profileIdOrResponse instanceof NextResponse) {
      return profileIdOrResponse;
    }

    const profileId = profileIdOrResponse;
    const body = (await request.json()) as SaveQuestionnaireBody;

    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const maxTotalRent = Number(body.maxTotalRent);
    const minRooms = Number(body.minRooms);
    const minAreaSqm = Number(body.minAreaSqm);
    const isActive = body.isActive === undefined ? true : Boolean(body.isActive);

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    if (!Number.isFinite(maxTotalRent) || maxTotalRent <= 0) {
      return NextResponse.json({ error: 'maxTotalRent must be a positive number' }, { status: 400 });
    }

    if (!Number.isFinite(minRooms) || minRooms <= 0) {
      return NextResponse.json({ error: 'minRooms must be a positive number' }, { status: 400 });
    }

    if (!Number.isFinite(minAreaSqm) || minAreaSqm <= 0) {
      return NextResponse.json({ error: 'minAreaSqm must be a positive number' }, { status: 400 });
    }

    const [updateResult] = await databaseConnect.execute<ResultSetHeader>(
      `
        UPDATE search_questionnaire
        SET
          city = ?,
          max_total_rent = ?,
          min_rooms = ?,
          min_area_sqm = ?,
          is_active = ?,
          updated_at = NOW()
        WHERE client_profile_id = ?
      `,
      [city, maxTotalRent, minRooms, minAreaSqm, isActive ? 1 : 0, profileId]
    );

    if (updateResult.affectedRows === 0) {
      await databaseConnect.execute(
        `
          INSERT INTO search_questionnaire (
            client_profile_id,
            city,
            max_total_rent,
            min_rooms,
            min_area_sqm,
            is_active,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
        [profileId, city, maxTotalRent, minRooms, minAreaSqm, isActive ? 1 : 0]
      );
    }

    return NextResponse.json({ message: 'Questionnaire saved' }, { status: 200 });
  } catch (error) {
    console.error('Error saving questionnaire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
