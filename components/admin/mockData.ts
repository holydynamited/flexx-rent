import type { AdminProfile, PaymentLedgerRow } from '@/components/admin/types';

export const REJECTION_PRESETS = [
  'Outdated Schufa statement (must be newer than 3 months)',
  'ID card image quality is too low to verify identity',
  'Selbstauskunft form is missing required signature fields',
  'Income proofs are missing for the latest 3 months',
  'Potential signs of document manipulation detected',
];

export const INITIAL_PROFILES: AdminProfile[] = [];

export const INITIAL_PAYMENTS: PaymentLedgerRow[] = [];
