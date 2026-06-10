import React from 'react';
import {
  PieChart,
  Boxes,
  TrendingUp,
  FileText,
  Calendar,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Item, TabId } from '../types';
import { UserSession } from './LoginScreen';

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  items: Item[];
  activeUser: UserSession | null;
}

export default function Navigation({ activeTab, setActiveTab, items, activeUser }: NavigationProps) {
  // Compute some counts to show little notifications
  const outOfStockCount = items.filter((item) => item.quantity === 0).length;
  
  // Calculate expired or warning items count
  const today = new Date();
  const warningDays = 15; // standard warning margin
  const expiringCount = items.filter((item) => {
    if (!item.expiryDate) return false;
    const expDate = new Date(item.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= warningDays;
  }).length;

  const totalBadges = outOfStockCount + expiringCount;

  const navItems = [
    {
      id: 'dashboard' as TabId,
      label: 'Rotina',
      icon: PieChart,
      badge: 0,
    },
    ...(activeUser?.role === 'admin' ? [{
      id: 'admin' as TabId,
      label: 'Admin',
      icon: ShieldCheck,
      badge: 0,
    }] : []),
    {
      id: 'estoque' as TabId,
      label: 'Estoque',
      icon: Boxes,
      badge: outOfStockCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'validades' as TabId,
      label: 'Validades',
      icon: Calendar,
      badge: expiringCount,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'movimentacoes' as TabId,
      label: 'Movimentações',
      icon: TrendingUp,
      badge: 0,
    },
    {
      id: 'relatorios' as TabId,
      label: 'WhatsApp',
      icon: FileText,
      badge: 0,
    },
    {
      id: 'configuracoes' as TabId,
      label: 'Ajustes',
      icon: Settings,
      badge: 0,
    },
  ];

  return (
    <>
      {/* SIDEBAR ON DESKTOP */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950 border-r border-white/5 text-slate-300 min-h-[calc(100vh-88px)] shrink-0 p-8 justify-between sticky top-[88px]">
        <div className="space-y-10">
          <div>
            <div className="flex items-center gap-2 px-1 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
              <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Navegação Principal</span>
            </div>
            <nav className="space-y-2 font-sans">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 group cursor-pointer border ${
                      isActive
                        ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]'
                        : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon
                        className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                          isActive ? 'text-brand-orange' : 'text-slate-600 group-hover:text-slate-400'
                        }`}
                      />
                      <span className="leading-none">{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black shadow-lg ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Operational Environment info */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-orange/10 rounded-xl">
                <Sparkles className="w-4 h-4 text-brand-orange" />
              </div>
              <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">Info Terminal</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
              Modo operacional ativo. Todas as alterações são sincronizadas localmente.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] text-center">
            Floripa Bar Operational • v2.1
          </p>
        </div>
      </aside>

      {/* BOTTOM TAB BAR ON MOBILE & TABLET */}
      <nav 
        id="mobile-bottom-nav" 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-850 text-slate-400 z-50 flex items-center justify-around py-2 px-1 safe-bottom"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 rounded-lg transition-all relative cursor-pointer ${
                isActive ? 'text-brand-orange scale-105 font-extrabold' : 'hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-orange' : 'text-slate-400'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2 text-[8px] min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center font-bold text-center ${item.badgeColor || 'bg-slate-800'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-1.5 tracking-tighter truncate max-w-[58px] sm:max-w-none text-center">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
