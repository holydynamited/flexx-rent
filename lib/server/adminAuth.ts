import { NextRequest, NextResponse } from 'next/server';

import { requireApiUser } from '@/lib/server/apiAuth';

export async function requireAdmin(request: NextRequest) {
  const adminOrResponse = await requireApiUser(request, { requiredRole: 'ADMIN' });
  if (adminOrResponse instanceof NextResponse) {
    return adminOrResponse;
  }

  return adminOrResponse;
}
