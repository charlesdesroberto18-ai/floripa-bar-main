import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Minus,
  Edit2,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Notebook,
  TrendingDown,
  Trash,
  ShieldAlert,
} from 'lucide-react';
import { Item, Category, Unit } from '../types';
import { UserSession } from './LoginScreen';

interface StockViewProps {
  items: Item[];
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onQuickQuantityUpdate: (itemId: string, change: number, notes: string) => void;
  onNavigateToAddItem: () => void;
  activeUser?: UserSession;
}

export default function StockView({
  items,
  onEditItem,
  onDeleteItem,
  onQuickQuantityUpdate,
  onNavigateToAddItem,
  activeUser,
}: StockViewProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'falta' | 'baixo' | 'ok'>('all');

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Manual fast input state per row
  const [customAdjustmentNotes, setCustomAdjustmentNotes] = useState<{ [key: string]: string }>({});

  // Active permission alert
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const categories: Category[] = [
    'Bebidas',
    'Alimentos',
    'Produtos de limpeza',
    'Utensílios',
    'Descartáveis',
    'Outros',
  ];

  // Helper to determine status
  const getItemStatus = (item: Item) => {
    if (item.quantity === 0) return { label: 'Em falta', color: 'rose', icon: AlertOctagon };
    if (item.quantity <= item.minQuantity) return { label: 'Baixo', color: 'amber', icon: AlertTriangle };
    return { label: 'OK', color: 'emerald', icon: CheckCircle };
  };

  // Helper to check if current employee has write access for this item's context
  const checkWritePermission = (item: Item, actionName: string): boolean => {
    if (!activeUser) return false;
    
    // Gerente is GOD
    if (activeUser.role === 'gerente') return true;

    // Cozinha cannot fiddle with drinks
    if (activeUser.role === 'cozinha' && item.category === 'Bebidas') {
      triggerPermissionError(`Acesso negado para Chef ${activeUser.name}: A categoria 'Bebidas' é de responsabilidade do bartender.`);
      return false;
    }

    // Bartender cannot fiddle with core food / kitchen utensils
    if (activeUser.role === 'bartender' && (item.category === 'Alimentos' || item.category === 'Utensílios' || item.category === 'Produtos de limpeza')) {
      triggerPermissionError(`Acesso negado para Bartender ${activeUser.name}: Bebidas e Descartáveis apenas.`);
      return false;
    }

    // Otherwise allowed
    return true;
  };

  const checkGlobalAddPermission = (): boolean => {
    if (!activeUser) return false;
    return true; // Anyone logged in can try to register, category restrictions checked on action
  };

  const triggerPermissionError = (msg: string) => {
    setPermissionError(msg);
    setTimeout(() => {
      setPermissionError(null);
    }, 4500);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    const status = getItemStatus(item);
    let matchesStatus = true;
    if (statusFilter === 'falta') matchesStatus = item.quantity === 0;
    else if (statusFilter === 'baixo') matchesStatus = item.quantity > 0 && item.quantity <= item.minQuantity;
    else if (statusFilter === 'ok') matchesStatus = item.quantity > item.minQuantity;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle immediate +/- clicks
  const handleQuickAdd = (item: Item) => {
    if (!checkWritePermission(item, 'adicionar')) return;
    const notes = customAdjustmentNotes[item.id] || 'Ajuste rápido de quantidade';
    onQuickQuantityUpdate(item.id, 1, notes);
    // Clear quick notes
    setCustomAdjustmentNotes(prev => ({ ...prev, [item.id]: '' }));
  };

  const handleQuickSubtract = (item: Item) => {
    if (!checkWritePermission(item, 'subtrair')) return;
    if (item.quantity === 0) return;
    const notes = customAdjustmentNotes[item.id] || 'Retirada rápida de estoque';
    onQuickQuantityUpdate(item.id, -1, notes);
    // Clear quick notes
    setCustomAdjustmentNotes(prev => ({ ...prev, [item.id]: '' }));
  };

  const handleTriggerEdit = (item: Item) => {
    if (!checkWritePermission(item, 'editar')) return;
    onEditItem(item);
  };

  const handleTriggerDelete = (item: Item) => {
    // Only Gerente can delete items entirely
    if (!activeUser) return;
    if (activeUser.role !== 'gerente') {
      triggerPermissionError('Apenas gerentes gerais possuem permissão para excluir produtos da base de dados!');
      return;
    }
    setConfirmDeleteId(item.id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-0">
      
      {/* Alert toast for permission restrictions */}
      {permissionError && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border-2 border-rose-500 p-4 rounded-2xl shadow-2xl flex items-start gap-3 max-w-sm animate-slide-up text-white">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-rose-400">Controle Operacional</h4>
            <p className="text-[11px] text-slate-300 leading-normal font-medium">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Search and Filters Header */}
      <div className="bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Inventário de Produtos</h2>
            <p className="text-xs text-slate-400 mt-0.5">Consulte, pesquise e ajuste estoque instantaneamente</p>
          </div>
          
          <button
            onClick={() => {
              if (checkGlobalAddPermission()) {
                onNavigateToAddItem();
              } else {
                triggerPermissionError('Realize o login antes de cadastrar novos itens.');
              }
            }}
            className="flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange/90 active:bg-brand-orange text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 text-white stroke-[3]" />
            <span>Cadastrar Novo</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por produto ou fornecedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            />
          </div>

          {/* Category drop */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
              className="w-full bg-slate-950 text-white text-xs px-3 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            >
              <option value="all">Todas Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quick status drop */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 text-white text-xs px-3 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            >
              <option value="all">Filtro de Status (Todos)</option>
              <option value="falta">Crítico: Em falta</option>
              <option value="baixo">Aviso: Estoque Baixo</option>
              <option value="ok">Atendido: Estoque OK</option>
            </select>
          </div>

        </div>

        {/* Quick horizontal filter pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/40 text-xs items-center">
          <span className="text-slate-500 font-bold mr-1.5 font-mono text-[10px]">Atalhos de filtro:</span>
          
          <button
            onClick={() => { setStatusFilter('all'); setSelectedCategory('all'); setSearchQuery(''); }}
            className={`px-3 py-1 rounded-full border transition-all text-[11px] ${
              statusFilter === 'all' && selectedCategory === 'all' && searchQuery === ''
                ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/30 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-white'
            }`}
          >
            Todos os Ativos ({items.length})
          </button>

          <button
            onClick={() => setStatusFilter('falta')}
            className={`px-3 py-1 rounded-full border transition-all text-[11px] ${
              statusFilter === 'falta'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-rose-400'
            }`}
          >
            Faltas ({items.filter(i => i.quantity === 0).length})
          </button>

          <button
            onClick={() => setStatusFilter('baixo')}
            className={`px-3 py-1 rounded-full border transition-all text-[11px] ${
              statusFilter === 'baixo'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-amber-400'
            }`}
          >
            Nível Crítico ({items.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length})
          </button>
        </div>
      </div>

      {/* Grid count stats */}
      <div className="text-xs text-slate-400 px-1 flex justify-between items-center">
        <span>Mostrando {filteredItems.length} de {items.length} itens cadastrados</span>
        {filteredItems.length === 0 && (
          <span className="text-brand-orange font-bold">Nenhum produto atende aos filtros atuais.</span>
        )}
      </div>

      {/* LIST TABLE - DESKTOP VIEW */}
      <div className="hidden lg:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-4 px-5">Produto</th>
              <th className="py-4 px-4">Categoria</th>
              <th className="py-4 px-4">Qtd. Atual</th>
              <th className="py-4 px-4">Mín. Ideal</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4">Ajuste Rápido (+ / -)</th>
              <th className="py-4 px-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => {
              const status = getItemStatus(item);
              const StatusIcon = status.icon;
              const isConfirming = confirmDeleteId === item.id;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    item.quantity === 0 ? 'bg-rose-500/[0.01]' : ''
                  }`}
                >
                  {/* Name, Supplier, Notes */}
                  <td className="py-4 px-5 max-w-[240px]">
                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        Forn: {item.supplier}
                      </span>
                      {item.notes && (
                        <span className="text-[10px] text-slate-500 italic max-w-full truncate" title={item.notes}>
                          Obs: {item.notes}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-805 rounded-full text-[10px] text-slate-300 font-semibold">
                      {item.category}
                    </span>
                  </td>

                  {/* Qtd. Actual */}
                  <td className="py-4 px-4">
                    <span className={`text-base font-bold font-mono ${
                      item.quantity === 0 ? 'text-rose-500' : item.quantity <= item.minQuantity ? 'text-amber-400' : 'text-slate-100'
                    }`}>
                      {item.quantity}
                    </span>
                    <span className="text-xs text-slate-450 font-medium ml-1">{item.unit}</span>
                  </td>

                  {/* Min Quantity */}
                  <td className="py-4 px-4 text-slate-450 font-mono text-xs">
                    {item.minQuantity} <span className="text-[10px] text-slate-500">{item.unit}</span>
                  </td>

                  {/* Status Indicator */}
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      status.color === 'rose'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : status.color === 'amber'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-[#10b981] border-emerald-500/20'
                    }`}>
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      {status.label}
                    </span>
                  </td>

                  {/* Quick incremental +/- adjustments */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1.5 max-w-[170px]">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickSubtract(item)}
                          disabled={item.quantity === 0}
                          title="Diminuir 1"
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 active:bg-slate-950 rounded text-slate-450 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="text-center font-bold px-1.5 bg-slate-950 border border-slate-800/85 text-xs text-slate-300 font-mono rounded min-w-[36px] py-1">
                          {item.quantity}
                        </div>

                        <button
                          onClick={() => handleQuickAdd(item)}
                          title="Adicionar 1"
                          className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 active:bg-slate-950 rounded text-slate-450 hover:text-brand-orange transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Micro note entry for this movement */}
                      <input
                        type="text"
                        placeholder="Motivo (ex: venda, avaria)..."
                        value={customAdjustmentNotes[item.id] || ''}
                        onChange={(e) => setCustomAdjustmentNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="bg-slate-950/60 text-slate-400 text-[10px] px-1.5 py-1 rounded border border-slate-800/60 focus:outline-none focus:border-brand-orange/50"
                      />
                    </div>
                  </td>

                  {/* Standard Actions (Edit, Delete) */}
                  <td className="py-4 px-5 text-right">
                    {isConfirming ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-rose-450 font-black">Remover?</span>
                        <button
                          onClick={() => { onDeleteItem(item.id); setConfirmDeleteId(null); }}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-1 px-2.5 rounded transition-all cursor-pointer"
                        >
                          Apagar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1 px-2.5 rounded transition-all cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTriggerEdit(item)}
                          title="Editar cadastro"
                          className="p-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleTriggerDelete(item)}
                          title="Excluir produto"
                          className="p-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST - CARDS VIEW */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {filteredItems.map((item) => {
          const status = getItemStatus(item);
          const StatusIcon = status.icon;
          const isConfirming = confirmDeleteId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-slate-900 rounded-2xl border p-4.5 space-y-4 hover:border-slate-700 transition-all ${
                item.quantity === 0 ? 'border-rose-500/20 bg-rose-500/[0.01]' : 'border-slate-800'
              }`}
            >
              {/* Product Info and status */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h4 className="font-bold text-white text-sm leading-tight break-words">{item.name}</h4>
                  <p className="text-xs text-slate-400 font-semibold">Forn: {item.supplier}</p>
                </div>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  status.color === 'rose'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : status.color === 'amber'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>

              {/* Counts section */}
              <div className="grid grid-cols-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 gap-2 text-center">
                <div className="border-r border-slate-800/60 py-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-tight">Qtd. Atual</p>
                  <p className={`text-xl font-extrabold font-mono mt-0.5 ${
                    item.quantity === 0 ? 'text-rose-500 animate-pulse' : item.quantity <= item.minQuantity ? 'text-amber-400' : 'text-slate-100'
                  }`}>
                    {item.quantity}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{item.unit}</p>
                </div>

                <div className="py-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight">Estoque Mínimo</p>
                  <p className="text-xl font-bold font-mono text-slate-300 mt-0.5">
                    {item.minQuantity}
                  </p>
                  <p className="text-[10px] text-slate-500">{item.unit}</p>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="bg-slate-950/40 p-2 rounded text-[11px] text-slate-400 border border-slate-800/40">
                  <span className="font-semibold text-slate-500 block">Observação:</span>
                  <p className="italic mt-0.5">{item.notes}</p>
                </div>
              )}

              {/* Quick adjustment buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1 bg-slate-950 rounded-lg border border-slate-800 p-1 font-semibold">
                  
                  {/* Subtract btn */}
                  <button
                    onClick={() => handleQuickSubtract(item)}
                    disabled={item.quantity === 0}
                    className="flex-1 py-1.5 flex justify-center bg-slate-900 border border-slate-800/50 hover:bg-slate-700 rounded-md text-rose-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-4 text-[11px] text-slate-400">Ajuste Manual Rápido</span>

                  {/* Add btn */}
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="flex-1 py-1.5 flex justify-center bg-slate-900 border border-slate-800/50 hover:bg-slate-700 rounded-md text-brand-orange cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                </div>

                {/* Mobile Quick Notes */}
                <input
                  type="text"
                  placeholder="Observação rápida do lote..."
                  value={customAdjustmentNotes[item.id] || ''}
                  onChange={(e) => setCustomAdjustmentNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                  className="bg-slate-950 text-slate-300 text-xs px-2.5 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-orange/50"
                />
              </div>

              {/* Standard actions footer */}
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-3">
                {isConfirming ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-[11px] text-rose-450 font-black">Remover definitivamente?</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { onDeleteItem(item.id); setConfirmDeleteId(null); }}
                        className="bg-rose-500 text-white font-bold text-xs py-1 px-3 rounded transition-all cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="bg-slate-800 text-slate-300 text-xs py-1 px-3 rounded transition-all cursor-pointer"
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleTriggerEdit(item)}
                      className="flex items-center gap-1.5 text-xs text-brand-orange py-1.5 px-3 bg-brand-orange/5 hover:bg-brand-orange/10 border border-brand-orange/10 rounded-xl cursor-pointer font-bold"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar Cadastro</span>
                    </button>
                    
                    <button
                      onClick={() => handleTriggerDelete(item)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 py-1.5 px-3 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl cursor-pointer"
                    >
                      <Trash className="w-3 h-3" />
                      <span>Excluir</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
