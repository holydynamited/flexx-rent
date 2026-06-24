'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/components/catalog/types';
import type { HeaderUser } from '@/components/layout/types';
import type { DocumentState } from '@/components/profile-settings/types';

interface PropertyDetailsModalProps {
  property: Property;
  enquirySent: boolean;
  bookingInProgress: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  user: HeaderUser | null;
}




export default function PropertyDetailsModal({
  property,
  enquirySent,
  bookingInProgress,
  onClose,
  onSubmit,
  user,
}: PropertyDetailsModalProps) {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentState | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const effectiveDocs = user ? docs : null;
  const hasRequiredDocs = Boolean(effectiveDocs?.idCard && effectiveDocs?.schufa && effectiveDocs?.tenantSelfDisclosure);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    const loadDocs = async () => {
      setLoadingDocs(true);
      try {
        const res = await fetch('/api/documents', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) {
            setDocs(null);
          }
          return;
        }
        const data = (await res.json()) as { documents?: DocumentState };
        if (!cancelled) {
          setDocs(data.documents ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoadingDocs(false);
        }
      }
    };

    void loadDocs();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => {
      onClose();
    }, 180);
  };



  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/60 backdrop-blur-md p-4 overflow-y-auto transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white rounded-[32px] max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col md:flex-row my-8 max-h-[90vh] transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.98]'
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 z-10 w-9 h-9 bg-[#1d1d1f] hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="md:w-1/2 relative bg-slate-100 min-h-[250px] md:min-h-full">
          <img src={property.image} alt={property.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 text-white space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/70 bg-white/10 backdrop-blur px-2.5 py-1 rounded-full font-bold">
              {property.city}
            </span>
            <h3 className="font-serif text-2xl font-bold mt-2">{property.title}</h3>
            <p className="text-white/60 text-xs font-light">{property.address}</p>
          </div>
        </div>

        <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto text-left flex flex-col justify-between space-y-8 max-h-[80vh] md:max-h-none">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Property overview</span>
              <p className="text-xs text-slate-600 font-light leading-relaxed">{property.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-black/[0.04] py-4 text-xs">
              <div>
                <span className="text-slate-400 block">Living area:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.area} sqm</p>
              </div>
              <div>
                <span className="text-slate-400 block">Rooms:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.rooms}</p>
              </div>
              <div>
                <span className="text-slate-400 block">Available from:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.availableFrom || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 block">Deposit:</span>
                <p className="font-semibold text-sm text-[#1d1d1f]">{property.deposit} EUR</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Amenities</span>
              <div className="flex flex-wrap gap-1.5">
                {(property.amenities.length ? property.amenities : ['Not specified']).map((amenity) => (
                  <span key={amenity} className="bg-[#f5f5f7] text-[#1d1d1f] text-[10px] font-medium px-3 py-1 rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-black/[0.04] pt-6 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Monthly cold rent</span>
                <span className="text-2xl font-serif font-bold text-[#1d1d1f]">
                  {property.price} EUR <span className="text-xs font-sans font-light text-slate-400">/ month</span>
                </span>
              </div>
            </div>

            {enquirySent ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center space-y-1 py-6">
                <span className="text-xl">Success</span>
                <p className="font-semibold">Booking request created.</p>
                <p className="text-[10px] text-emerald-600 font-light">Current status: NEW</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                {user ? (
                  loadingDocs ? (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-[#1d1d1f]/80 text-white py-3 rounded-full text-xs font-semibold cursor-not-allowed"
                    >
                      Checking your documents...
                    </button>
                  ) : hasRequiredDocs ? (
                    <button
                      type="submit"
                      disabled={bookingInProgress}
                      className="w-full bg-[#1d1d1f] cursor-pointer hover:bg-black text-white py-3 rounded-full text-xs font-semibold transition active:scale-95 shadow-lg shadow-black/5"
                    >
                      {bookingInProgress ? 'Creating booking...' : 'Book apartment'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push('/profile-settings')}
                      className="w-full bg-[#1d1d1f] cursor-pointer hover:bg-black text-white py-3 rounded-full text-xs font-semibold transition active:scale-95 shadow-lg shadow-black/5 inline-flex items-center justify-center gap-2"
                    >
                      Upload documents
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )
                ) : (
                  <p className="text-xs text-slate-600 font-light leading-relaxed">Please login to book an apartment.</p>
                )}
            </form>
        )}
      </div>
    </div>
  </div>
    </div>
  );
}
