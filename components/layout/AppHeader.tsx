'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import BrandIdentity from '@/components/BrandIdentity';
import ProfileMenuPanel from '@/components/layout/ProfileMenuPanel';
import type { HeaderUser } from '@/components/layout/types';
import type { UserRole } from '@/lib/types';

interface AppHeaderProps {
  user: HeaderUser | null;
  centerContent?: ReactNode;
  brandSubtitle?: string;
  showBrand?: boolean;
  showRoleNav?: boolean;
  showCenterContent?: boolean;
}

interface RoleNavItem {
  href: string;
  label: string;
}

function getClientTopNavConfig(isAuthenticated: boolean): RoleNavItem[] {
  const nav: RoleNavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Catalog' },
  ];

  if (isAuthenticated) {
    nav.push({ href: '/matcher', label: 'Matcher' });
  }

  nav.push({ href: '/how-it-works', label: 'How it works' });
  return nav;
}

function getRoleTopNavConfig(role: UserRole, isAuthenticated: boolean): RoleNavItem[] {
  if (role === 'ADMIN') {
    return [{ href: '/admin', label: 'Admin CRM' }];
  }
  if (role === 'AGENT') {
    return [{ href: '/agent', label: 'Agent CRM' }];
  }
  return getClientTopNavConfig(isAuthenticated);
}

function getRoleMenuNavConfig(role: UserRole): RoleNavItem[] {
  if (role === 'ADMIN') {
    return [
      { href: '/admin', label: 'Admin CRM' },
      { href: '/profile-settings', label: 'Profile' },
    ];
  }
  if (role === 'AGENT') {
    return [
      { href: '/agent', label: 'Agent CRM' },
      { href: '/profile-settings', label: 'Profile' },
    ];
  }
  return [
    { href: '/my-offers', label: 'My Offers' },
    { href: '/my-bookings', label: 'My Bookings' },
    { href: '/profile-settings', label: 'Profile' },
  ];
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader({
  user,
  centerContent,
  brandSubtitle = 'International Division',
  showBrand = true,
  showRoleNav = true,
  showCenterContent = false,
}: AppHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const roleTopNav = user
    ? getRoleTopNavConfig(user.role, true)
    : getRoleTopNavConfig('CLIENT', false);
  const roleMenuNav = user ? getRoleMenuNavConfig(user.role) : [];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.03] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {showBrand ? (
          <BrandIdentity
            href="/"
            subtitle={brandSubtitle}
            className="flex items-center space-x-3 cursor-pointer"
            titleClassName="font-serif text-[#1d1d1f] text-lg tracking-wide font-semibold leading-none"
            subtitleClassName="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-light mt-1"
          />
        ) : (
          <div />
        )}

        <div className="hidden md:flex items-center gap-6">
          {showRoleNav ? (
            <nav className="hidden lg:flex items-center gap-2">
              {roleTopNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2 py-1.5 text-[11px] uppercase tracking-wider font-semibold transition-colors duration-200 ${
                    isNavItemActive(pathname, item.href)
                      ? 'text-[#1d1d1f]'
                      : 'text-slate-500 hover:text-[#1d1d1f]'
                  }`}
                >
                  {isNavItemActive(pathname, item.href) ? (
                    <motion.span
                      layoutId="app-header-active-underline"
                      className="absolute left-2 right-2 -bottom-0.5 h-[2px] rounded-full bg-[#1d1d1f]/55"
                      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.35 }}
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </nav>
          ) : null}
          {showCenterContent ? centerContent : null}
        </div>

        <div className="relative">
          {user ? (
            <button
              onClick={() => setIsOpen((previous) => !previous)}
              className="flex items-center space-x-3 bg-white border border-black/[0.05] hover:border-black/20 rounded-full px-4 py-2 cursor-pointer transition-all shadow-sm shadow-black/5"
            >
              <div className="w-7 h-7 bg-[#1d1d1f] text-white font-serif text-xs rounded-full flex items-center justify-center font-bold">
                {user.firstName[0].toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1d1d1f]">
                  {user.firstName} {user.lastName[0]}.
                </span>
                <span className="text-[9px] text-emerald-600 flex items-center font-semibold uppercase tracking-wider">
                  {user.verificationStatus} Profile
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center space-x-4 text-sm font-medium">
              <Link href="/login" className="text-slate-600 hover:text-[#1d1d1f] transition-colors py-1">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-[#1d1d1f] text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-black transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}

          {isOpen && user ? (
            <ProfileMenuPanel
              user={user}
              pathname={pathname}
              roleMenuNav={roleMenuNav}
              isNavItemActive={isNavItemActive}
              onSignOut={() => {
                window.location.href = '/api/auth/logout';
              }}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
