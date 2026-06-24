import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';

type PayoutFilter = 'ALL' | 'PENDING' | 'CALCULATED';

interface PayoutRow extends RowDataPacket {
  payment_id: number;
  booking_id: number;
  client_name: string | null;
  client_email: string;
  agent_email: string | null;
  agent_name: string | null;
  property_title: string;
  base_rent: string;
  utility_costs: string;
  deposit_amount: string;
  amount: string;
  paid_at: string | Date | null;
  payout_calculated?: number;
  payout_paid_at?: string | Date | null;
}

function parsePayoutFilter(value: string | null): PayoutFilter {
  const normalized = value?.toUpperCase();
  if (normalized === 'PENDING' || normalized === 'CALCULATED') {
    return normalized;
  }

  return 'ALL';
}

export async function GET(request: NextRequest) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const payoutCalculatedColumn = await hasColumn('payments', 'payout_calculated');
    const payoutPaidAtColumn = await hasColumn('payments', 'payout_paid_at');
    const filter = parsePayoutFilter(request.nextUrl.searchParams.get('status'));

    const payoutCalculatedProjection = payoutCalculatedColumn ? 'pay.payout_calculated' : '0 AS payout_calculated';
    const payoutPaidAtProjection = payoutPaidAtColumn ? 'pay.payout_paid_at' : 'NULL AS payout_paid_at';

    const whereClauses = ["pay.transaction_status = 'SUCCESS'"];
    if (filter === 'PENDING') {
      whereClauses.push(`${payoutCalculatedColumn ? 'pay.payout_calculated' : '0'} = 0`);
    }
    if (filter === 'CALCULATED') {
      whereClauses.push(`${payoutCalculatedColumn ? 'pay.payout_calculated' : '0'} = 1`);
    }

    const [rows] = await databaseConnect.execute<PayoutRow[]>(
      `
        SELECT
          pay.id AS payment_id,
          pay.booking_id,
          CONCAT_WS(' ', cp.first_name, cp.last_name) AS client_name,
          cu.email AS client_email,
          au.email AS agent_email,
          CONCAT_WS(' ', ap.first_name, ap.last_name) AS agent_name,
          prop.title AS property_title,
          prop.base_rent,
          prop.utility_costs,
          prop.deposit_amount,
          pay.amount,
          pay.paid_at,
          ${payoutCalculatedProjection},
          ${payoutPaidAtProjection}
        FROM payments pay
        JOIN bookings b ON b.id = pay.booking_id
        JOIN properties prop ON prop.id = b.property_id
        JOIN profiles cp ON cp.id = b.client_profile_id
        JOIN users cu ON cu.id = cp.user_id
        LEFT JOIN profiles ap ON ap.id = b.agent_id
        LEFT JOIN users au ON au.id = ap.user_id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY pay.paid_at DESC, pay.id DESC
      `
    );

    const payouts = rows.map((row) => {
      const baseRent = Number(row.base_rent) || 0;
      const utilityCosts = Number(row.utility_costs) || 0;
      const deposit = Number(row.deposit_amount) || 0;
      const amount = Number(row.amount) || 0;
      const defaultTotal = baseRent + utilityCosts + deposit;
      const paidAtDate = row.paid_at ? (row.paid_at instanceof Date ? row.paid_at : new Date(row.paid_at)) : null;
      const payoutPaidAtDate = row.payout_paid_at
        ? row.payout_paid_at instanceof Date
          ? row.payout_paid_at
          : new Date(row.payout_paid_at)
        : null;

      return {
        id: row.payment_id,
        bookingId: row.booking_id,
        client: row.client_name?.trim() || row.client_email.split('@')[0] || `Client ${row.booking_id}`,
        agent: row.agent_name?.trim() || row.agent_email?.split('@')[0] || 'Unassigned',
        property: row.property_title,
        baseRent,
        deposit,
        totalPaid: amount > 0 ? amount : defaultTotal,
        paymentDate: paidAtDate && !Number.isNaN(paidAtDate.getTime()) ? paidAtDate.toISOString() : null,
        payoutCalculated: Boolean(Number(row.payout_calculated ?? 0)),
        payoutPaidAt:
          payoutPaidAtDate && !Number.isNaN(payoutPaidAtDate.getTime()) ? payoutPaidAtDate.toISOString() : null,
      };
    });

    console.info('[ADMIN] payouts loaded', {
      adminUserId: adminOrResponse.userId,
      status: filter,
      total: payouts.length,
    });

    return NextResponse.json({ payouts }, { status: 200 });
  } catch (error) {
    console.error('Error loading admin payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
