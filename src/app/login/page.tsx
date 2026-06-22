'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThermometerSnowflake, KeyRound, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setError('Por favor, informe e-mail e senha.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), senha);
      // AuthContext will handle routing to /dashboard
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400 mb-4 border border-blue-500/10 shadow-inner">
            <ThermometerSnowflake size={36} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Área Administrativa</h2>
          <p className="text-slate-400 text-xs mt-1">Insira suas credenciais para gerenciar a plataforma</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3">
            <AlertTriangle className="shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide block">E-mail</label>
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all duration-200">
              <Mail size={18} className="text-slate-500 shrink-0" />
              <input
                type="email"
                placeholder="nome@sistema.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wide block">Senha</label>
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-all duration-200">
              <KeyRound size={18} className="text-slate-500 shrink-0" />
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={submitting}
                className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Autenticando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            &larr; Voltar para a Página Principal
          </Link>
        </div>
      </div>
    </div>
  );
}
