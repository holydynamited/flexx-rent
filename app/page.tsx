import LandingHeader from '@/components/home-page/LandingHeader';
import LandingHero from '@/components/home-page/LandingHero';
import LandingAbout from '@/components/home-page/LandingAbout';
import LandingPortfolio from '@/components/home-page/LandingPortfolio';
import LandingFooter from '@/components/home-page/LandingFooter';
import { getSessionUser } from '@/lib/server/getSessionUser';

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
