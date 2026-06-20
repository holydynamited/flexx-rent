'use client';

import React, { useState } from 'react';
import { Playfair_Display, Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InputField from '@/components/InputField';

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

export default function RegisterPage() {
  const router = useRouter();
   
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return; 
      }

      router.push('/');
      router.refresh();

    } catch (err) {
      console.error('Registration error:', err);
      setError('Connection error. Please try again later.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className={`min-h-screen bg-[#f5f5f7] ${inter.className} ${playfair.variable} flex items-center justify-center p-4 sm:p-8 lg:p-12 selection:bg-[#1d1d1f] selection:text-white`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl shadow-black/5 overflow-hidden flex flex-col lg:flex-row min-h-[600px]"
      >
        <div className="relative w-full lg:w-1/2 h-64 sm:h-80 lg:h-auto overflow-hidden bg-slate-200">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Luxury Estate Interior"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-black/10 lg:to-black/40 mix-blend-multiply" />
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end lg:justify-between text-white">
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded flex items-center justify-center text-white font-[family-name:var(--font-playfair)] text-xl border border-white/20">
                F
              </div>
              <span className="font-[family-name:var(--font-playfair)] tracking-tight text-xl text-white/90">FlexxRent</span>
            </div>
            
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-3xl lg:text-4xl leading-[1.1] tracking-tight mb-3">
                Begin Your Journey.
              </h2>
              <p className="font-light text-white/70 max-w-sm text-sm leading-relaxed hidden sm:block">
                Join our exclusive network and discover exceptional homes tailored to your lifestyle.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#1d1d1f] rounded flex items-center justify-center text-white font-[family-name:var(--font-playfair)] text-xl shadow-lg shadow-black/10">
              M
            </div>
            <span className="font-[family-name:var(--font-playfair)] tracking-tight text-xl text-[#1d1d1f]">MunichEstates</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl lg:text-4xl font-[family-name:var(--font-playfair)] text-[#1d1d1f] mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-500 font-light text-sm tracking-tight">
              Fill in the details below to create your exclusive account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <InputField
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              label="Email Address" 
              type="email" 
              placeholder="john.doe@example.com" 
              required
            />
            <InputField
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="
              cursor-pointer
              group relative w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#1d1d1f] text-white hover:bg-black disabled:opacity-70 active:scale-95 transition-all duration-200 shadow-lg shadow-black/10 overflow-hidden mt-4"
            >
              <span className="font-light tracking-[0.05em] text-sm relative z-10">
                {isLoading ? 'Registering...' : 'Register Now'}
              </span>
              {!isLoading && <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />}
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </form>

          <div className="mt-8 text-center sm:text-left">
            <p className="text-sm font-light text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1d1d1f] font-medium hover:underline focus:outline-none transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}