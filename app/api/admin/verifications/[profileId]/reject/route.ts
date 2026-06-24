import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';

interface RejectVerificationBody {
  reason?: unknown;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const params = await context.params;
    const profileId = Number(params.profileId);
    if (!Number.isInteger(profileId) || profileId <= 0) {
      return NextResponse.json({ error: 'Invalid profileId' }, { status: 400 });
    }

    const body = (await request.json()) as RejectVerificationBody;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const hasRejectionReason = await hasColumn('profiles', 'rejection_reason');
    const updateQuery = hasRejectionReason
      ? `
          UPDATE profiles
          SET verification_status = 'REJECTED', rejection_reason = ?
          WHERE id = ?
        `
      : `
          UPDATE profiles
          SET verification_status = 'REJECTED'
          WHERE id = ?
        `;
    const queryParams = hasRejectionReason ? [reason, profileId] : [profileId];
    const [result] = await databaseConnect.execute<ResultSetHeader>(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.info('[ADMIN] verification rejected', {
      adminUserId: adminOrResponse.userId,
      profileId,
      reason,
    });

    return NextResponse.json(
      {
        message: 'Verification rejected',
        profileId,
        verificationStatus: 'REJECTED',
        reason,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error rejecting verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
