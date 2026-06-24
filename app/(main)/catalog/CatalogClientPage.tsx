'use client';

import { useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import type { HeaderUser } from '@/components/layout/types';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogToolbar from '@/components/catalog/CatalogToolbar';
import PropertyCard from '@/components/catalog/PropertyCard';
import PropertyListItem from '@/components/catalog/PropertyListItem';
import PropertyDetailsModal from '@/components/catalog/PropertyDetailsModal';
import type { PropertyRow, RoomsCount, SortBy, ViewMode } from '@/components/catalog/types';


interface CatalogClientPageProps {
  user: HeaderUser | null;
  properties: PropertyRow[];
}

const inferPropertyType = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('penthouse')) return 'Penthouse';
  if (lowerTitle.includes('loft')) return 'Loft';
  if (lowerTitle.includes('studio')) return 'Studio';
  if (lowerTitle.includes('villa')) return 'Villa';
  return 'Apartment';
};

const hasAmenity = (amenitiesText: string | null, keyword: string): boolean => {
  if (!amenitiesText) return false;
  return amenitiesText.toLowerCase().includes(keyword.toLowerCase());
};

export default function CatalogClientPage({ user, properties }: CatalogClientPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [roomsCount, setRoomsCount] = useState<RoomsCount>('Any');

  const [filterFurnished, setFilterFurnished] = useState(false);
  const [filterPets, setFilterPets] = useState(false);
  const [filterBalcony, setFilterBalcony] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterKitchen, setFilterKitchen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('price-asc');
  const [selectedProperty, setSelectedProperty] = useState<PropertyRow | null>(null);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', message: '' });
  const [favorites, setFavorites] = useState<number[]>([1, 5]);

  const handleToggleFavorite = (id: number, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setFavorites((previous) => (previous.includes(id) ? previous.filter((favId) => favId !== id) : [...previous, id]));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('All');
    setSelectedType('All');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setRoomsCount('Any');
    setFilterFurnished(false);
    setFilterPets(false);
    setFilterBalcony(false);
    setFilterParking(false);
    setFilterKitchen(false);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const lowerQuery = searchQuery.toLowerCase();
      const propertyType = inferPropertyType(property.title);

      const matchesSearch =
        searchQuery === '' ||
        property.title.toLowerCase().includes(lowerQuery) ||
        property.street_address.toLowerCase().includes(lowerQuery) ||
        property.city.toLowerCase().includes(lowerQuery);

      const matchesCity = selectedCity === 'All' || property.city === selectedCity;
      const matchesType = selectedType === 'All' || propertyType === selectedType;
      const priceValue = Number(property.base_rent);
      const areaValue = Number(property.area_sqm);
      const roomsValue = Number(property.rooms_count);
      const matchesMinPrice = minPrice === '' || priceValue >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || priceValue <= Number(maxPrice);
      const matchesMinArea = minArea === '' || areaValue >= Number(minArea);
      const matchesMaxArea = maxArea === '' || areaValue <= Number(maxArea);

      let matchesRooms = true;
      if (roomsCount !== 'Any') {
        matchesRooms = roomsCount === '4+' ? roomsValue >= 4 : roomsValue === Number(roomsCount);
      }

      const matchesFurnished = !filterFurnished || hasAmenity(property.amenities_text, 'furnished');
      const matchesPets = !filterPets || hasAmenity(property.amenities_text, 'pet');
      const matchesBalcony = !filterBalcony || hasAmenity(property.amenities_text, 'balcony');
      const matchesParking = !filterParking || hasAmenity(property.amenities_text, 'parking');
      const matchesKitchen = !filterKitchen || hasAmenity(property.amenities_text, 'kitchen');

      return (
        matchesSearch &&
        matchesCity &&
        matchesType &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinArea &&
        matchesMaxArea &&
        matchesRooms &&
        matchesFurnished &&
        matchesPets &&
        matchesBalcony &&
        matchesParking &&
        matchesKitchen
      );
    }).sort((a, b) => {
      const aPrice = Number(a.base_rent);
      const bPrice = Number(b.base_rent);
      const aArea = Number(a.area_sqm);
      const bArea = Number(b.area_sqm);

      if (sortBy === 'price-asc') return aPrice - bPrice;
      if (sortBy === 'price-desc') return bPrice - aPrice;
      if (sortBy === 'area-desc') return bArea - aArea;
      return 0;
    });
  }, [
    properties,
    searchQuery,
    selectedCity,
    selectedType,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    roomsCount,
    filterFurnished,
    filterPets,
    filterBalcony,
    filterParking,
    filterKitchen,
    sortBy,
  ]);

  const handleSendEnquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnquirySent(true);
    window.setTimeout(() => {
      setEnquirySent(false);
      setSelectedProperty(null);
      setEnquiryForm({ name: '', email: '', message: '' });
    }, 2200);
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
          selectedType={selectedType}
          minPrice={minPrice}
          maxPrice={maxPrice}
          minArea={minArea}
          maxArea={maxArea}
          roomsCount={roomsCount}
          filterFurnished={filterFurnished}
          filterPets={filterPets}
          filterBalcony={filterBalcony}
          filterParking={filterParking}
          filterKitchen={filterKitchen}
          onSearchQueryChange={setSearchQuery}
          onSelectedCityChange={setSelectedCity}
          onSelectedTypeChange={setSelectedType}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onMinAreaChange={setMinArea}
          onMaxAreaChange={setMaxArea}
          onRoomsCountChange={setRoomsCount}
          onFilterFurnishedChange={setFilterFurnished}
          onFilterPetsChange={setFilterPets}
          onFilterBalconyChange={setFilterBalcony}
          onFilterParkingChange={setFilterParking}
          onFilterKitchenChange={setFilterKitchen}
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
              <PropertyCard
                key={property.id}
                property={property}
                onToggleFavorite={handleToggleFavorite}
                onSelect={setSelectedProperty}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProperties.map((property) => (
              <PropertyListItem
                key={property.id}
                property={property}
                onToggleFavorite={handleToggleFavorite}
                onSelect={setSelectedProperty}
              />
            ))}
          </div>
        )}
      </main>

      <AppFooter divisionLabel="Germany Real Estate Division" />

      {selectedProperty ? (
        <PropertyDetailsModal
          property={selectedProperty}
          enquirySent={enquirySent}
          enquiryForm={enquiryForm}
          onClose={() => setSelectedProperty(null)}
          onSubmit={handleSendEnquiry}
          onEnquiryFormChange={setEnquiryForm}
        />
      ) : null}
    </div>
  );
}
