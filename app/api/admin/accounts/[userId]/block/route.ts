import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';

interface BlockBody {
  blocked?: unknown;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const hasIsBlockedColumn = await hasColumn('users', 'is_blocked');
    if (!hasIsBlockedColumn) {
      return NextResponse.json(
        {
          error: 'users.is_blocked column is missing. Apply db/migrations/20260624_admin_crm_columns.sql first.',
          code: 'ADMIN_MIGRATION_REQUIRED',
        },
        { status: 503 }
      );
    }

    const params = await context.params;
    const userId = Number(params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    if (userId === adminOrResponse.userId) {
      return NextResponse.json({ error: 'Admin cannot block self' }, { status: 400 });
    }

    const body = (await request.json()) as BlockBody;
    if (typeof body.blocked !== 'boolean') {
      return NextResponse.json({ error: 'blocked must be boolean' }, { status: 400 });
    }

    const [result] = await databaseConnect.execute<ResultSetHeader>(
      `
        UPDATE users
        SET is_blocked = ?
        WHERE id = ?
      `,
      [body.blocked ? 1 : 0, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.info('[ADMIN] account block toggled', {
      adminUserId: adminOrResponse.userId,
      targetUserId: userId,
      blocked: body.blocked,
    });

    return NextResponse.json(
      {
        message: body.blocked ? 'User blocked' : 'User unblocked',
        userId,
        blocked: body.blocked,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling user block state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
