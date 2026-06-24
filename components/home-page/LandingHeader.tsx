'use client';

import React from 'react';
import AppHeader from '@/components/layout/AppHeader';
import type { HeaderUser } from '@/components/layout/types';

interface LandingHeaderProps {
  user: HeaderUser | null;
}

export default function LandingHeader({ user }: LandingHeaderProps) {
  return <AppHeader user={user} brandSubtitle="" />;
}