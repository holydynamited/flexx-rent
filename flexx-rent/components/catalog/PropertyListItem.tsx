import type { MouseEvent } from 'react';
import type { Property } from '@/components/catalog/types';

interface PropertyListItemProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: number, event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (property: Property) => void;
}

export default function PropertyListItem({ property, isFavorite, onToggleFavorite, onSelect }: PropertyListItemProps) {
  return (
    <div
      onClick={() => onSelect(property)}
      className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-black/[0.02] border border-black/[0.01] hover:scale-[1.005] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 cursor-pointer text-left group"
    >
      <div className="md:col-span-4 relative aspect-[16/10] md:aspect-auto min-h-[180px] bg-slate-100">
        <img src={property.image} alt={property.title} className="absolute inset-0 w-full h-full object-cover" />
        <button
          type="button"
          onClick={(event) => onToggleFavorite(property.id, event)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition shadow-md"
        >
          <svg
            className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-[#1d1d1f]/60'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
        <div className="absolute bottom-4 left-4 bg-[#1d1d1f]/85 backdrop-blur text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {property.city}
        </div>
      </div>

      <div className="md:col-span-8 p-6 md:p-8 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold bg-[#f5f5f7] px-2.5 py-1 rounded-full">
                {property.type}
              </span>
              <h3 className="font-serif text-xl font-medium text-[#1d1d1f] mt-2 group-hover:text-slate-600 transition-colors leading-none">
                {property.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-serif font-semibold text-[#1d1d1f]">{property.price} EUR</span>
              <span className="text-[10px] text-slate-400 block font-light">Cold rent / month</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-mono">{property.address}</p>
          <p className="text-xs text-slate-500 font-light leading-relaxed max-w-2xl">{property.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-black/[0.03] mt-4">
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-medium">
            <span className="bg-[#f5f5f7] px-3 py-1.5 rounded-lg">{property.area} sqm</span>
            <span className="bg-[#f5f5f7] px-3 py-1.5 rounded-lg">{property.rooms} rooms</span>
            <span className="bg-[#f5f5f7] px-3 py-1.5 rounded-lg">{property.floor}</span>
            {property.furnished ? (
              <span className="bg-amber-50 text-amber-800 border border-amber-100/30 px-3 py-1.5 rounded-lg">Furnished</span>
            ) : null}
            {property.hasParking ? (
              <span className="bg-blue-50 text-blue-800 border border-blue-100/30 px-3 py-1.5 rounded-lg">Parking</span>
            ) : null}
          </div>
          <span className="text-xs font-semibold text-[#1d1d1f] flex items-center space-x-1.5 group-hover:translate-x-1 transition-transform">
            <span>View full specification</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}
