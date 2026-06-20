import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';



export default async function ProfilePage() {

  const cookieStore = await cookies();

  const token = cookieStore.get('session_token')?.value;


  if (!token) {
    redirect('/login');
  }

 

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const { payload } = await jwtVerify(token, secret);

  
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-8 max-w-sm w-full border border-slate-100">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-[#1d1d1f] rounded-full flex items-center justify-center text-white text-2xl font-serif">

              {String(payload.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-medium text-[#1d1d1f]">My Profile</h1>
              <p className="text-sm text-slate-500 font-light">Active Session</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mb-1">
                Email Address
              </p>
              <p className="text-[#1d1d1f] text-sm">
                {String(payload.email)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mb-1">
                  Access Role
                </p>
                <p className="text-[#1d1d1f] text-sm font-medium">
                  {String(payload.role)}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>
          </div>

        </div>
      </div>
    );

 
}