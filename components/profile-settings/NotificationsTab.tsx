'use client';

import type { NotificationSettings } from '@/components/profile-settings/types';

interface NotificationsTabProps {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
  onSave: () => void;
}

export default function NotificationsTab({ settings, onChange, onSave }: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-2xl font-medium">Notifications</h3>
        <p className="text-xs text-slate-500 font-light">Choose how and when you receive updates from FlexxRent.</p>
      </div>

      <div className="space-y-4 pt-6">
        <ToggleRow
          title="Email updates"
          description="Receive weekly account and application summaries."
          checked={settings.emailAlerts}
          onChange={(checked) => onChange({ ...settings, emailAlerts: checked })}
        />

        <ToggleRow
          title="SMS alerts"
          description="Get immediate text messages for high-priority events."
          checked={settings.smsAlerts}
          onChange={(checked) => onChange({ ...settings, smsAlerts: checked })}
        />

        <ToggleRow
          title="New match alerts"
          description="Notify me when a new listing fits my district and budget."
          checked={settings.matchingAlerts}
          onChange={(checked) => onChange({ ...settings, matchingAlerts: checked })}
        />
      </div>

      <div className="pt-6">
        <button
          onClick={onSave}
          className="bg-[#1d1d1f] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs font-semibold transition active:scale-95 shadow"
        >
          Save notification settings
        </button>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#f5f5f7] rounded-2xl gap-4">
      <div className="space-y-0.5">
        <h4 className="text-xs font-semibold">{title}</h4>
        <p className="text-[10px] text-slate-400 max-w-sm">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d1d1f]"></div>
      </label>
    </div>
  );
}
