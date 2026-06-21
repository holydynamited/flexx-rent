'use client';

import React, { useState } from 'react';

const PREMIUM_PROPERTIES = [
  {
    id: 1,
    title: 'Isar Riverside Loft',
    district: 'Bogenhausen',
    street_address: 'Mauerkircherstrasse 14',
    base_rent: '3200',
    area_sqm: '102',
    rooms_count: '3',
    images: [{ image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 2,
    title: 'Maxvorstadt Residence',
    district: 'Maxvorstadt',
    street_address: 'Turkenstrasse 22',
    base_rent: '2800',
    area_sqm: '89',
    rooms_count: '2',
    images: [{ image_url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80' }],
  },
  {
    id: 3,
    title: 'Schwabing Penthouse',
    district: 'Schwabing',
    street_address: 'Leopoldstrasse 31',
    base_rent: '4100',
    area_sqm: '128',
    rooms_count: '4',
    images: [{ image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80' }],
  },
];

export default function LandingPortfolio() {
  const [selectedDistrict, setSelectedDistrict] = useState("All");

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
          animation: marquee 30s linear infinite;
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
            {["All", "Schwabing", "Maxvorstadt", "Bogenhausen", "Glockenbachviertel"].map((district) => (
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
          <div className="animate-marquee">
            {[...PREMIUM_PROPERTIES, ...PREMIUM_PROPERTIES].map((prop, index) => {
              const isVisible = selectedDistrict === "All" || prop.district === selectedDistrict;
              return (
                <div 
                  key={`${prop.id}-${index}`}
                  className={`h-[320px] w-[450px] mx-4 rounded-3xl overflow-hidden relative shadow-xl shadow-black/5 flex-shrink-0 group cursor-pointer transition-all duration-500 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-10 scale-95 pointer-events-none'
                  }`}
                >
                  <img src={prop.images?.[0]?.image_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={prop.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                          {prop.district}
                        </span>
                        <h3 className="font-serif text-xl font-medium mt-2 leading-none text-white">{prop.title}</h3>
                        <p className="text-white/50 text-[11px] font-light mt-1">{prop.street_address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-white/50 block">Rent</span>
                        <span className="text-lg font-serif font-bold text-white">€{prop.base_rent}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-[10px] text-white/75 font-light">{prop.area_sqm} m² / {prop.rooms_count} Rooms</span>
                      <span className="bg-white text-[#1d1d1f] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-tight">
                        Apply Verification Hold
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}