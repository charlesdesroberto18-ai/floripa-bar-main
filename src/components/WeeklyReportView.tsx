import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Send,
  AlertOctagon,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Layers,
  Sparkles,
  Clipboard,
  Trash2,
  Phone,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  HelpCircle,
  FolderHeart,
  Briefcase
} from 'lucide-react';
import { Item, Movement, WorkShift, WeeklyWage, DailyTask, DailyNote, DailyFeedback } from '../types';

interface WeeklyReportViewProps {
  items: Item[];
  movements: Movement[];
  workShift: WorkShift;
  weeklyWage: WeeklyWage;
  dailyTasks: DailyTask[];
  dailyNotes: DailyNote[];
  dailyFeedback: DailyFeedback;
}

type ReportSubTab = 'whatsapp' | 'baixo' | 'falta' | 'validade' | 'movimentacoes' | 'perdas' | 'feedbacks';

export default function WeeklyReportView({
  items,
  movements,
  workShift,
  weeklyWage,
  dailyTasks,
  dailyNotes,
  dailyFeedback,
}: WeeklyReportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('whatsapp');
  const [copied, setCopied] = useState(false);

  // Stats Calculations
  const outOfStock = items.filter((item) => item.quantity === 0);
  const lowStock = items.filter((item) => item.quantity > 0 && item.quantity <= item.minQuantity);
  
  // Expiration limits
  const today = new Date();
  const listExpired = items.filter((item) => {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate).getTime() < today.getTime();
  });
  const listExpiringSoon = items.filter((item) => {
    if (!item.expiryDate) return false;
    const diff = new Date(item.expiryDate).getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 15;
  });

  // Finance metrics
  const totalDaysWorked = weeklyWage.selectedDays.length;
  const grossWages = totalDaysWorked * weeklyWage.dailyRate;
  const valesTotal = weeklyWage.transactions
    .filter((t) => t.type === 'vale')
    .reduce((sum, t) => sum + t.amount, 0);
  const discountsTotal = weeklyWage.transactions
    .filter((t) => t.type === 'desconto')
    .reduce((sum, t) => sum + t.amount, 0);
  const netEarnings = grossWages - valesTotal - discountsTotal;

  // Losses metrics (Subtypes: Avaria/Quebra, Perda por Vencimento, Descarte)
  const lossMovements = movements.filter((m) => {
    const sub = m.subtype?.toLowerCase();
    const n = m.notes?.toLowerCase() || '';
    return (
      m.quantityChange < 0 &&
      (sub === 'avaria/quebra' ||
        sub === 'perda por vencimento' ||
        sub === 'descarte' ||
        n.includes('avaria') ||
        n.includes('quebra') ||
        n.includes('vencido') ||
        n.includes('descarte'))
    );
  });

  // Calculate estimated loss costs (using item.unitValue * lost quantity)
  const totalFinancialLoss = lossMovements.reduce((sum, m) => {
    const matchedItem = items.find((i) => i.id === m.itemId);
    const cost = matchedItem?.unitValue || 0;
    return sum + Math.abs(m.quantityChange) * cost;
  }, 0);

  // Generate dynamic recommendation items list
  const recommendations = [...outOfStock, ...lowStock].map((item) => {
    const idealBuy = Math.ceil(Math.max(item.minQuantity * 1.5 - item.quantity, item.minQuantity + 5 - item.quantity));
    const estimatedCost = idealBuy * (item.unitValue || 0);
    return {
      name: item.name,
      amountToBuy: idealBuy,
      unit: item.unit,
      supplier: item.supplier,
      unitValue: item.unitValue || 0,
      estimatedCost,
    };
  });

  const totalEstimatedPurchaseCost = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0);

  // Format shift elapsed hours
  const formatSecsToHm = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Compile Comprehensive WhatsApp Message Content
  const generateWhatsAppMessage = () => {
    let msg = `🌊 *RELATÓRIO OPERACIONAL - A MARÉ* 🌊\n`;
    msg += `📅 _Relatório consolidado para Gerência e Finanças_\n`;
    msg += `══════════════════════════════\n\n`;

    msg += `👤 *1. JORNADA E FINANCEIRO DO GARÇOM*\n`;
    msg += `• Operador: ${workShift.status === 'nao_iniciada' ? 'Sem operador ativo' : 'Aberto por operador local'}\n`;
    msg += `• Jornada de hoje: ${formatSecsToHm(workShift.elapsedSeconds)} trabalhado\n`;
    msg += `• Escala Semanal: ${totalDaysWorked} dias trabalhados nesta escala\n`;
    msg += `• Salário Diárias Bruto: R$ ${grossWages.toFixed(2)} (Ref: R$ ${weeklyWage.dailyRate.toFixed(2)}/diária)\n`;
    msg += `• Vales/Adiantamentos: R$ ${valesTotal.toFixed(2)}\n`;
    msg += `• Descontos regist.: R$ ${discountsTotal.toFixed(2)}\n`;
    msg += `• *SALDO LÍQUIDO A RECEBER: R$ ${netEarnings.toFixed(2)}*\n\n`;

    msg += `❌ *2. SUPRIMENTOS EM FALTA (URGENTE)*\n`;
    if (outOfStock.length === 0) {
      msg += `✓ Nenhum item zerado! Abastecimento OK.\n`;
    } else {
      outOfStock.forEach((item) => {
        msg += `• ${item.name} | Forn: ${item.supplier}\n`;
      });
    }
    msg += `\n`;

    msg += `⚠️ *3. ALERTAS DE ESTOQUE BAIXO*\n`;
    if (lowStock.length === 0) {
      msg += `✓ Nenhum item abaixo do nível de segurança.\n`;
    } else {
      lowStock.forEach((item) => {
        msg += `• ${item.name} (${item.quantity} restando | Mín ideal: ${item.minQuantity} ${item.unit})\n`;
      });
    }
    msg += `\n`;

    msg += `📋 *4. CONTROLE DE TAREFAS OPERACIONAIS*\n`;
    const doneTasks = dailyTasks.filter(t => t.status === 'Concluída');
    msg += `• Progresso geral: ${doneTasks.length} de ${dailyTasks.length} tarefas concluídas\n`;
    if (dailyTasks.length > 0) {
      dailyTasks.forEach((t) => {
        const checkChar = t.status === 'Concluída' ? '✓' : '✗';
        msg += ` [${checkChar}] ${t.title} (${t.dueTime})\n`;
      });
    } else {
      msg += `• Nenhuma tarefa cadastrada para o turno de hoje.\n`;
    }
    msg += `\n`;

    msg += `📢 *5. ANOTAÇÕES OPERACIONAIS DO SALÃO*\n`;
    if (dailyNotes.length > 0) {
      dailyNotes.forEach((n) => {
        msg += `• "${n.text}" (${n.time})\n`;
      });
    } else {
      msg += `• Sem anotações ou ocorrências registradas hoje.\n`;
    }
    msg += `\n`;

    msg += `🌟 *6. FEEDBACK DO DIA E ERROS OPERACIONAIS*\n`;
    msg += `• Erros de pedidos registrados: ${dailyFeedback.hasError ? `${dailyFeedback.errorQty} erros` : 'Nenhum erro registrado!'}\n`;
    if (dailyFeedback.hasError && dailyFeedback.errorDescription) {
      msg += `  Detalhamento: ${dailyFeedback.errorDescription}\n`;
    }
    if (dailyFeedback.whatWentPerfect) {
      msg += `• Acertos: ${dailyFeedback.whatWentPerfect}\n`;
    }
    if (dailyFeedback.whatToImprove) {
      msg += `• Melhorias p/ amanhã: ${dailyFeedback.whatToImprove}\n`;
    }
    if (dailyFeedback.suggestions) {
      msg += `• Sugestões à gestão: ${dailyFeedback.suggestions}\n`;
    }
    msg += `\n`;

    msg += `══════════════════════════════\n`;
    msg += `_Compilado via A Maré POS Smart Console_ 🌊🤙`;
    return msg;
  };

  const messageText = generateWhatsAppMessage();

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-16 lg:pb-0 font-sans text-xs text-slate-300">
      
      {/* Upper header section */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5.5 h-5.5 text-brand-orange" />
            <span>CENTRAL RECURSIVA DE RELATÓRIOS</span>
          </h2>
          <p className="text-xs text-slate-400">Consulte relatórios semanais de desperdícios, equipe, validades e sugestões rápidas de compras</p>
        </div>

        {/* Action Triggers for quick Whatsapp sharing of standard reports */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-200 rounded-xl font-bold border border-slate-800 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-orange" />
                <span className="text-brand-orange font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar WhatsApp</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-orange to-brand-gold text-slate-950 rounded-xl font-black transition-all cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Enviar para o Patrão</span>
          </button>
        </div>
      </div>

      {/* Main SubTab switcher rails */}
      <div className="flex flex-wrap border-b border-slate-800 text-[10.5px] items-center gap-1.5 overflow-x-auto pb-1.5">
        <button
          onClick={() => setActiveSubTab('whatsapp')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'whatsapp' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          📱 1. Relatório WhatsApp
        </button>
        <button
          onClick={() => setActiveSubTab('baixo')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'baixo' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          ⚠️ 2. Estoque Baixo ({lowStock.length})
        </button>
        <button
          onClick={() => setActiveSubTab('falta')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'falta' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          ❌ 3. Itens em Falta ({outOfStock.length})
        </button>
        <button
          onClick={() => setActiveSubTab('validade')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer relative ${
            activeSubTab === 'validade' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          📅 4. Validades ({listExpired.length + listExpiringSoon.length})
        </button>
        <button
          onClick={() => setActiveSubTab('movimentacoes')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'movimentacoes' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          🔄 5. Movimentações
        </button>
        <button
          onClick={() => setActiveSubTab('perdas')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'perdas' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          💸 6. Controle Perdas/Quebra
        </button>
        <button
          onClick={() => setActiveSubTab('feedbacks')}
          className={`px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeSubTab === 'feedbacks' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          👥 7. Feedbacks Equipe
        </button>
      </div>

      {/* Render subtabs content matching each requested index */}
      
      {/* Subtab 1: WHATSAPP COMPILED REPORT */}
      {activeSubTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <span className="font-bold text-white text-sm">Visualização do Texto Formatado</span>
              <span className="text-[10px] text-slate-500 font-mono">Pronto para Envio</span>
            </div>

            {/* Simulated telephone / text box displaying the WhatsApp report to copy */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono leading-relaxed select-all whitespace-pre-wrap max-h-[500px] overflow-y-auto text-slate-300">
              {messageText}
            </div>

            <div className="flex items-center gap-3 bg-brand-orange/5 border border-brand-orange/10 rounded-xl p-3.5">
              <HelpCircle className="w-5 h-5 text-brand-orange shrink-0" />
              <p className="text-[11px] text-slate-400">
                Pressione <strong className="text-slate-300">"Copiar WhatsApp"</strong> no topo para copiar o texto com formatação do WhatsApp para sua área de transferência, para ser enviado em grupos de compras e gerenciamento da equipe do A Maré.
              </p>
            </div>
          </div>

          {/* Quick Metrics Aside panel */}
          <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Apreciação Rápida de Custos</h4>
            <div className="space-y-3 font-sans">
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">Investimento Recompra Recomendado</span>
                <p className="text-xl font-black text-brand-orange mt-1">R$ {totalEstimatedPurchaseCost.toFixed(2)}</p>
                <p className="text-[9px] text-slate-550 mt-0.5 mt-1 text-slate-500">{recommendations.length} insumos requerem atenção</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">Perdas Operacionais Registradas</span>
                <p className="text-xl font-black text-rose-450 text-rose-400 mt-1">R$ {totalFinancialLoss.toFixed(2)}</p>
                <p className="text-[9px] text-slate-500 mt-1">{lossMovements.length} ocorrências de avaria/descarte</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-[9.5px] text-slate-500 uppercase font-bold">Eficiência do Expediente</span>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {dailyFeedback.hasError ? '92%' : '100%'}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">Atendimento de metas e pedidos em sala</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: LOW STOCK & RECOMMENDATIONS */}
      {activeSubTab === 'baixo' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
          <div className="space-y-0.5 pb-2 border-b border-slate-850">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShoppingCart className="w-5 h-5 text-brand-orange" />
              <span>Itens com Estoque Baixo e Planejamento de Compra</span>
            </h3>
            <p className="text-xs text-slate-400">Sugestões de reposição baseadas no delta ideal em relação ao inventário mínimo de segurança</p>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">✓ Todos os níveis de estoque estão perfeitamente atendidos. Reposição não requerida!</div>
          ) : (
            <div className="overflow-x-auto text-xs font-sans">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Item Operacional</th>
                    <th className="py-3 px-4">Quantidade a Comprar</th>
                    <th className="py-3 px-4">Fornecedor do Lote</th>
                    <th className="py-3 px-4">Preço Unitário</th>
                    <th className="py-3 px-4 text-right">Custo Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recommendations.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40">
                      <td className="py-3.5 px-4 font-bold text-slate-200">{rec.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-orange text-sm">+{rec.amountToBuy}</span> <span className="text-[10px] text-slate-500">{rec.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-400">{rec.supplier}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-450">R$ {rec.unitValue.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">R$ {rec.estimatedCost.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950/80 font-black border-t border-slate-800 text-xs">
                    <td colSpan={4} className="py-4 px-4 text-slate-400 text-right">TOTAL INVSTIMENTO ESTIMADO REPOSIÇÃO:</td>
                    <td className="py-4 px-4 text-right font-mono text-brand-orange text-sm">R$ {totalEstimatedPurchaseCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: OUT OF STOCK SHORTAGES */}
      {activeSubTab === 'falta' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
          <div className="space-y-0.5 pb-2 border-b border-slate-850">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <AlertOctagon className="w-5 h-5 text-rose-500 animate-pulse" />
              <span>Itens em Falta Crítica (Quantidade 0)</span>
            </h3>
            <p className="text-xs text-slate-400">Produtos que estão totalmente ausentes. Providenciar reposição com máxima urgência</p>
          </div>

          {outOfStock.length === 0 ? (
            <div className="p-8 text-center text-[#10b981] font-bold italic flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Maravilhoso! Nenhum produto do Floripa Bar está com estoque zerado no momento.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
              {outOfStock.map((item) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Local: {item.storageLocation || 'Não definido'}</span>
                    <h4 className="font-extrabold text-white text-sm">{item.name}</h4>
                    <p className="text-slate-450 text-[11px]">Fornecedor Principal: <strong className="text-slate-350">{item.supplier}</strong></p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-[10px]">
                    <span className="text-amber-500 font-bold">Estoque de Segurança Recomendado: {item.minQuantity} {item.unit}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black uppercase">Falta Urgente</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: ALERT DE VALIDADES */}
      {activeSubTab === 'validade' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
          <div className="space-y-0.5 pb-2 border-b border-slate-850">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-brand-orange" />
              <span>Relatório Detalhado de Validades e Vencimentos</span>
            </h3>
            <p className="text-xs text-slate-400">Monitor de lotes que necessitam ser consumidos rapidamente ou descartados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left expired panel */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <h4 className="font-bold text-rose-450 text-rose-400 flex items-center gap-1.5 pb-1.5 border-b border-slate-900">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>Lotes Vencidos ({listExpired.length})</span>
              </h4>
              {listExpired.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-4">Sem itens vencidos pendentes de descarte no estoque.</p>
              ) : (
                <div className="space-y-2">
                  {listExpired.map((i) => (
                    <div key={i.id} className="p-2.5 bg-rose-500/[0.02] border border-rose-500/20 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-200">{i.name}</p>
                        <p className="text-[10px] text-slate-500">Expira em: <strong className="text-rose-400 font-mono">{i.expiryDate}</strong></p>
                      </div>
                      <span className="font-mono text-slate-350 font-bold">{i.quantity} {i.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right panel: expiring soon within 15 days */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <h4 className="font-bold text-amber-450 text-amber-400 flex items-center gap-1.5 pb-1.5 border-b border-slate-900">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Próximos do Vencimento (&lt; 15 dias) ({listExpiringSoon.length})</span>
              </h4>
              {listExpiringSoon.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-4">Sem itens de validade curta no armazém por hoje.</p>
              ) : (
                <div className="space-y-2">
                  {listExpiringSoon.map((i) => {
                    const expiry = new Date(i.expiryDate || '');
                    const dDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={i.id} className="p-2.5 bg-amber-500/[0.01] border border-amber-500/10 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-200">{i.name}</p>
                          <p className="text-[10px] text-slate-500">Vence em <strong className="text-amber-550 text-amber-400">{dDiff} dias</strong> ({i.expiryDate})</p>
                        </div>
                        <span className="font-mono text-slate-350 font-bold">{i.quantity} {i.unit}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Subtab 5: COMPLETE ACTIONS HISTORIC LOG */}
      {activeSubTab === 'movimentacoes' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4">
          <div className="space-y-0.5 pb-2 border-b border-slate-850">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
              <span>Inventário Histórico Consolidado</span>
            </h3>
            <p className="text-xs text-slate-400">Completo log de auditoria fiscal e conformidade de compras do Floripa Bar</p>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {movements.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Sem registros históricos disponíveis para listagem.</p>
            ) : (
              movements.map((move) => (
                <div key={move.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                        move.type === 'Entrada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 text-rose-400 border-rose-500/20'
                      }`}>
                        {move.subtype || move.type}
                      </span>
                      <span className="font-bold text-slate-200">{move.productName}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Lançado por: {move.responsible} • {move.date ? new Date(move.date).toLocaleDateString('pt-BR') : ''}</p>
                    {move.notes && <p className="text-[10px] text-slate-400 italic">"Obs: {move.notes}"</p>}
                  </div>
                  <span className={`font-mono font-bold text-sm shrink-0 self-end sm:self-center ${move.quantityChange < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {move.quantityChange > 0 ? '+' : ''}{move.quantityChange}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subtab 6: EXCLUSIVE MANAGER FINANCIAL WASTE/LOSS LEDGER */}
      {activeSubTab === 'perdas' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 font-sans text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-850 gap-2">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-rose-500" />
                <span>Auditoria de Desperdícios, Quebras e Perdas</span>
              </h3>
              <p className="text-xs text-slate-400">Total acumulado de perdas financeiras na operação do bar</p>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2 text-rose-400 font-bold font-mono text-center shrink-0">
              Custo Desperdício Total: R$ {totalFinancialLoss.toFixed(2)}
            </div>
          </div>

          {lossMovements.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">✓ Parabéns! Sem registro de descarte, quebra ou perda vencida no sistema de hoje.</div>
          ) : (
            <div className="space-y-2.5">
              {lossMovements.map((m) => {
                const targetItem = items.find((i) => i.id === m.itemId);
                const uVal = targetItem?.unitValue || 0;
                const lossVal = Math.abs(m.quantityChange) * uVal;

                return (
                  <div key={m.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-855 border-slate-850 flex items-center justify-between gap-3 text-xs text-slate-300">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-rose-500/15 text-rose-400 uppercase tracking-wider">{m.subtype || 'Descarte'}</span>
                        <h5 className="font-extrabold text-white text-xs">{m.productName}</h5>
                      </div>
                      <p className="text-[10px] text-slate-500">Operador: {m.responsible} | Motivo: <span className="italic">"{m.notes}"</span></p>
                      <p className="text-[10px] text-slate-500">Data ocorrida: {m.date ? new Date(m.date).toLocaleDateString('pt-BR') : ''}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-rose-400">-{Math.abs(m.quantityChange)} {targetItem?.unit || 'unidade(s)'}</p>
                      <p className="text-[10.5px] font-mono text-slate-500 font-bold mt-0.5">Prejuízo: R$ {lossVal.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subtab 7: QUALITATIVE GENERAL WAITER FEEDBACK COMPILATION */}
      {activeSubTab === 'feedbacks' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 font-sans text-xs">
          <div className="space-y-0.5 pb-2 border-b border-slate-850">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Award className="w-5 h-5 text-brand-gold" />
              <span>Consolidado de Feedbacks do Salão e Operações</span>
            </h3>
            <p className="text-xs text-slate-400">Anotações qualitativas gravadas pelo garçom de fechamento</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* General daily feedback comments summary */}
            <div className="md:col-span-8 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
              <div className="border-b border-slate-900 pb-2">
                <span className="font-bold text-slate-300">Avaliações de Turno Salvas</span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">O que deu certo:</span>
                  <p className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-lg text-slate-350 italic mt-1 font-medium text-slate-300">
                    {dailyFeedback.whatWentPerfect ? `"${dailyFeedback.whatWentPerfect}"` : 'Sem comentários qualitativos registrados hoje.'}
                  </p>
                </div>

                <div>
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">O que melhorar amanhã:</span>
                  <p className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-lg text-slate-350 italic mt-1 font-medium text-slate-300">
                    {dailyFeedback.whatToImprove ? `"${dailyFeedback.whatToImprove}"` : 'Sem anotações de melhoria de escala anotadas.'}
                  </p>
                </div>

                <div>
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Sugestões e Pedidos para o Patrão:</span>
                  <p className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-lg text-slate-350 italic mt-1 font-medium text-slate-350">
                    {dailyFeedback.suggestions ? `"${dailyFeedback.suggestions}"` : 'Nenhuma sugestão registrada.'}
                  </p>
                </div>
              </div>
            </div>

            {/* In-turn Order Mistakes index stats */}
            <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-300 block pb-2 border-b border-slate-900">Métricas de Qualidade</span>
                <div className="py-4 text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Índice Erros de Pedido:</span>
                  <span className={`text-4xl font-black block mt-2 ${dailyFeedback.hasError ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {dailyFeedback.hasError ? `${dailyFeedback.errorQty} erro(s)` : '0 Erros! ✓'}
                  </span>
                </div>
              </div>

              {dailyFeedback.hasError && dailyFeedback.errorDescription && (
                <div className="bg-slate-900 p-2.5 rounded border border-slate-805 text-[10.5px] text-slate-400">
                  <span className="font-bold text-rose-400 block mb-0.5">Defeito ocorrido:</span>
                  <p className="italic">"{dailyFeedback.errorDescription}"</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
