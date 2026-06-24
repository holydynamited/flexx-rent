'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Lock,
  Printer,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import type { HeaderUser } from '@/components/layout/types';

type PaymentMethod = 'card' | 'sepa' | 'apple';

interface CheckoutClientPageProps {
  user: HeaderUser;
}

const SELECTED_PROPERTY = {
  id: 'prop_001',
  title: 'Maxvorstadt Apartment',
  city: 'Munich',
  address: 'Theresienstrasse 45, Munich',
  baseRent: 1200,
  utilityCosts: 250,
  deposit: 2400,
  image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  agentName: 'Mark Weber',
};

const PROCESSING_STEPS = [
  'Establishing secure SSL session...',
  'Encrypting payment details according to PCI-DSS...',
  'Authorizing total amount on FlexxRent escrow account...',
  'Reserving deposit with partner bank...',
  'Transaction successfully verified.',
];

export default function CheckoutClientPage({ user }: CheckoutClientPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [sepaIban, setSepaIban] = useState('');
  const [sepaBic, setSepaBic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const totalAmount = SELECTED_PROPERTY.baseRent + SELECTED_PROPERTY.utilityCosts + SELECTED_PROPERTY.deposit;
  const formattedTotal = useMemo(() => new Intl.NumberFormat('en-US').format(totalAmount), [totalAmount]);

  const handleCardNumberChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(sanitized.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(sanitized.length > 2 ? `${sanitized.slice(0, 2)}/${sanitized.slice(2)}` : sanitized);
  };

  const handleCvvChange = (value: string) => {
    setCardCvv(value.replace(/\D/g, '').slice(0, 3));
  };

  const handleSubmitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessingStep(0);
    setIsProcessing(true);
  };

  useEffect(() => {
    if (!isProcessing) return;

    const interval = window.setInterval(() => {
      setProcessingStep((previous) => {
        if (previous < PROCESSING_STEPS.length - 1) return previous + 1;

        window.clearInterval(interval);
        setIsProcessing(false);
        setIsPaid(true);
        setTransactionId(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
        return previous;
      });
    }, 1100);

    return () => window.clearInterval(interval);
  }, [isProcessing]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      <AppHeader
        user={user}
        brandSubtitle="Secure Checkout"
        centerContent={
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <span>Escrow protected payment</span>
            <span>•</span>
            <span>AES-256 encrypted</span>
          </div>
        }
      />

      <main className="max-w-6xl mx-auto w-full px-4 md:px-6 py-10 md:py-14">
        <AnimatePresence mode="wait" initial={false}>
        {!isPaid ? (
          <motion.div
            key="checkout-payment-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <section className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-black/[0.02] shadow-xl shadow-black/[0.02] space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-serif tracking-tight">Secure payment</h1>
                <p className="text-xs md:text-sm text-slate-500 font-light leading-relaxed">
                  Complete the first-month payment and security deposit transfer to finalize your reservation.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#f5f5f7] p-1 rounded-xl border border-black/[0.02]">
                <MethodButton active={paymentMethod === 'card'} label="Card" icon={<CreditCard className="w-4 h-4" />} onClick={() => setPaymentMethod('card')} />
                <MethodButton active={paymentMethod === 'sepa'} label="SEPA" icon={<Building className="w-4 h-4" />} onClick={() => setPaymentMethod('sepa')} />
                <MethodButton active={paymentMethod === 'apple'} label="Apple Pay" icon={<Wallet className="w-4 h-4" />} onClick={() => setPaymentMethod('apple')} />
              </div>

              {isProcessing ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="py-10 space-y-5"
                >
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1d1d1f] rounded-full transition-all duration-500" style={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Processing transaction</p>
                    <p className="text-xs text-slate-500 font-mono">{PROCESSING_STEPS[processingStep]}</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <AnimatePresence mode="wait" initial={false}>
                    {paymentMethod === 'card' ? (
                      <motion.div
                        key="checkout-method-card"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="space-y-4"
                      >
                        <Field label="Card holder name">
                          <input
                            type="text"
                            required
                            value={cardName}
                            onChange={(event) => setCardName(event.target.value.toUpperCase())}
                            placeholder="IVAN KOVALENKO"
                            className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm tracking-widest font-mono focus:outline-none focus:border-[#1d1d1f] focus:bg-white"
                          />
                        </Field>
                        <Field label="Card number">
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(event) => handleCardNumberChange(event.target.value)}
                            placeholder="0000 0000 0000 0000"
                            className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm tracking-widest font-mono focus:outline-none focus:border-[#1d1d1f] focus:bg-white"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Expiry">
                            <input
                              type="text"
                              required
                              value={cardExpiry}
                              onChange={(event) => handleExpiryChange(event.target.value)}
                              placeholder="MM/YY"
                              className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm tracking-widest font-mono text-center focus:outline-none focus:border-[#1d1d1f] focus:bg-white"
                            />
                          </Field>
                          <Field label="CVV">
                            <input
                              type="password"
                              required
                              value={cardCvv}
                              onChange={(event) => handleCvvChange(event.target.value)}
                              placeholder="•••"
                              className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm tracking-widest font-mono text-center focus:outline-none focus:border-[#1d1d1f] focus:bg-white"
                            />
                          </Field>
                        </div>
                      </motion.div>
                    ) : null}

                    {paymentMethod === 'sepa' ? (
                      <motion.div
                        key="checkout-method-sepa"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="space-y-4"
                      >
                        <Field label="IBAN">
                          <input
                            type="text"
                            required
                            value={sepaIban}
                            onChange={(event) => setSepaIban(event.target.value.toUpperCase())}
                            placeholder="DE89 3704 0044 0532 0130 00"
                            className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm tracking-widest font-mono focus:outline-none focus:border-[#1d1d1f] focus:bg-white"
                          />
                        </Field>
                        <Field label="BIC">
                          <input
                            type="text"
                            required
                            value={sepaBic}
                            onChange={(event) => setSepaBic(event.target.value.toUpperCase())}
                            placeholder="COBADEFFXXX"
                            className="w-full bg-[#f5f5f7] border border-black/[0.05] rounded-xl px-4 py-3 text-sm tracking-widest font-mono focus:outline-none focus:border-[#1d1d1f] focus:bg-white"
                          />
                        </Field>
                        <p className="text-[11px] text-slate-500 bg-[#f5f5f7] border border-black/[0.02] p-3 rounded-xl">
                          By continuing, you authorize FlexxRent to collect funds via SEPA Direct Debit.
                        </p>
                      </motion.div>
                    ) : null}

                    {paymentMethod === 'apple' ? (
                      <motion.div
                        key="checkout-method-apple"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="py-8 text-center space-y-3"
                      >
                        <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium">Pay with Apple Pay</p>
                        <p className="text-xs text-slate-500">Use Face ID or Touch ID to authorize this payment.</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <button
                    type="submit"
                    className="w-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold uppercase tracking-widest py-4 rounded-full transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                  >
                    <span>Pay EUR {formattedTotal}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </section>

            <section className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl overflow-hidden border border-black/[0.02] shadow-xl shadow-black/[0.02]">
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img src={SELECTED_PROPERTY.image} alt={SELECTED_PROPERTY.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-[#1d1d1f]/85 text-white text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                    {SELECTED_PROPERTY.id}
                  </span>
                </div>
                <div className="p-5 space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Selected property</span>
                  <h3 className="font-serif font-semibold text-base leading-tight">{SELECTED_PROPERTY.title}</h3>
                  <p className="text-xs text-slate-500 font-light truncate">{SELECTED_PROPERTY.address}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-black/[0.02] shadow-xl shadow-black/[0.02] space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-bold text-slate-500">Invoice breakdown</h4>
                <Breakdown label="First month base rent" value={SELECTED_PROPERTY.baseRent} />
                <Breakdown label="First month utilities" value={SELECTED_PROPERTY.utilityCosts} />
                <Breakdown label="Security deposit (2x)" value={SELECTED_PROPERTY.deposit} highlight />
                <div className="pt-3 border-t border-black/[0.04] flex justify-between items-center text-sm font-bold text-[#1d1d1f]">
                  <span>Total due</span>
                  <span className="font-mono text-base text-emerald-600">EUR {formattedTotal}</span>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Your deposit is held in an escrow account and kept separate from landlord assets according to German tenancy requirements.
                </p>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="checkout-payment-success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-white rounded-3xl p-8 md:p-12 border border-black/[0.02] shadow-xl shadow-black/[0.02] max-w-2xl mx-auto text-center space-y-8"
          >
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-serif tracking-tight">Payment completed</h1>
              <p className="text-xs text-slate-500 font-light max-w-sm mx-auto leading-relaxed">
                Funds were successfully transferred to FlexxRent escrow. Your reservation is now confirmed.
              </p>
            </div>

            <div className="bg-[#f5f5f7] rounded-xl p-5 border border-black/[0.02] text-left text-xs space-y-4">
              <div className="flex justify-between border-b border-black/[0.03] pb-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Transaction ID</span>
                  <strong className="font-mono text-[#1d1d1f]">{transactionId}</strong>
                </div>
                <span className="text-emerald-700 font-semibold uppercase tracking-wider text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full h-fit">
                  Escrow held
                </span>
              </div>
              <div className="space-y-2">
                <ReceiptRow label="Property" value={SELECTED_PROPERTY.title} />
                <ReceiptRow label="Address" value={SELECTED_PROPERTY.address} />
                <ReceiptRow label="Agent" value={SELECTED_PROPERTY.agentName} />
                <ReceiptRow label="Amount" value={`EUR ${formattedTotal}`} strong />
              </div>
            </div>

            <div className="border-t border-black/[0.05] pt-6 space-y-4">
              <div className="flex items-start gap-3.5 text-left text-xs bg-slate-50 p-4 rounded-xl border border-black/[0.01]">
                <Clock className="w-5 h-5 text-[#1d1d1f] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-[#1d1d1f]">Next step: key handover</h4>
                  <p className="text-slate-500 font-light leading-relaxed">
                    Agent {SELECTED_PROPERTY.agentName} will contact you within 24 hours to schedule handover and inspection.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ActionButton icon={<Printer className="w-4 h-4" />} label="Print receipt" onClick={() => window.print()} />
                <ActionButton icon={<Download className="w-4 h-4" />} label="Download PDF" onClick={() => {}} />
                <ActionButton icon={<ExternalLink className="w-4 h-4" />} label="Open bookings" onClick={() => { window.location.href = '/agent'; }} primary />
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      <AppFooter divisionLabel="Payments and Escrow Division" />
    </div>
  );
}

function MethodButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${active ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-slate-500 hover:text-[#1d1d1f]'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

function Breakdown({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-600 font-light">{label}</span>
      <strong className={`font-mono ${highlight ? 'text-blue-600 font-semibold' : 'text-[#1d1d1f] font-medium'}`}>
        EUR {new Intl.NumberFormat('en-US').format(value)}
      </strong>
    </div>
  );
}

function ReceiptRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}:</span>
      <strong className={strong ? 'font-mono text-emerald-600 font-bold text-sm' : 'font-medium text-[#1d1d1f]'}>{value}</strong>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? 'bg-[#1d1d1f] hover:bg-black text-white py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2'
          : 'border border-black/[0.08] hover:bg-[#f5f5f7] py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2'
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
