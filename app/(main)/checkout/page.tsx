import { redirect } from 'next/navigation';
import CheckoutClientPage from '@/app/(main)/checkout/CheckoutClientPage';
import type { HeaderUser } from '@/components/layout/types';
import { getSessionUser } from '@/lib/server/getSessionUser';

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
