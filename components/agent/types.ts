export type AgentTab = 'bookings' | 'properties';
export type BookingStatus = 'Pending' | 'AwaitingPayment' | 'Paid' | 'Cancelled';

export interface AgentProperty {
  id: string;
  title: string;
  address: string;
  baseRent: number;
  utilityCosts: number;
  rooms: number;
  area: number;
  status: 'Available' | 'Rented';
  imagePlaceholder: string;
}

export interface AgentBooking {
  id: string;
  propertyId: string;
  propertyName: string;
  clientName: string;
  clientEmail: string;
  clientStatus: 'Verified';
  requestedDate: string;
  status: BookingStatus;
  timeLeft: number | null;
}
