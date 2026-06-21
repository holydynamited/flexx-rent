'use client';

import BrandIdentity from '@/components/BrandIdentity';
import type { UserProfile } from '@/components/profile-settings/types';

interface ProfileHeaderProps {
  user: UserProfile;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.03] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <BrandIdentity href="/" subtitle="Account" />

        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-400">
          <span>Home</span>
          <span>/</span>
          <span className="text-[#1d1d1f]">Profile settings</span>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-black/[0.04] rounded-full px-4 py-2 shadow-sm">
          <div className="w-7 h-7 bg-[#1d1d1f] text-white font-serif text-xs rounded-full flex items-center justify-center font-bold">
            {user.avatar}
          </div>
          <span className="text-xs font-medium text-[#1d1d1f]">
            {user.firstName} {user.lastName[0]}.
          </span>
        </div>
      </div>
    </header>
  );
}
