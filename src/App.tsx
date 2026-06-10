import React, { useState, useEffect, useRef } from 'react';
import { Item, Movement, TabId, WorkShift, WeeklyWage, DailyTask, DailyNote, DailyFeedback, TaskStatus, WageTransaction } from './types';
import { INITIAL_ITEMS, INITIAL_MOVEMENTS } from './initialData';

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

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    { id: 't1', title: 'Lustrar todos os copos de chopp do bar principal', priority: 'Média', dueTime: '17:00', status: 'Concluída' },
    { id: 't2', title: 'Verificar temperatura exata das chopeiras (< -2ºC)', priority: 'Alta', dueTime: '16:00', status: 'Concluída' },
    { id: 't3', title: 'Completar geladeiras expositoras de cerveja do salão', priority: 'Alta', dueTime: '18:00', status: 'Pendente' },
    { id: 't4', title: 'Retirar lixo acumulado e limpar balcão de serviço', priority: 'Média', dueTime: '19:30', status: 'Pendente' },
    { id: 't5', title: 'Confirmação do lote de validades da cozinha', priority: 'Alta', dueTime: '17:30', status: 'Pendente' },
  ]);

  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);

  const [dailyFeedback, setDailyFeedback] = useState<DailyFeedback>({
    hasError: false,
    errorQty: 0,
    errorDescription: '',
    whatWentPerfect: '',
    whatToImprove: '',
    suggestions: '',
    uploads: [],
  });

  // Editing state overlay
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  // shift background timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and load from LocalStorage
  useEffect(() => {
    const storedItems = localStorage.getItem('mare_items');
    const storedMovements = localStorage.getItem('mare_movements');
    const storedSync = localStorage.getItem('mare_last_sync');
    const storedUser = localStorage.getItem('mare_active_user');

    // Operational state restoration
    const storedShift = localStorage.getItem('mare_work_shift');
    const storedWage = localStorage.getItem('mare_weekly_wage');
    const storedTasks = localStorage.getItem('mare_daily_tasks');
    const storedNotes = localStorage.getItem('mare_daily_notes');
    const storedFeedback = localStorage.getItem('mare_daily_feedback');

    if (storedUser) {
      try {
        setActiveUser(JSON.parse(storedUser));
      } catch (e) {}
    }

    if (storedItems && storedMovements) {
      setItems(JSON.parse(storedItems));
      setMovements(JSON.parse(storedMovements));
      setLastSyncStr(storedSync || new Date().toLocaleTimeString('pt-BR'));
    } else {
      // Load initial hardcoded mock data
      setItems(INITIAL_ITEMS);
      setMovements(INITIAL_MOVEMENTS);
      const initialTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastSyncStr(initialTimeStr);
      
      localStorage.setItem('mare_items', JSON.stringify(INITIAL_ITEMS));
      localStorage.setItem('mare_movements', JSON.stringify(INITIAL_MOVEMENTS));
      localStorage.setItem('mare_last_sync', initialTimeStr);
    }

    if (storedShift) {
      try { setWorkShift(JSON.parse(storedShift)); } catch (e) {}
    }
    if (storedWage) {
      try { setWeeklyWage(JSON.parse(storedWage)); } catch (e) {}
    }
    if (storedTasks) {
      try { setDailyTasks(JSON.parse(storedTasks)); } catch (e) {}
    }
    if (storedNotes) {
      try { setDailyNotes(JSON.parse(storedNotes)); } catch (e) {}
    }
    if (storedFeedback) {
      try { setDailyFeedback(JSON.parse(storedFeedback)); } catch (e) {}
    }
  }, []);

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
          localStorage.setItem('mare_work_shift', JSON.stringify(next));
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [workShift.status]);

  // Sync to localStorage Helper for Core Items + Movements
  const syncData = (updatedItems: Item[], updatedMovements: Movement[]) => {
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setItems(updatedItems);
    setMovements(updatedMovements);
    setLastSyncStr(timeStr);

    localStorage.setItem('mare_items', JSON.stringify(updatedItems));
    localStorage.setItem('mare_movements', JSON.stringify(updatedMovements));
    localStorage.setItem('mare_last_sync', timeStr);
  };

  const handleLogin = (session: UserSession) => {
    setActiveUser(session);
    localStorage.setItem('mare_active_user', JSON.stringify(session));
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.removeItem('mare_active_user');
  };

  const handleUpdateUserDetails = (name: string, title: string) => {
    if (activeUser) {
      const nextUser = { ...activeUser, name, title };
      setActiveUser(nextUser);
      localStorage.setItem('mare_active_user', JSON.stringify(nextUser));
    }
  };

  // Reset Callback
  const handleResetData = () => {
    syncData(INITIAL_ITEMS, INITIAL_MOVEMENTS);
    
    // reset operations
    const initialShift: WorkShift = { status: 'nao_iniciada', startTime: null, endTime: null, totalWorkedMinutes: 0, elapsedSeconds: 0 };
    const initialWage: WeeklyWage = {
      dailyRate: 150,
      workedDays: ['Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
      selectedDays: ['Quarta-feira', 'Quinta-feira'],
      transactions: [],
    };
    const initialTasks: DailyTask[] = [
      { id: 't1', title: 'Lustrar todos os copos de chopp do bar principal', priority: 'Média', dueTime: '17:00', status: 'Concluída' },
      { id: 't2', title: 'Verificar temperatura exata das chopeiras (< -2ºC)', priority: 'Alta', dueTime: '16:00', status: 'Concluída' },
      { id: 't3', title: 'Completar geladeiras expositoras de cerveja do salão', priority: 'Alta', dueTime: '18:00', status: 'Pendente' },
      { id: 't4', title: 'Retirar lixo acumulado e limpar balcão de serviço', priority: 'Média', dueTime: '19:30', status: 'Pendente' },
    ];

    setWorkShift(initialShift);
    setWeeklyWage(initialWage);
    setDailyTasks(initialTasks);
    setDailyNotes([]);
    setDailyFeedback({
      hasError: false,
      errorQty: 0,
      errorDescription: '',
      whatWentPerfect: '',
      whatToImprove: '',
      suggestions: '',
      uploads: [],
    });

    localStorage.setItem('mare_work_shift', JSON.stringify(initialShift));
    localStorage.setItem('mare_weekly_wage', JSON.stringify(initialWage));
    localStorage.setItem('mare_daily_tasks', JSON.stringify(initialTasks));
    localStorage.setItem('mare_daily_notes', JSON.stringify([]));
    localStorage.setItem('mare_daily_feedback', JSON.stringify({
      hasError: false,
      errorQty: 0,
      errorDescription: '',
      whatWentPerfect: '',
      whatToImprove: '',
      suggestions: '',
      uploads: [],
    }));

    setActiveTab('dashboard');
  };

  const handleClearHistory = () => {
    syncData(items, []);
  };

  // Save Item (Create or Update Product attributes)
  const handleSaveItem = (itemData: Omit<Item, 'id' | 'lastUpdated'> & { id?: string }) => {
    const nowIso = new Date().toISOString();
    let updatedItems: Item[];

    if (itemData.id) {
      // Edit mode
      updatedItems = items.map((i) =>
        i.id === itemData.id
          ? {
              ...i,
              name: itemData.name,
              category: itemData.category,
              quantity: itemData.quantity,
              minQuantity: itemData.minQuantity,
              unit: itemData.unit,
              supplier: itemData.supplier,
              notes: itemData.notes,
              lastUpdated: nowIso,
              unitValue: itemData.unitValue || 5.0,
              barcode: itemData.barcode || '',
              expiryDate: itemData.expiryDate || '',
              photo: itemData.photo || i.photo,
              storageLocation: itemData.storageLocation || 'Depósito',
            }
          : i
      );
      
      // Register custom movement if quantity changed
      const oldItem = items.find((i) => i.id === itemData.id);
      if (oldItem && oldItem.quantity !== itemData.quantity) {
        const diff = itemData.quantity - oldItem.quantity;
        const newMove: Movement = {
          id: 'm-' + Math.random().toString(36).substr(2, 9),
          itemId: itemData.id,
          itemName: itemData.name,
          type: diff > 0 ? 'entrada' : 'saída',
          quantity: Math.abs(diff),
          date: nowIso,
          notes: `Ajuste manual de estoque de ${oldItem.quantity} para ${itemData.quantity}`,
          responsible: activeUser?.name || 'Sistema',
        };
        const updatedMovements = [newMove, ...movements];
        syncData(updatedItems, updatedMovements);
      } else {
        syncData(updatedItems, movements);
      }
      setItemToEdit(null); // Close modal
    } else {
      // Create mode
      const newId = 'item-' + Math.random().toString(36).substr(2, 9);
      const newItem: Item = {
        id: newId,
        name: itemData.name,
        category: itemData.category,
        quantity: itemData.quantity,
        minQuantity: itemData.minQuantity,
        unit: itemData.unit,
        supplier: itemData.supplier,
        notes: itemData.notes,
        lastUpdated: nowIso,
        unitValue: itemData.unitValue || 5.0,
        barcode: itemData.barcode || '',
        expiryDate: itemData.expiryDate || '',
        photo: itemData.photo,
        storageLocation: itemData.storageLocation || 'Depósito',
      };
      updatedItems = [newItem, ...items];

      // Add a historic initial entry movement log to keep stats true
      const initialMove: Movement = {
        id: 'm-' + Math.random().toString(36).substr(2, 9),
        itemId: newId,
        itemName: itemData.name,
        type: 'entrada',
        quantity: itemData.quantity,
        date: nowIso,
        notes: 'Cadastro inicial de suprimento',
        responsible: activeUser?.name || 'Sistema',
      };
      
      const updatedMovements = [initialMove, ...movements];
      syncData(updatedItems, updatedMovements);
      setActiveTab('estoque'); // Redirect to inventory table
    }
  };

  // Direct edit for other states like quantities
  const handleUpdateProductQuantity = (id: string, newQty: number) => {
    const updated = items.map((i) => {
      if (i.id === id) {
        return { ...i, quantity: newQty, lastUpdated: new Date().toISOString() };
      }
      return i;
    });
    syncData(updated, movements);
  };

  // Delete product logic
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter((i) => i.id !== itemId);
    const updatedMovements = movements.filter((m) => m.itemId !== itemId);
    syncData(updatedItems, updatedMovements);
  };

  // Add a raw manual Movement entry via the movements form
  const handleAddNewMovement = (movementData: Omit<Movement, 'id' | 'date'> & { date?: string }) => {
    const newId = 'm-' + Math.random().toString(36).substr(2, 9);
    const nowIso = movementData.date || new Date().toISOString();
    const cleanQty = movementData.quantityChange ? Math.abs(movementData.quantityChange) : (movementData.quantity || 1);

    const newMovement: Movement = {
      id: newId,
      itemId: movementData.itemId,
      itemName: movementData.productName || movementData.itemName || 'Produto Secundário',
      productName: movementData.productName,
      type: movementData.type,
      subtype: movementData.subtype,
      quantity: cleanQty,
      quantityChange: movementData.quantityChange,
      date: nowIso,
      notes: movementData.notes,
      responsible: movementData.responsible,
      photo: movementData.photo,
    };

    const updatedMovements = [newMovement, ...movements];

    // Readjust inventory calculation
    const updatedItems = items.map((item) => {
      if (item.id === movementData.itemId) {
        let newQty = item.quantity;
        if (movementData.quantityChange !== undefined) {
          newQty = Math.max(0, item.quantity + movementData.quantityChange);
        } else if (movementData.type === 'entrada' || movementData.type === 'Entrada') {
          newQty += cleanQty;
        } else if (movementData.type === 'saída' || movementData.type === 'Saída/Perda') {
          newQty = Math.max(0, item.quantity - cleanQty);
        } else if (movementData.type === 'ajuste') {
          newQty = cleanQty; // Direct override
        }
        return {
          ...item,
          quantity: newQty,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });

    syncData(updatedItems, updatedMovements);
  };

  // Fast direct quantity increment/decrement (+/-) from Dashboard warnings list or Stock list
  const handleQuickQuantityAdjustment = (itemId: string, change: number, notesStr: string) => {
    let typeOfOp: 'entrada' | 'saída' = change > 0 ? 'entrada' : 'saída';
    const volumeAmt = Math.abs(change);
    const nowIso = new Date().toISOString();

    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    let actualChange = change;
    if (change < 0 && targetItem.quantity < volumeAmt) {
      actualChange = -targetItem.quantity;
    }

    if (actualChange === 0) return;

    // Create a corresponding movement log to keep consistency
    const newMove: Movement = {
      id: 'm-' + Math.random().toString(36).substr(2, 9),
      itemId,
      itemName: targetItem.name,
      productName: targetItem.name,
      type: typeOfOp === 'entrada' ? 'Entrada' : 'Saída/Perda',
      subtype: 'Ajuste de Inventário',
      quantity: Math.abs(actualChange),
      quantityChange: actualChange,
      date: nowIso,
      notes: notesStr || (actualChange > 0 ? 'Ajuste rápido de entrada' : 'Ajuste rápido de saída'),
      responsible: activeUser?.name || 'Sistema',
    };

    const updatedMovements = [newMove, ...movements];

    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: Math.max(0, item.quantity + actualChange),
          lastUpdated: nowIso,
        };
      }
      return item;
    });

    syncData(updatedItems, updatedMovements);
  };

  // Turn Actions
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

  // Wage Transaction updates
  const handleAddTransaction = (type: 'vale' | 'desconto', amount: number, description: string) => {
    const nextTrans: WageTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      type,
      amount,
      description,
      date: new Date().toLocaleDateString('pt-BR'),
    };
    const nextWage = {
      ...weeklyWage,
      transactions: [...weeklyWage.transactions, nextTrans],
    };
    setWeeklyWage(nextWage);
    localStorage.setItem('floripa_weekly_wage', JSON.stringify(nextWage));
  };

  const handleRemoveTransaction = (id: string) => {
    const nextWage = {
      ...weeklyWage,
      transactions: weeklyWage.transactions.filter((t) => t.id !== id),
    };
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

  // Daily Tasks
  const handleAddTask = (task: Omit<DailyTask, 'id' | 'status'>) => {
    const nextT: DailyTask = {
      ...task,
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      status: 'Pendente',
    };
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

  // Daily Notes
  const handleAddNote = (text: string, link?: string, image?: string) => {
    const nextN: DailyNote = {
      id: 'note-' + Math.random().toString(36).substr(2, 9),
      text,
      link,
      image,
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

  // Feedback State Save
  const handleSaveFeedback = (feedback: DailyFeedback) => {
    setDailyFeedback(feedback);
    localStorage.setItem('floripa_daily_feedback', JSON.stringify(feedback));
  };

  // Nav redirection utility helper
  const handleRedirectAndNavigate = (tabId: TabId) => {
    setActiveTab(tabId);
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

          <main className="flex-1 p-4 md:p-10 bg-[radial-gradient(circle_at_top_right,rgba(122,22,22,0.03),transparent_40%)]">
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
                  dailyFeedback={dailyFeedback}
                  onSaveFeedback={handleSaveFeedback}
                  onNavigate={setActiveTab}
                  onQuickQuantityUpdate={handleQuickQuantityAdjustment}
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
                  dailyFeedback={dailyFeedback}
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

      {/* Overlay modal for product edit changes */}
      {itemToEdit && (
        <ItemFormModal
          isOpenAsModal={true}
          itemToEdit={itemToEdit}
          onCloseModal={() => setItemToEdit(null)}
          onSave={handleSaveItem}
        />
      )}

      {/* Mobile structural padding offset context */}
      <div className="h-16 lg:hidden" />

    </div>
  );
}
