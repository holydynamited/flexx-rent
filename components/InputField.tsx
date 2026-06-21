'use client';

import React, { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';


interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}


export default function InputField({ label, type, ...props }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const uniqueId = useId();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label 
        htmlFor={uniqueId} 
        className="text-[11px] uppercase tracking-widest text-slate-500 font-medium ml-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          id={uniqueId}
          className="w-full px-4 py-3.5 bg-transparent border border-black/10 rounded-xl focus:outline-none focus:border-[#1d1d1f] focus:ring-1 focus:ring-[#1d1d1f] transition-all font-light text-[#1d1d1f] placeholder:text-slate-400 text-sm"
          {...props} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1d1d1f] transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}