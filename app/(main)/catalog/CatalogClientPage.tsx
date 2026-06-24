'use client';

import { useMemo, useState, type FormEvent } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import type { HeaderUser } from '@/components/layout/types';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogToolbar from '@/components/catalog/CatalogToolbar';
import PropertyCard from '@/components/catalog/PropertyCard';
import PropertyListItem from '@/components/catalog/PropertyListItem';
import PropertyDetailsModal from '@/components/catalog/PropertyDetailsModal';

import type { Property, RoomsCount, SortBy, ViewMode } from '@/components/catalog/types';

interface CatalogClientPageProps {
  user: HeaderUser | null;
  properties: Property[];
}

export default function CatalogClientPage({ user, properties }: CatalogClientPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [roomsCount, setRoomsCount] = useState<RoomsCount>('Any');

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('price-asc');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [enquirySent, setEnquirySent] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('All');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setRoomsCount('Any');
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        property.title.toLowerCase().includes(lowerQuery) ||
        property.address.toLowerCase().includes(lowerQuery) ||
        property.city.toLowerCase().includes(lowerQuery);

      const matchesCity = selectedCity === 'All' || property.city === selectedCity;
      const matchesMinPrice = minPrice === '' || property.price >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || property.price <= Number(maxPrice);
      const matchesMinArea = minArea === '' || property.area >= Number(minArea);
      const matchesMaxArea = maxArea === '' || property.area <= Number(maxArea);

      let matchesRooms = true;
      if (roomsCount !== 'Any') {
        matchesRooms = roomsCount === '4+' ? property.rooms >= 4 : property.rooms === Number(roomsCount);
      }

      return (
        matchesSearch &&
        matchesCity &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinArea &&
        matchesMaxArea &&
        matchesRooms
      );
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'area-desc') return b.area - a.area;
      return 0;
    });
  }, [
    properties,
    searchQuery,
    selectedCity,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    roomsCount,
    sortBy,
  ]);

  const handleSendEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProperty || bookingInProgress) {
      return;
    }

    setBookingInProgress(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedProperty.id }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = data?.error || 'Failed to create booking request.';
        window.alert(message);
        return;
      }

      setEnquirySent(true);
      window.setTimeout(() => {
        setEnquirySent(false);
        setSelectedProperty(null);
      }, 2200);
    } catch (error) {
      console.error('Booking creation error:', error);
      window.alert('Connection error. Please try again later.');
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans font-light tracking-tight flex flex-col antialiased selection:bg-[#1d1d1f] selection:text-white">
      <AppHeader
        user={user}
        brandSubtitle="Germany Division"
        centerContent={
          <div className="hidden md:flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span>Federal housing inventory</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#1d1d1f]">{filteredProperties.length} available listings</span>
          </div>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-10 space-y-8">
        <div className="text-left space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500 font-semibold block">Premium Germany Residences</span>
          <h1 className="text-3xl md:text-5xl font-serif text-[#1d1d1f] tracking-tight">Germany rental catalog</h1>
          <p className="text-slate-500 font-light max-w-2xl text-sm md:text-base leading-relaxed">
            Discover premium long-term rentals across Germany. Use detailed filters to match listings to your exact needs.
          </p>
        </div>

        <CatalogFilters
          searchQuery={searchQuery}
          selectedCity={selectedCity}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minArea={minArea}
          maxArea={maxArea}
          roomsCount={roomsCount}
          onSearchQueryChange={setSearchQuery}
          onSelectedCityChange={setSelectedCity}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onMinAreaChange={setMinArea}
          onMaxAreaChange={setMaxArea}
          onRoomsCountChange={setRoomsCount}
          onReset={handleResetFilters}
        />

        <CatalogToolbar
          matchedCount={filteredProperties.length}
          totalCount={properties.length}
          sortBy={sortBy}
          viewMode={viewMode}
          onSortByChange={setSortBy}
          onViewModeChange={setViewMode}
        />

        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl py-20 px-6 text-center space-y-4 shadow-xl shadow-black/[0.01]">
            <div className="text-4xl">🔍</div>
            <h3 className="font-serif text-xl font-medium">No matches found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              No properties match the current filters. Try removing constraints or widening your price and area ranges.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-[#1d1d1f] hover:bg-black text-white px-6 py-2.5 rounded-full text-xs font-semibold transition shadow active:scale-95"
            >
              Reset all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} onSelect={setSelectedProperty} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} onSelect={setSelectedProperty} />
            ))}
          </div>
        )}
      </main>

      <AppFooter divisionLabel="Germany Real Estate Division" />

      {selectedProperty ? (
        <PropertyDetailsModal
          property={selectedProperty}
          user = {user}
          enquirySent={enquirySent}
          bookingInProgress={bookingInProgress}
          onClose={() => setSelectedProperty(null)}
          onSubmit={handleSendEnquiry}
        />
      ) : null}
    </div>
  );
}
