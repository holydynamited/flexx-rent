import type { UserRole, VerificationStatus } from '@/lib/types';

export interface HeaderUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
}
