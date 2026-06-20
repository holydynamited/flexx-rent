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
              Engineering solutions for  residential micro-market.
            </h2>
          </div>
          <div className="lg:col-span-7 text-slate-600 font-light leading-relaxed text-base space-y-6">
            <p>
              Long-term housing spectrum is strictly capacity-constrained. Every active asset profile faces substantial candidate over-subscription, delaying matching cycles. <strong>FlexxRent</strong> completely automates compliance staging with direct structural indexing of required verification tokens: national identification dossiers, <strong>SCHUFA</strong> ratings, and verified income statements.
            </p>
            <p>
              We eliminate execution lag via relational query resolution. The moment verification profiles pass administrative clearing thresholds, database layers trigger matching constraints across available inventory records, safe from race-condition concurrency errors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
          <div className="p-8 bg-[#f5f5f7] rounded-3xl space-y-4 border border-black/[0.01]">
            <h3 className="font-serif text-lg font-semibold">Identity Authentication</h3>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              Real-time validation tracking mapped directly to internal file storage registries with dynamic profile verification lifecycle updates.
            </p>
          </div>

          <div className="p-8 bg-[#f5f5f7] rounded-3xl space-y-4 border border-black/[0.01]">
            <h3 className="font-serif text-lg font-semibold">SCHUFA Interfacing</h3>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              Evaluating credit risk constraints against regulatory historical vectors to authorize active leasing privileges instantly.
            </p>
          </div>

          <div className="p-8 bg-[#f5f5f7] rounded-3xl space-y-4 border border-black/[0.01]">
            <h3 className="font-serif text-lg font-semibold">Atomic 2-Hour Holds</h3>
            <p className="text-xs text-slate-500 font-light  leading-relaxed">
              State machine modifications transition properties from available to pending payment. Expiry intervals safely revert unpaid properties.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}