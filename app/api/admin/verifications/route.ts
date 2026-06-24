import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/server/adminAuth';
import { hasColumn } from '@/lib/server/dbSchema';

type VerificationFilter = 'PENDING' | 'VERIFIED' | 'REJECTED';

interface VerificationRow extends RowDataPacket {
  profile_id: number;
  user_id: number;
  full_name: string | null;
  email: string;
  verification_status: string | null;
  rejection_reason: string | null;
  is_blocked: number;
}

interface DocumentRow extends RowDataPacket {
  profile_id: number;
  document_type: string;
  file_path: string;
  uploaded_at: string | Date;
}

interface VerificationDocument {
  name: string;
  uploadedAt: string;
}

interface VerificationDocuments {
  idCard: VerificationDocument | null;
  schufa: VerificationDocument | null;
  tenantSelfDisclosure: VerificationDocument | null;
}

const DB_DOCUMENT_TO_UI_KEY: Record<string, keyof VerificationDocuments> = {
  ID_CARD: 'idCard',
  SHUFA: 'schufa',
  INCOME_STATEMENT: 'tenantSelfDisclosure',
};

function normalizeVerificationStatus(value: string | null): VerificationFilter {
  if (value === 'VERIFIED' || value === 'REJECTED') {
    return value;
  }

  return 'PENDING';
}

function parseVerificationFilter(value: string | null): VerificationFilter | null {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();
  if (normalized === 'PENDING' || normalized === 'VERIFIED' || normalized === 'REJECTED') {
    return normalized;
  }

  return null;
}

function mapDocuments(rows: DocumentRow[]): Map<number, VerificationDocuments> {
  const documentsByProfile = new Map<number, VerificationDocuments>();

  for (const row of rows) {
    const uiKey = DB_DOCUMENT_TO_UI_KEY[row.document_type];
    if (!uiKey) {
      continue;
    }

    const existing = documentsByProfile.get(row.profile_id) ?? {
      idCard: null,
      schufa: null,
      tenantSelfDisclosure: null,
    };

    if (existing[uiKey]) {
      continue;
    }

    const fileName = row.file_path.split('/').pop() || `${row.document_type}.pdf`;
    const uploadedAtDate = row.uploaded_at instanceof Date ? row.uploaded_at : new Date(row.uploaded_at);
    existing[uiKey] = {
      name: fileName,
      uploadedAt: Number.isNaN(uploadedAtDate.getTime()) ? '' : uploadedAtDate.toISOString(),
    };
    documentsByProfile.set(row.profile_id, existing);
  }

  return documentsByProfile;
}

export async function GET(request: NextRequest) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }

    const statusFilter = parseVerificationFilter(request.nextUrl.searchParams.get('status'));
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
    const likeSearch = `%${search}%`;
    const hasIsBlocked = await hasColumn('users', 'is_blocked');
    const hasRejectionReason = await hasColumn('profiles', 'rejection_reason');

    const whereClauses: string[] = ['u.role = ?'];
    const params: Array<string | number> = ['CLIENT'];

    if (statusFilter) {
      whereClauses.push('p.verification_status = ?');
      params.push(statusFilter);
    }

    if (search) {
      whereClauses.push(
        "(CONCAT_WS(' ', p.first_name, p.last_name) LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) LIKE ?)"
      );
      params.push(likeSearch, likeSearch, likeSearch);
    }

    const blockedProjection = hasIsBlocked ? 'u.is_blocked' : '0 AS is_blocked';
    const rejectionProjection = hasRejectionReason ? 'p.rejection_reason' : 'NULL AS rejection_reason';

    const [rows] = await databaseConnect.execute<VerificationRow[]>(
      `
        SELECT
          p.id AS profile_id,
          u.id AS user_id,
          CONCAT_WS(' ', p.first_name, p.last_name) AS full_name,
          u.email,
          p.verification_status,
          ${rejectionProjection},
          ${blockedProjection}
        FROM profiles p
        JOIN users u ON u.id = p.user_id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY p.id DESC
      `,
      params
    );

    const profileIds = rows.map((row) => row.profile_id);
    let documentsByProfile = new Map<number, VerificationDocuments>();

    if (profileIds.length) {
      const placeholders = profileIds.map(() => '?').join(', ');
      const [documentRows] = await databaseConnect.execute<DocumentRow[]>(
        `
          SELECT profile_id, document_type, file_path, uploaded_at
          FROM documents
          WHERE profile_id IN (${placeholders})
          ORDER BY uploaded_at DESC, id DESC
        `,
        profileIds
      );
      documentsByProfile = mapDocuments(documentRows);
    }

    const verifications = rows.map((row) => ({
      profileId: row.profile_id,
      userId: row.user_id,
      fullName: row.full_name?.trim() || row.email.split('@')[0] || `User ${row.user_id}`,
      email: row.email,
      verificationStatus: normalizeVerificationStatus(row.verification_status),
      rejectionReason: row.rejection_reason,
      isBlocked: Boolean(Number(row.is_blocked ?? 0)),
      documents: documentsByProfile.get(row.profile_id) ?? {
        idCard: null,
        schufa: null,
        tenantSelfDisclosure: null,
      },
    }));

    console.info('[ADMIN] verifications loaded', {
      adminUserId: adminOrResponse.userId,
      status: statusFilter || 'ALL',
      search,
      total: verifications.length,
    });

    return NextResponse.json({ verifications }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin verifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
