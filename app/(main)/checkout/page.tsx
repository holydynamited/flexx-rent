import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import CheckoutClientPage from '@/app/(main)/checkout/CheckoutClientPage';
import type { HeaderUser } from '@/components/layout/types';
import type { UserRole, VerificationStatus } from '@/lib/types';

interface SessionPayload {
  userId: number;
  email: string;
  role: string;
}

async function getSessionUser(): Promise<HeaderUser | null> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as SessionPayload;
    const [firstNameFromEmail = 'Client'] = session.email.split('@');

    return {
      email: session.email,
      firstName: firstNameFromEmail,
      lastName: 'User',
      role: (session.role || 'CLIENT') as UserRole,
      verificationStatus: 'VERIFIED' as VerificationStatus,
    };
  } catch {
    return null;
  }
}

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!user && !isDevelopment) redirect('/login');
  if (user && user.role !== 'CLIENT' && !isDevelopment) redirect('/');

  const resolvedUser: HeaderUser =
    user ??
    ({
      email: 'demo.client@flexxrent.local',
      firstName: 'Demo',
      lastName: 'Client',
      role: 'CLIENT',
      verificationStatus: 'VERIFIED',
    } as HeaderUser);

  return <CheckoutClientPage user={resolvedUser} />;
}
