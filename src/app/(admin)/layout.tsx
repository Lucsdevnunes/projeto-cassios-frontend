'use client';

import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium text-sm">Carregando painel...</p>
      </div>
    );
  }

  if (!user) {
    return null; // The AuthContext will automatically redirect to /login
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-950">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-6 py-4 shrink-0 z-30">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="text-slate-400 hover:text-white cursor-pointer focus:outline-none"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-200 text-sm tracking-widest">CASSIOS</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700">
          {user.nome.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-600/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
