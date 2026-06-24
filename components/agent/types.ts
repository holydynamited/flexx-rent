export type AgentTab = 'bookings' | 'properties';
export type BookingStatus = 'NEW' | 'PENDING_PAYMENT' | 'RESERVED' | 'CANCELLED';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';
export type AgentPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED';

export interface AgentProperty {
  id: number;
  title: string;
  address: string;
  baseRent: number;
  utilityCosts: number;
  rooms: number;
  area: number;
  status: 'Available' | 'Pending payment' | 'Reserved' | 'Archived';
  dbStatus: 'AVAILABLE' | 'PENDING_PAYMENT' | 'RESERVED' | 'ARCHIVED';
  imagePlaceholder: string;
}

export interface AgentBooking {
  id: number;
  createdAt: string;
  expiresAt: string;
  status: BookingStatus;
  property: {
    id: number;
    title: string;
    address: string;
    image: string;
  };
  client: {
    id: number;
    fullName: string;
    email: string;
    verificationStatus: VerificationStatus;
  };
  payment: {
    status: AgentPaymentStatus;
    paidAt: string | null;
  };
}
