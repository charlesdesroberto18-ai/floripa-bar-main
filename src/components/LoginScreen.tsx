/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, User, Users, Lock, Sparkles, HelpCircle, ArrowRight, ScanLine } from 'lucide-react';
import FloripaLogo from './FloripaLogo';

export interface UserSession {
  name: string;
  role: 'gerente' | 'cozinha' | 'bartender';
  avatarColor: string;
  title?: string;
}

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [errorMess, setErrorMess] = useState('');

  // Built-in staff profiles for easy demonstration
  const staffProfiles = [
    { name: 'Charles', role: 'gerente' as const, pin: '1234', title: 'Gerente Geral (Acesso Total)', color: 'bg-brand-orange border-brand-orange/45' },
    { name: 'Mariana', role: 'cozinha' as const, pin: '5555', title: 'Chef de Cozinha (Insumos)', color: 'bg-emerald-500 border-emerald-500/40' },
    { name: 'Rodrigo', role: 'bartender' as const, pin: '8888', title: 'Bartender Principal (Bebidas)', color: 'bg-amber-400 border-amber-400/35' },
  ];

  const handleKeypadPress = (num: string) => {
    setErrorMess('');
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-validate if 4 digits matching
      if (nextPin.length === 4) {
        const found = staffProfiles.find(p => p.pin === nextPin);
        if (found) {
          onLogin({
            name: found.name,
            role: found.role,
            avatarColor: found.color,
            title: found.title,
          });
        } else {
          setTimeout(() => {
            setErrorMess('Código PIN incorreto! Tente de novo ou use o clique rápido.');
            setPin('');
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setErrorMess('');
  };

  const handleQuickLogin = (profile: typeof staffProfiles[0]) => {
    onLogin({
      name: profile.name,
      role: profile.role,
      avatarColor: profile.color,
      title: profile.title,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none selection:bg-brand-orange selection:text-white">
      {/* Visual glowing abstract shapes mimicking sunset */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-wine/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(122,22,22,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-5xl bg-slate-900/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative z-10 grid grid-cols-1 md:grid-cols-12 md:h-[680px]">
        
        {/* Left Col: Brand introduction */}
        <div className="md:col-span-5 bg-gradient-to-br from-brand-wine-dark via-slate-950 to-slate-950 p-8 md:p-12 flex flex-col justify-between text-slate-300 relative border-b md:border-b-0 md:border-r border-white/5">
          
          <div className="space-y-8 text-center md:text-left relative z-10">
            {/* Logo with subtle glow */}
            <div className="flex justify-center md:justify-start">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-brand-orange/20 blur-2xl rounded-full" />
                <FloripaLogo size={100} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-brand-orange tracking-widest">
                  Terminal de Operação
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Floripa Bar <br />
                <span className="text-slate-400 font-medium text-xl md:text-2xl">Smart Inventory</span>
              </h2>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto md:mx-0 font-medium">
              Gestão inteligente de insumos, bebidas e relatórios operacionais com integração direta.
            </p>
          </div>

          <div className="pt-8 md:pt-0 space-y-6 relative z-10">
            <div className="p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl space-y-3 shadow-inner">
              <span className="font-bold text-white flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-brand-orange" />
                Quick Access Guide
              </span>
              <p className="text-slate-400 leading-relaxed text-[12px] font-medium">
                Utilize o PIN funcional ou selecione seu perfil ao lado para acesso rápido ao terminal.
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold tracking-widest uppercase px-1">
              <span>Floripa Bar POS</span>
              <span>v2.1.0</span>
            </div>
          </div>

          {/* Decorative background element for left panel */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full -mr-16 -mt-16" />
        </div>

        {/* Right Col: Terminal Keypad */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-slate-900/50 relative">
          
          {/* Header block */}
          <div className="text-center space-y-2 mb-10">
            <div className="inline-flex p-3 bg-brand-orange/10 rounded-2xl border border-brand-orange/20 mb-2">
              <Lock className="w-6 h-6 text-brand-orange" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Desbloquear Terminal
            </h3>
            <p className="text-sm text-slate-500 font-medium">Autenticação de colaborador necessária</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Column: Colaboradores shortcuts */}
            <div className="col-span-1 lg:col-span-5 space-y-4 order-last lg:order-first">
              <div className="flex items-center gap-2 px-1">
                <Users className="w-4 h-4 text-slate-500" />
                <p className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Acesso Rápido</p>
              </div>
              
              <div className="space-y-3">
                {staffProfiles.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleQuickLogin(p)}
                    className="w-full flex items-center gap-4 p-3 bg-slate-950/50 hover:bg-brand-orange/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl transition-all duration-300 cursor-pointer text-left group shadow-sm hover:shadow-brand-orange/5"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 text-sm shadow-lg ${p.color || 'bg-slate-300'} group-hover:scale-110 transition-transform`}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-bold text-slate-100 text-sm group-hover:text-brand-orange transition-colors">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">{p.role === 'gerente' ? 'Gerente' : p.role === 'cozinha' ? 'Chef Cozinha' : 'Bartender'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-brand-orange transition-all group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Column: Pin input visual & visual numeric keypad */}
            <div className="col-span-1 lg:col-span-7 space-y-8">
              
              {/* Pin indicator holes */}
              <div className="flex flex-col items-center space-y-4">
                <div className="flex gap-5">
                  {[0, 1, 2, 3].map((val) => (
                    <div
                      key={val}
                      className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                        pin.length > val
                          ? 'bg-brand-orange border-brand-orange scale-125 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                          : 'border-slate-800 bg-slate-950 shadow-inner'
                      }`}
                    />
                  ))}
                </div>

                <div className="h-4 flex items-center justify-center">
                  {errorMess ? (
                    <span className="text-xs text-rose-400 font-bold animate-fade-in px-4 py-1 bg-rose-400/10 rounded-full border border-rose-400/20">
                      {errorMess}
                    </span>
                  ) : pin.length > 0 ? (
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">
                      Digitando...
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Numeric keypad (3 columns) */}
              <div className="max-w-[260px] mx-auto grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeypadPress(num)}
                    className="w-16 h-16 bg-slate-950/80 hover:bg-slate-800 active:bg-brand-orange active:text-slate-950 border border-white/5 text-white font-display text-2xl font-black rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Clear (C) */}
                <button
                  onClick={handleClear}
                  className="w-16 h-16 bg-slate-950/40 hover:bg-rose-500/10 text-rose-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
                >
                  Limpar
                </button>

                {/* Zero (0) */}
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-16 bg-slate-950/80 hover:bg-slate-800 active:bg-brand-orange active:text-slate-950 border border-white/5 text-white font-display text-2xl font-black rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  onClick={handleBackspace}
                  className="w-16 h-16 bg-slate-950/40 hover:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-white/10"
                >
                  <ScanLine className="w-5 h-5 rotate-90" />
                </button>
              </div>

            </div>

          </div>

          {/* Quick info list */}
          <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Terminal
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              Offline Sync Active
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
