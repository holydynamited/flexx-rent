import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';
import type { UserRole, VerificationStatus } from '@/lib/types';
import { hashPassword } from '@/utils/password';

type AccountRoleFilter = 'ALL' | 'CLIENT' | 'AGENT';

interface AccountRow extends RowDataPacket {
  user_id: number;
  profile_id: number | null;
  full_name: string | null;
  email: string;
  role: string | null;
  verification_status: string | null;
  is_blocked: number;
  managed_properties: number;
}

interface CreateAccountBody {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  verificationStatus?: unknown;
}

function parseRoleFilter(value: string | null): AccountRoleFilter {
  const normalized = value?.toUpperCase();
  if (normalized === 'CLIENT' || normalized === 'AGENT') {
    return normalized;
  }

  return 'ALL';
}

function normalizeVerificationStatus(value: string | null): VerificationStatus {
  if (value === 'VERIFIED' || value === 'REJECTED') {
    return value;
  }

  return 'PENDING';
}

export async function GET(request: NextRequest) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const roleFilter = parseRoleFilter(request.nextUrl.searchParams.get('role'));
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const likeSearch = `%${search}%`;
    const hasIsBlocked = await hasColumn('users', 'is_blocked');

    const whereClauses: string[] = ["u.role IN ('CLIENT', 'AGENT')"];
    const params: Array<string | number> = [];

    if (roleFilter !== 'ALL') {
      whereClauses.push('u.role = ?');
      params.push(roleFilter);
    }

    if (search) {
      whereClauses.push(
        "(CONCAT_WS(' ', p.first_name, p.last_name) LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) LIKE ?)"
      );
      params.push(likeSearch, likeSearch, likeSearch);
    }

    const blockedProjection = hasIsBlocked ? 'u.is_blocked' : '0 AS is_blocked';

    const [rows] = await databaseConnect.execute<AccountRow[]>(
      `
        SELECT
          u.id AS user_id,
          p.id AS profile_id,
          CONCAT_WS(' ', p.first_name, p.last_name) AS full_name,
          u.email,
          u.role,
          p.verification_status,
          ${blockedProjection},
          COALESCE(mp.total, 0) AS managed_properties
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN (
          SELECT agent_id, COUNT(*) AS total
          FROM properties
          WHERE agent_id IS NOT NULL
          GROUP BY agent_id
        ) mp ON mp.agent_id = p.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY u.id DESC
      `,
      params
    );

    const accounts = rows.map((row) => ({
      userId: row.user_id,
      profileId: row.profile_id,
      fullName: row.full_name?.trim() || row.email.split('@')[0] || `User ${row.user_id}`,
      email: row.email,
      role: (row.role || 'CLIENT') as Exclude<UserRole, 'ADMIN'>,
      verificationStatus: normalizeVerificationStatus(row.verification_status),
      isBlocked: Boolean(Number(row.is_blocked ?? 0)),
      managedProperties: Number(row.managed_properties || 0),
    }));

    console.info('[ADMIN] accounts loaded', {
      adminUserId: adminOrResponse.userId,
      role: roleFilter,
      search,
      total: accounts.length,
    });

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error) {
    console.error('Error loading admin accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const conn = await databaseConnect.getConnection();
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const body = (await request.json()) as CreateAccountBody;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role === 'CLIENT' || body.role === 'AGENT' ? body.role : null;
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const verificationStatus =
      body.verificationStatus === 'VERIFIED' || body.verificationStatus === 'REJECTED'
        ? body.verificationStatus
        : 'PENDING';

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password and role are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const [existingUsers] = await conn.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const hasIsBlocked = await hasColumn('users', 'is_blocked');

    await conn.beginTransaction();
    const [userInsert] = await conn.execute<ResultSetHeader>(
      `
        INSERT INTO users (email, password_hash, role${hasIsBlocked ? ', is_blocked' : ''})
        VALUES (?, ?, ?${hasIsBlocked ? ', 0' : ''})
      `,
      [email, hashedPassword, role]
    );
    const userId = userInsert.insertId;

    const [profileInsert] = await conn.execute<ResultSetHeader>(
      `
        INSERT INTO profiles (user_id, first_name, last_name, phone, verification_status, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [userId, firstName || 'New', lastName || 'User', phone, verificationStatus]
    );
    const profileId = profileInsert.insertId;

    await conn.commit();
    console.info('[ADMIN] account created', {
      adminUserId: adminOrResponse.userId,
      createdUserId: userId,
      role,
    });

    return NextResponse.json(
      {
        message: 'Account created',
        account: {
          userId,
          profileId,
          fullName: `${firstName || 'New'} ${lastName || 'User'}`.trim(),
          email,
          role,
          verificationStatus,
          isBlocked: false,
          managedProperties: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback();
    console.error('Error creating admin account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
