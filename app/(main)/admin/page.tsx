import { redirect } from 'next/navigation';
import AdminCmsClientPage from '@/app/(main)/admin/AdminCmsClientPage';
import type { HeaderUser } from '@/components/layout/types';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { getDefaultRouteForRole, isAdminRole } from '@/lib/types';

export default async function AdminPage() {
  const user = await getSessionUser();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!user && !isDevelopment) redirect('/login');
  if (user && !isAdminRole(user.role) && !isDevelopment) {
    redirect(getDefaultRouteForRole(user.role));
  }

  const resolvedUser: HeaderUser =
    user ??
    ({
      email: 'demo.admin@flexxrent.local',
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
    } as HeaderUser);

  return <AdminCmsClientPage user={resolvedUser} />;
}
