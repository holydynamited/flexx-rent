'use client';

import React, { useState } from 'react';
import BrandIdentity from '@/components/BrandIdentity';
import { UserRole, VerificationStatus } from '@/lib/types';

interface LandingHeaderProps {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    verificationStatus: VerificationStatus;
  } | null;
}

export default function LandingHeader({ user }: LandingHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.03] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <BrandIdentity
          href="/"
          subtitle="International Division"
          className="flex items-center space-x-3 cursor-pointer"
          titleClassName="font-serif text-[#1d1d1f] text-lg tracking-wide font-semibold leading-none"
          subtitleClassName="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-light mt-1"
        />

        <nav className="hidden md:flex items-center space-x-10 text-[14px] font-medium text-slate-600">
        <a href="#hero" className="hover:text-[#1d1d1f] transition-colors">Home</a>
    
          <a href="#hero" className="hover:text-[#1d1d1f] transition-colors">Catalog</a>
          {user&&(
          <a href="#about" className="hover:text-[#1d1d1f] transition-colors">Smart Matcher</a>
        )
       }
          <a href="#contact" className="hover:text-[#1d1d1f] transition-colors">How it works</a>
        </nav>

        <div className="relative">
          {user ? (
            <div 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-3 bg-white border border-black/[0.05] hover:border-black/20 rounded-full px-4 py-2 cursor-pointer transition-all shadow-sm shadow-black/5"
            >
              <div className="w-7 h-7 bg-[#1d1d1f] text-white font-serif text-xs rounded-full flex items-center justify-center font-bold">
                {user.firstName[0].toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1d1d1f]">{user.firstName} {user.lastName[0]}.</span>
                <span className="text-[9px] text-emerald-600 flex items-center font-semibold uppercase tracking-wider">
                  {user.verificationStatus} Profile
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 text-sm font-medium">
              <button 
                onClick={() => {
                  window.location.href = '/login';
                }} 
                className="text-slate-600 hover:text-[#1d1d1f] transition-colors cursor-pointer py-1 bg-transparent border-none"
              >
                Sign In
              </button>
              
              <button 
                onClick={() => {
                  window.location.href = '/register';
                }} 
                className="bg-[#1d1d1f] text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

          {isOpen && user && (
            <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-black/[0.04] z-50">
              <div className="flex items-center space-x-3 pb-4 border-b border-black/[0.04]">
                <div className="w-12  text-[#1d1d1f] h-12 bg-slate-100 border border-black/[0.05] text-[#1d1d1f] font-serif font-bold text-xl rounded-full flex items-center justify-center">
                  {user.firstName[0].toUpperCase()}{user.lastName[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-serif text-[#1d1d1f] text-sm font-semibold">{user.firstName} {user.lastName}</h4>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Role: {user.role}</p>
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <a href="/profile-settings" className="block w-full text-center bg-[#1d1d1f] text-white py-2.5 rounded-full text-xs font-semibold hover:bg-black transition-colors cursor-pointer">
                 Profile Settings
                </a>
                
                <button 
                  onClick={() => {
                    window.location.href = '/api/auth/logout';
                  }} 
                  className="w-full text-center text-red-600 hover:bg-red-50 py-2 rounded-full text-[11px] font-semibold transition-colors cursor-pointer block"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}