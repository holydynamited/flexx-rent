'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LandingPortfolioProperty {
  id: number;
  title: string;
  district: string;
  streetAddress: string;
  baseRent: number;
  areaSqm: number;
  roomsCount: number;
  imageUrl: string;
}

export default function LandingPortfolio({
  properties,
  isAuthenticated,
}: {
  properties: LandingPortfolioProperty[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const districtOptions = ['All', ...Array.from(new Set(properties.map((property) => property.district))).filter(Boolean)];
  const marqueeProperties = properties.length > 0 ? [...properties, ...properties] : [];

  return (
    <section id="portfolio" className="py-20 md:py-32 bg-[#f5f5f7] overflow-hidden">
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold block">Exclusive Portfolio</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1d1d1f]">Managed Housing Stock</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {districtOptions.map((district) => (
              <button
                key={district}
                onClick={() => setSelectedDistrict(district)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  selectedDistrict === district 
                    ? 'bg-[#1d1d1f] text-white shadow-lg shadow-black/10' 
                    : 'bg-white text-[#1d1d1f] hover:bg-slate-100 border border-black/[0.03]'
                }`}
              >
                {district === "All" ? "All Locations" : district}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative py-4 select-none">
        <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#f5f5f7] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#f5f5f7] to-transparent z-10 pointer-events-none"></div>
        
        <div className="overflow-hidden">
          {marqueeProperties.length === 0 ? (
            <div className="max-w-7xl mx-auto px-6 py-10 text-center text-sm text-slate-500">
              No available listings yet.
            </div>
          ) : (
            <div className="animate-marquee">
              {marqueeProperties.map((prop, index) => {
                const isMatchedDistrict =
                  selectedDistrict === 'All' || prop.district === selectedDistrict;
                return (
                <div
                  key={`${prop.id}-${index}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push('/login');
                      return;
                    }
                    router.push(`/catalog?propertyId=${prop.id}`);
                  }}
                  className={`h-[320px] w-[450px] mx-4 rounded-3xl overflow-hidden relative shadow-xl shadow-black/5 flex-shrink-0 group cursor-pointer transition-all duration-500 ${
                    isMatchedDistrict ? '' : 'opacity-60'
                  }`}
                >
                  <img
                    src={prop.imageUrl}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={prop.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  {isMatchedDistrict ? null : (
                    <div className="absolute inset-0 bg-white/55" />
                  )}

                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                          {prop.district}
                        </span>
                        <h3 className="font-serif text-xl font-medium mt-2 leading-none text-white">{prop.title}</h3>
                        <p className="text-white/50 text-[11px] font-light mt-1">{prop.streetAddress}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-white/50 block">Rent</span>
                        <span className="text-lg font-serif font-bold text-white">€{prop.baseRent}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-[10px] text-white/75 font-light">
                        {prop.areaSqm} m² / {prop.roomsCount} Rooms
                      </span>
                      <span className="bg-white text-[#1d1d1f] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-tight">
                        Apply Verification Hold
                      </span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}