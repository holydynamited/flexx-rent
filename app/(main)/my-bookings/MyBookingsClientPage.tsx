'use client';

import { useEffect, useMemo, useState } from 'react';
import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import type { HeaderUser } from '@/components/layout/types';
import type { BookingStatus } from '@/lib/types';

interface BookingListItem {
  id: number;
  status: BookingStatus;
  createdAt: string;
  expiresAt: string;
  property: {
    id: number;
    title: string;
    address: string;
    price: number;
    image: string;
  };
  payment: {
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
    transactionId: string | null;
  };
}

interface MyBookingsResponse {
  bookings?: BookingListItem[];
  error?: string;
}

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

export default function MyBookingsClientPage({ user }: { user: HeaderUser }) {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/bookings/my', { cache: 'no-store' });
        const data = (await response.json()) as MyBookingsResponse;
        if (!response.ok) {
          if (active) {
            setError(data.error || 'Failed to load bookings.');
          }
          return;
        }
        if (active) {
          setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        }
      } catch {
        if (active) {
          setError('Connection error. Please try again later.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadBookings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const hasBookings = bookings.length > 0;
  const activeCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'NEW' || booking.status === 'PENDING_PAYMENT').length,
    [bookings]
  );

  const handleCancel = async (bookingId: number) => {
    if (cancelingId === bookingId) {
      return;
    }

    setCancelingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        window.alert(data?.error || 'Failed to cancel booking.');
        return;
      }

      setBookings((previous) =>
        previous.map((booking) => (booking.id === bookingId ? { ...booking, status: 'CANCELLED' } : booking))
      );
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setCancelingId(null);
    }
  };

  const handlePay = async (booking: BookingListItem) => {
    if (payingId === booking.id) {
      return;
    }
    setPayingId(booking.id);
    try {
      let transactionId = booking.payment.transactionId;

      if (!transactionId || booking.payment.status !== 'PENDING') {
        const createResponse = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        });
        const createPayload = (await createResponse.json().catch(() => null)) as
          | { transactionId?: string; alreadyPaid?: boolean; error?: string }
          | null;
        if (!createResponse.ok) {
          window.alert(createPayload?.error || 'Failed to create payment intent.');
          return;
        }
        if (createPayload?.alreadyPaid) {
          setBookings((previous) =>
            previous.map((item) =>
              item.id === booking.id
                ? { ...item, payment: { ...item.payment, status: 'SUCCESS' } }
                : item
            )
          );
          return;
        }
        transactionId = createPayload?.transactionId || null;
      }

      if (!transactionId) {
        window.alert('Payment transaction was not created.');
        return;
      }

      const confirmResponse = await fetch('/api/payments/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      const confirmPayload = (await confirmResponse.json().catch(() => null)) as
        | { error?: string; bookingStatus?: BookingStatus }
        | null;
      if (!confirmResponse.ok) {
        window.alert(confirmPayload?.error || 'Payment failed.');
        return;
      }

      setBookings((previous) =>
        previous.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                    status: confirmPayload?.bookingStatus || 'RESERVED',
                payment: { status: 'SUCCESS', transactionId },
              }
            : item
        )
      );
    } catch {
      window.alert('Connection error. Please try again later.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans font-light tracking-tight flex flex-col antialiased selection:bg-[#1d1d1f] selection:text-white">
      <AppHeader user={user} brandSubtitle="Germany Division" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-10 space-y-8">
        <section className="space-y-2 text-left">
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500 font-semibold block">Client Dashboard</span>
          <h1 className="text-3xl md:text-4xl font-serif text-[#1d1d1f] tracking-tight">My bookings</h1>
          <p className="text-slate-500 font-light max-w-2xl text-sm md:text-base leading-relaxed">
            Track your booking requests, monitor payment hold timers, and complete payment before expiration.
          </p>
        </section>

        <section className="bg-white rounded-3xl p-5 md:p-6 border border-black/[0.04] shadow-xl shadow-black/[0.02]">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
              Total: {bookings.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              Active bookings: {activeCount}
            </span>
          </div>
        </section>

        {loading ? (
          <div className="bg-white rounded-3xl py-14 text-center text-sm text-slate-500 border border-black/[0.03]">
            Loading your bookings...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-3xl px-6 py-5 text-sm">{error}</div>
        ) : !hasBookings ? (
          <div className="bg-white rounded-3xl py-14 px-6 text-center space-y-2 border border-black/[0.03]">
            <p className="text-lg font-serif">No bookings yet</p>
            <p className="text-sm text-slate-500">Open the catalog and click Book apartment to create your first request.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const canCancel =
                (booking.status === 'NEW' || booking.status === 'PENDING_PAYMENT') &&
                booking.payment.status !== 'SUCCESS';
              const canPay = booking.status === 'PENDING_PAYMENT' && booking.payment.status !== 'SUCCESS';
              const isCanceling = cancelingId === booking.id;
              const isPaying = payingId === booking.id;
              const timeLeft = booking.status === 'PENDING_PAYMENT' ? formatTimeLeft(booking.expiresAt, nowMs) : null;

              return (
                <article
                  key={booking.id}
                  className="bg-white rounded-3xl p-5 md:p-6 border border-black/[0.03] shadow-xl shadow-black/[0.01] space-y-4"
                >
                  <div className="rounded-2xl overflow-hidden bg-slate-100 border border-black/[0.03]">
                    <img
                      src={booking.property.image}
                      alt={booking.property.title}
                      className="w-full h-48 md:h-56 object-cover"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl">{booking.property.title}</h2>
                      <p className="text-xs text-slate-500">{booking.property.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border font-semibold ${statusClasses(
                          booking.status
                        )}`}
                      >
                        {formatBookingBadgeLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#f5f5f7] rounded-2xl p-3">
                      <p className="text-slate-400 uppercase tracking-wider text-[10px]">Rent</p>
                      <p className="font-semibold text-sm">{booking.property.price} EUR / month</p>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-2xl p-3">
                      <p className="text-slate-400 uppercase tracking-wider text-[10px]">Created</p>
                      <p className="font-semibold text-sm">{formatDate(booking.createdAt)}</p>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-2xl p-3">
                      <p className="text-slate-400 uppercase tracking-wider text-[10px]">Expires</p>
                      <p className="font-semibold text-sm">{formatDate(booking.expiresAt)}</p>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-2xl p-3">
                      <p className="text-slate-400 uppercase tracking-wider text-[10px]">Timer</p>
                      <p className="font-semibold text-sm">{timeLeft ?? '-'}</p>
                    </div>
                  </div>

                  {canCancel || canPay ? (
                    <div className="flex justify-end gap-2">
                      {canPay ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handlePay(booking);
                          }}
                          disabled={isPaying || isCanceling}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-xs font-semibold transition disabled:opacity-60"
                        >
                          {isPaying ? 'Processing payment...' : 'Pay now'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.id)}
                        disabled={isCanceling || isPaying}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-xs font-semibold transition disabled:opacity-60"
                      >
                        {isCanceling ? 'Cancelling...' : 'Cancel booking'}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <AppFooter divisionLabel="Germany Real Estate Division" />
    </div>
  );
}
