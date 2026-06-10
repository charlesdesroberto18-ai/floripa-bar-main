import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  AlertCircle,
  Sparkles,
  FolderOpen,
  Tag,
  Truck,
  DollarSign,
  Barcode,
  Calendar,
  Camera,
  MapPin,
  Clipboard,
  Zap,
  Check,
  ScanLine
} from 'lucide-react';
import { Item, Category, Unit } from '../types';

interface ItemFormModalProps {
  itemToEdit?: Item | null;
  isOpenAsModal: boolean;
  onCloseModal?: () => void;
  onSave: (itemData: Omit<Item, 'id' | 'lastUpdated'> & { id?: string }) => void;
}

// Simulated Barcode Database for ML Kit / ZXing prediction
const BARCODE_DB: { [key: string]: Partial<Item> } = {
  '7891991000851': {
    name: 'Cerveja Brahma 600ml',
    category: 'Bebidas',
    unit: 'garrafa(s)',
    supplier: 'Ambev Distribuidora',
    unitValue: 8.50,
    storageLocation: 'Câmara Fria',
    notes: 'Auto-preenchido via leitura de Código de Barras'
  },
  '7894900011517': {
    name: 'Coca-Cola 2L',
    category: 'Bebidas',
    unit: 'garrafa(s)',
    supplier: 'Femsa S.A.',
    unitValue: 9.90,
    storageLocation: 'Adega',
    notes: 'Auto-preenchido via leitura de Código de Barras'
  },
  '7891010203040': {
    name: 'Água Mineral 500ml',
    category: 'Bebidas',
    unit: 'unidade(s)',
    supplier: 'Fontaine Distribuidora',
    unitValue: 3.00,
    storageLocation: 'Geladeira Bar',
    notes: 'Auto-preenchido via leitura de Código de Barras'
  },
  '7896007502012': {
    name: 'Batata Congelada McCain 2.5kg',
    category: 'Alimentos',
    unit: 'kg',
    supplier: 'McCain Alimentos',
    unitValue: 18.00,
    storageLocation: 'Freezer Cozinha',
    notes: 'Auto-preenchido via leitura de Código de Barras'
  },
  '7898032104505': {
    name: 'Hambúrguer de Costela 180g',
    category: 'Alimentos',
    unit: 'unidade(s)',
    supplier: 'Frigorífico Sul',
    unitValue: 12.50,
    storageLocation: 'Freezer Cozinha',
    notes: 'Auto-preenchido via leitura de Código de Barras'
  },
};

