import { useState, useEffect, FormEvent } from 'react';
import { 
  Package, ShoppingCart, ChefHat, Plus, Trash2, Save, 
  Box, ShoppingBag, Wallet, Store, Pencil, 
  X, Minus, Check, Banknote, CreditCard, QrCode,
  Search, Utensils, Bike, MessageSquare, ArrowRight, 
  Armchair, Clock, History, Settings, Users, Lock, ClipboardList,
  ArrowLeftRight, Merge, LogOut, ShieldAlert, Layers, AlertCircle, 
  Image as ImageIcon, Upload, FileText, UserPlus, RefreshCw, TrendingUp, TrendingDown, Eye,
  Truck, Phone, Mail, Calendar, CheckCircle, XCircle, MapPin, Building, Calculator, Filter, ListPlus,
  DollarSign, Activity, PieChart, Link, Receipt
} from 'lucide-react';

// ==========================================
// 1. TIPOS E INTERFACES GLOBAIS
// ==========================================
type Category = 'comida' | 'bebida' | 'sobremesa' | 'ingrediente' | 'embalagem' | 'diversos';
type ProductType = 'venda' | 'insumo';
type ProductionType = 'demanda' | 'estoque';
type Unit = 'un' | 'kg' | 'l' | 'g' | 'ml';
type TabStatus = 'livre' | 'ocupada' | 'reservada';

interface StepOption { id: string; name: string; priceChange: number; }
interface SalesStep { id: string; title: string; type: 'single' | 'multiple'; required: boolean; options: StepOption[]; }
interface RecipeItem { ingredientId: string; name: string; quantity: number; unit: Unit; cost: number; }

interface Product {
  id: string; code: string; name: string; description?: string; unit: Unit; minStock: number;
  price: number; costPrice: number; lossPercentage: number; realCost: number; stock: number;
  category: Category; type: ProductType; production: ProductionType; imageUrl?: string;
  recipe?: RecipeItem[]; steps?: SalesStep[]; 
  lastSupplierId?: string;
}

interface StockMovement {
  id: string; productId: string; type: 'in' | 'out'; quantity: number; date: string; originId?: string;
}

interface CartItem {
  cartId: string; product: Product; quantity: number;
  selectedOptions: { stepTitle: string; optionName: string; price: number }[];
  finalPrice: number; observation?: string;
}

interface Tab {
  id: string; number: number; label: string; status: TabStatus;
  items: CartItem[]; total: number; peopleCount: number; 
  location?: string; openedAt?: number; 
}

interface Supplier {
  id: string; name: string; tradeName?: string; cnpj: string; phone?: string; email?: string;
  zip?: string; address?: string; neighborhood?: string; city?: string; state?: string;
}

interface PurchaseItem { productId: string; productName: string; quantity: number; cost: number; }

interface PurchaseOrder {
  id: string; supplierId: string; supplierName: string;
  status: 'aberto' | 'entregue' | 'cancelado';
  items: PurchaseItem[]; totalValue: number; createdAt: string; deliveryDate?: string;
}

// --- FINANCEIRO AVANÇADO ---
interface PaymentMethod {
  id: string; name: string; type: 'dinheiro' | 'credito' | 'debito' | 'pix' | 'voucher';
  taxRate: number; // Taxa % (ex: 3.5)
  settlementDays: number; // Dias para cair na conta (ex: 30)
  active: boolean;
}

interface FinancialTransaction {
  id: string; 
  type: 'receita' | 'despesa'; 
  amount: number; 
  description: string;
  date: string; // Data de competência/lançamento
  dueDate: string; // Data de Vencimento/Previsão de Recebimento
  status: 'pendente' | 'pago'; 
  supplierId?: string; 
  origin: 'venda' | 'compra' | 'taxa' | 'manual';
  relatedId?: string; // ID da Venda, Pedido de Compra ou Nota Fiscal
  paymentMethodName?: string;
}

interface AppSettings { mode: 'mesa' | 'comanda'; tableCount: number; }

const calculateRealCost = (cost: number, loss: number) => {
  if (loss >= 100) return cost;
  return cost / ((100 - loss) / 100);
};

// ==========================================
// 2. MODAIS E COMPONENTES AUXILIARES
// ==========================================

