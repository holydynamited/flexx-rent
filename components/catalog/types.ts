export interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  price: number;
  utilityCosts: number;
  deposit: number;
  area: number;
  rooms: number;
  image: string;
  description: string;
  amenities: string[];
  heatingType?: string;
  type?: 'Apartment' | 'Loft' | 'Penthouse' | 'Studio' | 'Villa';
  availableFrom?: string;
  floor?: string;
  furnished?: boolean;
  petsAllowed?: boolean;
  hasBalcony?: boolean;
  hasParking?: boolean;
  hasKitchen?: boolean;
}

export type SortBy = 'price-asc' | 'price-desc' | 'area-desc';
export type ViewMode = 'grid' | 'list';
export type RoomsCount = 'Any' | '1' | '2' | '3' | '4+';
