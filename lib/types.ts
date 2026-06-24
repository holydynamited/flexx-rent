// ==========================================
// 1. CORE USER & ACCOUNT TYPES
// ==========================================

export type UserRole = 'GUEST' | 'CLIENT' | 'AGENT' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  verificationStatus: VerificationStatus;
  updatedAt: string;
}

// ==========================================
// 2. DOCUMENTATION TYPES
// ==========================================

export type DocumentType = 'SHUFA' | 'INCOME_STATEMENT' | 'ID_CARD';

export interface TenantDocument {
  id: number;
  profileId: number;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
  verifiedBy: number | null;
  verifiedAt: string | null;
  rejectionComment: string | null;
}


export interface DashboardDocuments {
  idCard: string | null;       
  schufa: string | null;       
  selbstauskunft: string | null; 
}

// ==========================================
// 3. PROPERTY & IMMOBILIEN TYPES
// ==========================================

export type PropertyStatus = 'AVAILABLE' | 'PENDING_PAYMENT' | 'RESERVED' | 'ARCHIVED';
export type HeatingType = 'GAS' | 'DISTRICT' | 'ELECTRIC' | 'HEAT_PUMP';

export interface PropertyImage {
  id: number;
  propertyId: number;
  imageUrl: string;
  sortOrder: number;
}

export interface Property {
  id: number;
  title: string;
  description: string | null;
  baseRent: string;      
  utilityCosts: string;  
  depositAmount: string;  
  areaSqm: string;        
  roomsCount: string;     
  heatingType: HeatingType;
  city: string;
  postalCode: string;
  streetAddress: string;
  amenitiesText: string | null; 
  status: PropertyStatus;
  createdAt: string;
  images?: PropertyImage[];
}

// ==========================================
// 4. LEASEHOLD & TRANSACTION TYPES
// ==========================================

export type BookingStatus = 'NEW' | 'PENDING' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Booking {
  id: number;
  clientProfileId: number;
  propertyId: number;
  agentId: number | null;
  status: BookingStatus;
  createdAt: string;
  expiresAt: string;
}


export interface ActiveBookingDashboard {
  booking_status: BookingStatus;
  expires_at: string;
  property_id: number;
  title: string;
  street_address: string;
  city: string;
  base_rent: string;
  deposit_amount: string;
  amenities_text: string | null;
}

export interface Payment {
  id: number;
  bookingId: number;
  amount: string; // DECIMAL
  transactionStatus: PaymentStatus;
  paidAt: string;
}

// ==========================================
// 5. SEARCH & AUTOMATED MATCHING TYPES
// ==========================================

export interface SearchQuestionnaire {
  id: number;
  clientProfileId: number;
  city: string;
  maxTotalRent: string;  
  minRooms: string;      
  minAreaSqm: string;   
  isActive: boolean;
  updatedAt: string;
}