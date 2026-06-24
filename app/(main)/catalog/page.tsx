import CatalogClientPage from '@/app/(main)/catalog/CatalogClientPage';
import { RowDataPacket } from 'mysql2';
import type { Property } from '@/components/catalog/types';
import { databaseConnect } from '@/lib/db';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { getDefaultRouteForRole, isClientRole } from '@/lib/types';
import { redirect } from 'next/navigation';



interface PropertyCatalogRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  base_rent: string;
  utility_costs: string;
  deposit_amount: string;
  area_sqm: string;
  rooms_count: string;
  heating_type: string;
  city: string;
  postal_code: string;
  street_address: string;
  amenities_text: string | null;
  image_url: string | null;
}

const CATALOG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80';

function parseAmenities(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((amenity) => amenity.trim())
    .filter(Boolean);
}

async function getPropertyCatalog(): Promise<Property[]> {
  try {
    const [rows] = await databaseConnect.execute<PropertyCatalogRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.description,
          p.base_rent,
          p.utility_costs,
          p.deposit_amount,
          p.area_sqm,
          p.rooms_count,
          p.heating_type,
          p.city,
          p.postal_code,
          p.street_address,
          p.amenities_text,
          (
            SELECT pi.image_url
            FROM property_images pi
            WHERE pi.property_id = p.id
            ORDER BY pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ) AS image_url
        FROM properties p
        WHERE p.status = 'AVAILABLE'
        ORDER BY p.created_at DESC
      `
    );

    return rows.map((row) => {
      const roomsCount = Number(row.rooms_count) || 0;

      return {
        id: row.id,
        title: row.title,
        address: `${row.street_address}, ${row.postal_code} ${row.city}`,
        city: row.city,
        price: Number(row.base_rent) || 0,
        utilityCosts: Number(row.utility_costs) || 0,
        deposit: Number(row.deposit_amount) || 0,
        area: Number(row.area_sqm) || 0,
        rooms: roomsCount,
        heatingType: row.heating_type,
        image: row.image_url || CATALOG_FALLBACK_IMAGE,
        description: row.description || 'No description provided yet.',
        amenities: parseAmenities(row.amenities_text),
      };
    });
  } catch (error) {
    console.error('Error loading property catalog:', error);
    return [];
  }
}

export default async function CatalogPage() {
  const user = await getSessionUser();
  if (user && !isClientRole(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }
  const properties = await getPropertyCatalog();

  return <CatalogClientPage user={user} properties={properties} />;
}
