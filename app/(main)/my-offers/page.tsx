import { redirect } from 'next/navigation';

import MyOffersClientPage from '@/app/(main)/my-offers/MyOffersClientPage';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { getDefaultRouteForRole, isClientRole } from '@/lib/types';

export default async function MyOffersPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!isClientRole(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return <MyOffersClientPage user={user} />;
}
