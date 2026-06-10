export type TabId = 'dashboard' | 'estoque' | 'validades' | 'movimentacoes' | 'relatorios' | 'configuracoes';

export type Category =
  | 'Bebidas'
  | 'Alimentos'
  | 'Produtos de limpeza'
  | 'Utensílios'
  | 'Descartáveis'
  | 'Outros';

export type Unit =
  | 'unidade(s)'
  | 'kg'
  | 'litro(s)'
  | 'pacote(s)'
  | 'caixa(s)'
  | 'garrafa(s)'
  | 'fardo(s)'
  | 'saco(s)';

export interface Item {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  minQuantity: number;
  unit: Unit;
  supplier: string;
  notes?: string;
  lastUpdated: string; // ISO date string
  unitValue: number; // Valor unitário
  barcode: string; // Código de barras
  expiryDate: string; // Data de validade YYYY-MM-DD
  photo?: string; // Produto foto (base64 or placeholder)
  storageLocation: string; // Local de armazenamento ex: Adega, Geladeira, Depósito
}

export type MovementType = 'entrada' | 'saída' | 'ajuste' | 'perda' | 'quebra' | 'descarte' | 'Entrada' | 'Saída/Perda';

export interface Movement {
  id: string;
  itemId: string;
  itemName?: string;
  productName?: string;
  type: string;
  subtype?: string;
  quantity?: number;
  quantityChange?: number;
  date: string; // YYYY-MM-DDTHH:mm:ss
  notes?: string;
  responsible?: string; // Quem fez a movimentação
  photo?: string; // Foto opcional do lote / avaria
}

export type ShiftStatus = 'nao_iniciada' | 'em_andamento' | 'finalizada';

export interface WorkShift {
  status: ShiftStatus;
  startTime: string | null;
  endTime: string | null;
  totalWorkedMinutes: number;
  elapsedSeconds: number;
}

export interface WageTransaction {
  id: string;
  type: 'vale' | 'desconto';
  amount: number;
  description: string;
  date: string;
}

export interface WeeklyWage {
  dailyRate: number;
  workedDays: string[]; // List of days scheduled ex: ["Quarta-feira", "Quinta-feira", ...]
  selectedDays: string[]; // Days actually worked this week
  transactions: WageTransaction[];
}

export type TaskPriority = 'Alta' | 'Média' | 'Baixa';
export type TaskStatus = 'Pendente' | 'Em andamento' | 'Concluída' | 'Atrasada';

export interface DailyTask {
  id: string;
  title: string;
  priority: TaskPriority;
  dueTime: string; // HH:MM
  status: TaskStatus;
  notes?: string;
}

export interface DailyNote {
  id: string;
  text: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  time: string; // HH:MM
  link?: string;
  image?: string;
}

export interface UserConfig {
  name: string;
  photo: string;
  role: string;
  phone: string;
}

export interface EstablishmentConfig {
  name: string;
  logo: string;
  phone: string;
  address: string;
}

export interface ActiveSettings {
  dailyRate: number;
  workedDays: string[];
  standardStartTime: string;
  alertsEnabled: boolean;
  theme: 'light' | 'dark';
}
