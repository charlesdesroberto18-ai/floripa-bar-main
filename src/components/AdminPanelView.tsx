import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Activity, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  RefreshCcw,
  Search,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Item, Movement } from '../types';

interface AdminPanelViewProps {
  items: Item[];
  movements: Movement[];
}

export default function AdminPanelView({ items, movements }: AdminPanelViewProps) {
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    // Check Supabase Connection
    const checkConn = async () => {
      try {
        const { data, error } = await supabase.from('items').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setDbStatus('online');
      } catch (e) {
        setDbStatus('offline');
      }
    };
    checkConn();

    // Calculations
    const val = items.reduce((acc, item) => acc + (item.quantity * (item.unitValue || 0)), 0);
    setTotalValue(val);
    setLowStockCount(items.filter(i => i.quantity <= i.minQuantity).length);
  }, [items]);

  const stats = [
    { label: 'Valor em Estoque', value: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Itens Críticos', value: lowStockCount, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Total de Itens', value: items.length, icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Movimentações (Mês)', value: movements.length, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header Mobile-First */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-slate-500 font-medium">Gestão centralizada do Floripa Bar via Supabase</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          dbStatus === 'online' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
          dbStatus === 'offline' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
          'bg-slate-500/10 text-slate-500 border border-slate-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
          Supabase {dbStatus === 'online' ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 space-y-3 shadow-lg">
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-white tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Manage Data Card */}
        <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-white">Gestão de Dados</h3>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <RefreshCcw className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Placeholder */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Pesquisar no banco de dados..." 
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-orange/50"
              />
            </div>

            {/* Tables Quick List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Tabela de Itens', 'Tabela de Movimentações', 'Usuários do Sistema', 'Logs de Erros'].map((tab) => (
                <button key={tab} className="flex items-center justify-between p-4 bg-slate-950/50 hover:bg-white/5 border border-white/5 rounded-2xl transition-all group">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">{tab}</span>
                  <Plus className="w-4 h-4 text-slate-600 group-hover:text-brand-orange" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Roles Card */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-wine/20 rounded-xl">
              <Shield className="w-5 h-5 text-brand-wine" />
            </div>
            <h3 className="text-lg font-black text-white">Segurança</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Políticas RLS</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-300">Autenticação Ativa</span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all">
              <Download className="w-4 h-4" />
              Exportar Backup JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
