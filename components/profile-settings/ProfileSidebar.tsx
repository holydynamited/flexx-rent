'use client';

import type { SettingsTab, UserProfile } from '@/components/profile-settings/types';

interface ProfileSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  user: UserProfile;
}

const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: 'personal', label: 'Personal info', icon: '👤' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

export default function ProfileSidebar({ activeTab, onTabChange, user }: ProfileSidebarProps) {
  return (
    <div className="w-full max-w-[640px] mx-auto space-y-6 text-left">
      <div className="w-full bg-white rounded-3xl p-6 shadow-xl shadow-black/[0.02] border border-black/[0.01]">
        <div className="flex  items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-[#f5f5f7] border border-black/[0.05] rounded-full flex items-center justify-center text-[#1d1d1f] font-serif text-2xl font-semibold">
            {user.avatar}
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-semibold leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <span className="bg-slate-100 text-[#1d1d1f] text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold">
              Verified member
            </span>
          </div>
        </div>

        <div className="border-t border-black/[0.04] pt-5">
          <span className="text-[10px] uppercase text-slate-400 block font-bold tracking-wider">
            Verification status
          </span>
          <div className="mt-2.5 p-3.5 bg-emerald-50/50 text-emerald-800 text-xs rounded-2xl border border-emerald-100 flex items-center space-x-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">Documents approved</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-light mt-3">
            Your profile is complete and ready for apartment applications.
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-3xl p-4 shadow-xl shadow-black/[0.02] border border-black/[0.01] flex flex-col space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-semibold transition-all duration-200 flex items-center space-x-3 ${
              activeTab === tab.id ? 'bg-[#1d1d1f] text-white shadow' : 'text-slate-600 hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
