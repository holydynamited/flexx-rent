'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileCheck,
  FileText,
  Info,
  Lock,
  Menu,
  Search,
  Unlock,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { INITIAL_PAYMENTS, INITIAL_PROFILES, REJECTION_PRESETS } from '@/components/admin/mockData';
import type { AdminProfile, AdminTab, PayoutFilter, RoleFilter, VerificationTab } from '@/components/admin/types';
import type { HeaderUser } from '@/components/layout/types';

interface AdminCmsClientPageProps {
  user: HeaderUser;
}

export default function AdminCmsClientPage({ user }: AdminCmsClientPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('verification');
  const [verificationSubTab, setVerificationSubTab] = useState<VerificationTab>('Pending');
  const [profiles, setProfiles] = useState(INITIAL_PROFILES);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [agentPayoutFilter, setAgentPayoutFilter] = useState<PayoutFilter>('ALL');
  const [inspectingUser, setInspectingUser] = useState<AdminProfile | null>(null);
  const [rejectionModalUser, setRejectionModalUser] = useState<AdminProfile | null>(null);
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState(REJECTION_PRESETS[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredVerificationList = useMemo(() => {
    return profiles.filter((profile) => {
      if (profile.role !== 'CLIENT') return false;
      if (profile.status !== verificationSubTab) return false;
      return (
        profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [profiles, verificationSubTab, searchTerm]);

  const filteredAccountsList = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || profile.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const pendingVerifications = profiles.filter((p) => p.role === 'CLIENT' && p.status === 'Pending').length;
    const totalVerified = profiles.filter((p) => p.role === 'CLIENT' && p.status === 'Verified').length;
    const totalBlocked = profiles.filter((p) => p.isBlocked).length;
    const totalTransactions = payments.reduce((acc, curr) => acc + curr.totalPaid, 0);
    const pendingAgentPayouts = payments
      .filter((payment) => !payment.payoutCalculated)
      .reduce((acc, payment) => acc + payment.baseRent * 0.1, 0);

    return {
      pendingVerifications,
      totalVerified,
      totalBlocked,
      totalTransactions,
      pendingAgentPayouts,
    };
  }, [profiles, payments]);

  const handleApprove = (userId: string) => {
    setProfiles((previous) =>
      previous.map((profile) => {
        if (profile.id !== userId || !profile.documents) return profile;
        return {
          ...profile,
          status: 'Verified',
          rejectionReason: '',
          documents: {
            idCard: { ...profile.documents.idCard, status: 'Verified' },
            schufa: { ...profile.documents.schufa, status: 'Verified' },
            selbstauskunft: { ...profile.documents.selbstauskunft, status: 'Verified' },
          },
        };
      }),
    );
    setInspectingUser(null);
  };

  const handleRejectSubmit = () => {
    if (!rejectionModalUser) return;
    const finalReason = customRejectionReason.trim() || selectedPresetReason;
    setProfiles((previous) =>
      previous.map((profile) => {
        if (profile.id !== rejectionModalUser.id || !profile.documents) return profile;
        return {
          ...profile,
          status: 'Rejected',
          rejectionReason: finalReason,
          documents: {
            idCard: { ...profile.documents.idCard, status: 'Rejected' },
            schufa: { ...profile.documents.schufa, status: 'Rejected' },
            selbstauskunft: { ...profile.documents.selbstauskunft, status: 'Rejected' },
          },
        };
      }),
    );
    setRejectionModalUser(null);
    setInspectingUser(null);
  };

  const handleToggleBlock = (userId: string) => {
    setProfiles((previous) =>
      previous.map((profile) => (profile.id === userId ? { ...profile, isBlocked: !profile.isBlocked } : profile)),
    );
  };

  const handleMarkAsPayoutCalculated = (paymentId: string) => {
    setPayments((previous) =>
      previous.map((payment) => (payment.id === paymentId ? { ...payment, payoutCalculated: true } : payment)),
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-[#1d1d1f] selection:text-white flex">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-black/[0.04] sticky top-0 h-screen p-6 shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1d1d1f] rounded-xl flex items-center justify-center text-white font-bold text-xl">F</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-lg tracking-tight">FlexxRent</span>
                <span className="bg-[#1d1d1f] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-bold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-light">Global CMS Console</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                setActiveTab('verification');
                setSearchTerm('');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'verification' ? 'bg-[#1d1d1f] text-white' : 'text-slate-600 hover:bg-black/[0.02]'}`}
            >
              <span className="flex items-center gap-3">
                <FileCheck className="w-4 h-4" />
                Verification
              </span>
              {stats.pendingVerifications > 0 ? (
                <span className="text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold bg-amber-500 text-white">
                  {stats.pendingVerifications}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => {
                setActiveTab('accounts');
                setSearchTerm('');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'accounts' ? 'bg-[#1d1d1f] text-white' : 'text-slate-600 hover:bg-black/[0.02]'}`}
            >
              <Users className="w-4 h-4" />
              Accounts
            </button>

            <button
              onClick={() => {
                setActiveTab('finances');
                setSearchTerm('');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${activeTab === 'finances' ? 'bg-[#1d1d1f] text-white' : 'text-slate-600 hover:bg-black/[0.02]'}`}
            >
              <DollarSign className="w-4 h-4" />
              Finance
            </button>
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader
          user={user}
          brandSubtitle="Admin CMS"
          centerContent={
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span>System monitoring</span>
              <span>•</span>
              <span>{stats.pendingVerifications} items pending review</span>
            </div>
          }
        />

        <div className="lg:hidden bg-white border-b border-black/[0.04] px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold">Admin Navigation</span>
          <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="p-1.5 rounded-lg border border-black/[0.05]">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="lg:hidden bg-white border-b border-black/[0.04] p-4 flex flex-col gap-2">
            {(['verification', 'accounts', 'finances'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase ${activeTab === tab ? 'bg-[#1d1d1f] text-white' : 'text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : null}

        <section className="bg-white border-b border-black/[0.02] py-6 px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Verification queue" value={`${stats.pendingVerifications} requests`} icon={<AlertTriangle className="w-5 h-5" />} />
            <MetricCard label="Verified clients" value={`${stats.totalVerified} users`} icon={<CheckCircle2 className="w-5 h-5" />} />
            <MetricCard label="Turnover" value={`EUR ${stats.totalTransactions.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
            <MetricCard label="Blocked accounts" value={`${stats.totalBlocked} accounts`} icon={<Lock className="w-4 h-4" />} />
          </div>
        </section>

        <main className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-8">
          {activeTab === 'verification' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Client document verification</h1>
                  <p className="text-slate-600 font-light mt-1 text-sm">Review uploaded client documents before granting platform access.</p>
                </div>
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search clients..." />
              </div>

              <div className="flex flex-wrap gap-2 border-b border-black/[0.04] pb-4">
                {(['Pending', 'Verified', 'Rejected'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setVerificationSubTab(tab)}
                    className={`px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all ${verificationSubTab === tab ? 'bg-[#1d1d1f] text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-black/[0.02]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredVerificationList.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-2xl border border-black/[0.03] p-5 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif font-semibold text-base">{profile.fullName}</h3>
                          {profile.isBlocked ? (
                            <span className="bg-rose-100 text-rose-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">Blocked</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 font-light">
                          {profile.email} · Registered {profile.registrationDate} · {profile.id}
                        </p>
                        {profile.status === 'Rejected' && profile.rejectionReason ? (
                          <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl p-3 flex gap-2.5 items-start">
                            <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="font-light">{profile.rejectionReason}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setInspectingUser(profile)}
                          className="px-4 py-2 rounded-full border border-[#1d1d1f]/10 text-xs font-semibold uppercase tracking-wider hover:bg-[#1d1d1f]/5 flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" /> Inspect
                        </button>
                        {profile.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(profile.id)}
                              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-emerald-700 flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectionModalUser(profile);
                                setCustomRejectionReason('');
                                setSelectedPresetReason(REJECTION_PRESETS[0]);
                              }}
                              className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-700 flex items-center gap-1.5"
                            >
                              <UserX className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleBlock(profile.id)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${profile.isBlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                          >
                            {profile.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {profile.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'accounts' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Global account control</h1>
                  <p className="text-slate-600 font-light mt-1 text-sm">Manage access for both clients and agents in one table.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search name or email..." />
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                    className="bg-white text-sm rounded-full px-4 py-2 border border-black/[0.05] focus:outline-none"
                  >
                    <option value="ALL">All roles</option>
                    <option value="CLIENT">Clients</option>
                    <option value="AGENT">Agents</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.03] overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black/[0.04]">
                      <th className="p-4 pl-6 text-[10px] uppercase tracking-wider font-semibold text-slate-500">User</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Role</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Verification</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Properties</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Account</th>
                      <th className="p-4 pr-6 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02]">
                    {filteredAccountsList.map((profile) => (
                      <tr key={profile.id} className="hover:bg-slate-50/50 transition-all text-sm">
                        <td className="p-4 pl-6">
                          <p className="font-serif font-medium text-[#1d1d1f]">{profile.fullName}</p>
                          <p className="text-xs text-slate-500 font-light">{profile.email}</p>
                        </td>
                        <td className="p-4">{profile.role}</td>
                        <td className="p-4">{profile.status}</td>
                        <td className="p-4">{profile.role === 'AGENT' ? `${profile.managedProperties ?? 0} properties` : '-'}</td>
                        <td className="p-4">{profile.isBlocked ? 'Blocked' : 'Active'}</td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleToggleBlock(profile.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-black/[0.08] hover:bg-slate-50"
                          >
                            {profile.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === 'finances' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-serif font-semibold tracking-tight">Finance audit and payouts</h1>
                  <p className="text-slate-600 font-light mt-1 text-sm">Track escrow payments and calculate manual agent commissions.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPayments((previous) => previous.map((p) => ({ ...p, payoutCalculated: false })))}
                    className="px-4 py-2 border border-[#1d1d1f]/10 rounded-full text-xs font-semibold hover:bg-slate-100"
                  >
                    Reset demo
                  </button>
                  <select
                    value={agentPayoutFilter}
                    onChange={(event) => setAgentPayoutFilter(event.target.value as PayoutFilter)}
                    className="bg-white text-sm rounded-full px-4 py-2 border border-black/[0.05] focus:outline-none"
                  >
                    <option value="ALL">All payments</option>
                    <option value="PENDING">Pending payouts</option>
                    <option value="CALCULATED">Calculated</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.03] overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black/[0.04]">
                      <th className="p-4 pl-6 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Operation</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Client</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Property</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-right">Rent</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-right">Deposit</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-right">Total</th>
                      <th className="p-4 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-center">Payout status</th>
                      <th className="p-4 pr-6 text-[10px] uppercase tracking-wider font-semibold text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02]">
                    {payments
                      .filter((payment) => {
                        if (agentPayoutFilter === 'PENDING') return !payment.payoutCalculated;
                        if (agentPayoutFilter === 'CALCULATED') return payment.payoutCalculated;
                        return true;
                      })
                      .map((payment) => {
                        const commission = payment.baseRent * 0.1;
                        return (
                          <tr key={payment.id} className="hover:bg-slate-50/50 transition-all text-sm">
                            <td className="p-4 pl-6 text-xs">
                              <span className="font-semibold block">{payment.id}</span>
                              <span className="text-slate-400">{payment.paymentDate}</span>
                            </td>
                            <td className="p-4">{payment.clientName}</td>
                            <td className="p-4">{payment.propertyTitle}</td>
                            <td className="p-4 text-right">EUR {payment.baseRent}</td>
                            <td className="p-4 text-right">EUR {payment.deposit}</td>
                            <td className="p-4 text-right font-bold text-emerald-600">EUR {payment.totalPaid}</td>
                            <td className="p-4 text-center">{payment.payoutCalculated ? 'Calculated' : `Commission EUR ${commission}`}</td>
                            <td className="p-4 pr-6 text-right">
                              {!payment.payoutCalculated ? (
                                <button
                                  onClick={() => handleMarkAsPayoutCalculated(payment.id)}
                                  className="bg-[#1d1d1f] text-white hover:bg-black text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full"
                                >
                                  Mark paid
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-light">Done</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </main>

        <AppFooter divisionLabel="Admin Operations Division" />
      </div>

      {inspectingUser && inspectingUser.documents ? (
        <div className="fixed inset-0 z-50 bg-[#1d1d1f]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl">
            <div className="bg-[#1d1d1f] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legal review</span>
                <h3 className="font-serif font-semibold text-lg mt-0.5">Documents: {inspectingUser.fullName}</h3>
              </div>
              <button onClick={() => setInspectingUser(null)} className="text-slate-400 hover:text-white text-xl font-bold px-3 py-1">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DocCard title="Passport / ID card" info={inspectingUser.documents.idCard} />
                <DocCard title="Schufa report" info={inspectingUser.documents.schufa} />
                <DocCard title="Selbstauskunft" info={inspectingUser.documents.selbstauskunft} />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                Data is confidential and should be reviewed only by authorized admins.
              </div>
            </div>
            <div className="bg-slate-50 p-5 border-t border-black/[0.04] flex items-center justify-between">
              <button onClick={() => setInspectingUser(null)} className="px-5 py-2 rounded-full border border-black/[0.08] text-xs font-semibold uppercase">
                Close
              </button>
              {inspectingUser.status === 'Pending' ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setRejectionModalUser(inspectingUser);
                      setSelectedPresetReason(REJECTION_PRESETS[0]);
                      setCustomRejectionReason('');
                    }}
                    className="px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold uppercase"
                  >
                    Reject
                  </button>
                  <button onClick={() => handleApprove(inspectingUser.id)} className="px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase">
                    Approve
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {rejectionModalUser ? (
        <div className="fixed inset-0 z-[60] bg-[#1d1d1f]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 bg-rose-600 text-white">
              <h3 className="font-serif font-semibold text-lg">Select rejection reason</h3>
              <p className="text-white/80 text-xs mt-1">The reason will be visible in the client cabinet.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                {REJECTION_PRESETS.map((preset) => (
                  <label key={preset} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="presetReason"
                      checked={selectedPresetReason === preset}
                      onChange={() => setSelectedPresetReason(preset)}
                      className="mt-0.5 text-[#1d1d1f]"
                    />
                    <span>{preset}</span>
                  </label>
                ))}
              </div>
              <textarea
                rows={2}
                value={customRejectionReason}
                onChange={(event) => setCustomRejectionReason(event.target.value)}
                placeholder="Optional custom reason..."
                className="w-full bg-[#f5f5f7] rounded-xl p-3 text-xs border border-slate-200 focus:outline-none"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-black/[0.04] flex items-center justify-between">
              <button onClick={() => setRejectionModalUser(null)} className="px-4 py-2 border border-black/[0.08] rounded-full text-xs font-semibold uppercase">
                Cancel
              </button>
              <button onClick={handleRejectSubmit} className="px-5 py-2 bg-rose-600 text-white rounded-full text-xs font-semibold uppercase">
                Confirm reject
              </button>
            </div>
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
        className="w-full bg-white text-sm rounded-full pl-10 pr-4 py-2 border border-black/[0.05] focus:outline-none"
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

function DocCard({ title, info }: { title: string; info: { name: string; size: string; status: string; score?: string } }) {
  return (
    <div className="bg-[#f5f5f7] rounded-xl p-4 border border-black/[0.04] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase">{title}</span>
        {info.score ? <span className="text-[10px] text-emerald-700">{info.score}</span> : null}
      </div>
      <div className="h-24 bg-white rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-2">
        <FileText className="w-6 h-6 text-[#1d1d1f]/40 mb-1" />
        <span className="text-[11px] font-medium text-slate-700 truncate max-w-full">{info.name}</span>
        <span className="text-[10px] text-slate-400">{info.size}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Status:</span>
        <strong className="text-slate-800">{info.status}</strong>
      </div>
    </div>
  );
}
