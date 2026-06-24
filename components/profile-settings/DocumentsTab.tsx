'use client';

import type { DocumentState } from '@/components/profile-settings/types';

interface DocumentsTabProps {
  documents: DocumentState;
  onUpload: (docKey: keyof DocumentState) => void;
}

interface DocumentConfig {
  key: keyof DocumentState;
  icon: string;
  title: string;
  description: string;
}

const documentConfig: DocumentConfig[] = [
  {
    key: 'idCard',
    icon: '🪪',
    title: 'Passport or ID card',
    description: 'Required to verify identity and complete rental agreements.',
  },
  {
    key: 'schufa',
    icon: '📊',
    title: 'SCHUFA credit report',
    description: 'Recent credit report used by landlords during screening.',
  },
  {
    key: 'tenantSelfDisclosure',
    icon: '📝',
    title: 'Tenant self-disclosure form',
    description: 'Signed form with basic personal and income information.',
  },
];

export default function DocumentsTab({ documents, onUpload }: DocumentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif text-2xl font-medium">Documents</h3>
        <p className="text-xs text-slate-500 font-light">Manage files required for application verification.</p>
      </div>

      <div className="space-y-4 pt-4">
        {documentConfig.map((item) => {
          const document = documents[item.key];
          return (
            <div
              key={item.key}
              className="p-5 bg-[#f5f5f7] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-black/[0.02]"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-semibold text-[#1d1d1f]">{item.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">{item.description}</p>
              </div>

              {document ? (
                <div className="flex items-center space-x-3 text-xs bg-white py-2 px-4 rounded-xl border border-black/[0.03]">
                  <div className="text-left font-mono text-[11px]">
                    <span className="text-slate-800 font-semibold block truncate max-w-[150px]">{document.name}</span>
                    <span className="text-slate-400 text-[9px]">
                      {document.size} - {document.uploadedAt}
                    </span>
                  </div>
                  <button
                    onClick={() => onUpload(item.key)}
                    className="bg-[#1d1d1f] hover:bg-black text-white px-4 py-2 rounded-full text-[10px] font-semibold transition"
                  >
                    Update PDF
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onUpload(item.key)}
                  className="bg-[#1d1d1f] hover:bg-black text-white px-5 py-2 rounded-full text-[10px] font-semibold transition"
                >
                  Upload PDF
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
