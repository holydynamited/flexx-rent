import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import LandingHeader from '@/components/home-page/LandingHeader';
import LandingHero from '@/components/home-page/LandingHero';
import LandingAbout from '@/components/home-page/LandingAbout';
import LandingPortfolio from '@/components/home-page/LandingPortfolio';
import LandingFooter from '@/components/home-page/LandingFooter';
import type { UserRole, VerificationStatus } from '@/lib/types';

interface SessionPayload {
  userId: number;
  email: string;
  role: string;
}

async function getSessionUser() {
  const token = (await cookies()).get('session_token')?.value;
  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as SessionPayload;
    const [firstNameFromEmail = 'User'] = session.email.split('@');

    return {
      email: session.email,
      firstName: firstNameFromEmail,
      lastName: 'Client',
      role: (session.role || 'CLIENT') as UserRole,
      verificationStatus: 'VERIFIED' as VerificationStatus,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#f5f5f7] gap-3">
      <LandingHeader user={user} />
      <main>
        <LandingHero />
        <LandingPortfolio />
        <div className="mb-6">
          <LandingAbout />
        </div>
        
      </main>
      <LandingFooter />
    </div>
  );
}
