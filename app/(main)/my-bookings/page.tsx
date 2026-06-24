import { redirect } from 'next/navigation';

import MyBookingsClientPage from '@/app/(main)/my-bookings/MyBookingsClientPage';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { getDefaultRouteForRole, isClientRole } from '@/lib/types';

export default async function MyBookingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }
  if (!isClientRole(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return <MyBookingsClientPage user={user} />;
}
