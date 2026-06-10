import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  ChevronRight,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
import { Item, Movement, Category } from '../types';
import { UserSession } from './LoginScreen';

interface ValidadesViewProps {
  items: Item[];
  activeUser: UserSession;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onAddMovement: (m: Omit<Movement, 'id' | 'date'>) => void;
}

export default function ValidadesView({
  items,
  activeUser,
  onUpdateQuantity,
  onAddMovement,
}: ValidadesViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'vencidos' | 'criticos' | 'validos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempReason, setTempReason] = useState<string>('');
  const [discardingItemId, setDiscardingItemId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState('');

  // Calculations relative to current dates
  const today = new Date();

  const getValidityDetails = (item: Item) => {
    if (!item.expiryDate) {
      return {
        label: 'Sem Validade Cadastrada',
        daysRemaining: Infinity,
        status: 'is_valid',
        color: 'text-slate-500 bg-slate-950 border-slate-850',
        badge: 'Sem data'
      };
    }

    const expiry = new Date(item.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: 'Vencido / Expirado',
        daysRemaining: diffDays,
        status: 'expired',
        color: 'text-rose-450 text-rose-400 bg-rose-500/10 border-rose-500/20',
        badge: 'Expirado'
      };
    } else if (diffDays <= 3) {
      return {
        label: `Vence em ${diffDays} dias (Crítico)`,
        daysRemaining: diffDays,
        status: 'critical_3',
        color: 'text-rose-400 bg-rose-500/5 border-rose-500/15 animate-pulse',
        badge: 'Crítico (3 dias)'
      };
    } else if (diffDays <= 7) {
      return {
        label: `Vence em ${diffDays} dias`,
        daysRemaining: diffDays,
        status: 'critical_7',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        badge: 'Imediato (7 dias)'
      };
    } else if (diffDays <= 15) {
      return {
        label: `Atenção: Vence em ${diffDays} dias`,
        daysRemaining: diffDays,
        status: 'warning_15',
        color: 'text-amber-400 bg-amber-500/5 border-amber-500/15',
        badge: 'Semana (15 dias)'
      };
    } else if (diffDays <= 30) {
      return {
        label: `Válido por ${diffDays} dias`,
        daysRemaining: diffDays,
        status: 'warning_30',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        badge: 'Mês (30 dias)'
      };
    } else {
      return {
        label: `Válido: Vence em ${diffDays} dias`,
        daysRemaining: diffDays,
        status: 'is_valid',
        color: 'text-[#10b981] bg-emerald-500/10 border-emerald-500/20',
        badge: 'Válido'
      };
    }
  };

  // Perform discard flow (Subtrating inventory + writing a loss movement logs)
  const handleDiscardSubmit = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const notes = tempReason.trim()
      ? `Descarte por validade vencida: ${tempReason}`
      : `Lote automático descartado por validade expirada (${item.expiryDate})`;

    // Track original quantity for inventory records
    const discardedQty = item.quantity;

    // Reset stock to 0
    onUpdateQuantity(itemId, 0);

    // Record Loss movement
    onAddMovement({
      itemId,
      productName: item.name,
      type: 'Saída/Perda',
      quantityChange: -discardedQty,
      responsible: activeUser.name,
      notes,
    });

    setToastMessage(`✓ Lote de ${item.name} (${discardedQty} ${item.unit}) descartado e movido para registro de Perdas.`);
    setDiscardingItemId(null);
    setTempReason('');

    // Clear toast message in 4 seconds
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Filter and Search item lists
  const processedItems = items
    .map((item) => {
      const vDetails = getValidityDetails(item);
      return { ...item, vDetails };
    })
    .filter((item) => {
      // Free text query
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.storageLocation &&
          item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Status filters
      if (selectedFilter === 'todos') return true;
      if (selectedFilter === 'vencidos') return item.vDetails.status === 'expired';
      if (selectedFilter === 'criticos') {
        const s = item.vDetails.status;
        return s === 'critical_3' || s === 'critical_7' || s === 'warning_15';
      }
      if (selectedFilter === 'validos') {
        const s = item.vDetails.status;
        return s === 'is_valid' || s === 'warning_30';
      }
      return true;
    })
    // Sort to show soonest expiry dates first
    .sort((a, b) => a.vDetails.daysRemaining - b.vDetails.daysRemaining);

  // Group summary metrics
  const totalWithExpiry = items.filter((i) => i.expiryDate).length;
  const countExpired = items.filter((i) => {
    if (!i.expiryDate) return false;
    return new Date(i.expiryDate).getTime() < today.getTime();
  }).length;

  const countNearExpiry = items.filter((i) => {
    if (!i.expiryDate) return false;
    const diff = new Date(i.expiryDate).getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 15;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-0 font-sans">
      
      {/* Toast Alert Success trigger */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border-2 border-emerald-500 p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm animate-slide-up text-white text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
          <p className="font-semibold text-slate-200">{toastMessage}</p>
        </div>
      )}

      {/* Expiry Header bar stats */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-orange" />
              <span>Controle Exclusivo de Validades</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Acompanhe vencimentos, envie alertas e gerencie descarte por expiração</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10.5px] text-slate-400 font-mono">Monitor de Validades Ativo</span>
          </div>
        </div>

        {/* Breakdown metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
            <div className="p-2 border border-rose-500/25 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500">Produtos Vencidos</span>
              <span className={`text-xl font-bold block leading-none mt-1 font-mono ${countExpired > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                {countExpired} itens
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
            <div className="p-2 border border-amber-500/25 bg-amber-500/10 text-amber-500 rounded-lg">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500">Próximos do Vencimento</span>
              <span className={`text-xl font-bold block leading-none mt-1 font-mono ${countNearExpiry > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                {countNearExpiry} itens
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center gap-3">
            <div className="p-2 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500">Total com Data Fixada</span>
              <span className="text-xl font-bold block leading-none mt-1 font-mono text-slate-300">
                {totalWithExpiry} de {items.length} itens
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search headers */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-6 relative text-xs">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por lote, fornecedor ou armazenamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-805 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-brand-orange focus:outline-none placeholder-slate-500"
          />
        </div>

        <div className="sm:col-span-6 flex justify-end gap-2 text-xs">
          <button
            onClick={() => setSelectedFilter('todos')}
            className={`px-3 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
              selectedFilter === 'todos'
                ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30'
                : 'bg-slate-900 border-slate-805 text-slate-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedFilter('vencidos')}
            className={`px-3 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
              selectedFilter === 'vencidos'
                ? 'bg-rose-500/10 text-rose-455 text-rose-400 border-rose-500/30'
                : 'bg-slate-900 border-slate-805 text-slate-400'
            }`}
          >
            Vencidos ({countExpired})
          </button>
          <button
            onClick={() => setSelectedFilter('criticos')}
            className={`px-3 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
              selectedFilter === 'criticos'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 border-slate-805 text-slate-400'
            }`}
          >
            Atenção (&lt;15d) ({countNearExpiry})
          </button>
        </div>
      </div>

      {/* Main Validity dynamic table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-xs">
        <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
          <span className="font-bold text-slate-350">Produtos Ordenados por Proximidade de Vencimento</span>
          <span className="text-[10.5px] text-slate-500">Total listados: {processedItems.length}</span>
        </div>

        {processedItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-1.5 font-sans">
            <Info className="w-8 h-8 text-slate-650 mx-auto" />
            <p className="font-bold">Nenhum produto atende a este filtro de validade.</p>
            <p className="text-[10.5px]">Seus produtos estão 105% seguros no salão e nos freezers.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {processedItems.map((item) => {
              const details = item.vDetails;
              const isExpired = details.status === 'expired';
              const isCritical = details.status.startsWith('critical');

              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-805 transition-colors ${
                    isExpired ? 'bg-rose-500/[0.01]' : ''
                  }`}
                >
                  {/* Left Column: Product primary tag info */}
                  <div className="space-y-1 md:max-w-md w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 text-slate-500">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium font-sans">
                      <p>Estoque atual: <span className="font-mono font-bold text-slate-300">{item.quantity} {item.unit}</span></p>
                      <p>Localização: <span className="font-semibold text-slate-205 text-slate-200">{item.storageLocation || 'Não especificado'}</span></p>
                      <p className="col-span-2 sm:col-span-1">Forn: <span className="text-slate-450 text-xs truncate max-w-[120px]">{item.supplier}</span></p>
                    </div>
                  </div>

                  {/* Right components: Dates, alerts & Discard action buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    
                    {/* Validades alert band */}
                    <div className="text-right space-y-1">
                      <p className="text-[11px] font-mono font-bold text-slate-300">
                        Validade: <span className="underline decoration-indigo-500 underline-offset-2">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR') : 'Lote permanente'}</span>
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${details.color}`}>
                        {details.badge}
                      </span>
                    </div>

                    {/* Quick descarte operations for safety compliance */}
                    <div className="shrink-0 flex items-center justify-end">
                      {discardingItemId === item.id ? (
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-805 max-w-xs animate-slide-up space-y-2 text-[11px] text-left">
                          <p className="font-bold text-rose-450 text-rose-400">Descartar do Estoque por Expiração?</p>
                          <input
                            type="text"
                            placeholder="Motivo (ex: Amassado, cheiro estragado)..."
                            value={tempReason}
                            onChange={(e) => setTempReason(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-white rounded p-1.5 focus:outline-none font-sans"
                          />
                          <div className="flex gap-2.5 justify-end">
                            <button
                              type="button"
                              onClick={() => { setDiscardingItemId(null); setTempReason(''); }}
                              className="px-2 py-1 bg-slate-850 hover:bg-slate-800 rounded text-slate-400 font-bold"
                            >
                              Voltar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDiscardSubmit(item.id)}
                              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded shadow-sm"
                            >
                              Confirmar Perda
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDiscardingItemId(item.id)}
                          className="p-2.5 bg-slate-950 border border-slate-850 text-slate-450 hover:text-rose-400 hover:bg-rose-500/[0.02] hover:border-rose-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-1 font-bold"
                          title="Descartar produto por vencimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Descartar Lote</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guide explaining standard Floripa Bar protocols for expired lots */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-805 flex gap-3 text-xs leading-relaxed text-slate-400">
        <Info className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-white">Manual de Segurança Sanitária - Floripa Bar</h4>
          <p>
            Qualquer item expirado ou vencido exibido em vermelho acima deve ser retirado imediatamente do estoque de salão e do bar de atendimento. O descarte deve ser registrado pelo botão <strong className="text-slate-300">Descartar Lote</strong>, que anula a quantidade atual e registra uma movimentação de Perda automática para fins de auditoria quinzenal e relatórios gerenciais do POS.
          </p>
        </div>
      </div>

    </div>
  );
}
