import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Home,
  DollarSign,
  Bell,
  RefreshCw,
  Clock,
  Sparkles,
  HelpCircle,
  Lock,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { UserSession } from './LoginScreen';
import { WeeklyWage, WorkShift } from '../types';

interface ConfiguracoesViewProps {
  activeUser: UserSession;
  onUpdateUserDetails: (name: string, title: string) => void;
  weeklyWage: WeeklyWage;
  onUpdateDailyRate: (rate: number) => void;
  onUpdateSelectedDays: (days: string[]) => void;
  onResetData: () => void;
  workShift: WorkShift;
}

export default function ConfiguracoesView({
  activeUser,
  onUpdateUserDetails,
  weeklyWage,
  onUpdateDailyRate,
  onUpdateSelectedDays,
  onResetData,
  workShift,
}: ConfiguracoesViewProps) {
  // Local Form states
  const [userName, setUserName] = useState(activeUser.name);
  const [userTitle, setUserTitle] = useState(activeUser.title);
  
  const [establishmentName, setEstablishmentName] = useState('A Maré');
  const [dailyRate, setDailyRate] = useState(weeklyWage.dailyRate.toString());
  
  // Alert checkboxes
  const [alertsExpiry, setAlertsExpiry] = useState(true);
  const [alertsZeroStock, setAlertsZeroStock] = useState(true);
  const [alertsSound, setAlertsSound] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    // Update user details
    if (userName.trim() && userTitle.trim()) {
      onUpdateUserDetails(userName.trim(), userTitle.trim());
    }

    // Update default rate
    const parsedRate = parseFloat(dailyRate);
    if (!isNaN(parsedRate) && parsedRate > 0) {
      onUpdateDailyRate(parsedRate);
    }

    // Handle password change (local only for this demo)
    if (newPassword && newPassword === confirmPassword) {
      localStorage.setItem('floripa_local_password', newPassword);
      setPasswordChangeSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleResetSystemData = () => {
    onResetData();
    setShowConfirmReset(false);
    alert('✓ Banco de dados do A Maré redefinido para o padrão original de fábrica!');
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-16 font-sans text-xs text-slate-300">
      
      {/* Header */}
      <div className="border-b border-slate-805 pb-4 mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-orange" />
          <span>Configurações do Terminal POS</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Customize parâmetros de diária, dados operacionais e redefinições de segurança</p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] p-3.5 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>✓ Configurações do Floripa Bar atualizadas com sucesso no dispositivo!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Section 1: User Account */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <User className="w-4 h-4 text-brand-orange" />
            <span>Perfil do Operador do Turno</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Usuário *</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cargo / Atividade *</label>
              <select
                value={userTitle}
                onChange={(e) => setUserTitle(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none font-semibold"
              >
                <option value="Garçom">Garçom</option>
                <option value="Gerente Operacional">Gerente Operacional</option>
                <option value="Barman Principal">Barman Principal</option>
                <option value="Administrador do Caixa">Administrador do Caixa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Password Security */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <Lock className="w-4 h-4 text-brand-orange" />
            <span>Segurança e Senha de Acesso</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mudar senha do terminal"
                className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
              />
            </div>
          </div>

          {passwordChangeSuccess && (
            <p className="text-[10px] text-emerald-500 font-bold animate-fade-in">✓ Senha local alterada com sucesso!</p>
          )}
          
          <p className="text-[10px] text-slate-500 block">
            Dica: A senha padrão inicial é <strong className="text-slate-400">0000</strong>. Ao alterar aqui, a nova senha será exigida no próximo login do usuário <strong className="text-slate-400">0000</strong>.
          </p>
        </div>

        {/* Section 2: Establishment info */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <Home className="w-4 h-4 text-brand-orange" />
            <span>Identificação do Estabelecimento</span>
          </h3>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nome Fantasia do Floripa Bar *</label>
            <input
              type="text"
              value={establishmentName}
              onChange={(e) => setEstablishmentName(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Section 3: Finance Ledger configurations */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <DollarSign className="w-4 h-4 text-brand-orange" />
            <span>Parâmetros Financeiros e Escala</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Valor Base da Diária (R$) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500 block">Padrão nacional do bar: R$ 150,00 por escala realizada de 8 horas.</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Escala Semanal Ordinária:</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1 text-[10.5px]">
                <p>Dias trabalhados ativos na semana em curso:</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {weeklyWage.workedDays.map((dia) => {
                    const isSel = weeklyWage.selectedDays.includes(dia);
                    return (
                      <span
                        key={dia}
                        className={`px-2 py-0.5 rounded font-black text-[9px] border ${
                          isSel ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' : 'bg-slate-900 border-slate-850 text-slate-500'
                        }`}
                      >
                        {dia.split('-')[0]}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Alerts configuration */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-805 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <Bell className="w-4 h-4 text-brand-orange" />
            <span>Configurações Estilo Alertas do Sistema</span>
          </h3>

          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between p-2 hover:bg-slate-950/20 rounded">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200 block text-xs">Ativar alertas de vencimento curta</span>
                <span className="text-[10px] text-slate-500">Notificar quando restante do lote expirar em menos de 15 dias</span>
              </div>
              <input
                type="checkbox"
                checked={alertsExpiry}
                onChange={() => setAlertsExpiry(!alertsExpiry)}
                className="w-4 h-4 text-brand-orange bg-slate-950 border-slate-800 rounded focus:ring-brand-orange shrink-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 hover:bg-slate-950/20 rounded">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200 block text-xs">Ativar indicador de Falta Absoluta</span>
                <span className="text-[10px] text-slate-500">Disparar alarme visual se o estoque de algum item zerar</span>
              </div>
              <input
                type="checkbox"
                checked={alertsZeroStock}
                onChange={() => setAlertsZeroStock(!alertsZeroStock)}
                className="w-4 h-4 text-brand-orange bg-slate-950 border-slate-800 rounded focus:ring-brand-orange shrink-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 hover:bg-slate-950/20 rounded">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200 block text-xs">Sons e micro-efeitos sonoros</span>
                <span className="text-[10px] text-slate-500">Tocar bipe simulado ao registrar ajuste (+ / -) e scan de bar</span>
              </div>
              <input
                type="checkbox"
                checked={alertsSound}
                onChange={() => setAlertsSound(!alertsSound)}
                className="w-4 h-4 text-brand-orange bg-slate-950 border-slate-800 rounded focus:ring-brand-orange shrink-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center justify-between pt-2">
          
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1.5 text-xs text-rose-455 text-rose-400 py-2.5 px-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Redefinir Dados Floripa</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-orange to-brand-gold text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Clock className="w-4 h-4 stroke-[3]" />
            <span>Salvar Configurações</span>
          </button>

        </div>

      </form>

      {/* Dangerous Reset warning confirmation modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scale-up text-xs font-sans">
            <h4 className="text-base font-black text-rose-500 flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500 animate-bounce" />
              <span>Aviso de Perigo: Redefinição</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Você está prestes a apagar permanentemente todas as suas tarefas concluídas, vales de dinheiro cadastrados, anotações e contagens de produtos. <strong className="text-white">Isso retornará o POS do Floripa Bar aos padrões de fábrica!</strong>
            </p>
            
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSystemData}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                APAGAR TUDO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
