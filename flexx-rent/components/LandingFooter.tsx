'use client';

import React from 'react';

export default function LandingFooter() {
  return (
    <footer className="bg-[#1d1d1f] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/[0.08] pb-12">
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white text-[#1d1d1f] flex items-center justify-center rounded-lg font-serif font-bold text-lg">
              F
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-lg tracking-wide font-medium text-white">FlexxRent</span>
              <span className="text-[8px] uppercase tracking-widest text-white/40 mt-0.5">Long-Term Housing Network</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 text-[11px] uppercase tracking-[0.2em] text-white/50 font-bold">
            <a href="#hero" className="hover:text-white transition-colors">Home</a>
            <a href="#about" className="hover:text-white transition-colors">Service</a>
            <a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-white/30 font-light gap-4 text-center md:text-left">
          <p>© 2026 FlexxRent GmbH. All rights reserved. Developed under Filin Software Group Scope.</p>
          <p className="uppercase tracking-[0.15em] text-white/20">International Division</p>
        </div>
      </div>
    </footer>
  );
}