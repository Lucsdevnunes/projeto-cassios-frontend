'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Tv, 
  Wrench, 
  Users, 
  LogOut, 
  ThermometerSnowflake,
  ScrollText,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
    { href: '/clientes', label: 'Estabelecimentos', icon: Users, roles: ['ADMIN', 'TECNICO'] },
    { href: '/equipamentos', label: 'Equipamentos', icon: Tv, roles: ['ADMIN', 'TECNICO'] },
    { href: '/manutencoes', label: 'Manutenções', icon: Wrench, roles: ['ADMIN', 'TECNICO'] },
    { href: '/usuarios', label: 'Usuários', icon: Users, roles: ['ADMIN'] },
    { href: '/logs', label: 'Logs de Atividade', icon: ScrollText, roles: ['ADMIN'] },
  ];

  const filteredLinks = links.filter((link) => link.roles.includes(user.perfil));

  const handleLinkClick = () => {
    // Automatically close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity cursor-pointer" 
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } shrink-0`}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900">
          <Link href="/dashboard" className="flex items-center w-full justify-center">
            <img src="/logo.png" alt="Empório do Ar" className="h-16 w-full object-contain max-w-[200px]" />
          </Link>

          {/* Close Button on Mobile */}
          <button 
            onClick={onClose}
            className="md:hidden text-slate-500 hover:text-slate-200 cursor-pointer focus:outline-none"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

      {/* User Information */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-slate-200 truncate">{user.nome}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
              user.perfil === 'ADMIN' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {user.perfil === 'ADMIN' ? 'Administrador' : 'Técnico'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  </>
  );
}
