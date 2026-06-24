import CatalogClientPage from '@/app/(main)/catalog/CatalogClientPage';
import { getSessionUser } from '@/lib/server/getSessionUser';
import { databaseConnect } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { PropertyRow } from '@/components/catalog/types';

interface CatalogJoinRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  base_rent: string;
  utility_costs: string;
  deposit_amount: string;
  area_sqm: string;
  rooms_count: string;
  heating_type: PropertyRow['heating_type'];
  city: string;
  postal_code: string;
  street_address: string;
  amenities_text: string | null;
  status: PropertyRow['status'];
  created_at: string;
  image_id: number | null;
  image_url: string | null;
  sort_order: number | null;
}

export async function getPropertyCatalog(): Promise<PropertyRow[]> {
  try {
    const [rows] = await databaseConnect.execute<CatalogJoinRow[]>(
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
        p.status,
        p.created_at,
        i.id as image_id,
        i.image_url,
        i.sort_order
      FROM properties p
      LEFT JOIN property_images i ON p.id = i.property_id
      WHERE p.status = 'AVAILABLE'
      ORDER BY p.created_at DESC, i.sort_order ASC, i.id ASC
      `
    );

    const byId = new Map<number, PropertyRow>();

    for (const row of rows) {
      if (!byId.has(row.id)) {
        byId.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          base_rent: row.base_rent,
          utility_costs: row.utility_costs,
          deposit_amount: row.deposit_amount,
          area_sqm: row.area_sqm,
          rooms_count: row.rooms_count,
          heating_type: row.heating_type,
          city: row.city,
          postal_code: row.postal_code,
          street_address: row.street_address,
          amenities_text: row.amenities_text,
          status: row.status,
          created_at: row.created_at,
          images: [],
        });
      }

      if (row.image_id && row.image_url) {
        byId.get(row.id)!.images.push({
          id: row.image_id,
          image_url: row.image_url,
          sort_order: row.sort_order ?? 0,
        });
      }
    }

    return Array.from(byId.values());
  } catch (error) {
    console.error('Error loading property catalog:', error);
    return [];
  }
}

export default async function CatalogPage() {
  const user = await getSessionUser();
  const properties = await getPropertyCatalog();
  return <CatalogClientPage user={user} properties={properties} />;
}
