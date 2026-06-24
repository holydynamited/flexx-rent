import { redirect } from 'next/navigation';

import MyBookingsClientPage from '@/app/(main)/my-bookings/MyBookingsClientPage';
import { getSessionUser } from '@/lib/server/getSessionUser';

export default async function MyBookingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return <MyBookingsClientPage user={user} />;
}
