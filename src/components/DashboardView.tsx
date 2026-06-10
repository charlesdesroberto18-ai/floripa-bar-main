import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckSquare,
  AlertTriangle,
  Calendar,
  TrendingUp,
  AlertCircle,
  Camera,
  ScanLine,
  PlusCircle,
  Image,
  Link,
  FileText,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Award,
  ThumbsUp,
  Sliders,
  Bell,
  Trash
} from 'lucide-react';
import { Item, Movement, Category, WorkShift, WeeklyWage, DailyTask, DailyNote, DailyFeedback, TaskPriority, TaskStatus, TabId } from '../types';
import { UserSession } from './LoginScreen';

interface DashboardViewProps {
  items: Item[];
  movements: Movement[];
  workShift: WorkShift;
  onStartShift: () => void;
  onEndShift: () => void;
  weeklyWage: WeeklyWage;
  onAddTransaction: (type: 'vale' | 'desconto', amount: number, description: string) => void;
  onRemoveTransaction: (id: string) => void;
  onUpdateDailyRate: (rate: number) => void;
  onUpdateSelectedDays: (days: string[]) => void;
  dailyTasks: DailyTask[];
  onAddTask: (task: Omit<DailyTask, 'id' | 'status'>) => void;
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  // Notes
  dailyNotes: DailyNote[];
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (id: string, text: string) => void;
  // Feedback
  dailyFeedback: DailyFeedback;
  onSaveFeedback: (feedback: DailyFeedback) => void;
  // Navigation & Stock
  onNavigate: (tabId: TabId) => void;
  onQuickQuantityUpdate: (itemId: string, change: number, notes: string) => void;
  activeUser: UserSession;
}

