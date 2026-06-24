'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock, Home, Search, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

import type {
  AgentBooking,
  AgentProperty,
  AgentTab,
  BookingStatus,
  VerificationStatus,
} from '@/components/agent/types';
import AppHeader from '@/components/layout/AppHeader';
import type { HeaderUser } from '@/components/layout/types';
import { isAllowedPropertyImageUrl, sanitizePropertyImageUrl } from '@/lib/shared/propertyImage';

interface AgentCmsClientPageProps {
  user: HeaderUser;
}

interface AgentBookingsResponse {
  bookings?: AgentBooking[];
  error?: string;
}

interface AgentPropertiesResponse {
  properties?: AgentProperty[];
  error?: string;
}

interface AgentPropertyUpdateResponse {
  property?: AgentProperty;
  error?: string;
}

interface AgentPropertyCreateResponse {
  property?: AgentProperty;
  error?: string;
}

interface AgentPropertyDeleteResponse {
  message?: string;
  propertyId?: number;
  error?: string;
}

interface EditPropertyForm {
  title: string;
  baseRent: string;
  utilityCosts: string;
  rooms: string;
  area: string;
  status: 'Available' | 'Archived';
}

interface CreatePropertyForm {
  title: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  baseRent: string;
  utilityCosts: string;
  depositAmount: string;
  rooms: string;
  area: string;
  status: 'Available' | 'Archived';
  imageUrl: string;
}

