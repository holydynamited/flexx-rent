'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Home,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import { INITIAL_BOOKINGS, INITIAL_PROPERTIES } from '@/components/agent/mockData';
import type { AgentBooking, AgentProperty, AgentTab, BookingStatus } from '@/components/agent/types';
import type { HeaderUser } from '@/components/layout/types';

interface AgentCmsClientPageProps {
  user: HeaderUser;
}

interface NewPropertyForm {
  title: string;
  address: string;
  baseRent: string;
  utilityCosts: string;
  rooms: string;
  area: string;
  imagePlaceholder: string;
}

const BOOKING_TABS: BookingStatus[] = ['Pending', 'AwaitingPayment', 'Paid', 'Cancelled'];

export default function AgentCmsClientPage({ user }: AgentCmsClientPageProps) {
  const [activeTab, setActiveTab] = useState<AgentTab>('bookings');
  const [bookingSubTab, setBookingSubTab] = useState<BookingStatus>('Pending');
  const [properties, setProperties] = useState<AgentProperty[]>(INITIAL_PROPERTIES);
  const [bookings, setBookings] = useState<AgentBooking[]>(INITIAL_BOOKINGS);
  const [propertySearch, setPropertySearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<NewPropertyForm>({
    title: '',
    address: '',
    baseRent: '',
    utilityCosts: '',
    rooms: '2',
    area: '',
    imagePlaceholder: '',
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBookings((previous) =>
        previous.map((booking) => {
          if (booking.status === 'AwaitingPayment' && booking.timeLeft && booking.timeLeft > 0) {
            return { ...booking, timeLeft: booking.timeLeft - 1 };
          }
          if (booking.status === 'AwaitingPayment' && booking.timeLeft === 0) {
            return { ...booking, status: 'Cancelled', timeLeft: null };
          }
          return booking;
        }),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchSearch =
          booking.clientName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
          booking.propertyName.toLowerCase().includes(bookingSearch.toLowerCase());
        return matchSearch && booking.status === bookingSubTab;
      }),
    [bookings, bookingSubTab, bookingSearch],
  );

  const filteredProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          property.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
          property.address.toLowerCase().includes(propertySearch.toLowerCase()),
      ),
    [properties, propertySearch],
  );

  const stats = useMemo(() => {
    const pendingRequests = bookings.filter((booking) => booking.status === 'Pending').length;
    const awaitingPayments = bookings.filter((booking) => booking.status === 'AwaitingPayment').length;
    const activePropertiesCount = properties.length;
    const rentedPropertiesCount = properties.filter((property) => property.status === 'Rented').length;

    return { pendingRequests, awaitingPayments, activePropertiesCount, rentedPropertiesCount };
  }, [bookings, properties]);

  const handleConfirmAvailability = (bookingId: string) => {
    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === bookingId ? { ...booking, status: 'AwaitingPayment', timeLeft: 120 } : booking,
      ),
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings((previous) =>
      previous.map((booking) => (booking.id === bookingId ? { ...booking, status: 'Cancelled', timeLeft: null } : booking)),
    );
  };

  const handleSimulateClientPayment = (bookingId: string, propertyId: string) => {
    setBookings((previous) =>
      previous.map((booking) => (booking.id === bookingId ? { ...booking, status: 'Paid', timeLeft: null } : booking)),
    );
    setProperties((previous) =>
      previous.map((property) => (property.id === propertyId ? { ...property, status: 'Rented' } : property)),
    );
  };

  const handleCreateProperty = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fallbackImages = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    ];
    const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

    const createdProperty: AgentProperty = {
      id: `prop_00${properties.length + 1}`,
      title: newProperty.title || 'Modern cozy apartment',
      address: newProperty.address || 'Munich, Germany',
      baseRent: Number(newProperty.baseRent) || 1000,
      utilityCosts: Number(newProperty.utilityCosts) || 200,
      rooms: Number(newProperty.rooms) || 2,
      area: Number(newProperty.area) || 50,
      status: 'Available',
      imagePlaceholder: newProperty.imagePlaceholder || randomImage,
    };

    setProperties((previous) => [createdProperty, ...previous]);
    setIsAddModalOpen(false);
    setNewProperty({
      title: '',
      address: '',
      baseRent: '',
      utilityCosts: '',
      rooms: '2',
      area: '',
      imagePlaceholder: '',
    });
  };

  const formatTime = (totalSeconds: number | null) => {
    if (totalSeconds === null || totalSeconds < 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-black/[0.04] h-screen sticky top-0 justify-between p-6 shrink-0 z-30">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1d1d1f] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/10">
              F
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-semibold text-lg tracking-tight">FlexxRent</span>
                <span className="bg-[#1d1d1f] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-bold">
                  Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-light tracking-tight">Property Management CMS</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                setActiveTab('bookings');
                setBookingSearch('');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'bookings' ? 'bg-[#1d1d1f] text-white shadow-md shadow-black/10' : 'text-slate-600 hover:bg-black/[0.02]'}`}
            >
              <span className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                Rental bookings
              </span>
              {stats.pendingRequests > 0 ? (
                <span className="text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold bg-amber-500 text-white">
                  {stats.pendingRequests}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => {
                setActiveTab('properties');
                setPropertySearch('');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'properties' ? 'bg-[#1d1d1f] text-white shadow-md shadow-black/10' : 'text-slate-600 hover:bg-black/[0.02]'}`}
            >
              <Home className="w-4 h-4" />
              Property inventory
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-black/[0.04] space-y-4">
          <div className="flex items-center gap-3 bg-[#f5f5f7] p-3 rounded-xl border border-black/[0.02]">
            <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-500">Assigned Agent</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          user={user}
          brandSubtitle="Agent Portal"
          centerContent={
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span>Agent workspace</span>
              <span>•</span>
              <span>{stats.pendingRequests} pending booking requests</span>
            </div>
          }
        />

        <header className="lg:hidden bg-white border-b border-black/[0.04] px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1d1d1f] rounded-lg flex items-center justify-center text-white font-bold text-base">F</div>
            <span className="font-serif font-semibold text-base tracking-tight">FlexxRent Agent</span>
          </div>
          <button onClick={() => setMobileMenuOpen((previous) => !previous)} className="p-1.5 rounded-lg border border-black/[0.05] hover:bg-slate-50">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileMenuOpen ? (
          <div className="lg:hidden bg-white border-b border-black/[0.04] p-4 flex flex-col gap-2 z-30">
            <button
              onClick={() => {
                setActiveTab('bookings');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase ${activeTab === 'bookings' ? 'bg-[#1d1d1f] text-white' : 'text-slate-600'}`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Rental bookings
              </span>
              {stats.pendingRequests > 0 ? (
                <span className="bg-amber-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {stats.pendingRequests}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => {
                setActiveTab('properties');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase ${activeTab === 'properties' ? 'bg-[#1d1d1f] text-white' : 'text-slate-600'}`}
            >
              <Home className="w-4 h-4" />
              Property inventory
            </button>
          </div>
        ) : null}

        <section className="bg-white border-b border-black/[0.02] py-6 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="New booking requests" value={`${stats.pendingRequests} requests`} icon={<Clock className="w-5 h-5" />} />
            <MetricCard label="Awaiting payment" value={`${stats.awaitingPayments} active`} icon={<Clock className="w-5 h-5 animate-pulse" />} />
            <MetricCard label="Inventory total" value={`${stats.activePropertiesCount} listings`} icon={<Home className="w-5 h-5" />} />
            <MetricCard label="Successfully rented" value={`${stats.rentedPropertiesCount} units`} icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>
        </section>

        <main className="flex-grow max-w-6xl w-full mx-auto px-6 lg:px-10 py-8">
          {activeTab === 'bookings' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Rental booking requests</h1>
                  <p className="text-slate-600 font-light mt-1 text-sm">Manage verified client bookings and approve apartment availability.</p>
                </div>
                <SearchInput value={bookingSearch} onChange={setBookingSearch} placeholder="Search by client or property..." />
              </div>

              <div className="flex flex-wrap gap-2 border-b border-black/[0.04] pb-4">
                {BOOKING_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBookingSubTab(tab)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all ${bookingSubTab === tab ? 'bg-[#1d1d1f] text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-black/[0.02]'}`}
                  >
                    <span>{tab}</span>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[9px]">
                      {bookings.filter((booking) => booking.status === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.02] shadow-sm">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-serif font-medium">No requests found</h3>
                  <p className="text-slate-500 text-xs font-light mt-1">No bookings in the current status.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-2xl border border-black/[0.03] p-5 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded tracking-wider uppercase font-bold text-slate-500">{booking.id}</span>
                            <h3 className="font-serif font-semibold text-base">{booking.propertyName}</h3>
                          </div>
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 font-light">
                            <span>{booking.clientName}</span>
                            <span>{booking.clientEmail}</span>
                            <span>Requested: {booking.requestedDate}</span>
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              Verified client
                            </span>
                          </div>

                          {booking.status === 'AwaitingPayment' ? (
                            <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-800 text-xs px-3.5 py-1.5 rounded-full font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              Deposit timer: <strong className="font-mono font-bold text-sm text-amber-900">{formatTime(booking.timeLeft)}</strong>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {booking.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => handleConfirmAvailability(booking.id)}
                                className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/10 transition-all flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirm availability
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/10 transition-all flex items-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          ) : null}

                          {booking.status === 'AwaitingPayment' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSimulateClientPayment(booking.id, booking.propertyId)}
                                className="px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black active:scale-95 shadow-md transition-all flex items-center gap-1.5"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                Simulate client payment
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="px-3 py-2 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold uppercase tracking-wider transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : null}

                          {booking.status === 'Paid' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Paid and rented
                            </span>
                          ) : null}

                          {booking.status === 'Cancelled' ? (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                              Cancelled
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white border border-black/[0.04] rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-[#1d1d1f]/5 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-[#1d1d1f]" />
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <h4 className="font-semibold text-[#1d1d1f]">Business rule:</h4>
                  <p className="font-light leading-relaxed">
                    After an agent confirms availability, a 2-hour payment timer starts for deposit transfer. If payment is not completed in time,
                    the booking is automatically cancelled.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'properties' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Property inventory management</h1>
                  <p className="text-slate-600 font-light mt-1 text-sm">Create new listings, set pricing, and monitor property availability.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput value={propertySearch} onChange={setPropertySearch} placeholder="Search property..." />
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full active:scale-95 shadow-lg shadow-black/10 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add property
                  </button>
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.02] shadow-sm">
                  <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-serif font-medium">No properties found</h3>
                  <p className="text-slate-500 text-xs font-light mt-1">Reset search or create a new listing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="bg-white rounded-2xl overflow-hidden border border-black/[0.03] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                      <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                        <img src={property.imagePlaceholder} alt={property.title} className="w-full h-full object-cover hover:scale-105 transition-all duration-500" />
                        <div className="absolute top-3 right-3">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${property.status === 'Available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {property.status}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-[#1d1d1f]/80 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-md text-[10px] font-mono">
                          ID: {property.id}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-serif font-semibold text-base leading-snug">{property.title}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-light">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {property.address}
                          </p>
                        </div>

                        <div className="flex gap-4 text-xs text-slate-600 bg-[#f5f5f7] p-2.5 rounded-xl border border-black/[0.01]">
                          <span>Rooms: <strong className="font-semibold text-[#1d1d1f]">{property.rooms}</strong></span>
                          <span className="border-l border-black/10 pl-4">Area: <strong className="font-semibold text-[#1d1d1f]">{property.area} sqm</strong></span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-black/[0.02]">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Base rent</span>
                            <span className="text-sm font-bold text-[#1d1d1f]">EUR {property.baseRent} / month</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Utilities</span>
                            <span className="text-sm font-semibold text-slate-700">EUR {property.utilityCosts} / month</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </main>

        <AppFooter divisionLabel="Agent Operations Division" />
      </div>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 bg-[#1d1d1f]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1d1d1f] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Property creation</span>
                <h3 className="font-serif font-semibold text-lg mt-0.5">Add a new listing</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-all text-xl font-bold px-3 py-1 bg-white/5 rounded-full hover:bg-white/10">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
              <FormInput label="Listing title" value={newProperty.title} onChange={(value) => setNewProperty((previous) => ({ ...previous, title: value }))} placeholder="Bright two-room apartment in Schwabing" required />
              <FormInput label="Address" value={newProperty.address} onChange={(value) => setNewProperty((previous) => ({ ...previous, address: value }))} placeholder="Leopoldstrasse 102, Munich" required />

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Base rent (EUR)" type="number" value={newProperty.baseRent} onChange={(value) => setNewProperty((previous) => ({ ...previous, baseRent: value }))} placeholder="1200" required />
                <FormInput label="Utilities (EUR)" type="number" value={newProperty.utilityCosts} onChange={(value) => setNewProperty((previous) => ({ ...previous, utilityCosts: value }))} placeholder="250" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Rooms</label>
                  <select
                    value={newProperty.rooms}
                    onChange={(event) => setNewProperty((previous) => ({ ...previous, rooms: event.target.value }))}
                    className="w-full bg-[#f5f5f7] rounded-xl p-3 text-xs border border-slate-200 focus:outline-none focus:border-[#1d1d1f]"
                  >
                    <option value="1">1 room</option>
                    <option value="2">2 rooms</option>
                    <option value="3">3 rooms</option>
                    <option value="4">4+ rooms</option>
                  </select>
                </div>
                <FormInput label="Area (sqm)" type="number" value={newProperty.area} onChange={(value) => setNewProperty((previous) => ({ ...previous, area: value }))} placeholder="55" required />
              </div>

              <FormInput label="Image URL (optional)" value={newProperty.imagePlaceholder} onChange={(value) => setNewProperty((previous) => ({ ...previous, imagePlaceholder: value }))} placeholder="https://images.unsplash.com/..." />

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-light leading-relaxed">
                New listing will be attached to your current agent profile and saved as an available property.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-black/[0.08] hover:bg-slate-100 text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-all">
                  Create listing
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:w-80 shrink-0">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-white text-sm rounded-full pl-10 pr-4 py-2 border border-black/[0.05] focus:outline-none focus:border-[#1d1d1f] tracking-tight transition-all"
      />
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-[#f5f5f7] p-4 rounded-xl border border-black/[0.02]">
      <div className="w-10 h-10 bg-[#1d1d1f]/10 text-[#1d1d1f] rounded-lg flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
        <h3 className="text-xl font-bold font-serif leading-none mt-1">{value}</h3>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'number';
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#f5f5f7] rounded-xl p-3 text-xs border border-slate-200 focus:outline-none focus:border-[#1d1d1f] transition-all"
      />
    </div>
  );
}
