'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building, CheckCircle2, Compass, Euro, Layers, MapPin, Send } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import type { HeaderUser } from '@/components/layout/types';
import type { MatcherProperty } from '@/components/matcher/types';

interface MatcherClientPageProps {
  user: HeaderUser;
  properties: MatcherProperty[];
}

export default function MatcherClientPage({ user, properties }: MatcherClientPageProps) {
  const [city, setCity] = useState('Munich');
  const [maxTotalRent, setMaxTotalRent] = useState(1900);
  const [minArea, setMinArea] = useState(40);
  const [minRooms, setMinRooms] = useState(2);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadQuestionnaire = async () => {
      try {
        const response = await fetch('/api/search-questionnaire', { method: 'GET' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          questionnaire: {
            city: string;
            maxTotalRent: number;
            minRooms: number;
            minAreaSqm: number;
            isActive: boolean;
          } | null;
        };
        if (!data.questionnaire || isCancelled) {
          return;
        }

        setCity(data.questionnaire.city || 'Munich');
        setMaxTotalRent(Number(data.questionnaire.maxTotalRent) || 1900);
        setMinRooms(Number(data.questionnaire.minRooms) || 2);
        setMinArea(Number(data.questionnaire.minAreaSqm) || 40);
      } catch {
        // Keep defaults when preferences cannot be loaded.
      }
    };

    void loadQuestionnaire();

    return () => {
      isCancelled = true;
    };
  }, []);

  const matchingProperties = useMemo(() => {
    return properties.filter((property) => {
      if (property.city.toLowerCase() !== city.toLowerCase()) return false;
      if (property.baseRent + property.utilityCosts > maxTotalRent) return false;
      if (property.area < minArea) return false;
      if (property.rooms < minRooms) return false;
      return true;
    });
  }, [properties, city, maxTotalRent, minArea, minRooms]);

  const cityOptions = useMemo(() => {
    const uniqueCities = new Set(properties.map((property) => property.city).filter(Boolean));
    return Array.from(uniqueCities).sort((a, b) => a.localeCompare(b));
  }, [properties]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/search-questionnaire', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          maxTotalRent,
          minRooms,
          minAreaSqm: minArea,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveError(payload?.error || 'Failed to save preferences.');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSaveError('Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-black/[0.04] h-screen sticky top-0 justify-between p-6 shrink-0 z-30">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1d1d1f] rounded-xl flex items-center justify-center text-white font-bold text-xl">F</div>
            <div>
             
              <p className="text-[11px] text-slate-500 font-light tracking-tight">Client preference engine</p>
            </div>
          </div>

        
        </div>

        <div className="pt-6 border-t border-black/[0.04] space-y-2 text-xs text-slate-500">
          <p className="font-semibold text-[#1d1d1f]">{user.firstName} {user.lastName}</p>
          <p>Personalized matching profile</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader user={user} brandSubtitle="Smart Matcher" />

        <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <section className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-10 border border-black/[0.02] shadow-xl shadow-black/[0.02]">
              <div className="space-y-3 mb-8">
                <h1 className="text-3xl md:text-4xl font-serif tracking-tight leading-tight">Housing preference questionnaire</h1>
                <p className="text-slate-500 font-light text-sm tracking-tight">
                  Criteria are synced with your saved search profile and matched against live available inventory.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-black/[0.04]">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500">Block 1: Location</h3>
                  </div>
                  <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1d1d1f] focus:bg-white transition-all cursor-pointer font-medium"
                  >
                    {cityOptions.length === 0 ? <option value="Munich">Munich</option> : null}
                    {cityOptions.map((cityOption) => (
                      <option key={cityOption} value={cityOption}>
                        {cityOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-black/[0.04]">
                    <Euro className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500">Block 2: Budget</h3>
                  </div>
                  <NumberInput label="Max total rent (warm)" value={maxTotalRent} onChange={setMaxTotalRent} min={300} max={10000} step={50} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-black/[0.04]">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500">Block 3: Property size</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberInput label="Minimum area (sqm)" value={minArea} onChange={setMinArea} min={15} max={300} step={1} />
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Minimum rooms</label>
                      <div className="flex gap-1.5 bg-[#f5f5f7] p-1 rounded-xl border border-black/[0.03]">
                        {[1, 1.5, 2, 2.5, 3].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setMinRooms(value)}
                            className={`flex-1 text-center py-2 text-xs font-mono rounded-lg transition-all font-bold ${minRooms === value ? 'bg-[#1d1d1f] text-white shadow-sm' : 'text-slate-600 hover:text-[#1d1d1f] hover:bg-black/[0.02]'}`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {saveError ? <p className="text-xs text-rose-600 font-medium">{saveError}</p> : null}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold uppercase tracking-widest py-4 rounded-full active:scale-[0.98] transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save matcher preferences'}
                </button>
              </form>
            </section>

            <section className="lg:col-span-5 space-y-6">
              <div className="bg-[#1d1d1f] text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 translate-x-10 -translate-y-10">
                  <Compass className="w-48 h-48 text-white" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Match results</span>
                  </div>
                  <h2 className="text-2xl font-serif leading-tight">
                    {matchingProperties.length > 0 ? `${matchingProperties.length} properties found` : 'No matching properties'}
                  </h2>
                  <p className="text-white/70 font-light text-xs leading-relaxed">
                    Results update live from `properties` table based on your questionnaire limits.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>Available in {city} — {matchingProperties.length}</span>
                </h3>

                {matchingProperties.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-black/[0.03] text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h4 className="font-serif text-sm font-semibold">No criteria match</h4>
                    <p className="text-slate-500 text-xs font-light leading-relaxed">
                      Try increasing the rent limit or allowing more heating types.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {matchingProperties.map((property) => (
                      <div key={property.id} className="bg-white rounded-xl overflow-hidden border border-black/[0.02] flex gap-3 p-3 hover:shadow-md transition-all duration-300">
                        <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-semibold truncate text-[#1d1d1f]">{property.title}</h4>
                            <p className="text-[10px] text-slate-400 font-light truncate">{property.address}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-black/[0.01] text-[10px]">
                            <span className="font-semibold text-[#1d1d1f]">EUR {property.baseRent + property.utilityCosts} warm</span>
                            <span className="text-slate-500 font-mono">{property.area} sqm • {property.rooms} rooms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>

        <AppFooter divisionLabel="Smart Matcher Division" />
      </div>

      {isSubmitted ? (
        <div className="fixed inset-0 z-50 bg-[#1d1d1f]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-semibold text-xl">Preferences saved</h3>
              <p className="text-slate-500 text-xs font-light leading-relaxed">
                Your matcher setup is now saved for {city}. Agent recommendations will use these criteria.
              </p>
            </div>
            <div className="bg-[#f5f5f7] p-3 rounded-xl border border-black/[0.02] text-left text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>City:</span>
                <strong className="font-semibold text-[#1d1d1f]">{city}</strong>
              </div>
              <div className="flex justify-between">
                <span>Base rent limit:</span>
                <strong className="font-semibold text-[#1d1d1f]">up to EUR {maxTotalRent} warm</strong>
              </div>
              <div className="flex justify-between">
                <span>Property size:</span>
                <strong className="font-semibold text-[#1d1d1f]">from {minArea} sqm / {minRooms} rooms</strong>
              </div>
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold uppercase tracking-widest py-3 rounded-full transition-all"
            >
              Continue matching
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">EUR</span>
        <input
          type="number"
          required
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl pl-14 pr-4 py-3 text-sm focus:outline-none focus:border-[#1d1d1f] focus:bg-white font-mono font-semibold transition-all"
        />
      </div>
    </div>
  );
}
