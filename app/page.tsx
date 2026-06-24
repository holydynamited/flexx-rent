import LandingHeader from '@/components/home-page/LandingHeader';
import LandingHero from '@/components/home-page/LandingHero';
import LandingAbout from '@/components/home-page/LandingAbout';
import LandingPortfolio from '@/components/home-page/LandingPortfolio';
import LandingFooter from '@/components/home-page/LandingFooter';
import { RowDataPacket } from 'mysql2';
import { databaseConnect } from '@/lib/db';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { getDefaultRouteForRole, isClientRole } from '@/lib/types';
import { sanitizePropertyImageUrl } from '@/lib/shared/propertyImage';
import { redirect } from 'next/navigation';

interface LandingPortfolioPropertyRow extends RowDataPacket {
  id: number;
  title: string;
  city: string;
  street_address: string;
  base_rent: string;
  area_sqm: string;
  rooms_count: string;
  image_url: string | null;
}

async function getLandingPortfolioProperties() {
  try {
    const [rows] = await databaseConnect.execute<LandingPortfolioPropertyRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.city,
          p.street_address,
          p.base_rent,
          p.area_sqm,
          p.rooms_count,
          (
            SELECT pi.image_url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ) AS image_url
        FROM properties p
        WHERE p.status = 'AVAILABLE'
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 12
      `
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      district: row.city,
      streetAddress: row.street_address,
      baseRent: Number(row.base_rent) || 0,
      areaSqm: Number(row.area_sqm) || 0,
      roomsCount: Number(row.rooms_count) || 0,
      imageUrl: sanitizePropertyImageUrl(row.image_url),
    }));
  } catch (error) {
    console.error('Error loading landing portfolio properties:', error);
    return [];
  }
}

export default async function Home() {
  const user = await getSessionUser();
  if (user && !isClientRole(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }
  const portfolioProperties = await getLandingPortfolioProperties();

  return (
    <div className="min-h-screen bg-[#f5f5f7] gap-3">
      <LandingHeader user={user} />
      <main>
        <LandingHero />
        <LandingPortfolio properties={portfolioProperties} isAuthenticated={Boolean(user)} />
        <div className="mb-6">
          <LandingAbout />
        </div>
        
      </main>
      <LandingFooter />
    </div>
  );
}
