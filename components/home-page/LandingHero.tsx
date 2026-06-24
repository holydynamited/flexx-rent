'use client';

import React from 'react';

export default function LandingHero() {
  return (
    <section id="hero" className="relative bg-[#f5f5f7] pt-12 pb-20 md:py-32 overflow-hidden px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        <div className="lg:col-span-5 space-y-8 text-left z-10 text-[#1d1d1f]">
        
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-[1.1] tracking-tight text-[#1d1d1f]">
            Your new address in <span className="italic">Munich</span> within 2 hours.
          </h1>
          
          <p className="text-slate-600 font-light text-base md:text-lg leading-relaxed max-w-lg">
          Forget about endless paperwork and queues. Submit your documents online and secure your apartment today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <a href="#portfolio" className="bg-[#1d1d1f] text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-black transition-all shadow-xl shadow-black/10 text-center">
              Explore Residences
            </a>
            <a href="#about" className="group flex items-center justify-center space-x-2 text-sm font-semibold text-[#1d1d1f] px-6 py-4 rounded-full hover:bg-black/5 transition-all text-center">
              <span>Rental Framework Guidelines</span>
              <span className="transform group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </a>
          </div>

          <div className="pt-6 border-t border-black/[0.04] grid grid-cols-2 gap-4">
           
            <div>
              <p className="font-serif text-2xl font-bold text-[#1d1d1f]">2 hrs</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Allocation Hold</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold text-[#1d1d1f]">3 Months</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Escrow Kaution</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#f5f5f7] via-transparent to-transparent z-10 pointer-events-none"></div>
          <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-black/10 aspect-[3/2] bg-slate-200">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" alt="Premium Residence Architecture" className="w-full h-full object-cover" />
        
          </div>
        </div>

      </div>
    </section>
  );
}