function OpenTabModal({ tab, settings, onClose, onConfirm, onReserve }: { tab: Tab, settings: AppSettings, onClose: () => void, onConfirm: (people: number, location: string) => void, onReserve: () => void }) {
  const [people, setPeople] = useState(settings.mode === 'comanda' ? 1 : 2);
  const [location, setLocation] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-900 p-4 text-white text-center font-bold text-lg">Abrir {tab.label}</div>
        <div className="p-6 space-y-4">
          {settings.mode === 'mesa' && (
            <div><label className="block text-sm font-bold text-gray-500 mb-1">Pessoas</label><div className="flex items-center gap-3"><button onClick={() => setPeople(Math.max(1, people - 1))} className="w-10 h-10 bg-gray-100 rounded-lg font-bold">-</button><input type="number" value={people} onChange={e => setPeople(Number(e.target.value))} className="flex-1 text-center font-bold text-xl border-none outline-none" /><button onClick={() => setPeople(people + 1)} className="w-10 h-10 bg-gray-100 rounded-lg font-bold">+</button></div></div>
          )}
          {settings.mode === 'comanda' && (
             <div><label className="block text-sm font-bold text-gray-500 mb-1">Identificação / Local</label><input autoFocus value={location} onChange={e => setLocation(e.target.value)} className="w-full border p-3 rounded-xl font-bold" placeholder="Ex: João - Mesa 12" /></div>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <button onClick={() => onConfirm(people, location)} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg">ABRIR</button>
            <div className="flex gap-2"><button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button><button onClick={onReserve} className="flex-1 py-3 text-yellow-600 bg-yellow-50 font-bold hover:bg-yellow-100 rounded-xl flex items-center justify-center gap-1"><Lock size={16}/> Reservar</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceabilityModal({ transaction, onClose }: { transaction: FinancialTransaction, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-4 text-white font-bold flex justify-between items-center">
            <span className="flex items-center gap-2"><Activity size={20}/> Rastreabilidade</span>
            <button onClick={onClose}><X /></button>
        </div>
        <div className="p-8 relative">
            <div className="absolute left-10 top-8 bottom-8 w-1 bg-gray-200"></div>
            <div className="space-y-8 relative">
                {/* Evento 1: Origem */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-4 border-white shadow-sm z-10">
                        {transaction.origin === 'compra' ? <Truck size={20}/> : transaction.origin === 'venda' ? <ShoppingCart size={20}/> : transaction.origin === 'taxa' ? <Receipt size={20}/> : <Wallet size={20}/>}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg capitalize">{transaction.origin}</h4>
                        <p className="text-sm text-gray-500">Origem da operação</p>
                        {transaction.relatedId && <div className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 font-mono">ID: {transaction.relatedId.slice(-8)}</div>}
                    </div>
                </div>
                 {/* Evento 2: Processamento Financeiro */}
                 <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center border-4 border-white shadow-sm z-10">
                        <Banknote size={20}/>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">Lançamento Financeiro</h4>
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                        <p className={`font-bold mt-1 ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>Valor: R$ {Math.abs(transaction.amount).toFixed(2)}</p>
                    </div>
                </div>
                {/* Evento 3: Status Atual */}
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 ${transaction.status === 'pago' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {transaction.status === 'pago' ? <CheckCircle size={20}/> : <Clock size={20}/>}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">{transaction.status === 'pago' ? 'Liquidado' : 'Aguardando'}</h4>
                        <p className="text-sm text-gray-500">Data Prevista/Pagto: {transaction.dueDate}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function ActionsModal({ tab, allTabs, onClose, onTransferTable, onMergeTable, onTransferItems }: { tab: Tab, allTabs: Tab[], onClose: () => void, onTransferTable: (targetId: string) => void, onMergeTable: (targetId: string) => void, onTransferItems: (targetId: string, itemIds: string[]) => void }) {
  const [view, setView] = useState<'menu' | 'transfer' | 'merge' | 'items'>('menu');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const freeTabs = allTabs.filter(t => t.status === 'livre');
  const busyTabs = allTabs.filter(t => t.status === 'ocupada' && t.id !== tab.id);
  const handleAction = () => { if (!selectedTarget) return; if (view === 'transfer') onTransferTable(selectedTarget); if (view === 'merge') onMergeTable(selectedTarget); if (view === 'items') onTransferItems(selectedTarget, selectedItems); onClose(); };
  const toggleItem = (id: string) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-4 text-white font-bold flex justify-between items-center"><span>Gerenciar {tab.label}</span><button onClick={onClose}><X /></button></div>
        <div className="p-6 flex-1 overflow-auto">
          {view === 'menu' && (
             <div className="space-y-3"><button onClick={() => setView('transfer')} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-blue-50 transition-colors"><div className="bg-blue-100 p-3 rounded-full text-blue-600"><ArrowLeftRight /></div><div className="text-left"><div className="font-bold text-gray-800">Trocar de Mesa</div><div className="text-xs text-gray-500">Mover todos os pedidos.</div></div></button><button onClick={() => setView('merge')} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-purple-50 transition-colors"><div className="bg-purple-100 p-3 rounded-full text-purple-600"><Merge /></div><div className="text-left"><div className="font-bold text-gray-800">Juntar/Unificar</div><div className="text-xs text-gray-500">Unir com outra mesa.</div></div></button><button onClick={() => setView('items')} className="w-full p-4 border rounded-xl flex items-center gap-4 hover:bg-orange-50 transition-colors"><div className="bg-orange-100 p-3 rounded-full text-orange-600"><LogOut /></div><div className="text-left"><div className="font-bold text-gray-800">Transferir Itens</div><div className="text-xs text-gray-500">Mover produtos específicos.</div></div></button></div>
          )}
          {view === 'transfer' && (<div><h4 className="font-bold mb-3 text-gray-700">Selecione o Destino (Livre):</h4><div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">{freeTabs.map(t => (<button key={t.id} onClick={() => setSelectedTarget(t.id)} className={`p-2 border rounded text-sm font-bold ${selectedTarget === t.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}>{t.label}</button>))}</div></div>)}
          {view === 'merge' && (<div><h4 className="font-bold mb-3 text-gray-700">Juntar com (Ocupada):</h4><div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto">{busyTabs.map(t => (<button key={t.id} onClick={() => setSelectedTarget(t.id)} className={`p-2 border rounded text-sm font-bold ${selectedTarget === t.id ? 'bg-purple-600 text-white' : 'hover:bg-gray-50'}`}>{t.label}</button>))}</div></div>)}
          {view === 'items' && (<div><h4 className="font-bold mb-2 text-gray-700">1. Selecione os Itens:</h4><div className="border rounded-lg max-h-40 overflow-auto mb-4 p-2 space-y-2">{tab.items.map(item => (<div key={item.cartId} onClick={() => toggleItem(item.cartId)} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${selectedItems.includes(item.cartId) ? 'bg-orange-50 border-orange-500' : ''}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedItems.includes(item.cartId) ? 'bg-orange-500 border-orange-500 text-white' : ''}`}>{selectedItems.includes(item.cartId) && <Check size={10}/>}</div><span className="text-xs font-bold">{item.quantity}x {item.product.name}</span></div>))}</div><h4 className="font-bold mb-2 text-gray-700">2. Selecione o Destino:</h4><select className="w-full border p-2 rounded" value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)}><option value="">Selecione...</option>{allTabs.filter(t => t.id !== tab.id).map(t => (<option key={t.id} value={t.id}>{t.label} ({t.status})</option>))}</select></div>)}
        </div>
        {view !== 'menu' && (<div className="p-4 border-t bg-gray-50 flex gap-2"><button onClick={() => setView('menu')} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Voltar</button><button onClick={handleAction} disabled={!selectedTarget || (view === 'items' && selectedItems.length === 0)} className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50">Confirmar</button></div>)}
      </div>
    </div>
  );
}

// ==========================================
// 3. TELAS (SCREENS)
// ==========================================

function TablesScreen({ tabs, settings, onSelectTab, onUpdateSettings }: { tabs: Tab[], settings: AppSettings, onSelectTab: (tab: Tab) => void, onUpdateSettings: (s: AppSettings) => void }) {
  const [showConfig, setShowConfig] = useState(false);
  const [tempCount, setTempCount] = useState(settings.tableCount);
  const [tempMode, setTempMode] = useState(settings.mode);
  useEffect(() => { setTempCount(settings.tableCount); setTempMode(settings.mode); }, [showConfig, settings]);
  const handleSaveConfig = () => { onUpdateSettings({ mode: tempMode, tableCount: Number(tempCount) }); setShowConfig(false); };
  const getDuration = (timestamp?: number) => { if (!timestamp) return ''; const diff = Math.floor((Date.now() - timestamp) / 1000 / 60); return diff > 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff} min`; };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-100 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">{settings.mode === 'mesa' ? <Armchair className="text-blue-600" /> : <ClipboardList className="text-blue-600" />} Gestão de {settings.mode === 'mesa' ? 'Mesas' : 'Comandas'}</h2><p className="text-gray-500 text-sm">{tabs.filter(t => t.status === 'ocupada').length} abertas de {tabs.length} totais</p></div>
        <div className="flex items-center gap-4"><div className="flex gap-2 text-xs font-bold bg-white p-2 rounded-lg shadow-sm"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Livre</div><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Ocupada</div><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Reservada</div></div><button onClick={() => setShowConfig(true)} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300"><Settings size={20} className="text-slate-700" /></button></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onSelectTab(tab)} className={`relative p-3 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md flex flex-col justify-between h-36 group ${tab.status === 'livre' ? 'bg-white border-gray-200 hover:border-green-400 text-gray-600' : tab.status === 'reservada' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div className="flex justify-between items-start w-full"><span className="font-black text-xl">{tab.number}</span>{tab.status === 'ocupada' && <Clock size={14} className="opacity-50" />}{tab.status === 'reservada' && <Lock size={14} />}</div>
            <div className="text-center font-bold text-sm my-1 leading-tight">{tab.label}</div>
            {tab.status === 'livre' ? (<div className="mt-auto text-xs text-green-600 font-bold bg-green-50 py-1 rounded w-full">LIVRE</div>) : tab.status === 'reservada' ? (<div className="mt-auto text-xs text-yellow-700 font-bold bg-yellow-100 py-1 rounded w-full">RESERVADA</div>) : (<div className="mt-auto w-full bg-white/50 p-1 rounded"><div className="font-black text-lg">R$ {tab.total.toFixed(2)}</div><div className="flex justify-between text-[10px] font-medium opacity-80 mt-1"><span className="flex items-center gap-0.5"><Users size={10}/> {tab.peopleCount}</span><span>{getDuration(tab.openedAt)}</span></div>{tab.location && <div className="text-[10px] mt-1 truncate border-t pt-0.5">{tab.location}</div>}</div>)}
          </button>
        ))}
      </div>
      {showConfig && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-xl p-6 w-full max-w-sm animate-fade-in"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20}/> Configurações</h3><div className="mb-4"><label className="block text-sm font-bold text-gray-500 mb-1">Modo</label><div className="flex gap-2"><button onClick={() => setTempMode('mesa')} className={`flex-1 py-2 rounded-lg font-bold border-2 ${tempMode === 'mesa' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>Mesas</button><button onClick={() => setTempMode('comanda')} className={`flex-1 py-2 rounded-lg font-bold border-2 ${tempMode === 'comanda' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>Comandas</button></div></div><div className="mb-6"><label className="block text-sm font-bold text-gray-500 mb-1">Quantidade</label><input type="number" value={tempCount} onChange={e => setTempCount(Number(e.target.value))} className="w-full border p-2 rounded-lg font-bold" /></div><div className="flex gap-2"><button onClick={() => setShowConfig(false)} className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={handleSaveConfig} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button></div></div></div>)}
    </div>
  );
}

function POSScreen({ 
  products, activeTab, allTabs, settings, paymentMethods, onAddToTab, onCloseTab, onBack, onVoidItem, onManageActions 
}: any) { 
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [currentSelections, setCurrentSelections] = useState<{ [stepId: string]: string[] }>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // PAGAMENTO (DINAMICO)
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [partialSelection, setPartialSelection] = useState<string[]>([]);
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [obsText, setObsText] = useState('');
  const [showActions, setShowActions] = useState(false);

  // PROTEÇÃO CONTRA UNDEFINED
  const safePaymentMethods = paymentMethods || [];

  const visibleProducts = products.filter((p: Product) => p.type === 'venda' && (selectedCategory === 'all' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentCartTotal = cart.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);
  const itemsToPay = isCheckoutOpen ? (partialSelection.length > 0 ? activeTab?.items.filter((i: CartItem) => partialSelection.includes(i.cartId)) || [] : [...(activeTab?.items || []), ...cart]) : [];
  const totalToPay = itemsToPay.reduce((acc: number, i: CartItem) => acc + (i.finalPrice * i.quantity), 0);
  const changeAmount = (safePaymentMethods.find((m: PaymentMethod) => m.id === selectedMethodId)?.type === 'dinheiro') && cashAmount ? Math.max(0, Number(cashAmount) - totalToPay) : 0;
  
  const splitValue = activeTab && activeTab.peopleCount > 1 && settings.mode === 'mesa' ? totalToPay / activeTab.peopleCount : totalToPay;

  const handleProductClick = (product: Product) => { if (product.steps?.length) { setCustomizingProduct(product); setCurrentSelections({}); } else { addToCart(product, [], product.price); } };
  const addToCart = (product: Product, selectedOptions: any[], price: number) => {
    const existing = cart.findIndex(i => i.product.id === product.id && JSON.stringify(i.selectedOptions) === JSON.stringify(selectedOptions));
    if (existing >= 0) { const n = [...cart]; n[existing].quantity++; setCart(n); }
    else { setCart([...cart, { cartId: Date.now().toString(), product, quantity: 1, selectedOptions, finalPrice: price, observation: '' }]); }
  };
  const updateQuantity = (id: string, d: number) => setCart(cart.map(i => i.cartId === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const removeFromCart = (id: string) => setCart(cart.filter(i => i.cartId !== id));
  const handleVoidItemClick = (item: CartItem) => { const pwd = prompt("Senha do Gerente:"); if (pwd === '1234') onVoidItem(item.cartId); };
  const handleActions = (type: string, targetId: string, itemIds?: string[]) => { onManageActions(type, targetId, itemIds); setShowActions(false); };
  const toggleOption = (stepId: string, optionId: string, type: 'single' | 'multiple') => { setCurrentSelections(prev => { const current = prev[stepId] || []; if (type === 'single') return { ...prev, [stepId]: [optionId] }; return { ...prev, [stepId]: current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId] }; }); };
  const confirmCustomization = () => { if (!customizingProduct) return; const missing = customizingProduct.steps?.filter(s => s.required && !currentSelections[s.id]?.length); if (missing?.length) { alert(`Obrigatório: ${missing[0].title}`); return; } let finalPrice = customizingProduct.price; const optionsSummary: any[] = []; customizingProduct.steps?.forEach(s => (currentSelections[s.id] || []).forEach(oid => { const opt = s.options.find(o => o.id === oid); if (opt) { finalPrice += opt.priceChange; optionsSummary.push({ stepTitle: s.title, optionName: opt.name, price: opt.priceChange }); } })); addToCart(customizingProduct, optionsSummary, finalPrice); setCustomizingProduct(null); };
  const togglePartialItem = (cartId: string) => setPartialSelection(prev => prev.includes(cartId) ? prev.filter(id => id !== cartId) : [...prev, cartId]);
  const selectAllForPayment = () => { if (!activeTab) return; if (partialSelection.length === activeTab.items.length) setPartialSelection([]); else setPartialSelection(activeTab.items.map((i: CartItem) => i.cartId)); };
  
  const handleMainAction = () => { if (activeTab) { if (cart.length > 0) { onAddToTab(cart); setCart([]); if (onBack) onBack(); } else { setPartialSelection([]); setIsCheckoutOpen(true); } } else { if (cart.length > 0) { setPartialSelection([]); setIsCheckoutOpen(true); } else alert("Carrinho vazio!"); } };
  
  const finalizePayment = () => { 
      if (!selectedMethodId) { alert("Selecione uma forma de pagamento!"); return; }
      const finalItems = partialSelection.length > 0 ? activeTab?.items.filter((i: CartItem) => partialSelection.includes(i.cartId)) || [] : (activeTab ? activeTab.items : cart); 
      onCloseTab(finalItems, selectedMethodId, totalToPay); 
      setIsCheckoutOpen(false); setCart([]); alert("Pagamento Confirmado!"); 
  };

  return (
    <div className="flex h-full animate-fade-in bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white p-4 shadow-sm z-10 flex gap-4 items-center">
          {onBack && <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowRight className="rotate-180" /></button>}
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        </div>
        <div className="flex gap-2 p-2 bg-white border-t overflow-x-auto">{['all', 'comida', 'bebida', 'sobremesa'].map(c => (<button key={c} onClick={() => setSelectedCategory(c as any)} className={`px-4 py-1 rounded-full text-sm font-bold capitalize ${selectedCategory === c ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{c === 'all' ? 'Todos' : c}</button>))}</div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">{visibleProducts.map((p: Product) => (<button key={p.id} onClick={() => handleProductClick(p)} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all text-left flex flex-col h-full border border-transparent hover:border-blue-500 group relative overflow-hidden"><div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Store className="text-gray-300" size={40} />}</div><div className="font-bold text-gray-800 leading-tight mb-1">{p.name}</div>{p.steps?.length ? <div className="text-[10px] text-blue-600 font-bold mb-2 bg-blue-50 inline-block px-1 rounded">Opções</div> : null}<div className="mt-auto text-green-700 font-black text-lg">R$ {p.price.toFixed(2)}</div></button>))}</div>
        </div>
      </div>
      <div className="w-96 bg-white shadow-2xl flex flex-col border-l relative z-20">
        <div className="p-4 bg-slate-900 text-white">{activeTab ? (<div className="flex justify-between items-start"><div><h2 className="text-xl font-black text-yellow-400 flex items-center gap-2">{activeTab.label}<button onClick={() => setShowActions(true)} className="bg-yellow-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-yellow-400">⚡ AÇÕES</button></h2><div className="flex gap-2 text-xs opacity-70 mt-1">{settings.mode === 'mesa' && <span className="flex items-center gap-1"><Users size={12}/> {activeTab.peopleCount}p</span>}{activeTab.location && <span>• {activeTab.location}</span>}</div></div><div className="text-right"><p className="text-xs opacity-70">Total Parcial</p><p className="font-bold text-lg">R$ {(activeTab.total + currentCartTotal).toFixed(2)}</p></div></div>) : (<div className="flex justify-between items-center"><h2 className="text-xl font-black text-white flex items-center gap-2"><Store /> PDV Rápido</h2><div className="text-right"><p className="text-xs opacity-70">Total</p><p className="font-bold text-lg">R$ {currentCartTotal.toFixed(2)}</p></div></div>)}</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab && activeTab.items.length > 0 && cart.length === 0 && (<div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100"><div className="flex items-center justify-between mb-2 text-yellow-800 font-bold text-sm"><span className="flex items-center gap-1"><History size={14}/> Pedidos Lançados</span></div><div className="space-y-2 text-sm text-gray-700">{activeTab.items.map((i: CartItem, idx: number) => (<div key={idx} className="flex justify-between items-start border-b border-yellow-200 last:border-0 pb-1 group"><div className="flex-1"><div>{i.quantity}x {i.product.name}</div>{i.selectedOptions.length > 0 && <div className="text-[10px] text-gray-500">{i.selectedOptions.map(o=>o.optionName).join(', ')}</div>}</div><div className="flex items-center gap-2"><span className="font-mono">R$ {(i.finalPrice * i.quantity).toFixed(2)}</span><button onClick={() => handleVoidItemClick(i)} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button></div></div>))}</div></div>)}
          {cart.length > 0 && <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2">Novos Itens</div>}
          {cart.map(item => (<div key={item.cartId} className="border-b pb-2 last:border-0 relative"><div className="flex justify-between items-start"><div className="flex-1 pr-2"><div className="font-bold text-gray-800 text-sm">{item.product.name}</div>{item.selectedOptions.map((o, i) => <span key={i} className="text-[10px] bg-gray-100 px-1 rounded mr-1">+ {o.optionName}</span>)}{item.observation && <div className="text-xs text-orange-600 italic">"{item.observation}"</div>}<button onClick={() => { setEditingObsId(item.cartId); setObsText(item.observation||''); }} className="text-[10px] text-blue-500 font-bold block mt-1 hover:underline">📝 Obs</button></div><div className="text-right"><div className="font-bold text-gray-800">R$ {(item.finalPrice * item.quantity).toFixed(2)}</div></div></div><div className="flex justify-between items-center bg-gray-50 p-1 rounded mt-1"><div className="flex items-center gap-2"><button onClick={() => item.quantity > 1 ? updateQuantity(item.cartId, -1) : removeFromCart(item.cartId)} className="w-6 h-6 bg-white border rounded flex items-center justify-center text-red-500"><Minus size={12}/></button><span className="font-bold text-sm w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.cartId, 1)} className="w-6 h-6 bg-white border rounded flex items-center justify-center text-blue-500"><Plus size={12}/></button></div><button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button></div></div>))}
        </div>
        <div className="p-4 bg-white border-t shadow-lg z-30"><button onClick={handleMainAction} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${activeTab && cart.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : activeTab ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>{activeTab ? (cart.length > 0 ? 'LANÇAR PEDIDO 👨‍🍳' : 'FECHAR CONTA 💰') : 'FINALIZAR VENDA ✅'}</button></div>
      </div>
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"><div className="bg-slate-900 p-4 text-white flex justify-between items-center"><div><h2 className="font-bold text-lg">Pagamento: {activeTab ? activeTab.label : 'Venda Balcão'}</h2><p className="text-xs opacity-70">Selecione os itens para pagar agora</p></div><button onClick={() => setIsCheckoutOpen(false)}><X /></button></div><div className="flex-1 overflow-auto p-4">{activeTab && (<div className="flex justify-between mb-2"><button onClick={selectAllForPayment} className="text-xs font-bold text-blue-600 hover:underline">Selecionar Todos</button><span className="text-xs text-gray-500">{partialSelection.length} itens selecionados</span></div>)}<div className="space-y-2">{(activeTab ? activeTab.items : cart).map((item: CartItem) => { const isChecked = partialSelection.includes(item.cartId) || !activeTab; return (<div key={item.cartId} onClick={() => activeTab && togglePartialItem(item.cartId)} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isChecked ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}><div className={`w-5 h-5 rounded border flex items-center justify-center ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{isChecked && <Check size={12}/>}</div><div className="flex-1"><div className="font-bold text-gray-800">{item.product.name}</div><div className="text-xs text-gray-500">{item.quantity} unidade(s)</div></div><div className="font-bold text-gray-700">R$ {(item.finalPrice * item.quantity).toFixed(2)}</div></div>) })}</div></div><div className="bg-gray-50 p-4 border-t"><div className="flex justify-between items-center mb-4"><div><span className="block text-xs text-gray-500 uppercase font-bold">Total a Pagar Agora</span><span className="text-3xl font-black text-slate-900">R$ {totalToPay.toFixed(2)}</span></div>{settings.mode === 'mesa' && activeTab && activeTab.peopleCount > 1 && (<div className="text-right"><span className="block text-xs text-gray-500 uppercase font-bold flex items-center gap-1 justify-end"><Users size={12}/> Por Pessoa ({activeTab.peopleCount})</span><span className="text-xl font-bold text-blue-600">R$ {splitValue.toFixed(2)}</span></div>)}</div><div className="grid grid-cols-3 gap-2 mb-4">{safePaymentMethods.map((m: PaymentMethod) => (<button key={m.id} onClick={() => setSelectedMethodId(m.id)} className={`p-2 border-2 rounded-lg capitalize font-bold text-xs ${selectedMethodId === m.id ? 'border-green-500 bg-green-100 text-green-800' : 'border-gray-200 bg-white'}`}>{m.name}</button>))}</div>{safePaymentMethods.find((m: PaymentMethod) => m.id === selectedMethodId)?.type === 'dinheiro' && (<div className="mb-4"><div className="flex justify-between items-center bg-white p-2 rounded border mb-2"><span className="font-bold text-sm">Entregue:</span><input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-24 text-right font-bold outline-none" placeholder="0.00" /></div><div className="text-right text-sm font-bold text-gray-600">Troco: <span className="text-green-600">R$ {changeAmount.toFixed(2)}</span></div></div>)}<button onClick={finalizePayment} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg">{partialSelection.length > 0 && activeTab && partialSelection.length < activeTab.items.length ? 'PAGAR PARCIAL E MANTER MESA' : 'PAGAR E FECHAR'}</button></div></div></div>
      )}
      {showActions && activeTab && (<ActionsModal tab={activeTab} allTabs={allTabs} onClose={() => setShowActions(false)} onTransferTable={(tId) => handleActions('transfer', tId)} onMergeTable={(tId) => handleActions('merge', tId)} onTransferItems={(tId, ids) => handleActions('items', tId, ids)} />)}
      {editingObsId && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded-xl w-80 shadow-2xl animate-fade-in"><h3 className="font-bold mb-2">Observação</h3><textarea value={obsText} onChange={e => setObsText(e.target.value)} className="w-full border p-2 rounded h-24 outline-none focus:ring-2 ring-blue-500" autoFocus /><div className="flex gap-2 mt-2"><button onClick={() => setEditingObsId(null)} className="flex-1 bg-gray-100 rounded p-2 text-sm font-bold">Cancelar</button><button onClick={() => { setCart(cart.map(i => i.cartId === editingObsId ? { ...i, observation: obsText } : i)); setEditingObsId(null); }} className="flex-1 bg-blue-600 text-white rounded p-2 text-sm font-bold">Salvar</button></div></div></div>)}
      {customizingProduct && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in"><div className="p-4 bg-slate-900 text-white font-bold flex justify-between items-center"><span className="text-lg">{customizingProduct.name}</span><button onClick={() => setCustomizingProduct(null)}><X /></button></div><div className="p-4 space-y-4 overflow-y-auto flex-1">{customizingProduct.steps?.map(s => (<div key={s.id} className="border-b pb-3"><div className="font-bold mb-2 text-gray-800 flex justify-between">{s.title} {s.required && <span className="text-[10px] bg-red-100 text-red-600 px-2 rounded-full flex items-center">Obrigatório</span>}</div><div className="grid gap-2">{s.options.map(o => { const sel = (currentSelections[s.id]||[]).includes(o.id); return (<button key={o.id} onClick={() => toggleOption(s.id, o.id, s.type)} className={`w-full text-left p-3 border-2 rounded-lg flex justify-between transition-all ${sel ? 'bg-green-50 border-green-500 text-green-900' : 'hover:bg-gray-50 border-gray-100'}`}><span>{o.name}</span><span className="font-bold text-sm">{o.priceChange > 0 ? `+${o.priceChange.toFixed(2)}` : 'Grátis'}</span></button>) })}</div></div>))}</div><div className="p-4 border-t bg-gray-50"><button onClick={confirmCustomization} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg">ADICIONAR AO PEDIDO</button></div></div></div>)}
    </div>
  );
}

function FinancialScreen({ transactions, paymentMethods, onAddMethod, onDeleteMethod, onUpdateTransaction }: { transactions: FinancialTransaction[], paymentMethods: PaymentMethod[], onAddMethod: (m: PaymentMethod) => void, onDeleteMethod: (id: string) => void, onUpdateTransaction: (t: FinancialTransaction) => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'extract' | 'config'>('dashboard');
  const [showTraceModal, setShowTraceModal] = useState<FinancialTransaction | null>(null);
  
  const totalRevenue = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalRevenue - totalExpense;

  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({ type: 'credito', taxRate: 0, settlementDays: 0 });

  return (
    <div className="p-6 h-full overflow-auto bg-gray-100 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Wallet className="text-blue-600" /> Financeiro</h2>
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md font-bold text-sm flex gap-2 ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><PieChart size={16}/> Visão Geral</button>
          <button onClick={() => setActiveTab('extract')} className={`px-4 py-2 rounded-md font-bold text-sm flex gap-2 ${activeTab === 'extract' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><ListPlus size={16}/> Extrato</button>
          <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-md font-bold text-sm flex gap-2 ${activeTab === 'config' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Settings size={16}/> Config. Pagamentos</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100"><div className="text-xs font-bold text-green-600 uppercase mb-1 flex items-center gap-1"><TrendingUp size={14}/> Receitas (Líquidas)</div><div className="text-3xl font-black text-gray-800">R$ {totalRevenue.toFixed(2)}</div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100"><div className="text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1"><TrendingDown size={14}/> Despesas (e Taxas)</div><div className="text-3xl font-black text-gray-800">R$ {totalExpense.toFixed(2)}</div></div>
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white"><div className="text-xs font-bold text-blue-300 uppercase mb-1 flex items-center gap-1"><DollarSign size={14}/> Saldo Líquido</div><div className="text-3xl font-black">R$ {balance.toFixed(2)}</div></div>
         </div>
      )}

      {activeTab === 'extract' && (
         <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs"><tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Origem</th><th className="p-4">Valor</th><th className="p-4">Status</th><th className="p-4 text-center">Ações</th></tr></thead><tbody className="divide-y">{transactions.slice().reverse().map(t => (<tr key={t.id} className="hover:bg-gray-50"><td className="p-4 text-sm text-gray-600">{t.date}</td><td className="p-4 font-bold text-gray-700">{t.description} {t.paymentMethodName && <span className="text-xs bg-gray-100 px-1 rounded ml-1">{t.paymentMethodName}</span>}</td><td className="p-4"><span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded">{t.origin}</span></td><td className={`p-4 font-bold ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status.toUpperCase()}</span></td><td className="p-4 text-center flex justify-center gap-2"><button onClick={() => setShowTraceModal(t)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Eye size={16}/></button>{t.status === 'pendente' && <button onClick={() => onUpdateTransaction({...t, status: 'pago'})} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"><CheckCircle size={16}/></button>}</td></tr>))}</tbody></table></div>
      )}

      {activeTab === 'config' && (
         <div>
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex gap-4 items-end">
               <div><label className="text-xs font-bold text-gray-500">Nome</label><input className="border p-2 rounded w-40" placeholder="Ex: Visa Crédito" value={newMethod.name || ''} onChange={e => setNewMethod({...newMethod, name: e.target.value})}/></div>
               <div><label className="text-xs font-bold text-gray-500">Tipo</label><select className="border p-2 rounded w-32" value={newMethod.type} onChange={e => setNewMethod({...newMethod, type: e.target.value as any})}><option value="credito">Crédito</option><option value="debito">Débito</option><option value="dinheiro">Dinheiro</option><option value="pix">Pix</option><option value="voucher">VR/VA</option></select></div>
               <div><label className="text-xs font-bold text-gray-500">Taxa (%)</label><input type="number" className="border p-2 rounded w-24" placeholder="0.00" value={newMethod.taxRate || ''} onChange={e => setNewMethod({...newMethod, taxRate: Number(e.target.value)})}/></div>
               <div><label className="text-xs font-bold text-gray-500">Prazo (Dias)</label><input type="number" className="border p-2 rounded w-24" placeholder="0" value={newMethod.settlementDays || ''} onChange={e => setNewMethod({...newMethod, settlementDays: Number(e.target.value)})}/></div>
               <button onClick={() => { if(newMethod.name) { onAddMethod({ id: Date.now().toString(), name: newMethod.name!, type: newMethod.type || 'credito', taxRate: newMethod.taxRate || 0, settlementDays: newMethod.settlementDays || 0, active: true }); setNewMethod({type: 'credito', taxRate: 0, settlementDays: 0}); }}} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">Adicionar</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {paymentMethods.map(m => (
                  <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border relative group hover:border-blue-300">
                     <h4 className="font-bold text-gray-800">{m.name}</h4><div className="text-sm text-gray-500 mt-1">{m.type.toUpperCase()}</div>
                     <div className="flex justify-between mt-3 pt-3 border-t text-xs"><span className="text-red-500 font-bold">Taxa: {m.taxRate}%</span><span className="text-blue-600 font-bold">Recebe em: D+{m.settlementDays}</span></div>
                     <button onClick={() => onDeleteMethod(m.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
               ))}
            </div>
         </div>
      )}

      {showTraceModal && <TraceabilityModal transaction={showTraceModal} onClose={() => setShowTraceModal(null)} />}
    </div>
  );
}

function StockScreen({ 
  products, suppliers, purchaseOrders, movements,
  onSave, onDelete, onImportXml, onCreateSupplier 
}: { 
  products: Product[], suppliers: Supplier[], purchaseOrders: PurchaseOrder[], movements: StockMovement[],
  onSave: (p: Product) => void, onDelete: (id: string) => void, 
  onImportXml: (data: any) => void, onCreateSupplier: (s: Supplier) => void
}) {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'entry'>('inventory');
  const [xmlData, setXmlData] = useState<any>(null);
  const [matchedItems, setMatchedItems] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [pendingXmlIndex, setPendingXmlIndex] = useState<number | null>(null);

  // ESTADOS DO PRODUTO (Renomeados para evitar conflito com App)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'recipe' | 'steps'>('basic'); 
  const [formData, setFormData] = useState<Partial<Product>>({ type: 'venda', production: 'demanda', category: 'comida', unit: 'un', minStock: 5, lossPercentage: 0, stock: 0 });
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [steps, setSteps] = useState<SalesStep[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States para seleção de tipo de cadastro (novo)
  const [productClass, setProductClass] = useState<'revenda' | 'produzido' | 'insumo'>('revenda');

  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState(1);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepType, setNewStepType] = useState<'single'|'multiple'>('single');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const insumos = products.filter(p => p.type === 'insumo');
  const totalRecipeCost = recipe.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  const displayedCost = (formData.production === 'demanda' && recipe.length > 0) ? totalRecipeCost : (formData.costPrice || 0);
  const realCost = calculateRealCost(displayedCost, formData.lossPercentage || 0);

  // Atualiza os dados do formulário quando muda a "Classificação"
  useEffect(() => {
     if (productClass === 'revenda') {
         setFormData(prev => ({ ...prev, type: 'venda', production: 'estoque' }));
     } else if (productClass === 'produzido') {
         setFormData(prev => ({ ...prev, type: 'venda', production: 'demanda' }));
     } else if (productClass === 'insumo') {
         setFormData(prev => ({ ...prev, type: 'insumo', production: 'estoque' }));
     }
  }, [productClass]);

  const simulateXmlRead = () => {
    const mockXml = { nfe: '12345', date: new Date().toISOString().split('T')[0], supplier: { name: 'Atacadão das Bebidas LTDA', cnpj: '12.345.678/0001-99' }, items: [{ code: '7894900011517', name: 'Coca Cola 350ml', qty: 24, cost: 2.50 }, { code: '999888777', name: 'Copo Descartável 300ml', qty: 100, cost: 0.15 }], total: 75.00 };
    const existingSupplier = suppliers.find(s => s.cnpj === mockXml.supplier.cnpj);
    const matches = mockXml.items.map(item => { const product = products.find(p => p.code === item.code || p.name.toLowerCase() === item.name.toLowerCase()); return { ...item, matchedProductId: product?.id || '' }; });
    setXmlData({ ...mockXml, supplierId: existingSupplier?.id || null }); setMatchedItems(matches); setNewSupplierName(mockXml.supplier.name);
  };

  const handleLinkProduct = (index: number, value: string) => {
    if (value === '__NEW__') {
       const item = matchedItems[index];
       setPendingXmlIndex(index);
       handleNewItem(); 
       setFormData({
          name: item.name, costPrice: item.cost, price: item.cost * 2, type: 'insumo', production: 'estoque', category: 'ingrediente', unit: 'un', stock: 0, minStock: 5, lossPercentage: 0
       });
       setProductClass('insumo'); // Padrão para compras
    } else {
       const updated = [...matchedItems]; updated[index].matchedProductId = value; setMatchedItems(updated);
    }
  };

  const finalizeImport = () => {
    let finalSupplierId = xmlData.supplierId;
    if (!finalSupplierId) { finalSupplierId = Date.now().toString(); onCreateSupplier({ id: finalSupplierId, name: newSupplierName, cnpj: xmlData.supplier.cnpj }); }
    const itemsToProcess = matchedItems.map(item => { if (!item.matchedProductId) return null; return { productId: item.matchedProductId, addQty: item.quantity, newCost: item.cost }; }).filter(Boolean);
    onImportXml({ supplierId: finalSupplierId, items: itemsToProcess, totalValue: xmlData.total, poId: selectedPoId, dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0] });
    setXmlData(null); setMatchedItems([]); alert("Nota Importada com Sucesso!"); setActiveSubTab('inventory');
  };

  const handleNewItem = () => {
      setFormData({ type: 'venda', production: 'demanda', category: 'comida', unit: 'un', minStock: 5, lossPercentage: 0, stock: 0 });
      setProductClass('produzido'); // Reset padrão
      setRecipe([]); setSteps([]); setEditingId(null); setIsFormOpen(true); setActiveFormTab('basic');
  };

  const handleEdit = (product: Product) => { 
      setFormData(product); setRecipe(product.recipe || []); setSteps(product.steps || []); setEditingId(product.id); setIsFormOpen(true); setActiveFormTab('basic'); 
      // Deduzir classificação
      if (product.type === 'insumo') setProductClass('insumo');
      else if (product.production === 'estoque') setProductClass('revenda');
      else setProductClass('produzido');
  };

  const handleAddIngredient = () => { if (!selectedIngredientId) return; const ing = products.find(p => p.id === selectedIngredientId); if (ing) { setRecipe([...recipe, { ingredientId: ing.id, name: ing.name, quantity: ingredientQty, unit: ing.unit, cost: ing.realCost }]); setSelectedIngredientId(''); setIngredientQty(1); } };
  const addStep = () => { if (!newStepTitle) return; setSteps([...steps, { id: Date.now().toString(), title: newStepTitle, type: newStepType, required: true, options: [] }]); setNewStepTitle(''); };
  const addOptionToStep = (stepIndex: number) => { if (!newOptionName) return; const updatedSteps = [...steps]; updatedSteps[stepIndex].options.push({ id: Date.now().toString(), name: newOptionName, priceChange: Number(newOptionPrice) }); setSteps(updatedSteps); setNewOptionName(''); setNewOptionPrice(0); };
  const removeStep = (index: number) => { setSteps(steps.filter((_, i) => i !== index)); };
  
  const handleSubmit = (e: FormEvent) => { 
      e.preventDefault(); 
      if (!formData.name) return; 
      const newId = editingId || Date.now().toString();
      const newProduct: Product = { id: newId, code: formData.code || 'AUTO', name: formData.name, description: formData.description || '', unit: formData.unit as Unit, minStock: Number(formData.minStock || 0), price: Number(formData.price || 0), costPrice: displayedCost, lossPercentage: Number(formData.lossPercentage || 0), realCost: realCost, stock: Number(formData.stock || 0), category: formData.category as Category, type: formData.type as ProductType, production: formData.production as ProductionType, imageUrl: formData.imageUrl || '', recipe: recipe, steps: steps };
      onSave(newProduct); 
      if (pendingXmlIndex !== null) { const updatedMatches = [...matchedItems]; updatedMatches[pendingXmlIndex].matchedProductId = newId; setMatchedItems(updatedMatches); setPendingXmlIndex(null); alert("Produto cadastrado e vinculado à nota!"); } else { alert("Salvo!"); }
      setRecipe([]); setSteps([]); setFormData({ type: 'venda', production: 'demanda', category: 'comida' }); setEditingId(null); setIsFormOpen(false); 
  };

  return (
    <div className="p-6 pb-20 overflow-auto h-full animate-fade-in bg-gray-50">
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-blue-600" /> Controle de Estoque</h2><div className="flex bg-white rounded-lg p-1 shadow-sm"><button onClick={() => setActiveSubTab('inventory')} className={`px-4 py-2 rounded-md font-bold text-sm ${activeSubTab === 'inventory' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Inventário</button><button onClick={() => setActiveSubTab('entry')} className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 ${activeSubTab === 'entry' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Upload size={16}/> Entrada XML</button></div></div>
      
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl mb-8 border border-blue-100 animate-fade-in overflow-hidden relative z-50">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center"><h3 className="font-bold text-blue-800">{editingId ? 'Editar Produto' : (pendingXmlIndex !== null ? 'Cadastrar Produto da Nota' : 'Novo Produto')}</h3><button type="button" onClick={() => { setIsFormOpen(false); setPendingXmlIndex(null); }}><X className="text-blue-400 hover:text-blue-700"/></button></div>
          <div className="flex border-b bg-gray-50">
            <button type="button" onClick={() => setActiveFormTab('basic')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 ${activeFormTab === 'basic' ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Box size={16} /> 1. Dados Básicos</button>
            {productClass === 'produzido' && (<button type="button" onClick={() => setActiveFormTab('recipe')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 ${activeFormTab === 'recipe' ? 'bg-white border-t-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}><ChefHat size={16} /> 2. Ficha Técnica</button>)}
            {productClass !== 'insumo' && (<button type="button" onClick={() => setActiveFormTab('steps')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 ${activeFormTab === 'steps' ? 'bg-white border-t-2 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}><Layers size={16} /> 3. Variações</button>)}
          </div>
          <div className="p-6">
            {activeFormTab === 'basic' && (
              <div className="animate-fade-in grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  
                  {/* SELETOR DE CLASSIFICAÇÃO (A Terceira Divisão) */}
                  <div className="md:col-span-6 mb-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Classificação do Item</label>
                     <div className="grid grid-cols-3 gap-4">
                        <button type="button" onClick={() => setProductClass('revenda')} className={`p-3 rounded-lg border-2 text-left transition-all ${productClass === 'revenda' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                            <div className="font-bold text-blue-900 mb-1 flex items-center gap-2"><ShoppingCart size={18}/> Revenda</div>
                            <div className="text-xs text-gray-500">Compra pronto e vende (Ex: Refri, Chocolate). Controla estoque.</div>
                        </button>
                        <button type="button" onClick={() => setProductClass('produzido')} className={`p-3 rounded-lg border-2 text-left transition-all ${productClass === 'produzido' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                            <div className="font-bold text-orange-900 mb-1 flex items-center gap-2"><ChefHat size={18}/> Produção</div>
                            <div className="text-xs text-gray-500">Feito na cozinha (Ex: Burger). Baixa estoque dos ingredientes.</div>
                        </button>
                        <button type="button" onClick={() => setProductClass('insumo')} className={`p-3 rounded-lg border-2 text-left transition-all ${productClass === 'insumo' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}`}>
                            <div className="font-bold text-green-900 mb-1 flex items-center gap-2"><Package size={18}/> Insumo</div>
                            <div className="text-xs text-gray-500">Matéria-prima (Ex: Farinha). Não aparece no PDV.</div>
                        </button>
                     </div>
                  </div>

                  <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-500 mb-1">Nome</label><input required onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name || ''} className="w-full border p-2 rounded-lg" placeholder="Nome do produto" /></div>
                  <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Categoria</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full border p-2 rounded-lg"><option value="comida">Comida</option><option value="bebida">Bebida</option><option value="sobremesa">Sobremesa</option><option value="ingrediente">Ingrediente</option><option value="embalagem">Embalagem</option><option value="diversos">Diversos</option></select></div>
                  <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">Unidade</label><select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as any})} className="w-full border p-2 rounded-lg"><option value="un">UN</option><option value="kg">KG</option><option value="l">L</option><option value="ml">ML</option></select></div>
                  
                  {productClass !== 'insumo' && (
                     <>
                        <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-500 mb-1">URL da Imagem</label><div className="flex gap-2"><input onChange={e => setFormData({...formData, imageUrl: e.target.value})} value={formData.imageUrl || ''} className="w-full border p-2 rounded-lg" placeholder="https://..." /><div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400">{formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover rounded" /> : <ImageIcon size={20} />}</div></div></div>
                        <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">Preço Venda</label><input type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold text-green-700 bg-green-50 border-green-200" /></div>
                     </>
                  )}

                  {/* CUSTOS E ESTOQUE (Dinâmico) */}
                  <div className="md:col-span-6 grid grid-cols-5 gap-4 bg-gray-50 p-3 rounded-lg mt-2 border border-gray-200">
                     {productClass !== 'produzido' && (<div><label className="block text-xs text-gray-500">Custo Compra</label><input type="number" step="0.01" value={formData.costPrice||''} onChange={e=>setFormData({...formData, costPrice:Number(e.target.value)})} className="w-full border p-2 rounded"/></div>)}
                     <div><label className="block text-xs text-gray-500">% Perda</label><input type="number" value={formData.lossPercentage||''} onChange={e=>setFormData({...formData, lossPercentage:Number(e.target.value)})} className="w-full border p-2 rounded"/></div>
                     <div><label className="block text-xs text-gray-500">Custo Real</label><div className="p-2 bg-gray-200 rounded font-bold text-gray-700">R$ {realCost.toFixed(2)}</div></div>
                     {productClass !== 'produzido' && (
                         <>
                           <div><label className="block text-xs text-gray-500">Estoque Atual</label><input type="number" value={formData.stock||''} onChange={e=>setFormData({...formData, stock:Number(e.target.value)})} className="w-full border p-2 rounded bg-white"/></div>
                           <div><label className="block text-xs text-gray-500">Mínimo</label><input type="number" value={formData.minStock||''} onChange={e=>setFormData({...formData, minStock:Number(e.target.value)})} className="w-full border p-2 rounded border-red-200 bg-red-50"/></div>
                         </>
                     )}
                  </div>
              </div>
            )}
            {activeFormTab === 'recipe' && (
              <div className="animate-fade-in bg-orange-50 p-4 rounded-xl border border-orange-200"><div className="flex gap-2 mb-3 items-end"><div className="flex-1"><select value={selectedIngredientId} onChange={e => setSelectedIngredientId(e.target.value)} className="w-full border p-2 rounded-lg"><option value="">Selecione...</option>{insumos.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div><div className="w-24"><input type="number" value={ingredientQty} onChange={e => setIngredientQty(Number(e.target.value))} className="w-full border p-2 rounded-lg" /></div><button type="button" onClick={handleAddIngredient} className="bg-orange-600 text-white p-2 rounded-lg"><Plus size={20} /></button></div>{recipe.map((item, idx) => (<div key={idx} className="flex justify-between bg-white p-2 rounded border mb-2"><span>{item.quantity} {item.unit} - {item.name}</span><button type="button" onClick={() => setRecipe(recipe.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={16} /></button></div>))}</div>
            )}
            {activeFormTab === 'steps' && (
              <div className="animate-fade-in space-y-4"><div className="flex gap-2 items-end bg-white p-3 rounded border"><div className="flex-1"><input value={newStepTitle} onChange={e => setNewStepTitle(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="Título" /></div><div><select value={newStepType} onChange={e => setNewStepType(e.target.value as any)} className="border p-2 rounded-lg"><option value="single">Única</option><option value="multiple">Múltipla</option></select></div><button type="button" onClick={addStep} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Add</button></div>{steps.map((step, index) => (<div key={step.id} className="bg-white border rounded-lg p-3"><div className="flex justify-between font-bold mb-2"><span>{step.title}</span><button type="button" onClick={() => removeStep(index)} className="text-red-500"><Trash2 size={16}/></button></div>{step.options.map(opt => (<div key={opt.id} className="text-sm flex justify-between border-b py-1"><span>{opt.name}</span><span>R$ {opt.priceChange}</span></div>))}<div className="flex gap-2 mt-2 pt-2 border-t"><input value={activeStepIndex === index ? newOptionName : ''} onChange={e => { setActiveStepIndex(index); setNewOptionName(e.target.value); }} className="flex-1 border p-1 rounded" placeholder="Opção" /><input type="number" value={activeStepIndex === index ? newOptionPrice : 0} onChange={e => { setActiveStepIndex(index); setNewOptionPrice(Number(e.target.value)); }} className="w-20 border p-1 rounded" /><button type="button" onClick={() => addOptionToStep(index)} className="bg-green-600 text-white p-1 rounded"><Plus size={16}/></button></div></div>))}</div>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t flex justify-end gap-3"><button type="button" onClick={() => { setIsFormOpen(false); setPendingXmlIndex(null); }} className="text-gray-500">Cancelar</button><button onClick={handleSubmit} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 flex gap-2"><Save size={20} /> SALVAR</button></div>
        </form>
      )}

      {activeSubTab === 'inventory' && !isFormOpen && (
        <>
          <div className="flex justify-between mb-4"><div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Pesquisar produto..." /></div><button onClick={handleNewItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow">+ Novo Item</button></div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs"><tr><th className="p-4">Produto</th><th className="p-4">Classificação</th><th className="p-4">Estoque</th><th className="p-4">Custo</th><th className="p-4">Venda</th><th className="p-4 text-right">Ação</th></tr></thead><tbody className="divide-y">{filteredProducts.map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="p-4 font-bold">{p.name}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.type === 'insumo' ? 'bg-green-100 text-green-700' : p.production === 'estoque' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{p.type === 'insumo' ? 'Insumo' : p.production === 'estoque' ? 'Revenda' : 'Produzido'}</span></td><td className="p-4">{p.production === 'demanda' ? '-' : `${p.stock} ${p.unit}`}</td><td className="p-4 text-gray-500">R$ {p.costPrice.toFixed(2)}</td><td className="p-4 text-green-600 font-bold">{p.type === 'venda' ? `R$ ${p.price.toFixed(2)}` : '-'}</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(p)} className="text-blue-500 bg-blue-50 p-2 rounded"><Pencil size={18}/></button><button onClick={() => onDelete(p.id)} className="text-red-500 bg-red-50 p-2 rounded"><Trash2 size={18}/></button></div></td></tr>))}</tbody></table></div>
        </>
      )}

      {activeSubTab === 'entry' && !isFormOpen && (
        <div className="animate-fade-in">
          {!xmlData ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center"><FileText size={48} className="mx-auto text-gray-400 mb-4" /><h3 className="text-xl font-bold text-gray-700 mb-2">Importar Nota Fiscal (XML)</h3><button onClick={simulateXmlRead} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 mx-auto"><Upload size={20} /> Simular Upload</button></div>
          ) : (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border"><h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Store size={18} /> Dados da Nota</h3><div className="grid grid-cols-3 gap-4"><div className="p-3 bg-gray-50 rounded-lg"><div className="text-xs text-gray-500 uppercase">Fornecedor</div><div className="font-bold text-lg">{xmlData.supplier.name}</div></div><div className="p-3 bg-gray-50 rounded-lg"><div className="text-xs text-gray-500 uppercase">Valor Total</div><div className="font-black text-2xl text-blue-600">R$ {xmlData.total.toFixed(2)}</div></div></div></div>
               <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><div className="divide-y">{matchedItems.map((item, idx) => (<div key={idx} className="p-4 flex items-center gap-4"><div className="flex-1"><div className="font-bold text-gray-800">{item.name}</div><div className="text-xs text-gray-500">Cód: {item.code} | Qtd: {item.quantity} | R$ {item.cost.toFixed(2)}</div></div><div className="flex-1"><select className={`w-full p-2 border rounded-lg text-sm font-bold ${!item.matchedProductId ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50 text-green-800'}`} value={item.matchedProductId || ''} onChange={(e) => handleLinkProduct(idx, e.target.value)}><option value="">-- Vincular Produto --</option><option value="__NEW__" className="font-bold text-blue-600">➕ CADASTRAR ESTE PRODUTO</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>))}</div></div>
               <div className="flex justify-end gap-3 pt-4"><button onClick={() => setXmlData(null)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl">Cancelar</button><button onClick={finalizeImport} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg flex items-center gap-2"><Check size={20} /> CONFIRMAR</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. TELA DE COMPRAS (PURCHASES)
// ==========================================
function PurchasesScreen({ 
  products, suppliers, orders, movements,
  onSaveSupplier, onDeleteSupplier, onSaveOrder, onUpdateOrderStatus 
}: { 
  products: Product[], suppliers: Supplier[], orders: PurchaseOrder[], movements: StockMovement[],
  onSaveSupplier: (s: Supplier) => void, onDeleteSupplier: (id: string) => void,
  onSaveOrder: (o: PurchaseOrder) => void, onUpdateOrderStatus: (id: string, status: 'entregue' | 'cancelado') => void
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers' | 'intelligence'>('intelligence');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  
  const [coverageDays, setCoverageDays] = useState(7); 
  const [onlyBelowMin, setOnlyBelowMin] = useState(false);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({});
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  const calculateSuggestions = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return products.map(p => {
       const exits = (movements || [])
          .filter(m => m.productId === p.id && m.type === 'out' && new Date(m.date) >= thirtyDaysAgo)
          .reduce((acc, m) => acc + m.quantity, 0);
       
       const avgDaily = exits / 30;
       const needed = (avgDaily * coverageDays) - p.stock;
       const suggested = needed > 0 ? Math.ceil(needed) : 0;

       return { ...p, avgDaily, suggested };
    }).filter(p => p.production !== 'demanda' && (onlyBelowMin ? p.stock < p.minStock : true));
  };

  const suggestions = calculateSuggestions();

  const handleGenerateAutoOrder = () => {
     if (selectedSuggestionIds.length === 0) return;
     const itemsToOrder = suggestions.filter(s => selectedSuggestionIds.includes(s.id));
     const preFilledItems = itemsToOrder.map(p => ({ productId: p.id, productName: p.name, quantity: p.suggested, cost: p.costPrice }));
     setOrderItems(preFilledItems);
     setOrderSupplierId(itemsToOrder[0].lastSupplierId || '');
     setIsFormOpen(true);
     setActiveTab('orders');
  };

  const handleSearchCnpj = async () => {
    const cleanCnpj = supplierForm.cnpj?.replace(/\D/g, '');
    if (!cleanCnpj || cleanCnpj.length !== 14) { alert("CNPJ inválido."); return; }
    setIsLoadingCNPJ(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) throw new Error("Erro");
      const data = await response.json();
      setSupplierForm(prev => ({ ...prev, name: data.razao_social, tradeName: data.nome_fantasia, phone: data.ddd_telefone_1, email: data.email, zip: data.cep, address: `${data.logradouro}, ${data.numero}`, neighborhood: data.bairro, city: data.municipio, state: data.uf }));
    } catch (error) { alert("Erro ao buscar CNPJ."); } finally { setIsLoadingCNPJ(false); }
  };

  const handleAddOrderItem = () => {
    if(!selectedProductId) {
      alert("Selecione um produto primeiro!");
      return;
    }
    const prod = products.find(p => p.id === selectedProductId);
    if(prod) { 
      setOrderItems([...orderItems, { productId: prod.id, productName: prod.name, quantity: itemQty, cost: itemCost }]); 
      setSelectedProductId(''); 
      setItemQty(1); 
      setItemCost(0); 
    }
  };

  const handleSaveOrder = () => {
    const supp = suppliers.find(s => s.id === orderSupplierId);
    if(!supp || orderItems.length === 0) return;
    onSaveOrder({ id: Date.now().toString(), supplierId: supp.id, supplierName: supp.name, status: 'aberto', items: orderItems, totalValue: orderItems.reduce((acc, i) => acc + (i.cost * i.quantity), 0), createdAt: new Date().toISOString().split('T')[0] });
    setIsFormOpen(false); setOrderItems([]); setOrderSupplierId('');
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-100 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShoppingBag className="text-blue-600" /> Compras</h2>
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          <button onClick={() => setActiveTab('intelligence')} className={`px-4 py-2 rounded-md font-bold text-sm flex gap-2 ${activeTab === 'intelligence' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Calculator size={16}/> Sugestão Inteligente</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-md font-bold text-sm flex gap-2 ${activeTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><FileText size={16}/> Pedidos</button>
          <button onClick={() => setActiveTab('suppliers')} className={`px-4 py-2 rounded-md font-bold text-sm flex gap-2 ${activeTab === 'suppliers' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Truck size={16}/> Fornecedores</button>
        </div>
      </div>

      {activeTab === 'intelligence' && (
         <div className="animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 mb-6 flex justify-between items-end">
               <div className="flex gap-8">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><RefreshCw size={12}/> Cobertura de Estoque (Dias)</label>
                     <div className="flex items-center gap-3">
                        <input type="range" min="1" max="60" value={coverageDays} onChange={e => setCoverageDays(Number(e.target.value))} className="w-48" />
                        <span className="font-black text-2xl text-blue-600">{coverageDays} dias</span>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 mb-2">Filtros</label>
                     <button onClick={() => setOnlyBelowMin(!onlyBelowMin)} className={`px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 ${onlyBelowMin ? 'bg-red-50 border-red-500 text-red-600' : 'bg-gray-50 border-gray-200'}`}>
                        <Filter size={16} /> Apenas Abaixo do Mínimo
                     </button>
                  </div>
               </div>
               <button onClick={handleGenerateAutoOrder} disabled={selectedSuggestionIds.length === 0} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  <ListPlus size={20} /> Gerar Pedido com Selecionados
               </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs">
                     <tr>
                        <th className="p-4 w-10"><input type="checkbox" onChange={(e) => setSelectedSuggestionIds(e.target.checked ? suggestions.map(s => s.id) : [])} /></th>
                        <th className="p-4">Produto</th>
                        <th className="p-4 text-center">Giro Diário (30d)</th>
                        <th className="p-4 text-center">Estoque Atual</th>
                        <th className="p-4 text-center">Sugestão</th>
                        <th className="p-4">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {suggestions.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                           <td className="p-4"><input type="checkbox" checked={selectedSuggestionIds.includes(p.id)} onChange={(e) => setSelectedSuggestionIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))} /></td>
                           <td className="p-4 font-bold text-gray-700">{p.name}</td>
                           <td className="p-4 text-center">{p.avgDaily.toFixed(2)} {p.unit}</td>
                           <td className="p-4 text-center font-mono">{p.stock}</td>
                           <td className="p-4 text-center">
                              <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{p.suggested} {p.unit}</span>
                           </td>
                           <td className="p-4">
                              {p.stock < p.minStock ? <span className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Crítico</span> : <span className="text-green-500 text-xs font-bold">Ok</span>}
                           </td>
                        </tr>
                     ))}
                     {suggestions.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma sugestão de compra baseada nos critérios.</td></tr>}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {activeTab === 'suppliers' && (
        <>
          <button onClick={() => { setIsFormOpen(true); setSupplierForm({}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold mb-4">+ Novo Fornecedor</button>
          {isFormOpen && (
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-blue-100 relative">
               <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
               <h3 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2"><Building size={20}/> Dados da Empresa</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                  <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1">CNPJ (Somente números)</label><div className="flex gap-2"><input className="border p-2 rounded-lg w-full font-bold" placeholder="00000000000000" value={supplierForm.cnpj || ''} onChange={e => setSupplierForm({...supplierForm, cnpj: e.target.value})} /><button onClick={handleSearchCnpj} disabled={isLoadingCNPJ} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{isLoadingCNPJ ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}</button></div></div>
                  <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-500 mb-1">Razão Social</label><input className="border p-2 rounded-lg w-full bg-gray-50" placeholder="Nome da Empresa" value={supplierForm.name || ''} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} /></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Nome Fantasia</label><input className="border p-2 rounded-lg w-full" value={supplierForm.tradeName || ''} onChange={e => setSupplierForm({...supplierForm, tradeName: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Telefone</label><input className="border p-2 rounded-lg w-full" value={supplierForm.phone || ''} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input className="border p-2 rounded-lg w-full" value={supplierForm.email || ''} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} /></div></div>
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-100"><h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><MapPin size={12}/> Endereço</h4><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><input className="border p-2 rounded" placeholder="CEP" value={supplierForm.zip || ''} onChange={e => setSupplierForm({...supplierForm, zip: e.target.value})} /><div className="md:col-span-3"><input className="border p-2 rounded w-full" placeholder="Rua, Número" value={supplierForm.address || ''} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} /></div><input className="border p-2 rounded" placeholder="Bairro" value={supplierForm.neighborhood || ''} onChange={e => setSupplierForm({...supplierForm, neighborhood: e.target.value})} /><input className="border p-2 rounded" placeholder="Cidade" value={supplierForm.city || ''} onChange={e => setSupplierForm({...supplierForm, city: e.target.value})} /><input className="border p-2 rounded" placeholder="UF" value={supplierForm.state || ''} onChange={e => setSupplierForm({...supplierForm, state: e.target.value})} /></div></div>
               <div className="flex justify-end gap-2 mt-6"><button onClick={() => setIsFormOpen(false)} className="text-gray-500 font-bold px-4">Cancelar</button><button onClick={() => { if(supplierForm.name) { onSaveSupplier({ id: Date.now().toString(), ...supplierForm } as Supplier); setIsFormOpen(false); } }} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow">SALVAR FORNECEDOR</button></div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{suppliers.map(s => (<div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors relative group"><h3 className="font-bold text-gray-800 flex items-center gap-2">{s.name}</h3><p className="text-xs text-blue-600 font-bold mb-2">{s.tradeName}</p><p className="text-xs text-gray-400 font-mono mb-3">{s.cnpj}</p><div className="space-y-1 text-xs text-gray-600 border-t pt-2">{s.city && <div className="flex items-center gap-2"><MapPin size={12}/> {s.city}/{s.state}</div>}{s.phone && <div className="flex items-center gap-2"><Phone size={12}/> {s.phone}</div>}{s.email && <div className="flex items-center gap-2 truncate"><Mail size={12}/> {s.email}</div>}</div><button onClick={() => onDeleteSupplier(s.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button></div>))}</div>
        </>
      )}

      {activeTab === 'orders' && (
        <>
          <button onClick={() => { setIsFormOpen(true); setOrderItems([]); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold mb-4">+ Novo Pedido</button>
          {isFormOpen && (
             <div className="bg-white p-6 rounded-xl shadow-xl mb-8 border-2 border-blue-100 relative">
                <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
                <h3 className="font-bold text-lg mb-4 text-blue-800">Criar Pedido de Compra</h3>
                <div className="mb-4"><label className="block text-xs font-bold text-gray-500 mb-1">Fornecedor</label><select className="w-full border p-2 rounded-lg font-bold" value={orderSupplierId} onChange={e => setOrderSupplierId(e.target.value)}><option value="">Selecione...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200"><div className="flex gap-2 items-end mb-2"><div className="flex-1"><label className="text-xs font-bold text-gray-500">Produto</label><select className="w-full border p-2 rounded" value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); const p = products.find(prod => prod.id === e.target.value); if(p) setItemCost(p.costPrice); }}><option value="">Adicionar item...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="w-20"><label className="text-xs font-bold text-gray-500">Qtd</label><input type="number" className="w-full border p-2 rounded" value={itemQty} onChange={e => setItemQty(Number(e.target.value))} /></div><div className="w-24"><label className="text-xs font-bold text-gray-500">Custo UN</label><input type="number" className="w-full border p-2 rounded" value={itemCost} onChange={e => setItemCost(Number(e.target.value))} /></div><button onClick={handleAddOrderItem} className="bg-blue-600 text-white p-2 rounded"><Plus /></button></div><div className="space-y-1">{orderItems.map((item, idx) => (<div key={idx} className="flex justify-between text-sm border-b pb-1"><span>{item.quantity}x {item.productName}</span><span className="font-mono">R$ {(item.cost * item.quantity).toFixed(2)}</span></div>))}</div><div className="text-right font-bold mt-2 text-lg text-blue-700">Total: R$ {orderItems.reduce((acc, i) => acc + (i.cost * i.quantity), 0).toFixed(2)}</div></div>
                <button onClick={handleSaveOrder} disabled={!orderSupplierId || orderItems.length === 0} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50">CONFIRMAR PEDIDO</button>
             </div>
          )}
          <div className="space-y-4">{orders.map(order => (<div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center"><div><div className="font-bold text-gray-800 text-lg">#{order.id.slice(-4)} - {order.supplierName}</div><div className="text-sm text-gray-500 flex items-center gap-4"><span className="flex items-center gap-1"><Calendar size={14}/> {order.createdAt}</span><span className="flex items-center gap-1"><Box size={14}/> {order.items.length} itens</span></div></div><div className="flex items-center gap-4"><div className="text-right"><div className="text-xs text-gray-400 uppercase font-bold">Valor Total</div><div className="font-black text-xl text-gray-800">R$ {order.totalValue.toFixed(2)}</div></div>{order.status === 'aberto' ? (<div className="flex flex-col gap-1"><span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold text-center">PENDENTE</span><button onClick={() => onUpdateOrderStatus(order.id, 'entregue')} className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1"><CheckCircle size={12}/> Receber</button><button onClick={() => onUpdateOrderStatus(order.id, 'cancelado')} className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"><XCircle size={12}/> Cancelar</button></div>) : (<span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'entregue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{order.status.toUpperCase()}</span>)}</div></div>))}</div>
        </>
      )}
    </div>
  );
}

// ==========================================
// 6. APP PRINCIPAL
// ==========================================
function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'tables' | 'stock' | 'purchases' | 'financial'>('tables'); 
  const [settings, setSettings] = useState<AppSettings>(() => {
     const saved = localStorage.getItem('erp_settings');
     return saved ? JSON.parse(saved) : { mode: 'mesa', tableCount: 15 };
  });

  const [tabs, setTabs] = useState<Tab[]>(() => {
      const saved = localStorage.getItem('erp_tabs');
      if (saved) return JSON.parse(saved);
      return [];
  });

  // Novos Estados
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('erp_suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('erp_pos');
    return saved ? JSON.parse(saved) : [];
  });
  const [financial, setFinancial] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('erp_financial');
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState<Product[]>(() => { const saved = localStorage.getItem('erp_products'); return saved ? JSON.parse(saved) : []; });
  
  const [movements, setMovements] = useState<StockMovement[]>(() => {
     const saved = localStorage.getItem('erp_movements');
     if (!saved) return [];
     return JSON.parse(saved);
  });
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
     const saved = localStorage.getItem('erp_methods');
     return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Dinheiro', type: 'dinheiro', taxRate: 0, settlementDays: 0, active: true },
        { id: '2', name: 'Pix', type: 'pix', taxRate: 0, settlementDays: 0, active: true },
        { id: '3', name: 'Crédito Master', type: 'credito', taxRate: 3.5, settlementDays: 30, active: true }
     ];
  });

  // Atualiza mesas conforme configuração
  useEffect(() => {
     setTabs(prevTabs => {
        return Array.from({ length: settings.tableCount }, (_, i) => {
             const existing = prevTabs.find(t => t.number === i + 1);
             const prefix = settings.mode === 'mesa' ? 'Mesa' : 'Comanda';
             const label = `${prefix} ${String(i+1).padStart(2, '0')}`;
             if (existing) return { ...existing, label };
             return { id: `tab-${i+1}`, number: i + 1, label, status: 'livre', items: [], total: 0, peopleCount: 0 };
        });
     });
  }, [settings.tableCount, settings.mode]);

  useEffect(() => { localStorage.setItem('erp_tabs', JSON.stringify(tabs)); }, [tabs]);
  useEffect(() => { localStorage.setItem('erp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('erp_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('erp_pos', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('erp_financial', JSON.stringify(financial)); }, [financial]);
  useEffect(() => { localStorage.setItem('erp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('erp_movements', JSON.stringify(movements)); }, [movements]);
  useEffect(() => { localStorage.setItem('erp_methods', JSON.stringify(paymentMethods)); }, [paymentMethods]);

  const [currentTab, setCurrentTab] = useState<Tab | null>(null);
  const [openingTab, setOpeningTab] = useState<Tab | null>(null);

  const handleTabClick = (tab: Tab) => { if (tab.status === 'livre') setOpeningTab(tab); else { setCurrentTab(tab); setActiveTab('pos'); } };
  
  const confirmOpenTab = (people: number, location: string) => {
      if (!openingTab) return;
      const updated = tabs.map(t => t.id === openingTab.id ? { ...t, status: 'ocupada' as TabStatus, peopleCount: people, location, openedAt: Date.now() } : t);
      setTabs(updated); setCurrentTab({ ...openingTab, status: 'ocupada', peopleCount: people, location }); setOpeningTab(null); setActiveTab('pos');
  };

  const handleReserveTab = () => { if (!openingTab) return; setTabs(tabs.map(t => t.id === openingTab.id ? { ...t, status: 'reservada' as TabStatus } : t)); setOpeningTab(null); };

  const handleAddToTab = (newItems: CartItem[]) => {
      if (!currentTab) return;
      const updated = tabs.map(t => t.id === currentTab.id ? { ...t, items: [...t.items, ...newItems], total: [...t.items, ...newItems].reduce((acc, i) => acc + (i.finalPrice * i.quantity), 0) } : t);
      setTabs(updated); setActiveTab('tables'); setCurrentTab(null);
  };

  const handleCloseTab = (itemsToPay: CartItem[], methodId: string, amountPaid: number) => {
      // 1. Achar o metodo de pagamento para calcular taxas e prazos
      const method = paymentMethods.find(m => m.id === methodId);
      if (!method) return;

      // REGISTRAR MOVIMENTAÇÃO DE SAÍDA (VENDAS)
      const newMovements = itemsToPay.map(item => ({
         id: Date.now().toString() + Math.random(),
         productId: item.product.id,
         type: 'out' as const,
         quantity: item.quantity,
         date: new Date().toISOString()
      }));
      setMovements([...movements, ...newMovements]);

      // CALCULAR DATAS E VALORES (FINANCEIRO)
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + method.settlementDays);
      
      const taxAmount = amountPaid * (method.taxRate / 100);
      const netAmount = amountPaid - taxAmount; // VALOR LÍQUIDO QUE VAI CAIR NA CONTA
      
      // Lança Receita LÍQUIDA (A Receber ou Recebido)
      const revenueTransaction: FinancialTransaction = { 
          id: Date.now().toString(), 
          type: 'receita', 
          amount: netAmount, 
          description: `Venda ${currentTab ? currentTab.label : 'Balcão'} (${method.name})`, 
          date: now.toISOString().split('T')[0], 
          dueDate: dueDate.toISOString().split('T')[0],
          status: method.settlementDays === 0 ? 'pago' : 'pendente', 
          origin: 'venda',
          paymentMethodName: method.name
      };

      // Lança Despesa de Taxa (Apenas informativo, já como PAGO, para constar no DRE)
      // O usuário pediu que a taxa fosse lançada como despesa PAGA
      const transactions = [revenueTransaction];
      if (taxAmount > 0) {
          transactions.push({
             id: Date.now().toString() + '_tax',
             type: 'despesa',
             amount: taxAmount,
             description: `Taxa Adm ${method.name} (${method.taxRate}%)`,
             date: now.toISOString().split('T')[0],
             dueDate: now.toISOString().split('T')[0],
             status: 'pago',
             origin: 'taxa',
             relatedId: revenueTransaction.id
          });
      }

      setFinancial([...financial, ...transactions]);

      if (!currentTab) {
          // Venda Balcão (Direta) - Apenas fecha
          return;
      }

      // Se for Mesa, atualiza itens pagos
      const paidIds = itemsToPay.map(i => i.cartId);
      const remainingItems = currentTab.items.filter(i => !paidIds.includes(i.cartId));

      const updated = tabs.map(t => {
          if (t.id === currentTab.id) {
              if (remainingItems.length === 0) return { ...t, status: 'livre' as TabStatus, items: [], total: 0, peopleCount: 0, openedAt: undefined, location: undefined };
              else return { ...t, items: remainingItems, total: remainingItems.reduce((acc, i) => acc + (i.finalPrice * i.quantity), 0) };
          } return t;
      });
      setTabs(updated); setActiveTab('tables'); setCurrentTab(null);
  };

  const handleVoidItem = (cartId: string) => {
      if (!currentTab) return;
      const updatedItems = currentTab.items.filter(i => i.cartId !== cartId);
      const updatedTabs = tabs.map(t => t.id === currentTab.id ? { ...t, items: updatedItems, total: updatedItems.reduce((acc, i) => acc + (i.finalPrice * i.quantity), 0) } : t);
      setTabs(updatedTabs);
      setCurrentTab({ ...currentTab, items: updatedItems, total: updatedItems.reduce((acc, i) => acc + (i.finalPrice * i.quantity), 0) });
  };

  const handleManageActions = (type: string, targetId: string, itemIds?: string[]) => {
      if (!currentTab) return;
      let newTabs = [...tabs];
      const targetIndex = newTabs.findIndex(t => t.id === targetId);
      const currentIndex = newTabs.findIndex(t => t.id === currentTab.id);

      if (type === 'transfer') {
          newTabs[targetIndex] = { ...currentTab, id: targetId, number: newTabs[targetIndex].number, label: newTabs[targetIndex].label };
          newTabs[currentIndex] = { ...newTabs[currentIndex], status: 'livre', items: [], total: 0, peopleCount: 0, location: undefined, openedAt: undefined };
          setActiveTab('tables'); setCurrentTab(null);
      } 
      else if (type === 'merge') {
          const target = newTabs[targetIndex];
          const newItems = [...target.items, ...currentTab.items];
          newTabs[targetIndex] = { ...target, items: newItems, total: newItems.reduce((acc,i)=>acc+(i.finalPrice*i.quantity),0) };
          newTabs[currentIndex] = { ...newTabs[currentIndex], status: 'livre', items: [], total: 0, peopleCount: 0, location: undefined, openedAt: undefined };
          setActiveTab('tables'); setCurrentTab(null);
      }
      else if (type === 'items' && itemIds) {
          const itemsToMove = currentTab.items.filter(i => itemIds.includes(i.cartId));
          const itemsToKeep = currentTab.items.filter(i => !itemIds.includes(i.cartId));
          const target = newTabs[targetIndex];
          const targetNewItems = [...target.items, ...itemsToMove];
          newTabs[targetIndex] = { ...target, status: 'ocupada', items: targetNewItems, total: targetNewItems.reduce((acc,i)=>acc+(i.finalPrice*i.quantity),0), openedAt: target.openedAt || Date.now() };
          newTabs[currentIndex] = { ...currentTab, items: itemsToKeep, total: itemsToKeep.reduce((acc,i)=>acc+(i.finalPrice*i.quantity),0) };
          setCurrentTab(newTabs[currentIndex]); 
      }
      setTabs(newTabs);
  };

  const handleSaveProduct = (product: Product) => { const exists = products.find(p => p.id === product.id); if (exists) setProducts(products.map(p => p.id === product.id ? product : p)); else setProducts([product, ...products]); };
  const handleDeleteProduct = (id: string) => { if (confirm('Apagar?')) setProducts(products.filter(p => p.id !== id)); };

  const handleDirectSaleClick = () => { setCurrentTab(null); setActiveTab('pos'); };

  // --- Handlers de Compras ---
  const handleCreateSupplier = (s: Supplier) => setSuppliers([...suppliers, s]);
  const handleDeleteSupplier = (id: string) => { if(confirm('Apagar?')) setSuppliers(suppliers.filter(s => s.id !== id)); };
  const handleSaveOrder = (o: PurchaseOrder) => setPurchaseOrders([...purchaseOrders, o]);
  const handleUpdateOrderStatus = (id: string, status: 'entregue' | 'cancelado') => {
     setPurchaseOrders(purchaseOrders.map(o => o.id === id ? { ...o, status } : o));
     if(status === 'entregue') {
        const order = purchaseOrders.find(o => o.id === id);
        if(order) {
           // REGISTRAR MOVIMENTAÇÃO DE ENTRADA
           const newMovements = order.items.map(i => ({
              id: Date.now().toString() + Math.random(),
              productId: i.productId,
              type: 'in' as const,
              quantity: i.quantity,
              date: new Date().toISOString()
           }));
           setMovements([...movements, ...newMovements]);

           // Atualizar estoque e custo e LastSupplier
           const updatedProducts = products.map(p => {
              const match = order.items.find(i => i.productId === p.id);
              if(match) return { ...p, stock: p.stock + match.quantity, costPrice: match.cost, realCost: calculateRealCost(match.cost, p.lossPercentage), lastSupplierId: order.supplierId };
              return p;
           });
           setProducts(updatedProducts);
           // Gerar Financeiro
           const newPayable: FinancialTransaction = { id: Date.now().toString(), type: 'despesa', amount: order.totalValue, description: `Compra Pedido #${order.id.slice(-4)}`, date: new Date().toISOString().split('T')[0], status: 'pendente', supplierId: order.supplierId, origin: 'compra', dueDate: new Date().toISOString().split('T')[0] };
           setFinancial([...financial, newPayable]);
           alert("Estoque Atualizado e Conta a Pagar Gerada!");
        }
     }
  };

  const handleImportXml = (data: any) => {
    // REGISTRAR MOVIMENTAÇÃO DE ENTRADA (XML)
    const newMovements = data.items.map((i:any) => ({
        id: Date.now().toString() + Math.random(),
        productId: i.productId,
        type: 'in' as const,
        quantity: i.addQty,
        date: new Date().toISOString()
    }));
    setMovements([...movements, ...newMovements]);

    const updatedProducts = products.map(p => {
      const match = data.items.find((i: any) => i.productId === p.id);
      if (match) return { ...p, stock: p.stock + match.addQty, costPrice: match.newCost, realCost: calculateRealCost(match.newCost, p.lossPercentage), lastSupplierId: data.supplierId };
      return p;
    });
    setProducts(updatedProducts);
    const newPayable: FinancialTransaction = { id: Date.now().toString(), type: 'despesa', amount: data.totalValue, description: `Compra XML (Nota Importada)`, date: data.dueDate, dueDate: data.dueDate, status: 'pendente', supplierId: data.supplierId, origin: 'compra' };
    setFinancial([...financial, newPayable]);
    if (data.poId) setPurchaseOrders(purchaseOrders.map(po => po.id === data.poId ? { ...po, status: 'entregue' } : po));
  };

  // --- Handlers de Pagamento ---
  const handleAddMethod = (m: PaymentMethod) => setPaymentMethods([...paymentMethods, m]);
  const handleDeleteMethod = (id: string) => { if(confirm('Apagar?')) setPaymentMethods(paymentMethods.filter(m => m.id !== id)); };
  const handleUpdateTransaction = (t: FinancialTransaction) => setFinancial(financial.map(tr => tr.id === t.id ? t : tr));

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-2xl z-10"><div className="mb-8 px-2 flex items-center gap-2 text-yellow-400"><ChefHat size={32} /><h1 className="text-2xl font-black tracking-tighter">ERP FOOD</h1></div><nav className="space-y-1 flex-1"><button onClick={() => setActiveTab('tables')} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 ${activeTab === 'tables' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}><Armchair size={20} /> SALÃO</button><button onClick={handleDirectSaleClick} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 ${activeTab === 'pos' && !currentTab ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}><Store size={20} /> PDV RÁPIDO</button><button onClick={() => setActiveTab('stock')} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 ${activeTab === 'stock' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}><Package size={20} /> ESTOQUE</button><button onClick={() => setActiveTab('purchases')} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 ${activeTab === 'purchases' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}><ShoppingBag size={20} /> COMPRAS</button><button onClick={() => setActiveTab('financial')} className={`w-full text-left px-4 py-3 rounded-lg font-bold flex items-center gap-3 ${activeTab === 'financial' ? 'bg-blue-600' : 'hover:bg-slate-800 text-slate-400'}`}><Wallet size={20} /> FINANCEIRO</button></nav></aside>
      <main className="flex-1 h-screen overflow-hidden relative">
        {activeTab === 'tables' && <TablesScreen tabs={tabs} settings={settings} onSelectTab={handleTabClick} onUpdateSettings={setSettings} />}
        {activeTab === 'pos' && <POSScreen products={products} activeTab={currentTab} allTabs={tabs} settings={settings} paymentMethods={paymentMethods} onAddToTab={handleAddToTab} onCloseTab={handleCloseTab} onBack={() => setActiveTab('tables')} onVoidItem={handleVoidItem} onManageActions={handleManageActions} />}
        {activeTab === 'stock' && <StockScreen products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} movements={movements} onSave={handleSaveProduct} onDelete={handleDeleteProduct} onImportXml={handleImportXml} onCreateSupplier={handleCreateSupplier} />}
        {activeTab === 'purchases' && <PurchasesScreen products={products} suppliers={suppliers} orders={purchaseOrders} movements={movements} onSaveSupplier={handleCreateSupplier} onDeleteSupplier={handleDeleteSupplier} onSaveOrder={handleSaveOrder} onUpdateOrderStatus={handleUpdateOrderStatus} />}
        {activeTab === 'financial' && <FinancialScreen transactions={financial} paymentMethods={paymentMethods} onAddMethod={handleAddMethod} onDeleteMethod={handleDeleteMethod} onUpdateTransaction={handleUpdateTransaction} />}
        {openingTab && <OpenTabModal tab={openingTab} settings={settings} onClose={() => setOpeningTab(null)} onConfirm={confirmOpenTab} onReserve={handleReserveTab} />}
      </main>
    </div>
  );
}

export default App;