import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';

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

    const hasRejectionReason = await hasColumn('profiles', 'rejection_reason');
    const updateQuery = hasRejectionReason
      ? `
          UPDATE profiles
          SET verification_status = 'VERIFIED', rejection_reason = NULL
          WHERE id = ?
        `
      : `
          UPDATE profiles
          SET verification_status = 'VERIFIED'
          WHERE id = ?
        `;

    const [result] = await databaseConnect.execute<ResultSetHeader>(updateQuery, [profileId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.info('[ADMIN] verification approved', {
      adminUserId: adminOrResponse.userId,
      profileId,
    });

    return NextResponse.json(
      {
        message: 'Verification approved',
        profileId,
        verificationStatus: 'VERIFIED',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error approving verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
