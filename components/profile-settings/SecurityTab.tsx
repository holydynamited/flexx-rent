'use client';

import type { FormEvent } from 'react';
import type { PasswordFormData } from '@/components/profile-settings/types';

interface SecurityTabProps {
  email: string;
  form: PasswordFormData;
  onChange: (form: PasswordFormData) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}

export default function SecurityTab({ email, form, onChange, onSave }: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-2xl font-medium">Security</h3>
        <p className="text-xs text-slate-500 font-light">Change your account password and review login credentials.</p>
      </div>

      <form onSubmit={onSave} className="space-y-5 pt-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Email address</label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full text-xs p-4 bg-[#f5f5f7] text-slate-400 cursor-not-allowed border-none rounded-xl focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 block">Email can only be changed by support.</span>
        </div>

        <div className="border-t border-black/[0.04] pt-5 space-y-4">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Password update</span>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Current password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.currentPassword}
              onChange={(event) => onChange({ ...form, currentPassword: event.target.value })}
              className="w-full text-xs p-4 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">New password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={form.newPassword}
                onChange={(event) => onChange({ ...form, newPassword: event.target.value })}
                className="w-full text-xs p-4 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Confirm new password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(event) => onChange({ ...form, confirmPassword: event.target.value })}
                className="w-full text-xs p-4 bg-[#f5f5f7] border-none rounded-xl focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="bg-[#1d1d1f] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs font-semibold transition active:scale-95 shadow-lg shadow-black/5"
          >
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
