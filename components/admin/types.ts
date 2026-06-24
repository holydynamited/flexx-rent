export type AdminTab = 'verification' | 'accounts' | 'finances';
export type VerificationTab = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type RoleFilter = 'ALL' | 'CLIENT' | 'AGENT';
export type PayoutFilter = 'ALL' | 'PENDING' | 'CALCULATED';

export interface DocumentInfo {
  name: string;
  uploadedAt: string;
}

export interface ClientDocuments {
  idCard: DocumentInfo | null;
  schufa: DocumentInfo | null;
  tenantSelfDisclosure: DocumentInfo | null;
}

export interface AdminProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: 'CLIENT' | 'AGENT';
  status: VerificationTab;
  rejectionReason?: string;
  isBlocked: boolean;
  documents?: ClientDocuments;
  managedProperties?: number;
}

export interface PaymentLedgerRow {
  id: number;
  bookingId: number;
  client: string;
  agent: string;
  property: string;
  baseRent: number;
  deposit: number;
  totalPaid: number;
  paymentDate: string | null;
  payoutCalculated: boolean;
  payoutPaidAt: string | null;
}
