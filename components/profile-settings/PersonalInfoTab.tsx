'use client';

import type { FormEvent } from 'react';
import type { ProfileFormData } from '@/components/profile-settings/types';

interface PersonalInfoTabProps {
  form: ProfileFormData;
  onChange: (form: ProfileFormData) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}

export default function PersonalInfoTab({ form, onChange, onSave }: PersonalInfoTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-2xl font-medium">Personal information</h3>
        <p className="text-xs text-slate-500 font-light">Update your contact details and rental preferences.</p>
      </div>

      <form onSubmit={onSave} className="space-y-5 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">First name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(event) => onChange({ ...form, firstName: event.target.value })}
              className="w-full text-xs p-4 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Last name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => onChange({ ...form, lastName: event.target.value })}
              className="w-full text-xs p-4 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(event) => onChange({ ...form, phone: event.target.value })}
            className="w-full text-xs p-4 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            className="bg-[#1d1d1f] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs font-semibold transition active:scale-95 shadow-lg shadow-black/5"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
