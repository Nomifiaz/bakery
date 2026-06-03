import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Bell,
  Sparkles,
  Database
} from 'lucide-react';

// Import Types
import { Product, Category, Customer, Supplier, PurchaseOrder, Transaction, BakerySettings, UserRole, SupplierLedgerEntry } from './types';

// Import Database Services
import { 
  getDatabase, 
  syncDatabase, 
  submitTransaction, 
  submitPurchaseOrder, 
  getOfflineQueue, 
  processOfflineQueue, 
  getOfflineSimulationState, 
  setOfflineSimulationState,
  FullDB
} from './dbService';

// Import Layout Panels
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POSBilling from './components/POSBilling';
import InventoryManagement from './components/InventoryManagement';
import PurchasesManagement from './components/PurchasesManagement';
import CustomersManagement from './components/CustomersManagement';
import ReportsModule from './components/ReportsModule';
import LabelPrinting from './components/LabelPrinting';
import SettingsModule from './components/SettingsModule';
import NotificationCenter from './components/NotificationCenter';

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Admin');

  // Master local state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ledger, setLedger] = useState<SupplierLedgerEntry[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [settings, setSettings] = useState<BakerySettings>({
    bakeryName: 'Artisan Bakehouse',
    tagline: 'Freshly Baked Goodness Daily',
    address: '42 Wheatfield Road, Flour District',
    phone: '0300-BAKERY-1',
    taxRate: 8,
    receiptSize: '80mm',
    printerName: 'XP-80 General',
    barcodePrefix: 'AB'
  });

  // Offline / Network States
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load database from API/Cache on startup
  const loadDatabaseState = useCallback(async () => {
    try {
      const db = await getDatabase();
      setProducts(db.products || []);
      setCategories(db.categories || []);
      setTransactions(db.transactions || []);
      setCustomers(db.customers || []);
      setSuppliers(db.suppliers || []);
      setLedger(db.ledger || []);
      setPurchases(db.purchases || []);
      if (db.settings) {
        setSettings(db.settings);
      }
      setOfflineQueue(getOfflineQueue());
    } catch (err) {
      console.error('Failed to load database state', err);
    }
  }, []);

  useEffect(() => {
    setIsSimulatedOffline(getOfflineSimulationState());
    loadDatabaseState();
  }, [loadDatabaseState]);

  // Sync state triggers
  const triggerDatabaseSync = async (nextState: FullDB) => {
    setIsSyncing(true);
    try {
      const updatedDB = await syncDatabase(nextState);
      setProducts(updatedDB.products || []);
      setCategories(updatedDB.categories || []);
      setTransactions(updatedDB.transactions || []);
      setCustomers(updatedDB.customers || []);
      setSuppliers(updatedDB.suppliers || []);
      setLedger(updatedDB.ledger || []);
      setPurchases(updatedDB.purchases || []);
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncing(false);
      setOfflineQueue(getOfflineQueue());
    }
  };

  // Switch Simulated Connection State (Online / simulated offline cascade)
  const toggleNetworkSimulation = async () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    setOfflineSimulationState(nextState);

    if (!nextState) {
      // Reconnected! Process offline queue instantly
      setIsSyncing(true);
      try {
        const currentDb: FullDB = { products, categories, transactions, customers, suppliers, ledger, purchases, settings };
        const syncOut = await processOfflineQueue(currentDb);
        
        // Load latest synced structures
        setProducts(syncOut.db.products || []);
        setCategories(syncOut.db.categories || []);
        setTransactions(syncOut.db.transactions || []);
        setCustomers(syncOut.db.customers || []);
        setSuppliers(syncOut.db.suppliers || []);
        setLedger(syncOut.db.ledger || []);
        setPurchases(syncOut.db.purchases || []);
        
        if (syncOut.syncedCount > 0) {
          alert(`Successfully reconnected! Synced ${syncOut.syncedCount} queued off-line transaction(s) with local backend DB file.`);
        }
      } catch (err) {
        console.error('Offline queue reconciliation failed', err);
      } finally {
        setIsSyncing(false);
        setOfflineQueue([]);
      }
    }
  };

  // Manual RESET database to startup template values
  const handleResetDBCommand = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/db/reset', { method: 'POST' });
      if (response.ok) {
        const res = await response.json();
        setProducts(res.db.products || []);
        setCategories(res.db.categories || []);
        setTransactions(res.db.transactions || []);
        setCustomers(res.db.customers || []);
        setSuppliers(res.db.suppliers || []);
        setLedger(res.db.ledger || []);
        setPurchases(res.db.purchases || []);
        setSettings(res.db.settings);
        setOfflineQueue([]);
        alert('Database completely reset to initial default dataset!');
      }
    } catch (e) {
      console.error('Failed to reset DB server-side, doing local state reset', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // General trigger handlers for CRUD routines
  const handleAddProduct = async (prod: Product) => {
    const updated = [...products, prod];
    setProducts(updated);
    await triggerDatabaseSync({ products: updated, categories, transactions, customers, suppliers, ledger, purchases, settings });
  };

  const handleUpdateProduct = async (prod: Product) => {
    const updated = products.map(p => p.id === prod.id ? prod : p);
    setProducts(updated);
    await triggerDatabaseSync({ products: updated, categories, transactions, customers, suppliers, ledger, purchases, settings });
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await triggerDatabaseSync({ products: updated, categories, transactions, customers, suppliers, ledger, purchases, settings });
  };

  const handleAddCustomer = async (cust: Customer) => {
    const updated = [...customers, cust];
    setCustomers(updated);
    await triggerDatabaseSync({ products, categories, transactions, customers: updated, suppliers, ledger, purchases, settings });
  };

  const handleUpdateCustomer = async (cust: Customer) => {
    const updated = customers.map(c => c.id === cust.id ? cust : c);
    setCustomers(updated);
    await triggerDatabaseSync({ products, categories, transactions, customers: updated, suppliers, ledger, purchases, settings });
  };

  const handleDeleteCustomer = async (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    await triggerDatabaseSync({ products, categories, transactions, customers: updated, suppliers, ledger, purchases, settings });
  };

  const handleSaveSettings = async (nextSettings: BakerySettings) => {
    setSettings(nextSettings);
    await triggerDatabaseSync({ products, categories, transactions, customers, suppliers, ledger, purchases, settings: nextSettings });
  };

  // Submit PO
  const handleSubmitPO = async (po: PurchaseOrder) => {
    const currentDb: FullDB = { products, categories, transactions, customers, suppliers, ledger, purchases, settings };
    const result = await submitPurchaseOrder(po, currentDb);
    
    // update states dynamically
    setProducts(result.db.products);
    setPurchases(result.db.purchases);
    setLedger(result.db.ledger);
    setOfflineQueue(getOfflineQueue());
  };

  // Submit Transaction
  const handleSubmitTransaction = async (tx: Transaction) => {
    const currentDb: FullDB = { products, categories, transactions, customers, suppliers, ledger, purchases, settings };
    const result = await submitTransaction(tx, currentDb);

    // update states dynamically
    setProducts(result.db.products);
    setTransactions(result.db.transactions);
    setCustomers(result.db.customers);
    setOfflineQueue(getOfflineQueue());
  };

  const handleSupplierPayment = async (supplierId: string, amount: number) => {
    // Record payment locally
    const paymentEntry: SupplierLedgerEntry = {
      id: 'led-' + Date.now(),
      supplierId,
      date: new Date().toISOString().split('T')[0],
      description: 'Cash Payment to Supplier',
      debit: amount,
      credit: 0,
      balance: -amount
    };

    const nextLedger = [...ledger, paymentEntry];
    setLedger(nextLedger);
    await triggerDatabaseSync({ products, categories, transactions, customers, suppliers, ledger: nextLedger, purchases, settings });
  };

  const handleUpdateTransactionStatus = async (id: string, nextStatus: 'Paid' | 'Hold' | 'Void') => {
    const updated = transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTransactions(updated);
    await triggerDatabaseSync({ products, categories, transactions: updated, customers, suppliers, ledger, purchases, settings });
  };

  const handleQuickRestockShortcut = () => {
    // Navigates straight to purchases restock PO form
    setActiveTab('purchases');
  };

  // Clear cashier screen cart triggers
  const resetCashierPOSData = () => {
    // Signal POS checkouts list blanking
  };

  // Render correct catalog layout element
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            products={products}
            transactions={transactions}
            onNavigate={(t) => setActiveTab(t)}
            onQuickRestock={handleQuickRestockShortcut}
            onResetDB={handleResetDBCommand}
            isSyncing={isSyncing}
            offlineQueueCount={offlineQueue.length}
          />
        );
      case 'pos':
        return (
          <POSBilling
            products={products}
            categories={categories}
            customers={customers}
            settings={settings}
            onSubmitTransaction={handleSubmitTransaction}
            transactions={transactions}
            onUpdateTransactionStatus={handleUpdateTransactionStatus}
          />
        );
      case 'products':
      case 'inventory':
        return (
          <InventoryManagement
            products={products}
            categories={categories}
            suppliers={suppliers}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'purchases':
        return (
          <PurchasesManagement
            products={products}
            suppliers={suppliers}
            purchases={purchases}
            ledger={ledger}
            onSubmitPO={handleSubmitPO}
            onSubmitPayment={handleSupplierPayment}
          />
        );
      case 'customers':
        return (
          <CustomersManagement
            customers={customers}
            transactions={transactions}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'reports':
        return (
          <ReportsModule
            products={products}
            transactions={transactions}
            categories={categories}
          />
        );
      case 'labels':
        return (
          <LabelPrinting
            products={products}
            settings={settings}
          />
        );
      case 'settings':
        return (
          <SettingsModule
            settings={settings}
            onSaveSettings={handleSaveSettings}
            isSyncing={isSyncing}
            onSyncForce={async () => {
              const currentDb: FullDB = { products, categories, transactions, customers, suppliers, ledger, purchases, settings };
              await triggerDatabaseSync(currentDb);
            }}
            offlineQueueLength={offlineQueue.length}
          />
        );
      default:
        return <div className="p-8">Panel not implemented.</div>;
    }
  };

  return (
    <div id="applet-viewport-frame" className="min-h-screen bg-[#FAF9F6] text-zinc-800 flex font-sans overflow-x-hidden antialiased">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab === 'products' ? 'inventory' : activeTab} // unify products & central inventory
        setActiveTab={setActiveTab}
        resetCashierPOS={resetCashierPOSData}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main viewport area */}
      <div id="content-container" className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top bar header */}
        <header id="top-bar-app" className="bg-[#FAF9F6] border-b border-gray-100 h-16 px-8 flex items-center justify-between flex-none select-none">
          <div className="flex items-center space-x-3.5">
            <span className="text-xs font-semibold text-gray-400 capitalize font-mono">
              Terminal Node 01 • Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* FORCE SYNC INDICATOR */}
            {isSyncing && (
              <span className="text-xs text-[#580c1f] flex items-center font-bold font-mono">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#580c1f]" />
                Syncing DB...
              </span>
            )}

            {/* Simulated internet / LAN offline-first tester toggle buttons */}
            <button
              id="network-simulator-pill"
              onClick={toggleNetworkSimulation}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer border ${
                isSimulatedOffline
                  ? 'bg-amber-100 hover:bg-amber-150 border-amber-200 text-amber-800'
                  : 'bg-green-100 hover:bg-green-150 border-green-200 text-green-800'
              }`}
              title="Click here to interrupt network connection and simulate offline-first billing behaviors"
            >
              {isSimulatedOffline ? (
                <>
                  <WifiOff className="w-4 h-4 mr-1.5 animate-pulse text-amber-600" />
                  <span>Simulated Offline Mode</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-1.5 text-green-600" />
                  <span>Online Service</span>
                </>
              )}
            </button>

            {/* Notification Alert Bell */}
            <NotificationCenter 
              products={products} 
              onCreatePO={handleQuickRestockShortcut}
            />

            {/* Small active session profile badge */}
            <div className="flex items-center space-x-2.5 border-l border-zinc-200/50 pl-4">
              <div className="text-right">
                <p className="text-xs font-extrabold text-gray-800 leading-none">Admin Station</p>
                <p className="text-[10px] text-[#580c1f] font-mono mt-1 font-bold">{userRole}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#580c1f] text-white flex items-center justify-center font-display font-extrabold text-sm">
                A
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Inner Panel Viewport */}
        <main id="main-panel-container" className="flex-1 overflow-y-auto bg-[#FAF9F6]">
          {renderActivePanel()}
        </main>

      </div>

    </div>
  );
}
