import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CircleArrowDown,
  CircleArrowUp,
  Sliders,
  Calendar,
  MessageSquare,
  HelpCircle,
  Clock,
  RotateCcw,
  User,
  Camera,
  Trash2,
  X,
  FileText,
  Bookmark
} from 'lucide-react';
import { Item, Movement } from '../types';
import { UserSession } from './LoginScreen';

interface MovementsViewProps {
  items: Item[];
  movements: Movement[];
  onAddMovement: (movementData: Omit<Movement, 'id' | 'date'> & { date?: string }) => void;
  onClearHistory: () => void;
  activeUser: UserSession;
}

export type BroadType = 'Entrada' | 'Saída/Perda';

export default function MovementsView({
  items,
  movements,
  onAddMovement,
  onClearHistory,
  activeUser,
}: MovementsViewProps) {
  // Local Form states
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [broadType, setBroadType] = useState<BroadType>('Entrada');
  const [subtype, setSubtype] = useState<string>('Compra');
  const [quantity, setQuantity] = useState<number>(0);
  const [responsible, setResponsible] = useState(activeUser.name);
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  
  // Scaffolding alerts
  const [errorMess, setErrorMess] = useState('');
  const [successMess, setSuccessMess] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);

  // Sorter / Filter for log view
  const [logFilter, setLogFilter] = useState<'all' | 'Entrada' | 'Saída/Perda'>('all');

  const entradaSubtypes = [
    'Recebimento de Mercadorias',
    'Compra',
    'Retorno de empréstimo',
    'Outros'
  ];

  const saidaSubtypes = [
    'Venda',
    'Consumo interno',
    'Ajuste de Inventário',
    'Perda por Vencimento',
    'Avaria/Quebra',
    'Descarte',
    'Outros'
  ];

  // Keep subtipos aligned dynamically
  useEffect(() => {
    if (broadType === 'Entrada') {
      setSubtype('Compra');
    } else {
      setSubtype('Venda');
    }
  }, [broadType]);

  // Keep active user responsible synced
  useEffect(() => {
    if (activeUser) {
      setResponsible(activeUser.name);
    }
  }, [activeUser]);

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');
    setSuccessMess('');

    if (!selectedItemId) {
      setErrorMess('Por favor, cadastre ou selecione um produto primeiro.');
      return;
    }

    if (quantity <= 0) {
      setErrorMess('A quantidade da movimentação deve ser maior que zero.');
      return;
    }

    const itemObj = items.find((i) => i.id === selectedItemId);
    if (!itemObj) {
      setErrorMess('Produto não localizado no estoque.');
      return;
    }

    // Safety checks for outputs
    if (broadType === 'Saída/Perda' && itemObj.quantity < quantity) {
      setErrorMess(
        `Saída de estoque Inválida! A quantidade atual em mãos (${itemObj.quantity} ${itemObj.unit}) é inferior à retirada solicitada de ${quantity} ${itemObj.unit}.`
      );
      return;
    }

    // Call save action (combining quantities with standard types)
    onAddMovement({
      itemId: selectedItemId,
      productName: itemObj.name,
      type: broadType,
      subtype,
      quantityChange: broadType === 'Entrada' ? quantity : -quantity,
      responsible: responsible.trim() || activeUser.name,
      date: new Date(date).toISOString(),
      notes: notes.trim() ? `${subtype}: ${notes.trim()}` : subtype,
      photo: photo || undefined,
    });

    // Reset local state fields
    setQuantity(0);
    setNotes('');
    setPhoto('');
    setSuccessMess(`Lançamento de ${broadType} (${subtype}) registrado com sucesso para o item "${itemObj.name}"!`);
    
    // Clear message soon
    setTimeout(() => {
      setSuccessMess('');
    }, 4000);
  };

  // Filter movements
  const filteredMovements = movements
    .filter((m) => logFilter === 'all' || m.type === logFilter)
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  // Simulate snapping camera
  const triggerCameraSnap = () => {
    setPhoto('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f97316"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="%23ffffff">MOV_FOTO</text></svg>');
    setPhotoSuccess(true);
    setTimeout(() => {
      setShowCamera(false);
      setPhotoSuccess(false);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-fade-in pb-16 lg:pb-0 font-sans text-xs">
      
      {/* Form: Register movement */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 shadow-xl space-y-4">
          <div className="border-b border-slate-850 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
              <span>REGISTRAR MOVIMENTAÇÕES</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Entrada de novos lotes ou perdas do salão</p>
          </div>

          <form onSubmit={handleSubmitMovement} className="space-y-4">
            
            {errorMess && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-450 text-rose-400 font-bold">
                <span className="font-semibold">{errorMess}</span>
              </div>
            )}

            {successMess && (
              <div className="bg-emerald-500/10 border border-emerald-505/20 rounded-xl p-3 text-[#10b981] font-bold">
                <span>{successMess}</span>
              </div>
            )}

            {/* Select Product */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Selecionar Produto *
              </label>
              {items.length === 0 ? (
                <p className="text-[11px] text-rose-400 italic">Nenhum produto cadastrado no estoque do bar.</p>
              ) : (
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-950 text-white font-semibold text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
                  required
                >
                  <option value="" disabled>-- Selecione o item --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.quantity} {i.unit} em estoque)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Broad Type Selector (Entrada / Saída) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Fluxo de Movimentação *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBroadType('Entrada')}
                  className={`py-3 px-2.5 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    broadType === 'Entrada'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <CircleArrowUp className="w-4 h-4 shrink-0" />
                  <span>Entrada (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBroadType('Saída/Perda')}
                  className={`py-3 px-2.5 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    broadType === 'Saída/Perda'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-452 text-rose-400 shadow-md shadow-rose-950/20'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <CircleArrowDown className="w-4 h-4 shrink-0" />
                  <span>Saída/Perda (-)</span>
                </button>
              </div>
            </div>

            {/* Subtype dropdown based on type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Motivação Real / Subtipo *
              </label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                className="w-full bg-slate-950 text-white font-semibold text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
              >
                {broadType === 'Entrada'
                  ? entradaSubtypes.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))
                  : saidaSubtypes.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
              </select>
            </div>

            {/* Quantity and Operator row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 24"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-white font-mono text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 block">
                  <User className="w-3 h-3 text-brand-orange" />
                  Responsável
                </label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none font-semibold"
                  required
                />
              </div>
            </div>

            {/* Date time of movement */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Data do Registro *
              </label>
              <div className="relative text-xs">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange"
                  required
                />
              </div>
            </div>

            {/* Photo trigger */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-brand-orange" />
                Foto de Acompanhamento (Opcional)
              </label>
              {photo ? (
                <div className="bg-slate-950 p-2 rounded-xl flex items-center justify-between border border-emerald-500/20 text-emerald-400">
                  <span>✓ Foto da mercadoria salva</span>
                  <button type="button" onClick={() => setPhoto('')} className="text-slate-400 hover:text-white">Excluir</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-805 text-slate-300 font-bold border border-slate-850 rounded-xl cursor-pointer"
                >
                  📷 Tirar Foto da Mercadoria/Avaria
                </button>
              )}
            </div>

            {/* Observations / Motivo */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Anotações (Opcional)
              </label>
              <div className="relative text-xs text-slate-350">
                <span className="absolute top-3 left-3 pointer-events-none text-slate-500 font-bold">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Ex: Nota Fiscal nº 2056, garrafa quebrou na limpeza do bar"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-855 border-slate-850 focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              id="btn-confirmar-movimentacao"
              disabled={items.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-brand-gold disabled:opacity-50 text-slate-950 font-black tracking-wider uppercase rounded-xl shadow-md hover:from-brand-orange/95 hover:to-brand-gold/95 cursor-pointer block text-center"
            >
              Confirmar Lançamento
            </button>
          </form>
        </div>
      </div>

      {/* History Log table */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-850 gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-orange" />
                <span>Histórico de Lançamentos do Floripa</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Visão cronológica de entradas, saídas e acertos</p>
            </div>

            {movements.length > 0 && (
              <button
                onClick={() => { if (window.confirm('Deseja realmente limpar todo o histórico de lançamentos do Floripa Bar?')) onClearHistory(); }}
                className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 border border-slate-855 px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-tight text-brand-orange cursor-pointer"
              >
                <RotateCcw className="w-3" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>

          {/* Quick inline status pills filters */}
          <div className="flex flex-wrap gap-2 pt-3 pb-2 text-[11px] items-center">
            <span className="text-slate-500 font-semibold mr-1">Filtrar histórico:</span>
            <button
              onClick={() => setLogFilter('all')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                logFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Ver Tudo ({movements.length})
            </button>
            <button
              onClick={() => setLogFilter('Entrada')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                logFilter === 'Entrada' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setLogFilter('Saída/Perda')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                logFilter === 'Saída/Perda' ? 'bg-rose-500/10 text-rose-455 font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Saídas/Perdas
            </button>
          </div>

          {/* Log Table or card list */}
          <div className="mt-3 overflow-hidden">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs text-slate-500 italic">
                Nenhum lançamento filtrado no histórico inicial do dispositivo.
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredMovements.map((move) => {
                  const isLossSub = move.subtype === 'Avaria/Quebra' || move.subtype === 'Perda por Vencimento' || move.subtype === 'Descarte';
                  return (
                    <div
                      key={move.id}
                      className="bg-slate-950 rounded-xl p-3.5 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300"
                    >
                      {/* Product details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            move.type === 'Entrada'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                              : isLossSub
                              ? 'bg-rose-500/15 text-rose-452 text-rose-400 border-rose-500/15'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                          }`}>
                            {move.subtype || move.type}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-xs mt-1.5">{move.productName}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-slate-500 font-semibold font-sans">
                          <span>Operador: {move.responsible}</span>
                          <span>•</span>
                          <span>
                            {move.date ? new Date(move.date).toLocaleDateString('pt-BR') : ''} a {move.date ? new Date(move.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        {move.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-1.5 rounded border border-slate-900 mt-1">{move.notes}</p>
                        )}
                      </div> 
 
                      {/* Right: Quantity indicators */}
                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 shrink-0 bg-slate-900 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-850 sm:border-0 shrink-0">
                        <p className={`font-mono font-black text-sm ${
                          move.quantityChange < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {move.quantityChange > 0 ? '+' : ''}
                          {move.quantityChange}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Simulator Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 max-w-sm w-full border border-slate-800 rounded-2xl overflow-hidden text-center text-xs text-slate-350 space-y-4 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCamera(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-orange" />
                <span>Camera de Registro de Avarias</span>
              </h4>
              <p className="text-slate-400 text-xs">Pressione para registrar a imagem da mercadoria avariada para anexar ao histórico</p>
            </div>

            {/* View Finder */}
            <div className="w-full aspect-square bg-[#0b0c10] relative overflow-hidden rounded-xl border border-slate-850 flex items-center justify-center">
              <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono bg-slate-950/80 p-1 rounded">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>AVARIA CAM</span>
              </div>
              <Camera className="w-16 h-16 text-slate-850/40 animate-pulse" />
            </div>

            {photoSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] font-bold">
                ✓ Comprovante anexado!
              </div>
            )}

            <button
              type="button"
              onClick={triggerCameraSnap}
              className="w-16 h-16 bg-white hover:bg-slate-100 rounded-full border-4 border-slate-805 transition-all cursor-pointer flex items-center justify-center mx-auto"
            >
              <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-950"></div>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