export default function ItemFormModal({
  itemToEdit,
  isOpenAsModal,
  onCloseModal,
  onSave,
}: ItemFormModalProps) {
  // Local form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Bebidas');
  const [quantity, setQuantity] = useState<number>(0);
  const [minQuantity, setMinQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>('unidade(s)');
  const [supplier, setSupplier] = useState('');
  const [unitValue, setUnitValue] = useState<number>(0);
  const [barcode, setBarcode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [photo, setPhoto] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMess, setErrorMess] = useState('');

  // Interactive scanner & camera simulators
  const [showScanner, setShowScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [matchingProductMsg, setMatchingProductMsg] = useState('');
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState(false);

  const categories: Category[] = [
    'Bebidas',
    'Alimentos',
    'Produtos de limpeza',
    'Utensílios',
    'Descartáveis',
    'Outros',
  ];

  const units: Unit[] = [
    'unidade(s)',
    'kg',
    'litro(s)',
    'pacote(s)',
    'caixa(s)',
    'garrafa(s)',
    'fardo(s)',
    'saco(s)',
  ];

  // Load edit item data if present
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setQuantity(itemToEdit.quantity);
      setMinQuantity(itemToEdit.minQuantity);
      setUnit(itemToEdit.unit);
      setSupplier(itemToEdit.supplier);
      setUnitValue(itemToEdit.unitValue || 0);
      setBarcode(itemToEdit.barcode || '');
      setExpiryDate(itemToEdit.expiryDate || '');
      setPhoto(itemToEdit.photo || '');
      setStorageLocation(itemToEdit.storageLocation || '');
      setNotes(itemToEdit.notes || '');
    } else {
      // Clear values if adding new
      setName('');
      setCategory('Bebidas');
      setQuantity(0);
      setMinQuantity(0);
      setUnit('unidade(s)');
      setSupplier('');
      setUnitValue(0);
      setBarcode('');
      setExpiryDate('');
      setPhoto('');
      setStorageLocation('');
      setNotes('');
    }
    setErrorMess('');
    setPhotoSuccessMsg(false);
  }, [itemToEdit]);

  // Handle Scan effect simulator
  useEffect(() => {
    let interval: any = null;
    if (showScanner) {
      setScanProgress(0);
      setMatchingProductMsg('');
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 20;
        });
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showScanner]);

  // Execute barcode simulation resolution
  const handleSimulatedScanResult = (selectedBarcode: string) => {
    setBarcode(selectedBarcode);
    const resolved = BARCODE_DB[selectedBarcode];
    if (resolved) {
      setName(resolved.name || '');
      setCategory(resolved.category as Category || 'Bebidas');
      setUnit(resolved.unit as Unit || 'unidade(s)');
      setSupplier(resolved.supplier || '');
      setUnitValue(resolved.unitValue || 0);
      setStorageLocation(resolved.storageLocation || '');
      setNotes(resolved.notes || '');
      setMatchingProductMsg(`✓ Sucesso! ML Kit identificou: ${resolved.name}`);
    } else {
      setMatchingProductMsg('❌ Código lido com sucesso, mas nenhum produto correspondente no banco. Preencha manualmente.');
    }
    setTimeout(() => {
      setShowScanner(false);
    }, 1500);
  };

  // Simulate snapping camera
  const triggerCameraSnap = () => {
    setPhoto('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f97316"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="%23ffffff">FOTO PRODUTO</text></svg>');
    setPhotoSuccessMsg(true);
    setTimeout(() => {
      setShowCamera(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');

    // Small validation check
    if (!name.trim()) {
      setErrorMess('Por favor, preencha o Nome do Produto.');
      return;
    }
    if (!supplier.trim()) {
      setErrorMess('Por favor, adicione o Fornecedor do produto.');
      return;
    }
    if (quantity < 0) {
      setErrorMess('A quantidade atual não pode ser inferior a 0.');
      return;
    }
    if (minQuantity < 0) {
      setErrorMess('A quantidade mínima ideal não pode ser inferior a 0.');
      return;
    }

    onSave({
      id: itemToEdit?.id,
      name: name.trim(),
      category,
      quantity,
      minQuantity,
      unit,
      supplier: supplier.trim(),
      unitValue: Number(unitValue) || 0,
      barcode: barcode.trim(),
      expiryDate,
      photo,
      storageLocation: storageLocation.trim(),
      notes: notes.trim() || undefined,
    });

    // Reset forms if it is standard page form
    if (!isOpenAsModal) {
      setName('');
      setCategory('Bebidas');
      setQuantity(0);
      setMinQuantity(0);
      setUnit('unidade(s)');
      setSupplier('');
      setUnitValue(0);
      setBarcode('');
      setExpiryDate('');
      setPhoto('');
      setStorageLocation('');
      setNotes('');
    }
  };

  const formLayout = (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-300 text-xs">
      {errorMess && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2.5 items-center text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMess}</span>
        </div>
      )}

      {/* Camera / Photo preview slot if captured */}
      {photo && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-orange/10 border border-brand-orange/20 overflow-hidden flex items-center justify-center font-bold text-[9px] text-brand-orange">
              FOTO
            </div>
            <div>
              <p className="font-bold text-white text-[11px]">Foto do Produto Salva</p>
              <p className="text-[10px] text-slate-500">Pronto para envio nos relatórios gerenciais</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhoto('')}
            className="text-xs text-rose-400 hover:underline"
          >
            Remover Foto
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Barcode Intelligence Trigger bar */}
        <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-850">
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-[11px] text-slate-200 font-extrabold transition-all cursor-pointer"
          >
            <Barcode className="w-4 h-4 text-brand-orange" />
            <span>[ZXing/ML Kit] Escanear Código</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-[11px] text-slate-200 font-extrabold transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-brand-orange" />
            <span>📷 Tirar Foto pelo Celular</span>
          </button>
        </div>

        {/* Name input */}
        <div className="space-y-1 md:col-span-8">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-orange" />
            Nome do Produto *
          </label>
          <input
            type="text"
            placeholder="Ex: Cerveja Brahma 600ml, Batata Congelada McCain, etc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Barcode (direct edit) */}
        <div className="space-y-1 md:col-span-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-brand-orange" />
            Código de Barras
          </label>
          <input
            type="text"
            placeholder="Preencha ou escaneie acima"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full bg-slate-950 text-white font-mono text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
          />
        </div>

        {/* Category select */}
        <div className="space-y-1 md:col-span-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-brand-orange" />
            Categoria *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors font-semibold"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Measure */}
        <div className="space-y-1 md:col-span-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            Unidade de Medida *
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Price (R$) */}
        <div className="space-y-1 md:col-span-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-orange" />
            Valor de Compra Unitário (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={unitValue === 0 ? '' : unitValue}
            placeholder="Ex: 8.50"
            onChange={(e) => setUnitValue(Number(e.target.value) || 0)}
            className="w-full bg-slate-950 text-white font-mono text-xs px-4 py-3 rounded-xl border border-slate-855 border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
          />
        </div>

        {/* Qtd em Maos */}
        <div className="space-y-1 md:col-span-3">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">
            Qtd Atual Mãos *
          </label>
          <input
            type="number"
            min="0"
            value={quantity === 0 ? '' : quantity}
            placeholder="0"
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            className="w-full bg-slate-950 text-white font-mono text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Qtd Minima Ideal */}
        <div className="space-y-1 md:col-span-3">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">
            Estoque de Segurança *
          </label>
          <input
            type="number"
            min="0"
            value={minQuantity === 0 ? '' : minQuantity}
            placeholder="Ex: 50"
            onChange={(e) => setMinQuantity(Number(e.target.value) || 0)}
            className="w-full bg-slate-950 text-white font-mono text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Expiry Date (Data de Validade) */}
        <div className="space-y-1 md:col-span-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-orange" />
            Validade Produto
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-slate-950 text-white font-semibold font-mono text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
          />
        </div>

        {/* Storage Location */}
        <div className="space-y-1 md:col-span-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-orange" />
            Armazenamento Location
          </label>
          <input
            type="text"
            placeholder="Ex: Geladeira Bar"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
            className="w-full bg-slate-950 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
          />
        </div>

        {/* Fornecedor */}
        <div className="space-y-1 md:col-span-12">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-brand-orange" />
            Fornecedor Principal *
          </label>
          <input
            type="text"
            placeholder="Ex: Ambev, Frigorífico Sul, Distribuidora Nacional de Embalagens"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Observações / Notas */}
        <div className="space-y-1 md:col-span-12">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-slate-450">
            Anotações Especiais (Opcional)
          </label>
          <textarea
            placeholder="Ex: Armazenar no congelador secundário do bar do meio, etc."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-850 focus:border-brand-orange focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
        {isOpenAsModal && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="px-4 py-2.5 bg-slate-850 hover:bg-slate-805 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          id="btn-salvar-item"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-orange to-brand-gold text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
        >
          <Save className="w-4 h-4 stroke-[3]" />
          <span>{itemToEdit ? 'Salvar Cadastro' : 'Cadastrar Produto'}</span>
        </button>
      </div>
    </form>
  );

  // RETURN MODAL PRESET OR PAGE COMPONENT PRESET ACCORDING TO PROPS
  return (
    <>
      {isOpenAsModal ? (
        <div 
          id="item-form-modal-overlay"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative block max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{itemToEdit ? 'Editar Produto de Estoque' : 'Cadastrar Novo Insumo'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Sabor da Ilha - Floripa Bar POS</p>
              </div>
              {onCloseModal && (
                <button
                  onClick={onCloseModal}
                  className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-900 border border-slate-850 hover:bg-slate-805 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {formLayout}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl max-w-3xl mx-auto animate-fade-in">
          <div className="border-b border-slate-850 pb-4 mb-5">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              <span>Cadastrar Novo Produto</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Insira mercadorias, bebidas ou pertences operacionais no sistema</p>
          </div>
          {formLayout}
        </div>
      )}

      {/* 8. BARCODE/ZXING/ML KIT SCANNER MODAL SIMULATOR */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 max-w-md w-full border border-slate-800 rounded-2xl overflow-hidden text-center text-xs text-slate-350 space-y-4 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-orange fill-brand-orange animate-pulse" />
                <span>Simulador de Scanner ZXing / ML Kit</span>
              </h4>
              <p className="text-slate-400 text-xs">Aponte para o código de barras no insumo da cozinha</p>
            </div>

            {/* Scanning Box Window */}
            <div className="w-full aspect-video bg-neutral-950 relative overflow-hidden rounded-xl border border-slate-850 flex items-center justify-center">
              {/* Laser line animation */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-lg shadow-red-500 animate-[bounce_2s_infinite]"
                style={{ top: `${scanProgress}%` }}
              />
              <div className="border-2 border-dashed border-brand-orange/50 w-2/3 h-1/2 rounded flex flex-col items-center justify-center text-[10px] text-slate-500 bg-slate-900/30">
                <ScanLine className="w-8 h-8 text-slate-600 animate-pulse" />
                <span className="font-mono mt-2">Visor do Sensor</span>
              </div>
            </div>

            {matchingProductMsg && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-brand-orange font-bold font-sans">
                {matchingProductMsg}
              </div>
            )}

            {/* Helper Buttons to feed popular barcodes */}
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Selecione para simular leitura de código:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulatedScanResult('7891991000851')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-left text-[11px] font-bold text-slate-300 border border-slate-850 flex items-center justify-between"
                >
                  <span>🍻 Cerveja Brahma</span>
                  <span className="text-[9px] font-mono select-all font-normal text-slate-500">..0851</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedScanResult('7896007502012')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-left text-[11px] font-bold text-slate-300 border border-slate-850 flex items-center justify-between"
                >
                  <span>🍟 Batata McCain</span>
                  <span className="text-[9px] font-mono font-normal text-slate-500">..2012</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedScanResult('7894900011517')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-lg text-left text-[11px] font-bold text-slate-300 border border-slate-850 flex items-center justify-between"
                >
                  <span>🥤 Coca-Cola 2L</span>
                  <span className="text-[9px] font-mono font-normal text-slate-500">..1517</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedScanResult('9999999999999')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-805 rounded-lg text-left text-[11px] font-bold text-slate-305 text-slate-400 border border-slate-850 flex items-center justify-between"
                >
                  <span>❓ Desconhecido</span>
                  <span className="text-[9px] font-mono font-normal text-slate-500">..9999</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. CAMERA SNAPPING OVERLAY SIMULATOR */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 max-w-sm w-full border border-slate-800 rounded-2xl overflow-hidden text-center text-xs text-slate-350 space-y-4 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCamera(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-orange" />
                <span>Simulador de Câmera de Insumos</span>
              </h4>
              <p className="text-slate-400 text-xs">Pressione para registrar a imagem do lote / embalagem em alta resolução</p>
            </div>

            {/* Mirror View Finder */}
            <div className="w-full aspect-square bg-[#0b0c10] relative overflow-hidden rounded-xl border border-slate-850 flex items-center justify-center">
              <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono bg-slate-950/80 p-1 rounded">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>REC LIVE</span>
              </div>
              <Camera className="w-16 h-16 text-slate-800/40 animate-pulse" />
            </div>

            {photoSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] font-bold">
                ✓ Registro capturado com sucesso!
              </div>
            )}

            <button
              type="button"
              onClick={triggerCameraSnap}
              className="w-16 h-16 bg-white hover:bg-slate-100 rounded-full border-4 border-slate-800 transition-all cursor-pointer flex items-center justify-center mx-auto"
              title="Obturador"
            >
              <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-950"></div>
            </button>
          </div>
        </div>
      )}

    </>
  );
}
