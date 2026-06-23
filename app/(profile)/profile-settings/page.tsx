import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import ProfileSettingsClient from './ProfileSettingsClient';
import type { DocumentState, UserProfile } from '@/components/profile-settings/types';

interface SessionPayload {
  userId: number;
  email: string;
  role: string;
}

interface ProfileRow extends RowDataPacket {
  email: string;
  role: string | null;
  verification_status: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface DocumentRow extends RowDataPacket {
  document_type: string;
  file_path: string;
  uploaded_at: string | Date;
}

const dbTypeToUiKey: Record<string, keyof DocumentState> = {
  ID_CARD: 'idCard',
  SHUFA: 'schufa',
  INCOME_STATEMENT: 'tenantSelfDisclosure',
};

function formatUploadedAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Today';
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function getSessionOrRedirect(): Promise<SessionPayload> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token || !process.env.JWT_SECRET) redirect('/login');

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    redirect('/login');
  }
}

export default async function ProfileSettingsPage() {
  const session = await getSessionOrRedirect();

  const [rows] = await databaseConnect.execute<ProfileRow[]>(
    `
      SELECT
        u.email,
        u.role,
        p.verification_status,
        p.first_name,
        p.last_name,
        p.phone
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [session.userId]
  );

  if (!rows.length) redirect('/login');

  const row = rows[0];
  const firstName = row.first_name ?? 'New';
  const lastName = row.last_name ?? 'User';

  const initialProfile: UserProfile = {
    firstName,
    lastName,
    email: row.email ?? session.email,
    role: (row.role || session.role || 'CLIENT') as UserProfile['role'],
    verificationStatus: (row.verification_status || 'PENDING') as UserProfile['verificationStatus'],
    phone: row.phone ?? '',
    preferredDistrict: '',
    monthlyBudget: 0,
    avatar: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
  };

  const [documents] = await databaseConnect.execute<DocumentRow[]>(
    `
      SELECT d.document_type, d.file_path, d.uploaded_at
      FROM documents d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.user_id = ?
      ORDER BY d.uploaded_at DESC
    `,
    [session.userId]
  );

  const initialDocuments: DocumentState = {
    idCard: null,
    schufa: null,
    tenantSelfDisclosure: null,
  };

  for (const document of documents) {
    const uiKey = dbTypeToUiKey[document.document_type];
    if (!uiKey || initialDocuments[uiKey]) {
      continue;
    }

    const nameFromPath = document.file_path.split('/').pop() || `${document.document_type}.pdf`;
    initialDocuments[uiKey] = {
      name: nameFromPath,
      size: 'PDF',
      uploadedAt: formatUploadedAt(document.uploaded_at),
    };
  }

  return <ProfileSettingsClient initialProfile={initialProfile} initialDocuments={initialDocuments} />;
}