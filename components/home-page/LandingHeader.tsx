'use client';

import React from 'react';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import type { HeaderUser } from '@/components/layout/types';

interface LandingHeaderProps {
  user: HeaderUser | null;
}

export default function LandingHeader({ user }: LandingHeaderProps) {
  return (
    <AppHeader
      user={user}
      centerContent={
        <nav className="hidden md:flex items-center space-x-10 text-[14px] font-medium text-slate-600">
          <Link href="/" className="hover:text-[#1d1d1f] transition-colors">
            Home
          </Link>
          <Link href="/catalog" className="hover:text-[#1d1d1f] transition-colors">
            Catalog
          </Link>
          {user ? (
            <Link href="/matcher" className="hover:text-[#1d1d1f] transition-colors">
              Smart Matcher
            </Link>
          ) : null}
          <Link href="/how-it-works" className="hover:text-[#1d1d1f] transition-colors">
            How it works
          </Link>
        </nav>
      }
    />
  );
}