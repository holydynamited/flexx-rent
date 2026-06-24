import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const hasPayoutCalculated = await hasColumn('payments', 'payout_calculated');
    const hasPayoutPaidAt = await hasColumn('payments', 'payout_paid_at');
    if (!hasPayoutCalculated || !hasPayoutPaidAt) {
      return NextResponse.json(
        {
          error: 'payments payout columns are missing. Apply admin CRM migration first.',
        },
        { status: 500 }
      );
    }

    const params = await context.params;
    const paymentId = Number(params.id);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json({ error: 'Invalid payout id' }, { status: 400 });
    }

    const [result] = await databaseConnect.execute<ResultSetHeader>(
      `
        UPDATE payments
        SET payout_calculated = 1, payout_paid_at = NOW()
        WHERE id = ?
      `,
      [paymentId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    console.info('[ADMIN] payout marked paid', {
      adminUserId: adminOrResponse.userId,
      paymentId,
    });

    return NextResponse.json(
      {
        message: 'Payout marked as paid',
        id: paymentId,
        payoutCalculated: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
