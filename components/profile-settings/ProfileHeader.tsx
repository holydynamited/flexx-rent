'use client';

import AppHeader from '@/components/layout/AppHeader';
import type { UserProfile } from '@/components/profile-settings/types';

interface ProfileHeaderProps {
  user: UserProfile;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <AppHeader
      user={{
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'CLIENT',
        verificationStatus: 'VERIFIED',
      }}
      brandSubtitle="Account"
      centerContent={
        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-400">
          <span>Home</span>
          <span>/</span>
          <span className="text-[#1d1d1f]">Profile settings</span>
        </div>
      }
    />
  );
}
