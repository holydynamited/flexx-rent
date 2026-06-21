export type AdminTab = 'verification' | 'accounts' | 'finances';
export type VerificationTab = 'Pending' | 'Verified' | 'Rejected';
export type RoleFilter = 'ALL' | 'CLIENT' | 'AGENT';
export type PayoutFilter = 'ALL' | 'PENDING' | 'CALCULATED';

export interface DocumentInfo {
  name: string;
  size: string;
  uploadedAt: string;
  status: 'Uploaded' | 'Verified' | 'Rejected';
  score?: string;
}

export interface ClientDocuments {
  idCard: DocumentInfo;
  schufa: DocumentInfo;
  selbstauskunft: DocumentInfo;
}

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  registrationDate: string;
  role: 'CLIENT' | 'AGENT';
  status: 'Pending' | 'Verified' | 'Rejected';
  rejectionReason?: string;
  isBlocked: boolean;
  documents?: ClientDocuments;
  managedProperties?: number;
}

export interface PaymentLedgerRow {
  id: string;
  clientName: string;
  agentName: string;
  agentId: string;
  propertyTitle: string;
  baseRent: number;
  utilityCosts: number;
  deposit: number;
  totalPaid: number;
  paymentDate: string;
  status: 'PAID';
  payoutCalculated: boolean;
}
