import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { hasColumn } from '@/lib/server/dbSchema';
import { verifyToken } from '@/utils/jwt';

interface AgentProfileRow extends RowDataPacket {
  profile_id: number;
  role: string;
  is_blocked?: number;
}

export async function getAgentProfileIdOrResponse(
  request: NextRequest
): Promise<number | NextResponse> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const hasIsBlockedColumn = await hasColumn('users', 'is_blocked');
  const blockedProjection = hasIsBlockedColumn ? 'u.is_blocked' : '0 AS is_blocked';

  const [rows] = await databaseConnect.execute<AgentProfileRow[]>(
    `
      SELECT
        p.id AS profile_id,
        u.role,
        ${blockedProjection}
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [payload.userId]
  );

  if (!rows.length || !rows[0].profile_id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (rows[0].role !== 'AGENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (Boolean(Number(rows[0].is_blocked ?? 0))) {
    return NextResponse.json({ error: 'Account is blocked' }, { status: 403 });
  }

  return rows[0].profile_id;
}
