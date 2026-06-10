/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, AlertTriangle, Clock, LogOut, Shield, AlertCircle } from 'lucide-react';
import { Item } from '../types';
import { UserSession } from './LoginScreen';
import FloripaLogo from './FloripaLogo';

interface HeaderProps {
  items: Item[];
  onResetData: () => void;
  lastUpdatedStr: string;
  activeUser: UserSession | null;
  onLogout: () => void;
}

export default function Header({ items, onResetData, lastUpdatedStr, activeUser, onLogout }: HeaderProps) {
  const lowStockCount = items.filter(
    (item) => item.quantity > 0 && item.quantity <= item.minQuantity
  ).length;
  const outOfStockCount = items.filter((item) => item.quantity === 0).length;

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 text-white py-4 px-4 md:px-8 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand Identity & Active Logo */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="hover:scale-105 transition-transform duration-300">
            <FloripaLogo size={56} showText={true} />
          </div>

          <div className="hidden lg:block h-8 w-[1px] bg-white/10 mx-2" />

          <div className="hidden sm:flex items-center gap-3">
            <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-orange/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              Estoque Ativo
            </span>
          </div>
        </div>

        {/* Right: Real-time Stats Quick look & Active Employee */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          
          {/* Quick status dots */}
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-950/40 backdrop-blur-sm rounded-2xl border border-white/5 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Sistema Online</span>
            </div>
            {outOfStockCount > 0 && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-4 group">
                <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-rose-400 font-black text-[11px]">{outOfStockCount} Faltando</span>
              </div>
            )}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-4 group">
                <AlertCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-amber-400 font-black text-[11px]">{lowStockCount} Baixos</span>
              </div>
            )}
          </div>

          {/* Locked / Employee Section */}
          {activeUser && (
            <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 pr-3 border border-white/10 rounded-2xl shadow-lg hover:border-brand-orange/30 transition-colors group">
              <div className={`w-8 h-8 rounded-xl ${activeUser.avatarColor} text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                {activeUser.name[0]}
              </div>
              <div className="flex flex-col text-left leading-tight pr-2">
                <span className="text-xs font-black text-white leading-none tracking-tight">{activeUser.name}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-1">
                  {activeUser.role === 'gerente' ? 'Gerente' : activeUser.role === 'cozinha' ? 'Chef Cozinha' : 'Bartender'}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Bloquear Terminal / Trocar Usuário"
                className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reset action */}
          <button
            onClick={onResetData}
            id="btn-recriar-dados"
            title="Restaurar banco fictício original"
            className="flex items-center justify-center w-10 h-10 md:w-auto md:px-4 bg-slate-800/50 hover:bg-brand-orange/10 border border-white/5 hover:border-brand-orange/30 rounded-2xl transition-all text-slate-400 hover:text-brand-orange cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 md:mr-2 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest">Reset</span>
          </button>
        </div>

      </div>
    </header>
  );
}

