import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';
import ProfileSettingsClient from './ProfileSettingsClient';
import type { UserProfile } from '@/components/profile-settings/types';

interface SessionPayload {
  userId: number;
  email: string;
  role: string;
}

interface ProfileRow extends RowDataPacket {
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
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
    phone: row.phone ?? '',
    preferredDistrict: '',
    monthlyBudget: 0,
    avatar: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
  };

  return <ProfileSettingsClient initialProfile={initialProfile} />;
}