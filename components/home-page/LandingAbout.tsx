'use client';

import React from 'react';

export default function LandingAbout() {
  return (
    <section id="about" className="py-20 md:py-32 bg-white px-6">
      <div className="max-w-7xl mx-auto space-y-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500 font-bold block mb-4">Operational Excellence</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#1d1d1f] tracking-tight leading-tight">
              Long-term rentals, simplified across Germany.
            </h2>
          </div>
          <div className="lg:col-span-7 text-slate-600 font-light leading-relaxed text-base space-y-6">
            <p>
              In Germany&apos;s largest cities, quality apartments receive dozens of applications within days. <strong>FlexxRent</strong> helps you stand out with a complete tenant file — ID, <strong>SCHUFA</strong>, and income proof — ready before you even schedule a viewing.
            </p>
            <p>
              Once your profile is verified, you can apply to listed properties nationwide without starting from scratch each time. Less paperwork, faster responses, and a smoother path from first inquiry to signed lease.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
          <div className="p-8 bg-[#f5f5f7] rounded-3xl space-y-4 border border-black/[0.01]">
            <h3 className="font-serif text-lg font-semibold text-[#1d1d1f]">Verified Tenant Profile</h3>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              Upload your ID and income documents once — we prepare a landlord-ready dossier so you can apply to apartments anywhere in Germany without resending paperwork for every viewing.
            </p>
          </div>

          <div className="p-8 bg-[#f5f5f7] rounded-3xl space-y-4 border border-black/[0.01]">
            <h3 className="font-serif text-lg font-semibold text-[#1d1d1f]">SCHUFA &amp; Credit Check</h3>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              Landlords nationwide expect a clean SCHUFA and proof of stable income. We guide you through the standard checks property owners across Germany require before signing a long-term lease.
            </p>
          </div>

          <div className="p-8 bg-[#f5f5f7] rounded-3xl space-y-4 border border-black/[0.01]">
            <h3 className="font-serif text-lg font-semibold text-[#1d1d1f]">2-Hour Property Hold</h3>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              Found the right apartment in Berlin, Hamburg, or Frankfurt? Reserve it for two hours while you confirm details and arrange the deposit — before another applicant takes the slot.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}