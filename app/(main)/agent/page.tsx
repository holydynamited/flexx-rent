import { redirect } from 'next/navigation';
import AgentCmsClientPage from '@/app/(main)/agent/AgentCmsClientPage';
import type { HeaderUser } from '@/components/layout/types';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { getDefaultRouteForRole, isAgentRole } from '@/lib/types';

export default async function AgentPage() {
  const user = await getSessionUser();
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!user && !isDevelopment) redirect('/login');
  if (user && !isAgentRole(user.role) && !isDevelopment) {
    redirect(getDefaultRouteForRole(user.role));
  }

  const resolvedUser: HeaderUser =
    user ??
    ({
      email: 'demo.agent@flexxrent.local',
      firstName: 'Demo',
      lastName: 'Agent',
      role: 'AGENT',
      verificationStatus: 'VERIFIED',
    } as HeaderUser);

  return <AgentCmsClientPage user={resolvedUser} />;
}
