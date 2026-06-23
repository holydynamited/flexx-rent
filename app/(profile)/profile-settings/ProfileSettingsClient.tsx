'use client';

import { useState, type FormEvent } from 'react';
import DocumentsTab from '@/components/profile-settings/DocumentsTab';
import NotificationsTab from '@/components/profile-settings/NotificationsTab';
import PersonalInfoTab from '@/components/profile-settings/PersonalInfoTab';
import ProfileHeader from '@/components/profile-settings/ProfileHeader';
import ProfileSidebar from '@/components/profile-settings/ProfileSidebar';
import SecurityTab from '@/components/profile-settings/SecurityTab';
import Toast from '@/components/profile-settings/Toast';
import AppFooter from '@/components/layout/AppFooter';
import type {
  DocumentState,
  NotificationSettings,
  PasswordFormData,
  ProfileFormData,
  SettingsTab,
  UserProfile,
} from '@/components/profile-settings/types';

type Props = {
  initialProfile: UserProfile;
  initialDocuments: DocumentState;
};

const defaultDocuments: DocumentState = {
  idCard: { name: 'passport_scan.pdf', size: '2.4 MB', uploadedAt: '12 Jun 2026' },
  schufa: null,
  tenantSelfDisclosure: null,
};

const initialNotificationSettings: NotificationSettings = {
  emailAlerts: true,
  smsAlerts: false,
  matchingAlerts: true,
};

export default function ProfileSettingsClient({ initialProfile, initialDocuments }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    phone: initialProfile.phone,
    preferredDistrict: initialProfile.preferredDistrict,
    monthlyBudget: initialProfile.monthlyBudget,
  });

  const handlePersonalInfoSave = async (e: React.FormEvent) => {
    e.preventDefault(); 

    try {
      const response = await fetch('/api/profile-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: profileForm.firstName, last_name: profileForm.lastName, phone: profileForm.phone }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        triggerToast(data.error || 'Invalid email or password');
        return; 
      }

      setProfile((previous) => ({
        ...previous,
        ...profileForm,
      }));
      triggerToast('Personal info updated successfully');

    } catch (err) {
      console.error('Login error:', err);
      triggerToast('Connection error. Please try again later.');
    } 
  };

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [documents, setDocuments] = useState<DocumentState>(initialDocuments || defaultDocuments);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialNotificationSettings);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const handlePasswordSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerToast('New passwords do not match.');
      return;
    }

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    triggerToast('Password was updated.');
  };

  const handleFileUpload = async (docKey: keyof DocumentState, fileName: string) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docKey }),
      });

      const data = await response.json();
      if (!response.ok) {
        triggerToast(data.error || 'Failed to upload document.');
        return;
      }

      setDocuments((previous) => ({
        ...previous,
        [docKey]: { name: fileName, size: 'PDF', uploadedAt: 'Today' },
      }));
      triggerToast(`${fileName} uploaded.`);
    } catch (error) {
      console.error('Document upload error:', error);
      triggerToast('Connection error. Please try again later.');
    }
  };

  const handleFileDelete = (docKey: keyof DocumentState) => {
    setDocuments((previous) => ({ ...previous, [docKey]: null }));
    triggerToast('Document removed.');
  };

  return (
    <div className="min-h-1000 gap-6 bg-[#f5f5f7] text-[#1d1d1f] font-sans font-light tracking-tight flex flex-col antialiased selection:bg-[#1d1d1f] selection:text-white">
      <ProfileHeader user={profile} />

      <Toast message={toast} />

      <div className="min-h-screen w-full max-w-[800px] mx-auto">
        <div className="max-w-[700px] mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col items-stretch gap-6 md:gap-10">
            <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} user={profile} />

            <div className="w-full max-w-[640px] min-w-0 mx-auto text-left">
              <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-black/[0.02] border border-black/[0.01] min-h-[500px]">
                {activeTab === 'personal' && (
                  <PersonalInfoTab form={profileForm} onChange={setProfileForm} onSave={handlePersonalInfoSave} />
                )}
                {activeTab === 'security' && (
                  <SecurityTab
                    email={profile.email}
                    form={passwordForm}
                    onChange={setPasswordForm}
                    onSave={handlePasswordSave}
                  />
                )}
                {activeTab === 'documents' && (
                  <DocumentsTab documents={documents} onUpload={handleFileUpload} onDelete={handleFileDelete} />
                )}
                {activeTab === 'notifications' && (
                  <NotificationsTab
                    settings={notificationSettings}
                    onChange={setNotificationSettings}
                    onSave={() => triggerToast('Notification settings saved.')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppFooter legalText="© 2026 FlexxRent GmbH. Profile settings dashboard." divisionLabel="Munich" />
    </div>
  );
}