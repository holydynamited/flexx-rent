'use client';

import Link from 'next/link';

import type { HeaderUser } from '@/components/layout/types';

interface ProfileMenuNavItem {
  href: string;
  label: string;
}

interface ProfileMenuPanelProps {
  user: HeaderUser;
  pathname: string;
  roleMenuNav: ProfileMenuNavItem[];
  isNavItemActive: (pathname: string, href: string) => boolean;
  onSignOut: () => void;
}

export default function ProfileMenuPanel({
  user,
  pathname,
  roleMenuNav,
  isNavItemActive,
  onSignOut,
}: ProfileMenuPanelProps) {
  return (
    <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-black/[0.04] z-50">
      <div className="flex items-center space-x-3 pb-4 border-b border-black/[0.04]">
        <div className="w-12 h-12 bg-slate-100 border border-black/[0.05] text-[#1d1d1f] font-serif font-bold text-xl rounded-full flex items-center justify-center">
          {user.firstName[0].toUpperCase()}
          {user.lastName[0].toUpperCase()}
        </div>
        <div>
          <h4 className="font-serif text-[#1d1d1f] text-sm font-semibold">
            {user.firstName} {user.lastName}
          </h4>
          <p className="text-[11px] text-slate-500">{user.email}</p>
          {user.role === 'ADMIN' ? (
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Role: {user.role}</p>
          ) : null}
        </div>
      </div>
      <div className="pt-4 space-y-2">
        {roleMenuNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block w-full text-center py-2.5 rounded-full text-xs font-semibold transition-colors ${
              isNavItemActive(pathname, item.href)
                ? 'bg-[#1d1d1f] text-white hover:bg-black'
                : 'bg-white border border-black/[0.08] text-[#1d1d1f] hover:bg-black/[0.02]'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={onSignOut}
          className="w-full text-center text-red-600 hover:bg-red-50 py-2 rounded-full text-[11px] font-semibold transition-colors block"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
