import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { hasColumn } from '@/lib/server/dbSchema';
import type { UserRole } from '@/lib/types';
import { verifyToken } from '@/utils/jwt';

interface SessionUserRow extends RowDataPacket {
  id: number;
  role: string | null;
  email: string;
  is_blocked?: number;
}

interface ProfileRow extends RowDataPacket {
  id: number;
}

export interface ApiAuthUser {
  userId: number;
  role: UserRole;
  email: string;
  isBlocked: boolean;
}

export interface ApiAuthProfile {
  user: ApiAuthUser;
  profileId: number;
}

interface RequireApiUserOptions {
  requiredRole?: UserRole;
  allowBlocked?: boolean;
}

export async function requireApiUser(
  request: NextRequest,
  options: RequireApiUserOptions = {}
): Promise<ApiAuthUser | NextResponse> {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const isBlockedColumnPresent = await hasColumn('users', 'is_blocked');
  const blockedProjection = isBlockedColumnPresent ? 'u.is_blocked' : '0 AS is_blocked';
  const [rows] = await databaseConnect.execute<SessionUserRow[]>(
    `
      SELECT
        u.id,
        u.role,
        u.email,
        ${blockedProjection}
      FROM users u
      WHERE u.id = ?
      LIMIT 1
    `,
    [payload.userId]
  );

  if (!rows.length) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = rows[0];
  const resolvedRole = (row.role || payload.role || 'CLIENT') as UserRole;
  const isBlocked = Boolean(Number(row.is_blocked ?? 0));

  if (options.requiredRole && resolvedRole !== options.requiredRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!options.allowBlocked && isBlocked) {
    return NextResponse.json({ error: 'Account is blocked' }, { status: 403 });
  }

  return {
    userId: row.id,
    role: resolvedRole,
    email: row.email,
    isBlocked,
  };
}

export async function requireApiProfile(
  request: NextRequest,
  options: RequireApiUserOptions = {}
): Promise<ApiAuthProfile | NextResponse> {
  const userOrResponse = await requireApiUser(request, options);
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse;
  }

  const [profiles] = await databaseConnect.execute<ProfileRow[]>(
    'SELECT id FROM profiles WHERE user_id = ? LIMIT 1',
    [userOrResponse.userId]
  );

  if (!profiles.length) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return {
    user: userOrResponse,
    profileId: profiles[0].id,
  };
}
