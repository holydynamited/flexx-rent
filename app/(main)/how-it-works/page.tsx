import Link from 'next/link';
import { CheckCircle2, FileCheck2, Home, ShieldCheck, Wallet } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

const steps = [
  {
    title: 'Create your profile',
    description: 'Register your account and complete your basic rental preferences to unlock matching.',
    icon: Home,
  },
  {
    title: 'Upload verification documents',
    description: 'Submit ID, Schufa, and Selbstauskunft so the admin team can verify your profile.',
    icon: FileCheck2,
  },
  {
    title: 'Get matched and book',
    description: 'Browse matched properties, send booking requests, and wait for agent availability confirmation.',
    icon: CheckCircle2,
  },
  {
    title: 'Pay securely via escrow',
    description: 'Complete first-month payment and deposit through encrypted checkout flow.',
    icon: Wallet,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      <AppHeader user={null} brandSubtitle="Platform Guide" />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-6 py-10 md:py-14 space-y-8">
        <section className="bg-white rounded-3xl p-8 md:p-10 border border-black/[0.02] shadow-xl shadow-black/[0.02]">
          <div className="space-y-3 max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">How FlexxRent Works</span>
            <h1 className="text-3xl md:text-5xl font-serif tracking-tight">Your rental journey in four simple steps</h1>
            <p className="text-sm md:text-base text-slate-500 font-light leading-relaxed">
              FlexxRent combines verification, smart matching, agent support, and escrow payments in one secure flow.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="bg-white rounded-3xl p-6 md:p-7 border border-black/[0.02] shadow-lg shadow-black/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">Step {index + 1}</p>
                    <h2 className="text-xl font-serif">{step.title}</h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#1d1d1f]/5 text-[#1d1d1f] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </article>
            );
          })}
        </section>

        <section className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 leading-relaxed">
            Deposits are held in escrow and protected under platform policies. You can track each booking and payment status in your dashboard.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 border border-black/[0.02] shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Ready to begin? Create an account or explore available properties.</p>
          <div className="flex gap-3">
            <Link href="/register" className="px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors">
              Create account
            </Link>
            <Link href="/catalog" className="px-5 py-2.5 rounded-full border border-black/[0.1] text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors">
              Open catalog
            </Link>
          </div>
        </section>
      </main>

      <AppFooter divisionLabel="How It Works Division" />
    </div>
  );
}
