import type { RoomsCount } from '@/components/catalog/types';

interface CatalogFiltersProps {
  searchQuery: string;
  selectedCity: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  roomsCount: RoomsCount;
  onSearchQueryChange: (value: string) => void;
  onSelectedCityChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinAreaChange: (value: string) => void;
  onMaxAreaChange: (value: string) => void;
  onRoomsCountChange: (value: RoomsCount) => void;
  onReset: () => void;
}

export default function CatalogFilters({
  searchQuery,
  selectedCity,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  roomsCount,
  onSearchQueryChange,
  onSelectedCityChange,
  onMinPriceChange,
  onMaxPriceChange,
  onMinAreaChange,
  onMaxAreaChange,
  onRoomsCountChange,
  onReset,
}: CatalogFiltersProps) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-black/[0.02] border border-black/[0.01] space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by title, city, or address..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#f5f5f7] rounded-2xl text-xs font-light focus:outline-none focus:ring-1 focus:ring-black/20 transition-all"
          />
        </div>

        <div className="md:col-span-6 bg-[#f5f5f7] px-4 py-2 rounded-2xl flex flex-col justify-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">City</span>
          <select
            value={selectedCity}
            onChange={(event) => onSelectedCityChange(event.target.value)}
            className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer w-full mt-0.5 text-[#1d1d1f]"
          >
            <option value="All">All Germany</option>
            <option value="Berlin">Berlin</option>
            <option value="Munich">Munich</option>
            <option value="Hamburg">Hamburg</option>
            <option value="Frankfurt">Frankfurt</option>
            <option value="Dusseldorf">Dusseldorf</option>
            <option value="Cologne">Cologne</option>
          </select>
        </div>
      </div>

      <div className="h-px bg-black/[0.03]" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 space-y-2 text-left">
          <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Price per month (EUR)</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(event) => onMinPriceChange(event.target.value)}
              className="w-full px-4 py-2.5 bg-[#f5f5f7] rounded-xl text-xs font-light focus:outline-none text-center"
            />
            <span className="text-slate-300">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              className="w-full px-4 py-2.5 bg-[#f5f5f7] rounded-xl text-xs font-light focus:outline-none text-center"
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-2 text-left">
          <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Living area (sqm)</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={minArea}
              onChange={(event) => onMinAreaChange(event.target.value)}
              className="w-full px-4 py-2.5 bg-[#f5f5f7] rounded-xl text-xs font-light focus:outline-none text-center"
            />
            <span className="text-slate-300">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxArea}
              onChange={(event) => onMaxAreaChange(event.target.value)}
              className="w-full px-4 py-2.5 bg-[#f5f5f7] rounded-xl text-xs font-light focus:outline-none text-center"
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-2 text-left">
          <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Rooms</span>
          <div className="grid grid-cols-5 gap-1.5">
            {(['Any', '1', '2', '3', '4+'] as const).map((roomsOption) => (
              <button
                key={roomsOption}
                type="button"
                onClick={() => onRoomsCountChange(roomsOption)}
                className={`py-2 rounded-xl text-xs font-semibold transition duration-150 active:scale-95 border ${
                  roomsCount === roomsOption
                    ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white shadow'
                    : 'bg-[#f5f5f7] border-transparent text-slate-600 hover:bg-[#e8e8ed]'
                }`}
              >
                {roomsOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-black/[0.03]" />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl transition duration-200"
        >
          Reset all filters
        </button>
      </div>
    </div>
  );
}