export default function DashboardView({
  items,
  movements,
  workShift,
  onStartShift,
  onEndShift,
  weeklyWage,
  onAddTransaction,
  onRemoveTransaction,
  onUpdateDailyRate,
  onUpdateSelectedDays,
  dailyTasks,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  dailyNotes,
  onAddNote,
  onDeleteNote,
  onEditNote,
  dailyFeedback,
  onSaveFeedback,
  onNavigate,
  onQuickQuantityUpdate,
  activeUser,
}: DashboardViewProps) {

  // Local state for UI toggles
  const [showRateModal, setShowRateModal] = useState(false);
  const [tempRate, setTempRate] = useState(weeklyWage.dailyRate.toString());
  
  // Vales & Descontos Form State
  const [showTransForm, setShowTransForm] = useState(false);
  const [transType, setTransType] = useState<'vale' | 'desconto'>('vale');
  const [transValue, setTransValue] = useState('');
  const [transDesc, setTransDesc] = useState('');

  // Tasks Form State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Média');
  const [taskDue, setTaskDue] = useState('18:00');
  const [taskNotes, setTaskNotes] = useState('');

  // Notes Form State
  const [noteText, setNoteText] = useState('');
  const [noteLink, setNoteLink] = useState('');
  const [noteImage, setNoteImage] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Time calculation help for tasks
  const [currentTime, setCurrentTime] = useState(new Date());

  // Feedback fields
  const [fbHasError, setFbHasError] = useState(dailyFeedback.hasError);
  const [fbErrorQty, setFbErrorQty] = useState(dailyFeedback.errorQty);
  const [fbErrorDesc, setFbErrorDesc] = useState(dailyFeedback.errorDescription);
  const [fbPerfect, setFbPerfect] = useState(dailyFeedback.whatWentPerfect);
  const [fbToImprove, setFbToImprove] = useState(dailyFeedback.whatToImprove);
  const [fbSuggestions, setFbSuggestions] = useState(dailyFeedback.suggestions);
  const [fbUploads, setFbUploads] = useState(dailyFeedback.uploads);
  const [copiedLink, setCopiedLink] = useState(false);

  // Format Elapsed clock
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => (v < 10 ? '0' + v : v)).join(':');
  };

  useEffect(() => {
    // Keep local timer updated for alerts logic
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute stats for Saldo da semana
  const totalDaysWorked = weeklyWage.selectedDays.length;
  const grossWages = totalDaysWorked * (weeklyWage.dailyRate || 0);
  const valesTotal = weeklyWage.transactions
    .filter((t) => t.type === 'vale')
    .reduce((sum, t) => sum + t.amount, 0);
  const discountsTotal = weeklyWage.transactions
    .filter((t) => t.type === 'desconto')
    .reduce((sum, t) => sum + t.amount, 0);
  const netEarnings = grossWages - valesTotal - discountsTotal;

  // Compute custom real-time task alerts
  const checkTaskAlert = (task: DailyTask) => {
    if (task.status === 'Concluída') return null;

    const [dueH, dueM] = task.dueTime.split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(dueH, dueM, 0, 0);

    const diffMs = taskTime.getTime() - currentTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 0) {
      return { msg: 'Tarefa atrasada', type: 'late' };
    } else if (diffMinutes <= 30) {
      return { msg: `Tarefa vence em ${diffMinutes} minutos`, type: 'warning' };
    }
    return null;
  };

  // Add a task
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle,
      priority: taskPriority,
      dueTime: taskDue,
      notes: taskNotes,
    });
    setTaskTitle('');
    setTaskNotes('');
    setShowTaskForm(false);
  };

  // Add transactional discount/vale
  const handleTransSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transValue);
    if (isNaN(amt) || amt <= 0 || !transDesc.trim()) return;
    onAddTransaction(transType, amt, transDesc);
    setTransValue('');
    setTransDesc('');
    setShowTransForm(false);
  };

  // Edit/Save notes
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    if (editingNoteId) {
      onEditNote(editingNoteId, noteText, noteLink, noteImage);
      setEditingNoteId(null);
    } else {
      onAddNote(noteText, noteLink, noteImage);
    }
    setNoteText('');
    setNoteLink('');
    setNoteImage('');
  };

  const handleEditNoteTrigger = (note: DailyNote) => {
    setEditingNoteId(note.id);
    setNoteText(note.text);
    setNoteLink(note.link || '');
    setNoteImage(note.image || '');
  };

  // Save general end-day feedback
  const handleSaveFeedbackData = () => {
    onSaveFeedback({
      hasError: fbHasError,
      errorQty: fbErrorQty,
      errorDescription: fbErrorDesc,
      whatWentPerfect: fbPerfect,
      whatToImprove: fbToImprove,
      suggestions: fbSuggestions,
      uploads: fbUploads,
    });
    const indicator = document.getElementById('feedback-saved-indicator');
    if (indicator) {
      indicator.classList.remove('opacity-0');
      setTimeout(() => {
        indicator.classList.add('opacity-0');
      }, 3000);
    }
  };

  // Simulate file upload or link adding
  const handleAddUpload = (type: 'image' | 'doc' | 'link') => {
    if (type === 'link') {
      const url = prompt('Cole o link do documento ou referência externa:');
      if (url) {
        setFbUploads([
          ...fbUploads,
          { id: Math.random().toString(), name: 'Doc Link Externo', type, url },
        ]);
      }
    } else {
      // Simulate file picker / take picture
      const filename = type === 'image' ? 'comprovante_erro.jpg' : 'assinatura_gerencia.pdf';
      setFbUploads([
        ...fbUploads,
        { id: Math.random().toString(), name: filename, type, url: '#' },
      ]);
    }
  };

  // Remove upload item
  const handleRemoveUpload = (id: string) => {
    setFbUploads(fbUploads.filter((u) => u.id !== id));
  };

  const syncFeedbackState = () => {
    setFbHasError(dailyFeedback.hasError);
    setFbErrorQty(dailyFeedback.errorQty);
    setFbErrorDesc(dailyFeedback.errorDescription);
    setFbPerfect(dailyFeedback.whatWentPerfect);
    setFbToImprove(dailyFeedback.whatToImprove);
    setFbSuggestions(dailyFeedback.suggestions);
    setFbUploads(dailyFeedback.uploads);
  };

  // Keep feedback fields in sync with props changes
  useEffect(() => {
    syncFeedbackState();
  }, [dailyFeedback]);

  // Quick Stock alerts calculations
  const outOfStockItems = items.filter((item) => item.quantity === 0);
  const lowStockItems = items.filter(
    (item) => item.quantity > 0 && item.quantity <= item.minQuantity
  );
  
  // Filter expiring products matching alerts (<= 15 days)
  const expiringWarning = items.filter((item) => {
    if (!item.expiryDate) return false;
    const expDate = new Date(item.expiryDate);
    const diffTime = expDate.getTime() - currentTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 15;
  });

  const expiredItems = items.filter((item) => {
    if (!item.expiryDate) return false;
    const expDate = new Date(item.expiryDate);
    const diffTime = expDate.getTime() - currentTime.getTime();
    return diffTime <= 0;
  });

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in pb-20">
      
      {/* 1. JORNADA DE TRABALHO CARD (CRITICAL PRIORITY FOR THE WAITER) */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden group">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-brand-orange/10 transition-colors duration-700" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-4 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
                <Clock className="w-6 h-6 text-brand-orange" />
              </div>
              <span>Jornada de Trabalho</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">Controle em tempo real do seu turno operacional</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm transition-all duration-500 ${
              workShift.status === 'em_andamento'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse'
                : workShift.status === 'finalizada'
                ? 'bg-slate-800 text-slate-500 border-white/5'
                : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
            }`}>
              {workShift.status === 'em_andamento' ? 'Turno Ativo' : workShift.status === 'finalizada' ? 'Turno Encerrado' : 'Aguardando Início'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Main Stopwatch visualization */}
          <div className="md:col-span-5 bg-slate-950/80 rounded-[2rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
            <span className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-500">Tempo Decorrido</span>
            <div className="text-5xl md:text-6xl font-black font-display text-white tracking-tighter transition-all py-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {formatTime(workShift.elapsedSeconds)}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${workShift.status === 'em_andamento' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeUser.name}
              </span>
            </div>
          </div>

          {/* Times and actions section */}
          <div className="md:col-span-7 space-y-6">
            <div className="grid grid-cols-3 bg-slate-950/40 p-5 rounded-2xl border border-white/5 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Entrada</p>
                <p className="text-lg font-black text-slate-200 font-mono">
                  {workShift.startTime ? new Date(workShift.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div className="border-x border-white/5 space-y-1">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Saída</p>
                <p className="text-lg font-black text-slate-200 font-mono">
                  {workShift.endTime ? new Date(workShift.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total</p>
                <p className="text-lg font-black text-brand-orange font-mono">
                  {workShift.status === 'nao_iniciada' ? '0h 0m' : `${Math.floor(workShift.elapsedSeconds / 3600)}h ${Math.floor((workShift.elapsedSeconds % 3600) / 60)}m`}
                </p>
              </div>
            </div>

            {/* Shift start/stop action triggers */}
            <div className="flex gap-4">
              {workShift.status !== 'em_andamento' ? (
                <button
                  type="button"
                  onClick={onStartShift}
                  disabled={workShift.status === 'finalizada'}
                  className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Iniciar Turno</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onEndShift}
                  className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-br from-rose-500 to-red-700 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-[0_10px_20px_-5px_rgba(244,63,94,0.3)]"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Finalizar Turno</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 2. SALDO DA SEMANA (ESTIMATE EARNINGS & INTERMITTENT DISCOUNTS) */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-4 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
                <DollarSign className="w-6 h-6 text-brand-orange" />
              </div>
              <span>Saldo Operacional</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">Resumo financeiro semanal e adiantamentos</p>
          </div>
          
          <button
            onClick={() => setShowRateModal(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] text-slate-300 font-black uppercase tracking-widest transition-all cursor-pointer hover:border-brand-orange/30"
          >
            Ajustar Diária
          </button>
        </div>

        {/* Selected week worked days */}
        <div className="bg-slate-950/60 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-inner">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Escala de Trabalho (Clique para marcar):</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {weeklyWage.workedDays.map((dia) => {
              const isSelected = weeklyWage.selectedDays.includes(dia);
              return (
                <button
                  key={dia}
                  onClick={() => {
                    const nextDays = isSelected
                      ? weeklyWage.selectedDays.filter((d) => d !== dia)
                      : [...weeklyWage.selectedDays, dia];
                    onUpdateSelectedDays(nextDays);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-orange text-slate-950 border-brand-orange shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                      : 'bg-slate-900/50 hover:bg-white/5 text-slate-500 border-white/5'
                  }`}
                >
                  {dia.split('-')[0]} {isSelected ? '✓' : '✗'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ledger values recap */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-950/80 p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-lg">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Frequência</span>
            <span className="text-2xl font-black text-white mt-3">{totalDaysWorked} <span className="text-sm text-slate-600">/ 5d</span></span>
            <span className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">Quarta à Domingo</span>
          </div>

          <div className="bg-slate-950/80 p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-lg group/item">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-emerald-500 transition-colors">Ganhos Brutos</span>
            <span className="text-2xl font-black text-emerald-400 mt-3">R$ {grossWages.toFixed(2)}</span>
            <span className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">Taxa: R$ {weeklyWage.dailyRate.toFixed(2)}</span>
          </div>

          <div className="bg-slate-950/80 p-6 rounded-3xl border border-white/5 flex flex-col justify-between shadow-lg group/item">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-rose-500 transition-colors">Descontos</span>
            <span className="text-2xl font-black text-rose-400 mt-3">R$ {valesTotal.toFixed(2)}</span>
            <span className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">Qtd: {weeklyWage.transactions.filter(t => t.type === 'vale').length}</span>
          </div>

          <div className="bg-slate-950/80 p-6 rounded-3xl border-2 border-brand-orange/30 flex flex-col justify-between shadow-[0_0_30px_rgba(249,115,22,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-orange/10 blur-2xl -mr-8 -mt-8" />
            <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest relative z-10">Saldo Líquido</span>
            <span className="text-3xl font-black text-white mt-3 relative z-10">R$ {netEarnings.toFixed(2)}</span>
            <div className="flex items-center gap-1.5 mt-2 relative z-10">
              <div className="w-1 h-1 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Pronto para Saque</span>
            </div>
          </div>
        </div>

        {/* Ledger transaction logs & add triggers */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400">Detalhamento Financeiro (Vales & Descontos)</span>
            <button
              onClick={() => {
                setTransType('vale');
                setShowTransForm(!showTransForm);
              }}
              className="flex items-center gap-1.5 text-[10px] text-brand-orange hover:text-[#fb923c] font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Vale ou Desconto</span>
            </button>
          </div>

          {/* Mini Inline transaction registration form */}
          {showTransForm && (
            <form onSubmit={handleTransSubmit} className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-3 animate-slide-up text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tipo de lançamento</label>
                  <select
                    value={transType}
                    onChange={(e) => setTransType(e.target.value as any)}
                    className="w-full bg-slate-950 text-slate-200 p-2 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange"
                  >
                    <option value="vale">Vale / Adiantamento</option>
                    <option value="desconto">Desconto / Penalização</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 50"
                    value={transValue}
                    onChange={(e) => setTransValue(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 p-2 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Motivo / Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Vale pego na quinta feira"
                    value={transDesc}
                    onChange={(e) => setTransDesc(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 p-2 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTransForm(false)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 px-3 py-1.5 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white px-4 py-1.5 rounded-lg font-bold"
                >
                  Salvar Turno
                </button>
              </div>
            </form>
          )}

          {/* List of active transactions on weekly ledger */}
          <div className="divide-y divide-slate-900">
            {weeklyWage.transactions.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-2 text-center">Nenhum vale ou desconto lançado para a semana de trabalho.</p>
            ) : (
              weeklyWage.transactions.map((tr) => (
                <div key={tr.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        tr.type === 'vale' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-rose-450 text-rose-400'
                      }`}>
                        {tr.type === 'vale' ? 'VALE' : 'DESCONTO'}
                      </span>
                      <span className="font-bold text-slate-205 text-slate-200">{tr.description}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Lançado em: {new Date(tr.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-300">R$ {tr.amount.toFixed(2)}</span>
                    <button
                      onClick={() => onRemoveTransaction(tr.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. TAREFAS DE HOJE (EDITABLE ROUTINE CHECKLIST & ALARMS) */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/65 gap-3">
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-orange" />
              <span>Tarefas Operacionais de Hoje</span>
            </h3>
            <p className="text-sm text-slate-400">Verifique seu checklist de deveres no Floripa Bar antes de encerrar o expediente</p>
          </div>
          
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2.5 py-1.5 rounded-xl text-[10px] text-brand-orange font-bold uppercase transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>

        {/* Task Creator form */}
        {showTaskForm && (
          <form onSubmit={handleAddTaskSubmit} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 animate-slide-up text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Nome / Tópico da Tarefa *</label>
                <input
                  type="text"
                  placeholder="Ex: Lustrar copos de chopp"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 p-2.5 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Prioridade</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-900 text-slate-200 p-2.5 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange font-bold"
                >
                  <option value="Alta">Alta (Urgente)</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Horário Limite</label>
                <input
                  type="time"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 p-2.5 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange font-mono font-semibold"
                  required
                />
              </div>

              <div className="sm:col-span-12 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Observações adicionais (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Usar pano microfibra"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 p-2.5 border border-slate-800 rounded-lg focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 px-3.5 py-1.5 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-brand-orange hover:bg-brand-orange/90 text-white px-4 py-1.5 rounded-lg font-bold"
              >
                Cadastrar Tarefa
              </button>
            </div>
          </form>
        )}

        {/* List of Tasks with calculated real-time alarms */}
        <div className="space-y-2.5">
          {dailyTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">Nenhuma tarefa listada para hoje. Adicione um dever!</p>
          ) : (
            dailyTasks.map((task) => {
              const alertInfo = checkTaskAlert(task);
              const isDone = task.status === 'Concluída';

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDone
                      ? 'bg-slate-950/40 border-slate-850 text-slate-500'
                      : alertInfo?.type === 'late'
                      ? 'bg-rose-500/[0.02] border-rose-500/20 text-slate-200'
                      : alertInfo?.type === 'warning'
                      ? 'bg-amber-500/[0.02] border-amber-500/20 text-slate-200'
                      : 'bg-slate-950 border-slate-850 text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() =>
                        onUpdateTaskStatus(
                          task.id,
                          isDone ? 'Pendente' : 'Concluída'
                        )
                      }
                      className="mt-0.5 text-slate-400 hover:text-brand-orange transition-colors cursor-pointer shrink-0"
                      title={isDone ? 'Desmarcar' : 'Concluir'}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isDone ? 'bg-brand-orange border-brand-orange text-slate-950' : 'bg-slate-900 border-slate-800'
                      }`}>
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                      </div>
                    </button>

                    <div className="space-y-1 min-w-s font-sans">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-bold text-xs ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </span>

                        {/* Priority pill */}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase inline-block ${
                          task.priority === 'Alta'
                            ? 'bg-rose-500/10 text-rose-450 text-rose-400'
                            : task.priority === 'Média'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">
                          Prazo: {task.dueTime}
                        </span>
                      </div>

                      {task.notes && (
                        <p className="text-[10px] text-slate-450 italic line-clamp-1 truncate max-w-sm">{task.notes}</p>
                      )}

                      {/* Display calculations alarm warn inline */}
                      {alertInfo && (
                        <span className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase mt-1 px-2 py-0.5 rounded-full border ${
                          alertInfo.type === 'late'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/15 animate-pulse'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/15'
                        }`}>
                          <AlertCircle className="w-3 h-3" />
                          <span>{alertInfo.msg}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status buttons and edit */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-[10px] font-bold p-1 bg-slate-900 text-slate-300 border border-slate-805 rounded focus:outline-none ${
                        isDone ? 'opacity-50' : ''
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                      <option value="Atrasada">Atrasada</option>
                    </select>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. ANOTAÇÕES E IDEIAS */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-8 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/5 gap-4 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
                <Lightbulb className="w-6 h-6 text-brand-orange" />
              </div>
              <span>Anotações e Ideias</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">Registre ideias, melhorias ou observações com links e imagens para o relatório semanal</p>
          </div>
        </div>

        <form onSubmit={handleNoteSubmit} className="space-y-6 relative z-10">
          <div className="space-y-4">
            <textarea
              placeholder="Descreva sua ideia ou anotação aqui..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full bg-slate-950/80 text-slate-200 text-sm px-6 py-4 rounded-[1.5rem] border border-white/5 focus:border-brand-orange/50 focus:outline-none transition-all resize-none shadow-inner"
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-brand-orange transition-colors">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="Link de referência (opcional)"
                  value={noteLink}
                  onChange={(e) => setNoteLink(e.target.value)}
                  className="w-full bg-slate-950/80 text-slate-300 text-xs pl-12 pr-4 py-3.5 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-brand-orange transition-colors">
                  <Image className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="URL da Imagem (opcional)"
                  value={noteImage}
                  onChange={(e) => setNoteImage(e.target.value)}
                  className="w-full bg-slate-950/80 text-slate-300 text-xs pl-12 pr-4 py-3.5 rounded-2xl border border-white/5 focus:border-brand-orange/50 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-brand-orange hover:bg-brand-orange/90 text-slate-950 font-black text-xs px-8 py-3.5 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_-5px_rgba(249,115,22,0.3)]"
            >
              {editingNoteId ? 'Atualizar Registro' : 'Gravar Anotação'}
            </button>
          </div>
        </form>

        <div className="space-y-4 relative z-10">
          {dailyNotes.length === 0 ? (
            <div className="bg-slate-950/40 p-10 rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-white/5 rounded-full">
                <FileText className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-sm text-slate-600 font-bold">Nenhuma ideia ou anotação registrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyNotes.map((note) => (
                <div key={note.id} className="bg-slate-950/80 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between gap-4 group/note hover:border-brand-orange/20 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        <span>{note.date}</span>
                        <span className="text-slate-800">•</span>
                        <Clock className="w-3 h-3" />
                        <span>{note.time}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditNoteTrigger(note)}
                          className="p-2 text-slate-500 hover:text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-300 text-sm font-medium leading-relaxed break-words">{note.text}</p>
                    
                    {note.image && (
                      <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-lg">
                        <img src={note.image} alt="Nota" className="w-full h-32 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}

                    {note.link && (
                      <a 
                        href={note.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-brand-orange uppercase tracking-wider hover:underline"
                      >
                        <Link2 className="w-3 h-3" />
                        Ver Referência Externa
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* 6. INDICADORES RÁPIDOS DE ESTOQUE (LOW LIMIT COUNTERS & CRUCIAL SHORTAGES ONLY) */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="space-y-0.5 pb-2 border-b border-slate-850">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Indicadores Rápidos de Alertas de Suprimentos</h3>
          <p className="text-xs text-slate-500">O estoque completo está em página própria. Abaixo, apenas alertas críticos do bar:</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          
          <div
            onClick={() => onNavigate('estoque')}
            className="p-3.5 bg-slate-950 hover:bg-slate-800/20 rounded-xl border border-slate-850 cursor-pointer transition-colors"
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Produtos em Falta</span>
            <span className={`text-2xl font-black block mt-1 font-mono ${outOfStockItems.length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
              {outOfStockItems.length}
            </span>
            <span className="text-[9px] text-slate-500 italic mt-0.5 block">Qtd zerada</span>
          </div>

          <div
            onClick={() => onNavigate('estoque')}
            className="p-3.5 bg-slate-950 hover:bg-slate-800/20 rounded-xl border border-slate-850 cursor-pointer transition-colors"
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estoque Crítico / Baixo</span>
            <span className={`text-2xl font-black block mt-1 font-mono ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
              {lowStockItems.length}
            </span>
            <span className="text-[9px] text-slate-500 italic mt-0.5 block">Abaixo do mínimo ideal</span>
          </div>

          <div
            onClick={() => onNavigate('validades')}
            className="p-3.5 bg-slate-950 hover:bg-slate-800/20 rounded-xl border border-slate-850 cursor-pointer transition-colors"
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Próximos do Vencimento</span>
            <span className={`text-2xl font-black block mt-1 font-mono ${expiringWarning.length > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
              {expiringWarning.length}
            </span>
            <span className="text-[9px] text-slate-500 italic mt-0.5 block">Menos de 15 dias</span>
          </div>

          <div
            onClick={() => onNavigate('validades')}
            className="p-3.5 bg-slate-950 hover:bg-slate-800/20 rounded-xl border border-slate-850 cursor-pointer transition-colors"
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Produtos Vencidos</span>
            <span className={`text-2xl font-black block mt-1 font-mono ${expiredItems.length > 0 ? 'text-rose-500 leading-none pb-1 font-extrabold animate-bounce' : 'text-slate-300'}`}>
              {expiredItems.length}
            </span>
            <span className="text-[9px] text-slate-450 text-rose-400 font-bold mt-0.5 block">Descarte necessário!</span>
          </div>

        </div>
      </div>

      {/* 7. AÇÕES RÁPIDAS FIXAS CARD */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Atividades e Atalhos Rápidos Operacionais</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          
          <button
            onClick={workShift.status === 'nao_iniciada' ? onStartShift : onEndShift}
            disabled={workShift.status === 'finalizada'}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5 text-brand-orange" />
            <span>{workShift.status === 'nao_iniciada' ? 'Iniciar Jornada' : 'Finalizar Jornada'}</span>
          </button>

          <button
            onClick={() => { setShowTaskForm(true); const el = document.getElementById('nav-item-dashboard'); el?.scrollIntoView({ behavior: 'smooth' }); }}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5 text-brand-orange" />
            <span>Nova Tarefa</span>
          </button>

          <button
            onClick={() => { const el = document.getElementById('nav-item-dashboard'); el?.scrollIntoView({ behavior: 'smooth' }); }}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 text-brand-orange" />
            <span>Nova Anotação</span>
          </button>

          <button
            onClick={() => { setShowTransForm(true); const el = document.getElementById('nav-item-dashboard'); el?.scrollIntoView({ behavior: 'smooth' }); }}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5 text-brand-orange" />
            <span>Registrar Vale</span>
          </button>

          <button
            onClick={() => { setFbHasError(true); setFbErrorQty(prev => prev + 1); const el = document.getElementById('nav-item-dashboard'); el?.scrollIntoView({ behavior: 'smooth' }); }}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-brand-orange" />
            <span>Registrar Erro Pedido</span>
          </button>

          <button
            onClick={() => onNavigate('movimentacoes')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <TrendingUp className="w-5 h-5 text-brand-orange" />
            <span>Lançar Movimentação</span>
          </button>

          <button
            onClick={() => onNavigate('relatorios')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 hover:border-brand-orange hover:text-white transition-all text-xs font-semibold text-center cursor-pointer flex flex-col items-center justify-center gap-2 col-span-2 md:col-span-2"
          >
            <FileText className="w-5 h-5 text-brand-gold" />
            <span>Compilar Relatório Semanal</span>
          </button>

        </div>
      </div>

      {/* R$ Diária Editor Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scale-up text-xs font-sans">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-orange" />
              <span>Ajustar Valor da Diária</span>
            </h4>
            <p className="text-slate-400">Padrão: R$ 150,00 por dia de trabalho na escala quinzenal do salão.</p>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Novo Valor Monetário (R$)</label>
              <input
                type="number"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-sm p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const r = parseFloat(tempRate);
                  if (!isNaN(r) && r > 0) {
                    onUpdateDailyRate(r);
                    setShowRateModal(false);
                  }
                }}
                className="bg-brand-orange hover:bg-brand-orange/90 text-slate-950 px-5 py-2.5 rounded-xl font-bold cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