const BOOKING_TABS: BookingStatus[] = ['NEW', 'PENDING_PAYMENT', 'RESERVED', 'CANCELLED'];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLeft(expiresAt: string, nowMs: number): string {
  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return 'Unknown';
  }

  const diff = expiresMs - nowMs;
  if (diff <= 0) {
    return 'Expired';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m ${seconds}s left`;
}

function statusClasses(status: BookingStatus): string {
  if (status === 'NEW') {
    return 'bg-blue-50 text-blue-700 border-blue-100';
  }
  if (status === 'PENDING_PAYMENT') {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (status === 'RESERVED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function formatBookingTabLabel(status: BookingStatus): string {
  if (status === 'PENDING_PAYMENT') {
    return 'PENDING';
  }
  if (status === 'RESERVED') {
    return 'RESERVED';
  }
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }
  return status;
}

function formatBookingBadgeLabel(status: BookingStatus): string {
  if (status === 'NEW') {
    return 'AWAITING AGENT CONFIRMATION';
  }
  if (status === 'PENDING_PAYMENT') {
    return 'AWAITING PAYMENT CONFIRMATION';
  }
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }
  return 'RESERVED';
}

function verificationBadge(verificationStatus: VerificationStatus): {
  label: string;
  className: string;
} {
  if (verificationStatus === 'VERIFIED') {
    return {
      label: 'Verified client',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
  }
  if (verificationStatus === 'REJECTED') {
    return {
      label: 'Rejected verification',
      className: 'bg-rose-50 text-rose-700 border-rose-100',
    };
  }
  return {
    label: 'Pending verification',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  };
}

export default function AgentCmsClientPage({ user }: AgentCmsClientPageProps) {
  const [activeTab, setActiveTab] = useState<AgentTab>('bookings');
  const [bookingSubTab, setBookingSubTab] = useState<BookingStatus>('NEW');
  const [bookingSearch, setBookingSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [actionBookingId, setActionBookingId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [editingProperty, setEditingProperty] = useState<AgentProperty | null>(null);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [isCreatePropertyModalOpen, setIsCreatePropertyModalOpen] = useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState<number | null>(null);
  const [editPropertyForm, setEditPropertyForm] = useState<EditPropertyForm>({
    title: '',
    baseRent: '',
    utilityCosts: '',
    rooms: '',
    area: '',
    status: 'Available',
  });
  const [createPropertyForm, setCreatePropertyForm] = useState<CreatePropertyForm>({
    title: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    baseRent: '',
    utilityCosts: '',
    depositAmount: '',
    rooms: '',
    area: '',
    status: 'Available',
    imageUrl: '',
  });

  const fetchBookings = useCallback(async (status?: BookingStatus, search = ''): Promise<AgentBooking[]> => {
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status);
    }
    if (search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(`/api/agent/bookings?${params.toString()}`, { cache: 'no-store' });
    const data = (await response.json().catch(() => null)) as AgentBookingsResponse | null;
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to load bookings.');
    }
    return Array.isArray(data?.bookings) ? data.bookings : [];
  }, []);

  const loadBookings = useCallback(async (status: BookingStatus, search: string) => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const nextBookings = await fetchBookings(status, search);
      setBookings(nextBookings);
    } catch {
      setBookingsError('Connection error. Please try again later.');
    } finally {
      setBookingsLoading(false);
    }
  }, [fetchBookings]);

  const loadBookingStats = useCallback(async () => {
    try {
      const allBookings = await fetchBookings();
      setNewRequestsCount(allBookings.filter((booking) => booking.status === 'NEW').length);
    } catch {
      setNewRequestsCount(0);
    }
  }, [fetchBookings]);

  const loadProperties = useCallback(async () => {
    setPropertiesLoading(true);
    setPropertiesError(null);
    try {
      const response = await fetch('/api/agent/properties', { cache: 'no-store' });
      const data = (await response.json()) as AgentPropertiesResponse;
      if (!response.ok) {
        setPropertiesError(data.error || 'Failed to load properties.');
        return;
      }
      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch {
      setPropertiesError('Connection error. Please try again later.');
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBookings(bookingSubTab, bookingSearch);
  }, [bookingSubTab, bookingSearch, loadBookings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBookingStats();
  }, [loadBookingStats]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    return {
      pendingRequests: newRequestsCount,
      activePropertiesCount: properties.length,
      rentedPropertiesCount: properties.filter((property) => property.dbStatus === 'RESERVED').length,
    };
  }, [newRequestsCount, properties]);

  const filteredProperties = useMemo(() => {
    const search = propertySearch.trim().toLowerCase();
    if (!search) {
      return properties;
    }
    return properties.filter(
      (property) =>
        property.title.toLowerCase().includes(search) ||
        property.address.toLowerCase().includes(search)
    );
  }, [properties, propertySearch]);

  const handleApprove = async (bookingId: number) => {
    if (actionBookingId === bookingId) {
      return;
    }
    setActionBookingId(bookingId);
    try {
      const response = await fetch(`/api/agent/bookings/${bookingId}/approve`, { method: 'PATCH' });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        window.alert(data?.error || 'Failed to approve booking.');
        return;
      }
      await Promise.all([loadBookings(bookingSubTab, bookingSearch), loadBookingStats(), loadProperties()]);
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setActionBookingId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (actionBookingId === bookingId) {
      return;
    }
    setActionBookingId(bookingId);
    try {
      const response = await fetch(`/api/agent/bookings/${bookingId}/cancel`, { method: 'PATCH' });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        window.alert(data?.error || 'Failed to cancel booking.');
        return;
      }
      await Promise.all([loadBookings(bookingSubTab, bookingSearch), loadBookingStats(), loadProperties()]);
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setActionBookingId(null);
    }
  };

  const openEditPropertyModal = (property: AgentProperty) => {
    setEditingProperty(property);
    setEditPropertyForm({
      title: property.title,
      baseRent: String(property.baseRent),
      utilityCosts: String(property.utilityCosts),
      rooms: String(property.rooms),
      area: String(property.area),
      status: property.status === 'Available' ? 'Available' : 'Archived',
    });
  };

  const closeEditPropertyModal = () => {
    if (isSavingProperty) {
      return;
    }
    setEditingProperty(null);
  };

  const handleSaveProperty = async () => {
    if (!editingProperty || isSavingProperty) {
      return;
    }

    setIsSavingProperty(true);
    try {
      const response = await fetch(`/api/agent/properties/${editingProperty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPropertyForm.title.trim(),
          baseRent: Number(editPropertyForm.baseRent),
          utilityCosts: Number(editPropertyForm.utilityCosts),
          rooms: Number(editPropertyForm.rooms),
          area: Number(editPropertyForm.area),
          status: editPropertyForm.status,
        }),
      });
      const data = (await response.json().catch(() => null)) as AgentPropertyUpdateResponse | null;
      if (!response.ok || !data?.property) {
        window.alert(data?.error || 'Failed to update property.');
        return;
      }

      setProperties((previous) =>
        previous.map((property) => (property.id === data.property?.id ? data.property : property))
      );
      setEditingProperty(null);
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setIsSavingProperty(false);
    }
  };

  const resetCreatePropertyForm = () => {
    setCreatePropertyForm({
      title: '',
      streetAddress: '',
      postalCode: '',
      city: '',
      baseRent: '',
      utilityCosts: '',
      depositAmount: '',
      rooms: '',
      area: '',
      status: 'Available',
      imageUrl: '',
    });
  };

  const handleCreateProperty = async () => {
    if (isCreatingProperty) {
      return;
    }

    const trimmedImageUrl = createPropertyForm.imageUrl.trim();
    if (trimmedImageUrl && !isAllowedPropertyImageUrl(trimmedImageUrl)) {
      window.alert('Invalid image URL. Use a direct URL from images.unsplash.com.');
      return;
    }

    setIsCreatingProperty(true);
    try {
      const response = await fetch('/api/agent/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createPropertyForm.title.trim(),
          streetAddress: createPropertyForm.streetAddress.trim(),
          postalCode: createPropertyForm.postalCode.trim(),
          city: createPropertyForm.city.trim(),
          baseRent: Number(createPropertyForm.baseRent),
          utilityCosts: Number(createPropertyForm.utilityCosts),
          depositAmount: Number(createPropertyForm.depositAmount),
          rooms: Number(createPropertyForm.rooms),
          area: Number(createPropertyForm.area),
          status: createPropertyForm.status,
          imageUrl: trimmedImageUrl,
        }),
      });
      const data = (await response.json().catch(() => null)) as AgentPropertyCreateResponse | null;
      if (!response.ok || !data?.property) {
        window.alert(data?.error || 'Failed to create property.');
        return;
      }

      setProperties((previous) => [data.property as AgentProperty, ...previous]);
      setIsCreatePropertyModalOpen(false);
      resetCreatePropertyForm();
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setIsCreatingProperty(false);
    }
  };

  const handleDeleteProperty = async (property: AgentProperty) => {
    if (deletingPropertyId === property.id || isSavingProperty) {
      return;
    }

    const confirmed = window.confirm(
      `Delete property "${property.title}"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingPropertyId(property.id);
    try {
      const response = await fetch(`/api/agent/properties/${property.id}`, {
        method: 'DELETE',
      });
      const data = (await response.json().catch(() => null)) as AgentPropertyDeleteResponse | null;
      if (!response.ok) {
        window.alert(data?.error || 'Failed to delete property.');
        return;
      }

      setProperties((previous) =>
        previous.filter((currentProperty) => currentProperty.id !== property.id)
      );
      if (editingProperty?.id === property.id) {
        setEditingProperty(null);
      }
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setDeletingPropertyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      <AppHeader
        user={user}
        brandSubtitle="Agent Portal"
        centerContent={
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span>Agent workspace</span>
            <span>-</span>
            <span>{stats.pendingRequests} NEW requests</span>
          </div>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="New booking requests"
            value={`${stats.pendingRequests} requests`}
            icon={<Clock className="w-5 h-5" />}
          />
          <MetricCard
            label="Inventory total"
            value={`${stats.activePropertiesCount} listings`}
            icon={<Home className="w-5 h-5" />}
          />
          <MetricCard
            label="Successfully rented"
            value={`${stats.rentedPropertiesCount} units`}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
        </section>

        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider ${
              activeTab === 'bookings'
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-white text-slate-600 border border-black/[0.06]'
            }`}
          >
            Bookings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider ${
              activeTab === 'properties'
                ? 'bg-[#1d1d1f] text-white'
                : 'bg-white text-slate-600 border border-black/[0.06]'
            }`}
          >
            Properties
          </button>
        </section>

        <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'bookings' ? (
          <motion.section
            key="agent-bookings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <div>
                <h1 className="text-2xl font-serif font-semibold tracking-tight">Agent bookings</h1>
                <p className="text-sm text-slate-500">Review your real booking requests and process them by status.</p>
              </div>
              <SearchInput
                value={bookingSearch}
                onChange={setBookingSearch}
                placeholder="Search client, email, property..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {BOOKING_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBookingSubTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    bookingSubTab === tab
                      ? 'bg-[#1d1d1f] text-white'
                      : 'bg-white text-slate-600 border border-black/[0.06]'
                  }`}
                >
                  {formatBookingTabLabel(tab)}
                </button>
              ))}
            </div>

            {bookingsLoading ? (
              <div className="bg-white rounded-2xl py-10 text-center border border-black/[0.03] text-sm text-slate-500">
                Loading bookings...
              </div>
            ) : bookingsError ? (
              <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-4 text-sm">
                {bookingsError}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl py-10 text-center border border-black/[0.03]">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No bookings in this status.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((booking) => {
                  const isProcessing = actionBookingId === booking.id;
                  const canApprove = booking.status === 'NEW';
                  const canReject = booking.status === 'NEW';
                  const canCancel = booking.status === 'PENDING_PAYMENT';
                  const verification = verificationBadge(booking.client.verificationStatus);
                  const holdTimeLeft = booking.status === 'PENDING_PAYMENT' ? formatTimeLeft(booking.expiresAt, nowMs) : null;

                  return (
                    <article key={booking.id} className="bg-white rounded-2xl border border-black/[0.03] p-5 shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                              #{booking.id}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${statusClasses(
                                booking.status
                              )}`}
                            >
                              {formatBookingBadgeLabel(booking.status)}
                            </span>
                          </div>
                          <h3 className="font-serif text-lg">{booking.property.title}</h3>
                          <p className="text-xs text-slate-500">{booking.property.address}</p>
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {booking.client.fullName}
                            </span>
                            <span>{booking.client.email}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${verification.className}`}
                            >
                              {verification.label}
                            </span>
                            {booking.status === 'PENDING_PAYMENT' ? (
                              <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-100">
                                Expires in: {holdTimeLeft}
                              </span>
                            ) : null}
                            <span>Created: {formatDate(booking.createdAt)}</span>
                            {booking.status !== 'PENDING_PAYMENT' ? <span>Expires: {formatDate(booking.expiresAt)}</span> : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {canApprove ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(booking.id)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-60 transition"
                            >
                              {isProcessing ? 'Processing...' : 'Confirm availability'}
                            </button>
                          ) : null}

                          {canReject ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(booking.id)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-700 disabled:opacity-60 transition"
                            >
                              {isProcessing ? 'Processing...' : 'Reject'}
                            </button>
                          ) : null}

                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(booking.id)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-full border border-rose-300 text-rose-700 text-xs font-semibold uppercase tracking-wider hover:bg-rose-50 disabled:opacity-60 transition"
                            >
                              {isProcessing ? 'Processing...' : 'Cancel'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="bg-white border border-black/[0.04] rounded-2xl p-5 flex items-start gap-3 text-xs text-slate-600">
              <div className="w-8 h-8 rounded-lg bg-[#1d1d1f]/5 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-[#1d1d1f]" />
              </div>
              <p>
                Status flow in Agent CRM: <strong>AWAITING AGENT CONFIRMATION</strong> -&gt;{' '}
                <strong>AWAITING PAYMENT CONFIRMATION</strong> -&gt; <strong>RESERVED</strong> or{' '}
                <strong>CANCELLED</strong>. Only bookings from your properties are accessible.
              </p>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="agent-properties-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <div>
                <h1 className="text-2xl font-serif font-semibold tracking-tight">My properties</h1>
                <p className="text-sm text-slate-500">Real listings bound to your agent profile.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={propertySearch}
                  onChange={setPropertySearch}
                  placeholder="Search by title or address..."
                />
                <button
                  type="button"
                  onClick={() => setIsCreatePropertyModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition"
                >
                  Add property
                </button>
              </div>
            </div>

            {propertiesLoading ? (
              <div className="bg-white rounded-2xl py-10 text-center border border-black/[0.03] text-sm text-slate-500">
                Loading properties...
              </div>
            ) : propertiesError ? (
              <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-5 py-4 text-sm">
                {propertiesError}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white rounded-2xl py-10 text-center border border-black/[0.03] text-sm text-slate-500">
                No properties found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProperties.map((property) => (
                  <article key={property.id} className="bg-white rounded-2xl border border-black/[0.03] overflow-hidden shadow-sm">
                    <Image
                      src={sanitizePropertyImageUrl(property.imagePlaceholder)}
                      alt={property.title}
                      width={1200}
                      height={660}
                      className="w-full h-44 object-cover"
                    />
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-serif text-lg">{property.title}</h3>
                        <p className="text-xs text-slate-500">{property.address}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-slate-100 px-2 py-1 rounded-full">Rooms: {property.rooms}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-full">Area: {property.area} sqm</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-full">Rent: EUR {property.baseRent}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded-full">Utilities: EUR {property.utilityCosts}</span>
                      </div>
                      <span
                        className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                          property.dbStatus === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : property.dbStatus === 'PENDING_PAYMENT'
                              ? 'bg-amber-100 text-amber-700'
                              : property.dbStatus === 'RESERVED'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {property.status}
                      </span>
                      <div className="pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPropertyModal(property)}
                            disabled={deletingPropertyId === property.id}
                            className="px-4 py-2 rounded-full border border-black/[0.08] text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void handleDeleteProperty(property);
                            }}
                            disabled={deletingPropertyId === property.id}
                            className="px-4 py-2 rounded-full border border-rose-200 text-rose-700 text-xs font-semibold uppercase tracking-wider hover:bg-rose-50 transition disabled:opacity-60"
                          >
                            {deletingPropertyId === property.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
      {editingProperty ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-[#1d1d1f]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="bg-[#1d1d1f] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Property update</span>
                <h3 className="font-serif font-semibold text-lg mt-0.5">Edit listing #{editingProperty.id}</h3>
              </div>
              <button
                type="button"
                onClick={closeEditPropertyModal}
                disabled={isSavingProperty}
                className="text-slate-400 hover:text-white transition text-xl font-bold px-3 py-1"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FormInput
                label="Title"
                value={editPropertyForm.title}
                onChange={(value) => setEditPropertyForm((prev) => ({ ...prev, title: value }))}
                placeholder="Property title"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Base rent (EUR)"
                  type="number"
                  value={editPropertyForm.baseRent}
                  onChange={(value) => setEditPropertyForm((prev) => ({ ...prev, baseRent: value }))}
                  placeholder="1200"
                  required
                />
                <FormInput
                  label="Utilities (EUR)"
                  type="number"
                  value={editPropertyForm.utilityCosts}
                  onChange={(value) => setEditPropertyForm((prev) => ({ ...prev, utilityCosts: value }))}
                  placeholder="200"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Rooms"
                  type="number"
                  value={editPropertyForm.rooms}
                  onChange={(value) => setEditPropertyForm((prev) => ({ ...prev, rooms: value }))}
                  placeholder="2"
                  required
                />
                <FormInput
                  label="Area (sqm)"
                  type="number"
                  value={editPropertyForm.area}
                  onChange={(value) => setEditPropertyForm((prev) => ({ ...prev, area: value }))}
                  placeholder="50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Status</label>
                <select
                  value={editPropertyForm.status}
                  onChange={(event) =>
                    setEditPropertyForm((prev) => ({
                      ...prev,
                      status: event.target.value as AgentProperty['status'],
                    }))
                  }
                  className="w-full bg-[#f5f5f7] rounded-xl p-3 text-xs border border-slate-200 focus:outline-none focus:border-[#1d1d1f]"
                >
                  <option value="Available">Available</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-black/[0.04] flex items-center justify-between">
              <button
                type="button"
                onClick={closeEditPropertyModal}
                disabled={isSavingProperty}
                className="px-4 py-2 border border-black/[0.08] rounded-full text-xs font-semibold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSaveProperty();
                }}
                disabled={isSavingProperty}
                className="px-5 py-2 bg-[#1d1d1f] text-white rounded-full text-xs font-semibold uppercase disabled:opacity-60"
              >
                {isSavingProperty ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      <AnimatePresence>
      {isCreatePropertyModalOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-[#1d1d1f]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="bg-[#1d1d1f] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Property creation</span>
                <h3 className="font-serif font-semibold text-lg mt-0.5">Create new listing</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isCreatingProperty) return;
                  setIsCreatePropertyModalOpen(false);
                }}
                disabled={isCreatingProperty}
                className="text-slate-400 hover:text-white transition text-xl font-bold px-3 py-1"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FormInput
                label="Title"
                value={createPropertyForm.title}
                onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, title: value }))}
                placeholder="Modern apartment"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Street address"
                  value={createPropertyForm.streetAddress}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, streetAddress: value }))}
                  placeholder="Leopoldstrasse 12"
                  required
                />
                <FormInput
                  label="Postal code"
                  value={createPropertyForm.postalCode}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, postalCode: value }))}
                  placeholder="80331"
                  required
                />
              </div>
              <FormInput
                label="City"
                value={createPropertyForm.city}
                onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, city: value }))}
                placeholder="Munich"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Base rent (EUR)"
                  type="number"
                  value={createPropertyForm.baseRent}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, baseRent: value }))}
                  placeholder="1200"
                  required
                />
                <FormInput
                  label="Utilities (EUR)"
                  type="number"
                  value={createPropertyForm.utilityCosts}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, utilityCosts: value }))}
                  placeholder="200"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Deposit amount (EUR)"
                  type="number"
                  value={createPropertyForm.depositAmount}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, depositAmount: value }))}
                  placeholder="2400"
                  required
                />
                <FormInput
                  label="Rooms"
                  type="number"
                  value={createPropertyForm.rooms}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, rooms: value }))}
                  placeholder="2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Area (sqm)"
                  type="number"
                  value={createPropertyForm.area}
                  onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, area: value }))}
                  placeholder="55"
                  required
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Status</label>
                  <select
                    value={createPropertyForm.status}
                    onChange={(event) =>
                      setCreatePropertyForm((prev) => ({
                        ...prev,
                        status: event.target.value as AgentProperty['status'],
                      }))
                    }
                    className="w-full bg-[#f5f5f7] rounded-xl p-3 text-xs border border-slate-200 focus:outline-none focus:border-[#1d1d1f]"
                  >
                    <option value="Available">Available</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <FormInput
                label="Image URL (optional)"
                value={createPropertyForm.imageUrl}
                onChange={(value) => setCreatePropertyForm((prev) => ({ ...prev, imageUrl: value }))}
                placeholder="https://images.unsplash.com/..."
              />
              <p className="text-[11px] text-slate-500">
                Only direct image links from images.unsplash.com are allowed.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-black/[0.04] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (isCreatingProperty) return;
                  setIsCreatePropertyModalOpen(false);
                }}
                disabled={isCreatingProperty}
                className="px-4 py-2 border border-black/[0.08] rounded-full text-xs font-semibold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleCreateProperty();
                }}
                disabled={isCreatingProperty}
                className="px-5 py-2 bg-[#1d1d1f] text-white rounded-full text-xs font-semibold uppercase disabled:opacity-60"
              >
                {isCreatingProperty ? 'Creating...' : 'Create property'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
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

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-black/[0.02]">
      <div className="w-10 h-10 bg-[#1d1d1f]/10 text-[#1d1d1f] rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
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
        className="w-full bg-[#f5f5f7] rounded-xl p-3 text-xs border border-slate-200 focus:outline-none focus:border-[#1d1d1f]"
      />
    </div>
  );
}
