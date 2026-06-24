'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';

import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import type { HeaderUser } from '@/components/layout/types';

interface OfferItem {
  id: number;
  title: string;
  address: string;
  city: string;
  baseRent: number;
  utilityCosts: number;
  rooms: number;
  area: number;
  image: string;
  heating: 'GAS' | 'DISTRICT' | 'ELECTRIC' | 'HEAT_PUMP';
  status: string;
}

interface MyOffersResponse {
  hasQuestionnaire?: boolean;
  questionnaire?: {
    id: number;
    city: string;
    maxTotalRent: number;
    minRooms: number;
    minAreaSqm: number;
    isActive: boolean;
  } | null;
  offers?: OfferItem[];
  error?: string;
}

export default function MyOffersClientPage({ user }: { user: HeaderUser }) {
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [newOffersCount, setNewOffersCount] = useState(0);
  const [bookingPropertyId, setBookingPropertyId] = useState<number | null>(null);
  const knownOfferIdsRef = useRef<Set<number>>(new Set());

  const loadOffers = useCallback(
    async (options: { manual?: boolean } = {}) => {
      if (options.manual) {
        setRefreshing(true);
      } else if (knownOfferIdsRef.current.size === 0 && !hasQuestionnaire) {
        setLoading(true);
      }

      try {
        const response = await fetch('/api/my-offers', {
          method: 'GET',
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as MyOffersResponse | null;
        if (!response.ok) {
          setError(payload?.error || 'Failed to load offers.');
          return;
        }

        const nextOffers = Array.isArray(payload?.offers) ? payload.offers : [];
        const addedCount = nextOffers.filter((offer) => !knownOfferIdsRef.current.has(offer.id)).length;
        if (addedCount > 0) {
          setNewOffersCount((current) => current + addedCount);
        }
        knownOfferIdsRef.current = new Set(nextOffers.map((offer) => offer.id));

        setHasQuestionnaire(Boolean(payload?.hasQuestionnaire));
        setOffers(nextOffers);
        setError(null);
        setLastUpdatedAt(new Date());
      } catch {
        setError('Connection error. Please try again later.');
      } finally {
        if (options.manual) {
          setRefreshing(false);
        }
        setLoading(false);
      }
    },
    [hasQuestionnaire]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (!hasQuestionnaire) {
      return;
    }

    const runRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadOffers();
      }
    };

    const intervalId = window.setInterval(runRefresh, 15000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasQuestionnaire, loadOffers]);

  const totalWarmRent = useMemo(
    () => offers.reduce((acc, offer) => acc + offer.baseRent + offer.utilityCosts, 0),
    [offers]
  );

  const handleBook = async (propertyId: number) => {
    if (bookingPropertyId === propertyId) {
      return;
    }
    setBookingPropertyId(propertyId);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        window.alert(payload?.error || 'Failed to create booking.');
        return;
      }
      window.alert(payload?.message || 'Booking request created.');
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setBookingPropertyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      <AppHeader user={user} brandSubtitle="Client Offers" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-8 space-y-6">
        <section className="space-y-1">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Client Dashboard</span>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight">My Offers</h1>
          <p className="text-sm text-slate-500">Properties that match your saved questionnaire.</p>
        </section>

        <section className="bg-white border border-black/[0.04] rounded-2xl p-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
              Offers: {offers.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              Total warm rent: EUR {new Intl.NumberFormat('en-US').format(totalWarmRent)}
            </span>
            {lastUpdatedAt ? (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                Last updated: {lastUpdatedAt.toLocaleTimeString('en-GB')}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              void loadOffers({ manual: true });
            }}
            disabled={refreshing}
            className="px-4 py-2 rounded-full border border-black/[0.08] text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 disabled:opacity-60 flex items-center gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        {newOffersCount > 0 ? (
          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-800 flex items-center justify-between gap-2">
            <span>New offers found: {newOffersCount}</span>
            <button
              type="button"
              onClick={() => setNewOffersCount(0)}
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Dismiss
            </button>
          </section>
        ) : null}

        {loading ? (
          <section className="bg-white rounded-2xl py-10 text-center border border-black/[0.03] text-sm text-slate-500">
            Loading offers...
          </section>
        ) : error ? (
          <section className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-4 text-sm">{error}</section>
        ) : !hasQuestionnaire ? (
          <section className="bg-white rounded-2xl py-10 px-6 text-center border border-black/[0.03] space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h2 className="font-serif text-xl">Fill out the questionnaire first</h2>
            <p className="text-sm text-slate-500">Complete your matcher preferences to get personalized offers.</p>
            <Link
              href="/matcher"
              className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold uppercase tracking-wider"
            >
              Go to matcher
            </Link>
          </section>
        ) : offers.length === 0 ? (
          <section className="bg-white rounded-2xl py-10 px-6 text-center border border-black/[0.03] space-y-3">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h2 className="font-serif text-xl">No offers yet</h2>
            <p className="text-sm text-slate-500">Try softening your criteria to receive more matches.</p>
            <Link
              href="/matcher"
              className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-black/[0.08] text-xs font-semibold uppercase tracking-wider hover:bg-slate-50"
            >
              Update questionnaire
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {offers.map((offer) => (
              <article key={offer.id} className="bg-white rounded-2xl border border-black/[0.03] overflow-hidden shadow-sm">
                <Image src={offer.image} alt={offer.title} width={1200} height={700} className="w-full h-44 object-cover" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg">{offer.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold">
                      Matching your profile
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{offer.address}</p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-slate-100 px-2 py-1 rounded-full">Warm rent: EUR {offer.baseRent + offer.utilityCosts}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-full">Rooms: {offer.rooms}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-full">Area: {offer.area} sqm</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-full">Heating: {offer.heating}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link
                      href="/catalog"
                      className="px-4 py-2 rounded-full border border-black/[0.08] text-xs font-semibold uppercase tracking-wider hover:bg-slate-50"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void handleBook(offer.id);
                      }}
                      disabled={bookingPropertyId === offer.id}
                      className="px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black disabled:opacity-60"
                    >
                      {bookingPropertyId === offer.id ? 'Booking...' : 'Book apartment'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <AppFooter divisionLabel="Client Offers Division" />
    </div>
  );
}
