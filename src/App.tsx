import React, { useState, useEffect, useRef } from 'react';
import { Item, Movement, TabId, WorkShift, WeeklyWage, DailyTask, DailyNote, DailyFeedback, TaskStatus, WageTransaction } from './types';
import { INITIAL_ITEMS, INITIAL_MOVEMENTS } from './initialData';
import { supabase } from './lib/supabase';

// Modular Components
import Header from './components/Header';
import Navigation from './components/Navigation';
import DashboardView from './components/DashboardView';
import StockView from './components/StockView';
import ItemFormModal from './components/ItemFormModal';
import MovementsView from './components/MovementsView';
import ValidadesView from './components/ValidadesView';
import WeeklyReportView from './components/WeeklyReportView';
import ConfiguracoesView from './components/ConfiguracoesView';
import AdminPanelView from './components/AdminPanelView';
import LoginScreen, { UserSession } from './components/LoginScreen';

export default function App() {
  // Authentication State
  const [activeUser, setActiveUser] = useState<UserSession | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Core Data States
  const [items, setItems] = useState<Item[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lastSyncStr, setLastSyncStr] = useState('');

  // Operational States
  const [workShift, setWorkShift] = useState<WorkShift>({
    status: 'nao_iniciada',
    startTime: null,
    endTime: null,
    totalWorkedMinutes: 0,
    elapsedSeconds: 0,
  });

  const [weeklyWage, setWeeklyWage] = useState<WeeklyWage>({
    dailyRate: 150,
    workedDays: ['Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
    selectedDays: ['Quarta-feira', 'Quinta-feira'],
    transactions: [],
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);

  // Editing state overlay
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  // shift background timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Handle Supabase Auth State
  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setActiveUser({
          name: session.user.user_metadata?.full_name || 'Administrador',
          role: 'admin',
          avatarColor: 'bg-indigo-600 border-indigo-500/40',
          title: 'Administrador do Sistema',
          email: session.user.email,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setActiveUser({
          name: session.user.user_metadata?.full_name || 'Administrador',
          role: 'admin',
          avatarColor: 'bg-indigo-600 border-indigo-500/40',
          title: 'Administrador do Sistema',
          email: session.user.email,
        });
      } else {
        // If it was a PIN user, we don't clear it here, unless we want to force logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Core Data (Supabase or LocalStorage)
  useEffect(() => {
    const loadData = async () => {
      if (activeUser?.role === 'admin') {
        // Fetch from Supabase
        try {
          const { data: itemsData } = await supabase.from('items').select('*').order('name');
          const { data: movementsData } = await supabase.from('movements').select('*').order('date', { ascending: false });
          
          if (itemsData) setItems(itemsData);
          if (movementsData) setMovements(movementsData);
          setLastSyncStr(new Date().toLocaleTimeString('pt-BR'));
        } catch (error) {
          console.error('Erro ao carregar dados do Supabase:', error);
        }
      } else {
        // Fetch from LocalStorage
        const storedItems = localStorage.getItem('floripa_items');
        const storedMovements = localStorage.getItem('floripa_movements');
        const storedSync = localStorage.getItem('floripa_last_sync');
        const storedUser = localStorage.getItem('floripa_active_user');

        if (storedUser && !activeUser) {
          try { setActiveUser(JSON.parse(storedUser)); } catch (e) {}
        }

        if (storedItems && storedMovements) {
          setItems(JSON.parse(storedItems));
          setMovements(JSON.parse(storedMovements));
          setLastSyncStr(storedSync || new Date().toLocaleTimeString('pt-BR'));
        } else {
          setItems(INITIAL_ITEMS);
          setMovements(INITIAL_MOVEMENTS);
          const initialTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          setLastSyncStr(initialTimeStr);
          localStorage.setItem('floripa_items', JSON.stringify(INITIAL_ITEMS));
          localStorage.setItem('floripa_movements', JSON.stringify(INITIAL_MOVEMENTS));
          localStorage.setItem('floripa_last_sync', initialTimeStr);
        }
      }
    };

    loadData();

    // Operational state restoration
    const storedShift = localStorage.getItem('floripa_work_shift');
    const storedWage = localStorage.getItem('floripa_weekly_wage');
    const storedTasks = localStorage.getItem('floripa_daily_tasks');
    const storedNotes = localStorage.getItem('floripa_daily_notes');

    if (storedShift) { try { setWorkShift(JSON.parse(storedShift)); } catch (e) {} }
    if (storedWage) { try { setWeeklyWage(JSON.parse(storedWage)); } catch (e) {} }
    if (storedTasks) { try { setDailyTasks(JSON.parse(storedTasks)); } catch (e) {} }
    if (storedNotes) { try { setDailyNotes(JSON.parse(storedNotes)); } catch (e) {} }
  }, [activeUser?.role]);

  // Chronometer count handler for work shift
  useEffect(() => {
    if (workShift.status === 'em_andamento') {
      timerRef.current = setInterval(() => {
        setWorkShift((prev) => {
          const next = {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1,
            totalWorkedMinutes: Math.floor((prev.elapsedSeconds + 1) / 60),
          };
          localStorage.setItem('floripa_work_shift', JSON.stringify(next));
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [workShift.status]);

  // Sync to localStorage / Supabase Helper
  const syncData = async (updatedItems: Item[], updatedMovements: Movement[]) => {
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setItems(updatedItems);
    setMovements(updatedMovements);
    setLastSyncStr(timeStr);

    if (activeUser?.role === 'admin') {
      // In a real app, we'd do individual CRUD operations, 
      // but for this prototype integration we'll just handle local state.
      // CRUD functions will handle Supabase directly.
    } else {
      localStorage.setItem('floripa_items', JSON.stringify(updatedItems));
      localStorage.setItem('floripa_movements', JSON.stringify(updatedMovements));
      localStorage.setItem('floripa_last_sync', timeStr);
    }
  };

  const handleLogin = (session: UserSession) => {
    setActiveUser(session);
    if (session.role !== 'admin') {
      localStorage.setItem('floripa_active_user', JSON.stringify(session));
    }
  };

  const handleLogout = async () => {
    if (activeUser?.role === 'admin') {
      await supabase.auth.signOut();
    }
    setActiveUser(null);
    localStorage.removeItem('floripa_active_user');
  };

  const handleUpdateUserDetails = (name: string, title: string) => {
    if (activeUser) {
      const nextUser = { ...activeUser, name, title };
      setActiveUser(nextUser);
      if (activeUser.role !== 'admin') {
        localStorage.setItem('floripa_active_user', JSON.stringify(nextUser));
      }
    }
  };

  // Reset Callback
  const handleResetData = () => {
    syncData(INITIAL_ITEMS, INITIAL_MOVEMENTS);
    
    const initialShift: WorkShift = { status: 'nao_iniciada', startTime: null, endTime: null, totalWorkedMinutes: 0, elapsedSeconds: 0 };
    const initialWage: WeeklyWage = {
      dailyRate: 150,
      workedDays: ['Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
      selectedDays: ['Quarta-feira', 'Quinta-feira'],
      transactions: [],
    };

    setWorkShift(initialShift);
    setWeeklyWage(initialWage);
    setDailyTasks([]);
    setDailyNotes([]);

    localStorage.setItem('floripa_work_shift', JSON.stringify(initialShift));
    localStorage.setItem('floripa_weekly_wage', JSON.stringify(initialWage));
    localStorage.setItem('floripa_daily_tasks', JSON.stringify([]));
    localStorage.setItem('floripa_daily_notes', JSON.stringify([]));

    setActiveTab('dashboard');
  };

  const handleClearHistory = () => {
    syncData(items, []);
  };

  // CRUD Operations
  const handleSaveItem = async (itemData: Omit<Item, 'id' | 'lastUpdated'> & { id?: string }) => {
    const nowIso = new Date().toISOString();
    
    if (activeUser?.role === 'admin') {
      if (itemData.id) {
        const { error } = await supabase.from('items').update({ ...itemData, lastUpdated: nowIso }).eq('id', itemData.id);
        if (error) console.error(error);
      } else {
        const { error } = await supabase.from('items').insert([{ ...itemData, lastUpdated: nowIso }]);
        if (error) console.error(error);
      }
      // Reload from Supabase
      const { data } = await supabase.from('items').select('*').order('name');
      if (data) setItems(data);
      setItemToEdit(null);
    } else {
      // Local storage implementation (existing)
      let updatedItems: Item[];
      if (itemData.id) {
        updatedItems = items.map((i) => i.id === itemData.id ? { ...i, ...itemData, lastUpdated: nowIso } : i);
        syncData(updatedItems, movements);
        setItemToEdit(null);
      } else {
        const newItem: Item = { ...itemData, id: 'item-' + Math.random().toString(36).substr(2, 9), lastUpdated: nowIso } as Item;
        updatedItems = [newItem, ...items];
        syncData(updatedItems, movements);
        setActiveTab('estoque');
      }
    }
  };

  const handleUpdateProductQuantity = async (id: string, newQty: number) => {
    const nowIso = new Date().toISOString();
    if (activeUser?.role === 'admin') {
      await supabase.from('items').update({ quantity: newQty, lastUpdated: nowIso }).eq('id', id);
      const { data } = await supabase.from('items').select('*').order('name');
      if (data) setItems(data);
    } else {
      const updated = items.map((i) => i.id === id ? { ...i, quantity: newQty, lastUpdated: nowIso } : i);
      syncData(updated, movements);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (activeUser?.role === 'admin') {
      await supabase.from('items').delete().eq('id', itemId);
      const { data } = await supabase.from('items').select('*').order('name');
      if (data) setItems(data);
    } else {
      const updatedItems = items.filter((i) => i.id !== itemId);
      const updatedMovements = movements.filter((m) => m.itemId !== itemId);
      syncData(updatedItems, updatedMovements);
    }
  };

  const handleAddNewMovement = async (movementData: Omit<Movement, 'id' | 'date'> & { date?: string }) => {
    const nowIso = movementData.date || new Date().toISOString();
    if (activeUser?.role === 'admin') {
      const { error } = await supabase.from('movements').insert([{ ...movementData, date: nowIso }]);
      if (error) console.error(error);
      const { data } = await supabase.from('movements').select('*').order('date', { ascending: false });
      if (data) setMovements(data);
    } else {
      const newMove: Movement = { ...movementData, id: 'm-' + Math.random().toString(36).substr(2, 9), date: nowIso };
      syncData(items, [newMove, ...movements]);
    }
  };

  const handleQuickQuantityAdjustment = async (itemId: string, change: number, notesStr: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;
    const newQty = Math.max(0, targetItem.quantity + change);
    await handleUpdateProductQuantity(itemId, newQty);
    await handleAddNewMovement({
      itemId,
      itemName: targetItem.name,
      type: change > 0 ? 'Entrada' : 'Saída/Perda',
      quantity: Math.abs(change),
      notes: notesStr,
      responsible: activeUser?.name || 'Sistema',
    });
  };

  const handleStartShift = () => {
    const nextShift: WorkShift = {
      status: 'em_andamento',
      startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      endTime: null,
      totalWorkedMinutes: 0,
      elapsedSeconds: 0,
    };
    setWorkShift(nextShift);
    localStorage.setItem('floripa_work_shift', JSON.stringify(nextShift));
  };

  const handleEndShift = () => {
    const nextShift: WorkShift = {
      ...workShift,
      status: 'finalizada',
      endTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setWorkShift(nextShift);
    localStorage.setItem('floripa_work_shift', JSON.stringify(nextShift));
  };

  const handleAddTransaction = (type: 'vale' | 'desconto', amount: number, description: string) => {
    const nextTrans: WageTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      type, amount, description,
      date: new Date().toLocaleDateString('pt-BR'),
    };
    const nextWage = { ...weeklyWage, transactions: [...weeklyWage.transactions, nextTrans] };
    setWeeklyWage(nextWage);
    localStorage.setItem('floripa_weekly_wage', JSON.stringify(nextWage));
  };

  const handleRemoveTransaction = (id: string) => {
    const nextWage = { ...weeklyWage, transactions: weeklyWage.transactions.filter((t) => t.id !== id) };
    setWeeklyWage(nextWage);
    localStorage.setItem('floripa_weekly_wage', JSON.stringify(nextWage));
  };

  const handleUpdateDailyRate = (rate: number) => {
    const nextWage = { ...weeklyWage, dailyRate: rate };
    setWeeklyWage(nextWage);
    localStorage.setItem('floripa_weekly_wage', JSON.stringify(nextWage));
  };

  const handleUpdateSelectedDays = (days: string[]) => {
    const nextWage = { ...weeklyWage, selectedDays: days };
    setWeeklyWage(nextWage);
    localStorage.setItem('floripa_weekly_wage', JSON.stringify(nextWage));
  };

  const handleAddTask = (task: Omit<DailyTask, 'id' | 'status'>) => {
    const nextT: DailyTask = { ...task, id: 'task-' + Math.random().toString(36).substr(2, 9), status: 'Pendente' };
    const nextList = [nextT, ...dailyTasks];
    setDailyTasks(nextList);
    localStorage.setItem('floripa_daily_tasks', JSON.stringify(nextList));
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    const nextList = dailyTasks.map((t) => (t.id === id ? { ...t, status } : t));
    setDailyTasks(nextList);
    localStorage.setItem('floripa_daily_tasks', JSON.stringify(nextList));
  };

  const handleDeleteTask = (id: string) => {
    const nextList = dailyTasks.filter((t) => t.id !== id);
    setDailyTasks(nextList);
    localStorage.setItem('floripa_daily_tasks', JSON.stringify(nextList));
  };

  const handleAddNote = (text: string, link?: string, image?: string) => {
    const nextN: DailyNote = {
      id: 'note-' + Math.random().toString(36).substr(2, 9),
      text, link, image,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    const nextList = [nextN, ...dailyNotes];
    setDailyNotes(nextList);
    localStorage.setItem('floripa_daily_notes', JSON.stringify(nextList));
  };

  const handleDeleteNote = (id: string) => {
    const nextList = dailyNotes.filter((n) => n.id !== id);
    setDailyNotes(nextList);
    localStorage.setItem('floripa_daily_notes', JSON.stringify(nextList));
  };

  const handleEditNote = (id: string, text: string, link?: string, image?: string) => {
    const nextList = dailyNotes.map((n) => (n.id === id ? { ...n, text, link, image } : n));
    setDailyNotes(nextList);
    localStorage.setItem('floripa_daily_notes', JSON.stringify(nextList));
  };

  if (!activeUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-orange selection:text-white font-sans overflow-x-hidden">
      <div className="flex flex-col min-h-screen">
        <Header
          items={items}
          onResetData={handleResetData}
          lastUpdatedStr={lastSyncStr}
          activeUser={activeUser}
          onLogout={handleLogout}
        />

        <div className="flex flex-1 relative">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} items={items} />

          <main className="flex-1 p-3 md:p-10 bg-[radial-gradient(circle_at_top_right,rgba(122,22,22,0.03),transparent_40%)]">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {activeTab === 'dashboard' && (
                <DashboardView
                  activeUser={activeUser}
                  items={items}
                  movements={movements}
                  workShift={workShift}
                  onStartShift={handleStartShift}
                  onEndShift={handleEndShift}
                  weeklyWage={weeklyWage}
                  onAddTransaction={handleAddTransaction}
                  onRemoveTransaction={handleRemoveTransaction}
                  onUpdateDailyRate={handleUpdateDailyRate}
                  onUpdateSelectedDays={handleUpdateSelectedDays}
                  dailyTasks={dailyTasks}
                  onAddTask={handleAddTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onDeleteTask={handleDeleteTask}
                  dailyNotes={dailyNotes}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                  onEditNote={handleEditNote}
                  onNavigate={setActiveTab}
                  onQuickQuantityUpdate={handleQuickQuantityAdjustment}
                />
              )}

              {activeTab === 'admin' && activeUser?.role === 'admin' && (
                <AdminPanelView
                  items={items}
                  movements={movements}
                />
              )}

              {activeTab === 'estoque' && (
                <StockView
                  items={items}
                  onEditItem={(item) => setItemToEdit(item)}
                  onDeleteItem={handleDeleteItem}
                  onQuickQuantityUpdate={handleQuickQuantityAdjustment}
                  onNavigateToAddItem={() => setActiveTab('add-item')}
                  activeUser={activeUser}
                />
              )}

              {activeTab === 'add-item' && (
                <ItemFormModal
                  isOpenAsModal={false}
                  onSave={handleSaveItem}
                />
              )}

              {activeTab === 'validades' && (
                <ValidadesView
                  items={items}
                  activeUser={activeUser}
                  onUpdateQuantity={handleUpdateProductQuantity}
                  onAddMovement={handleAddNewMovement}
                />
              )}

              {activeTab === 'movimentacoes' && (
                <MovementsView
                  items={items}
                  movements={movements}
                  onAddMovement={handleAddNewMovement}
                  onClearHistory={handleClearHistory}
                  activeUser={activeUser}
                />
              )}

              {activeTab === 'relatorios' && (
                <WeeklyReportView
                  items={items}
                  movements={movements}
                  workShift={workShift}
                  weeklyWage={weeklyWage}
                  dailyTasks={dailyTasks}
                  dailyNotes={dailyNotes}
                />
              )}

              {activeTab === 'configuracoes' && (
                <ConfiguracoesView
                  activeUser={activeUser}
                  onUpdateUserDetails={handleUpdateUserDetails}
                  weeklyWage={weeklyWage}
                  onUpdateDailyRate={handleUpdateDailyRate}
                  onUpdateSelectedDays={handleUpdateSelectedDays}
                  onResetData={handleResetData}
                  workShift={workShift}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {itemToEdit && (
        <ItemFormModal
          isOpenAsModal={true}
          itemToEdit={itemToEdit}
          onCloseModal={() => setItemToEdit(null)}
          onSave={handleSaveItem}
        />
      )}

      <div className="h-16 lg:hidden" />
    </div>
  );
}
