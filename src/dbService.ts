import { Product, Category, Customer, Supplier, PurchaseOrder, Transaction, BakerySettings, SupplierLedgerEntry } from './types';

// Storage Keys
const LOCAL_DB_KEY = 'artisan_bakehouse_local_db';
const OFFLINE_QUEUE_KEY = 'artisan_bakehouse_offline_queue';
const IS_OFFLINE_SIMULATED_KEY = 'artisan_bakehouse_is_offline_simulated';

export interface FullDB {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  ledger: SupplierLedgerEntry[];
  purchases: PurchaseOrder[];
  settings: BakerySettings;
}

// Check if we are simulating offline mode
export function getOfflineSimulationState(): boolean {
  return localStorage.getItem(IS_OFFLINE_SIMULATED_KEY) === 'true';
}

export function setOfflineSimulationState(state: boolean): void {
  localStorage.setItem(IS_OFFLINE_SIMULATED_KEY, String(state));
}

// Fetch DB contents
export async function getDatabase(): Promise<FullDB> {
  const isSimulatedOffline = getOfflineSimulationState();
  
  if (!isSimulatedOffline) {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const db: FullDB = await response.json();
        // Overwrite standard local storage cache
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
        return db;
      }
    } catch (e) {
      console.warn('Network unavailable, falling back to offline LocalStorage database', e);
    }
  }

  // Fallback to local storage cached database
  const cached = localStorage.getItem(LOCAL_DB_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  // Double fallback in case nothing exists yet
  const fallback: FullDB = {
    products: [],
    categories: [],
    transactions: [],
    customers: [],
    suppliers: [],
    ledger: [],
    purchases: [],
    settings: {
      bakeryName: 'Artisan Bakehouse (Offline)',
      tagline: 'Freshly Baked Goodness Daily',
      address: '42 Wheatfield Road, Flour District',
      phone: '0300-BAKERY-1',
      taxRate: 8,
      receiptSize: '80mm',
      printerName: 'XP-80 Thermal Printer',
      barcodePrefix: 'AB'
    }
  };
  return fallback;
}

// Save Full DB locally
export function saveDBLocally(db: FullDB): void {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

// Push local edits or sync with server
export async function syncDatabase(db: FullDB): Promise<FullDB> {
  saveDBLocally(db);
  const isSimulatedOffline = getOfflineSimulationState();

  if (!isSimulatedOffline) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      });
      if (response.ok) {
        const res = await response.json();
        return res.db;
      }
    } catch (e) {
      console.error('Failed to sync database with backend server', e);
    }
  }
  return db;
}

// Submit a purchase order
export async function submitPurchaseOrder(po: PurchaseOrder, db: FullDB): Promise<{ db: FullDB }> {
  // Update local copy
  const updatedPO = { ...po, id: po.id || 'po-' + Date.now() };
  const updatedPurchases = [updatedPO, ...db.purchases.filter(p => p.id !== po.id)];
  
  const updatedProducts = [...db.products];
  const updatedLedger = [...db.ledger];
  
  if (po.status === 'Received') {
    po.items.forEach(item => {
      const pIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          stockQuantity: updatedProducts[pIndex].stockQuantity + item.quantity,
          purchasePrice: item.costPrice,
          profitMargin: updatedProducts[pIndex].salePrice > 0 
            ? Math.round(((updatedProducts[pIndex].salePrice - item.costPrice) / updatedProducts[pIndex].salePrice) * 100)
            : 0
        };
      }
    });

    const ledgerEntry: SupplierLedgerEntry = {
      id: 'led-' + Date.now(),
      supplierId: po.supplierId,
      date: po.orderDate,
      description: `Stock Delivery - PO ${updatedPO.id}`,
      debit: 0,
      credit: po.totalCost,
      balance: po.totalCost
    };
    updatedLedger.push(ledgerEntry);
  }

  const nextDB: FullDB = {
    ...db,
    purchases: updatedPurchases,
    products: updatedProducts,
    ledger: updatedLedger
  };

  saveDBLocally(nextDB);

  if (!getOfflineSimulationState()) {
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPO)
      });
      if (response.ok) {
        const serverRes = await response.json();
        return { db: serverRes.db };
      }
    } catch (e) {
      console.warn('Network issue submitting PO, saved offline', e);
      // Add to offline queue
      addOfflineQueue('purchase', po);
    }
  } else {
    addOfflineQueue('purchase', po);
  }

  return { db: nextDB };
}

