import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { hasColumn } from '@/lib/server/dbSchema';
import { verifyToken } from '@/utils/jwt';
import type { HeaderUser } from '@/components/layout/types';
import type { UserRole, VerificationStatus } from '@/lib/types';

interface SessionUserRow extends RowDataPacket {
  email: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: string | null;
  is_blocked?: number;
}

export async function getSessionUser(): Promise<HeaderUser | null> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    const isBlockedColumnPresent = await hasColumn('users', 'is_blocked');
    const blockedProjection = isBlockedColumnPresent ? 'u.is_blocked' : '0 AS is_blocked';

    const [rows] = await databaseConnect.execute<SessionUserRow[]>(
      `
        SELECT
          u.email,
          u.role,
          ${blockedProjection},
          p.first_name,
          p.last_name,
          p.verification_status
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [payload.userId]
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    if (Boolean(Number(row.is_blocked ?? 0))) {
      return null;
    }
    const [firstNameFromEmail = 'User'] = row.email.split('@');

    return {
      email: row.email,
      firstName: row.first_name || firstNameFromEmail,
      lastName: row.last_name || 'User',
      role: ((row.role || payload.role || 'CLIENT') as UserRole),
      verificationStatus: ((row.verification_status || 'PENDING') as VerificationStatus),
    };
  } catch {
    return null;
  }
}
