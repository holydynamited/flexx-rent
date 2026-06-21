export interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  type: 'Apartment' | 'Loft' | 'Penthouse' | 'Studio' | 'Villa';
  price: number;
  deposit: number;
  area: number;
  rooms: number;
  floor: string;
  availableFrom: string;
  image: string;
  description: string;
  furnished: boolean;
  petsAllowed: boolean;
  hasBalcony: boolean;
  hasParking: boolean;
  hasKitchen: boolean;
  amenities: string[];
}

export type SortBy = 'price-asc' | 'price-desc' | 'area-desc';
export type ViewMode = 'grid' | 'list';
export type RoomsCount = 'Any' | '1' | '2' | '3' | '4+';