// Submit transaction
export async function submitTransaction(tx: Transaction, db: FullDB): Promise<{ db: FullDB }> {
  const updatedTx = { ...tx, id: tx.id || 'trans-' + Date.now() };
  const updatedTransactions = [updatedTx, ...db.transactions.filter(t => t.id !== tx.id)];

  // Auto stock deplete & customer points local fallbacks
  const updatedProducts = [...db.products];
  const updatedCustomers = [...db.customers];

  if (tx.status === 'Paid') {
    tx.items.forEach(item => {
      if (item.productId) {
        const pIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          updatedProducts[pIndex] = {
            ...updatedProducts[pIndex],
            stockQuantity: Math.max(0, updatedProducts[pIndex].stockQuantity - item.quantity)
          };
        }
      }
    });
  }

  if (tx.customerId && tx.customerId !== 'cust-3') {
    const cIndex = updatedCustomers.findIndex(c => c.id === tx.customerId);
    if (cIndex !== -1) {
      updatedCustomers[cIndex] = {
        ...updatedCustomers[cIndex],
        loyaltyPoints: updatedCustomers[cIndex].loyaltyPoints + Math.floor(tx.total / 10)
      };
    }
  }

  const nextDB: FullDB = {
    ...db,
    transactions: updatedTransactions,
    products: updatedProducts,
    customers: updatedCustomers
  };

  saveDBLocally(nextDB);

  if (!getOfflineSimulationState()) {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx)
      });
      if (response.ok) {
        const serverRes = await response.json();
        saveDBLocally(serverRes.db);
        return { db: serverRes.db };
      }
    } catch (e) {
      console.warn('Network issue. Transaction saved locally in offline queue.', e);
      addOfflineQueue('transaction', updatedTx);
    }
  } else {
    addOfflineQueue('transaction', updatedTx);
  }

  return { db: nextDB };
}

// Queue for offline processing
export interface QueueItem {
  id: string;
  type: 'transaction' | 'purchase' | 'product_custom_entry';
  data: any;
  timestamp: number;
}

export function getOfflineQueue(): QueueItem[] {
  const qStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
  return qStr ? JSON.parse(qStr) : [];
}

export function addOfflineQueue(type: QueueItem['type'], data: any): void {
  const q = getOfflineQueue();
  q.push({
    id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    type,
    data,
    timestamp: Date.now()
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
}

// Process sync of offline queued actions
export async function processOfflineQueue(currentDb: FullDB): Promise<{ status: string; syncedCount: number; db: FullDB }> {
  const q = getOfflineQueue();
  if (q.length === 0) return { status: 'no_actions', syncedCount: 0, db: currentDb };

  let syncedCount = 0;
  let workingDb = { ...currentDb };

  for (const item of q) {
    try {
      if (item.type === 'transaction') {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        if (response.ok) {
          const res = await response.json();
          workingDb = res.db;
          syncedCount++;
        }
      } else if (item.type === 'purchase') {
        const response = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        if (response.ok) {
          const res = await response.json();
          workingDb = res.db;
          syncedCount++;
        }
      }
    } catch (e) {
      console.error('Error syncing individual queue item', item, e);
      // Keep in queue or skip
    }
  }

  // Clear queue if fully synchronized
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
  // Sync the latest state back to localStorage
  saveDBLocally(workingDb);
  return { status: 'success', syncedCount, db: workingDb };
}
