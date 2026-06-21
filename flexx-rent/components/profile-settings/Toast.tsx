'use client';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1d1d1f] text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center space-x-3">
      <span className="text-emerald-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}
