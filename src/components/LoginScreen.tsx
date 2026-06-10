/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Users, Lock, Sparkles, HelpCircle, ArrowRight, ScanLine, Mail, Key } from 'lucide-react';
import FloripaLogo from './FloripaLogo';
import { supabase } from '../lib/supabase';

export interface UserSession {
  name: string;
  role: 'gerente' | 'cozinha' | 'bartender' | 'admin';
  avatarColor: string;
  title?: string;
  email?: string;
}

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMess, setErrorMess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');
    setIsLoading(true);

    // 1. Check local "0000" credentials
    const localPassword = localStorage.getItem('floripa_local_password') || '0000';
    if (username === '0000' && password === localPassword) {
      onLogin({
        name: 'Administrador Local',
        role: 'admin',
        avatarColor: 'bg-brand-orange border-brand-orange/45',
        title: 'Gerente Geral (Acesso Local)',
      });
      setIsLoading(false);
      return;
    }

    // 2. Fallback to Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // Assuming username is email for Supabase
        password,
      });

      if (error) throw error;

      if (data.user) {
        onLogin({
          name: data.user.user_metadata?.full_name || 'Administrador',
          role: 'admin',
          avatarColor: 'bg-indigo-600 border-indigo-500/40',
          title: 'Administrador do Sistema',
          email: data.user.email,
        });
      }
    } catch (err: any) {
      setErrorMess('Usuário ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none selection:bg-brand-orange selection:text-white">
      {/* Visual glowing abstract shapes */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-wine/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-slate-900/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 p-8 md:p-12">
        
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Logo */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-brand-orange/20 blur-2xl rounded-full" />
            <FloripaLogo size={100} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">Floripa Bar</h2>
            <p className="text-slate-500 font-medium text-sm tracking-wide uppercase">Smart Inventory Access</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-orange transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Usuário ou Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/80 text-white text-sm pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-orange transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 text-white text-sm pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {errorMess && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold text-center animate-fade-in">
                {errorMess}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-orange to-brand-gold text-slate-950 font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="pt-6 border-t border-white/5 w-full flex justify-center">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Terminal v2.2.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

