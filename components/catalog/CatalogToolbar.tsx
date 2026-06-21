import type { SortBy, ViewMode } from '@/components/catalog/types';

interface CatalogToolbarProps {
  matchedCount: number;
  totalCount: number;
  sortBy: SortBy;
  viewMode: ViewMode;
  onSortByChange: (value: SortBy) => void;
  onViewModeChange: (value: ViewMode) => void;
}

export default function CatalogToolbar({
  matchedCount,
  totalCount,
  sortBy,
  viewMode,
  onSortByChange,
  onViewModeChange,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-black/[0.01]">
      <div className="text-xs text-slate-400 font-light text-left">
        Matches found: <span className="text-[#1d1d1f] font-semibold">{matchedCount}</span> of {totalCount}
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-[#f5f5f7] px-4 py-2 rounded-xl flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-light">Sort by:</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortBy)}
            className="bg-transparent border-none font-semibold focus:outline-none cursor-pointer text-[#1d1d1f]"
          >
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="area-desc">Area: high to low</option>
          </select>
        </div>

        <div className="bg-[#f5f5f7] p-1 rounded-xl flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-slate-400 hover:text-[#1d1d1f]'}`}
            title="Grid view"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1d1d1f]' : 'text-slate-400 hover:text-[#1d1d1f]'}`}
            title="List view"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
