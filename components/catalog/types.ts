export type Status = 'AVAILABLE' | 'PENDING_PAYMENT' | 'RESERVED' | 'ARCHIVED';
export type HeatingType = 'GAS' | 'DISTRICT' | 'ELECTRIC' | 'HEAT_PUMP';
export interface PropertyImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface PropertyRow {
  id: number;
  title: string;
  description: string | null;
  base_rent: string;        
  utility_costs: string;   
  deposit_amount: string;   
  area_sqm: string;         
  rooms_count: string;     
  heating_type: HeatingType;
  city: string;
  postal_code: string;
  street_address: string;
  amenities_text: string | null;
  status: Status;
  created_at: string;       
  images: PropertyImage[];
}

export type SortBy = 'price-asc' | 'price-desc' | 'area-desc';
export type ViewMode = 'grid' | 'list';
export type RoomsCount = 'Any' | '1' | '2' | '3' | '4+';
