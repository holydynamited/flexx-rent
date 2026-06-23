import { redirect } from 'next/navigation';
import MatcherClientPage from '@/app/(main)/matcher/MatcherClientPage';
import type { HeaderUser } from '@/components/layout/types';
import { getSessionUser } from '@/lib/server/getSessionUser';

export default async function MatcherPage() {
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

  return <MatcherClientPage user={resolvedUser} />;
}
