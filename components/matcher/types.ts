export type HeatingType = 'GAS' | 'DISTRICT' | 'ELECTRIC' | 'HEAT_PUMP';

export interface MatcherProperty {
  id: string;
  title: string;
  city: string;
  address: string;
  baseRent: number;
  utilityCosts: number;
  rooms: number;
  area: number;
  heating: HeatingType;
  image: string;
}
