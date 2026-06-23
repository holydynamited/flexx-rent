import CatalogClientPage from '@/app/(main)/catalog/CatalogClientPage';
import { getSessionUser } from '@/lib/server/getSessionUser';

export default async function CatalogPage() {
  const user = await getSessionUser();
  return <CatalogClientPage user={user} />;
}
