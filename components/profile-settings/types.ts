import type { UserRole, VerificationStatus } from '@/lib/types';

export type SettingsTab = 'personal' | 'security' | 'documents' | 'notifications';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  phone: string;
  preferredDistrict: string;
  monthlyBudget: number;
  avatar: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  preferredDistrict: string;
  monthlyBudget: number;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UploadedDocument {
  name: string;
  size: string;
  uploadedAt: string;
}

export interface DocumentState {
  idCard: UploadedDocument | null;
  schufa: UploadedDocument | null;
  tenantSelfDisclosure: UploadedDocument | null;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  matchingAlerts: boolean;
}
