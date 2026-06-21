import type { MouseEvent } from 'react';
import type { Property } from '@/components/catalog/types';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: number, event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: (property: Property) => void;
}

export default function PropertyCard({ property, isFavorite, onToggleFavorite, onSelect }: PropertyCardProps) {
  return (
    <div
      onClick={() => onSelect(property)}
      className="bg-white rounded-[24px] overflow-hidden shadow-xl shadow-black/[0.02] border border-black/[0.01] hover:scale-[1.015] hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 flex flex-col group cursor-pointer text-left"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <button
          type="button"
          onClick={(event) => onToggleFavorite(property.id, event)}
          className="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition shadow-md"
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

        <div className="absolute bottom-4 left-4 bg-[#1d1d1f]/80 backdrop-blur text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {property.city}
        </div>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#1d1d1f] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {property.type}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-serif text-lg font-medium text-[#1d1d1f] line-clamp-1 leading-tight group-hover:text-slate-600 transition-colors">
            {property.title}
          </h3>
          <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">{property.address}</p>
          <p className="text-xs text-slate-500 font-light line-clamp-2 leading-relaxed">{property.description}</p>
        </div>

        <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 font-medium">
          <span className="bg-[#f5f5f7] px-2 py-1 rounded-lg">{property.area} sqm</span>
          <span className="bg-[#f5f5f7] px-2 py-1 rounded-lg">{property.rooms} rooms</span>
          <span className="bg-[#f5f5f7] px-2 py-1 rounded-lg">{property.floor}</span>
          {property.furnished ? (
            <span className="bg-amber-50 text-amber-800 border border-amber-100/40 px-2 py-1 rounded-lg">Furnished</span>
          ) : null}
        </div>

        <div className="border-t border-black/[0.03] pt-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Cold rent</span>
            <span className="text-lg font-serif font-semibold text-[#1d1d1f]">{property.price} EUR</span>
          </div>
          <span className="text-[11px] font-semibold text-[#1d1d1f] flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
            <span>View details</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </div>
  );
}