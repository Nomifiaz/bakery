import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Product, Category, Customer, Supplier, PurchaseOrder, Transaction, BakerySettings, SupplierLedgerEntry } from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Helper function to load and save local database file (db.json)
interface Database {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  ledger: SupplierLedgerEntry[];
  purchases: PurchaseOrder[];
  settings: BakerySettings;
}

const getInitialDB = (): Database => {
  // Let's create high-quality initial data mirroring the screenshots
  const categories: Category[] = [
    { id: 'cat-breads', name: 'Breads' },
    { id: 'cat-pastries', name: 'Pastries' },
    { id: 'cat-cakes', name: 'Cakes' },
    { id: 'cat-coffee', name: 'Coffee' },
    { id: 'cat-savory', name: 'Savory' },
    { id: 'cat-sandwiches', name: 'Sandwiches' },
  ];

  const products: Product[] = [
    {
      id: 'prod-sourdough',
      name: 'Artisan Sourdough Loaf',
      barcode: '823910293',
      sku: 'SD-001-REG',
      categoryId: 'cat-breads',
      purchasePrice: 1.80,
      salePrice: 6.50,
      profitMargin: 72,
      stockQuantity: 42,
      minStockLevel: 10,
      expiryDate: '2026-10-12',
    },
    {
      id: 'prod-croissant',
      name: 'Butter Croissant',
      barcode: '912038472',
      sku: 'PT-291-REG',
      categoryId: 'cat-pastries',
      purchasePrice: 1.10,
      salePrice: 3.75,
      profitMargin: 71,
      stockQuantity: 25,
      minStockLevel: 8,
      expiryDate: '2026-06-04',
    },
    {
      id: 'prod-fudge',
      name: 'Chocolate Fudge Cake',
      barcode: '734201948',
      sku: 'CK-712-FUD',
      categoryId: 'cat-cakes',
      purchasePrice: 1.50,
      salePrice: 5.20,
      profitMargin: 71,
      stockQuantity: 12,
      minStockLevel: 5,
      expiryDate: '2026-06-08',
    },
    {
      id: 'prod-latte',
      name: 'Caffé Latte',
      barcode: '551029384',
      sku: 'CF-102-LAT',
      categoryId: 'cat-coffee',
      purchasePrice: 0.90,
      salePrice: 4.25,
      profitMargin: 79,
      stockQuantity: 100,
      minStockLevel: 20,
      expiryDate: '2027-12-31',
    },
    {
      id: 'prod-almond',
      name: 'Almond Croissant',
      barcode: '912038472', // shared croissant barcode or custom
      sku: 'PT-112-ALM',
      categoryId: 'cat-pastries',
      purchasePrice: 0.95,
      salePrice: 4.25,
      profitMargin: 77,
      stockQuantity: 8,
      minStockLevel: 15,
      expiryDate: '2026-06-03', // Today
    },
    {
      id: 'prod-muffin',
      name: 'Blueberry Streusel Muffin',
      barcode: '734201948',
      sku: 'CK-088-BLU',
      categoryId: 'cat-cakes',
      purchasePrice: 0.65,
      salePrice: 3.50,
      profitMargin: 81,
      stockQuantity: 0,
      minStockLevel: 10,
      expiryDate: '2026-05-30', // expired
    },
    {
      id: 'prod-tart',
      name: 'Valrhona Chocolate Tart',
      barcode: '551029384',
      sku: 'PT-112-DRK',
      categoryId: 'cat-pastries',
      purchasePrice: 2.50,
      salePrice: 12.00,
      profitMargin: 79,
      stockQuantity: 15,
      minStockLevel: 5,
      expiryDate: '2026-10-14',
    }
  ];

  const customers: Customer[] = [
    { id: 'cust-1', name: 'Emma Miller', phone: '03001234567', address: '123 Baker Street', loyaltyPoints: 120 },
    { id: 'cust-2', name: 'James Doe', phone: '03129876543', address: '45 Blue Orchard Ave', loyaltyPoints: 45 },
    { id: 'cust-3', name: 'Walk-in Customer', phone: 'N/A', address: 'N/A', loyaltyPoints: 0 },
    { id: 'cust-4', name: 'Sarah Adams', phone: '03215551122', address: '78 Pine Hills Lane', loyaltyPoints: 80 }
  ];

  const suppliers: Supplier[] = [
    { id: 'sup-1', name: 'Global Flour Co.', contact: 'Michael Scott', phone: '1-800-FLOUR', email: 'sales@globalflour.com' },
    { id: 'sup-2', name: 'Dairy & Dairy Co.', contact: 'Pam Beesly', phone: '03009998877', email: 'orders@dairyanddairy.com' },
    { id: 'sup-3', name: 'Sweet Sugar Ltd.', contact: 'Jim Halpert', phone: '03456667777', email: 'jim@sweetsugar.com' }
  ];

  const ledger: SupplierLedgerEntry[] = [
    { id: 'led-1', supplierId: 'sup-1', date: '2026-05-20', description: 'Opening Balance', debit: 0, credit: 1500, balance: 1500 },
    { id: 'led-2', supplierId: 'sup-1', date: '2026-05-25', description: 'Payment made', debit: 1000, credit: 0, balance: 500 },
    { id: 'led-3', supplierId: 'sup-2', date: '2026-05-22', description: 'Butter Stock Delivery', debit: 0, credit: 450, balance: 450 }
  ];

  const transactions: Transaction[] = [
    {
      id: 'trans-9042',
      invoiceNumber: 'AB-9042',
      customerId: 'cust-1',
      customerName: 'Emma Miller',
      customerPhone: '03001234567',
      items: [
        { id: 'item-1', productId: 'prod-sourdough', name: 'Artisan Sourdough Loaf', price: 6.50, quantity: 4 },
        { id: 'item-2', productId: 'prod-croissant', name: 'Butter Croissant', price: 3.75, quantity: 3 },
        { id: 'item-3', productId: 'prod-fudge', name: 'Chocolate Fudge Cake', price: 5.20, quantity: 1 }
      ],
      subtotal: 39.35,
      tax: 3.15,
      discount: 0,
      total: 42.50,
      paymentMethod: 'Cash',
      date: '2026-06-03T12:45:00Z',
      status: 'Paid',
      cashierName: 'Admin Station 01'
    },
    {
      id: 'trans-9041',
      invoiceNumber: 'AB-9041',
      customerId: 'cust-2',
      customerName: 'James Doe',
      customerPhone: '03129876543',
      items: [
        { id: 'item-4', productId: 'prod-croissant', name: 'Butter Croissant', price: 3.75, quantity: 2 },
        { id: 'item-5', productId: 'prod-latte', name: 'Caffé Latte', price: 4.25, quantity: 2 },
        { id: 'item-6', name: 'Custom Birthday Message', price: 2.20, quantity: 1, isManual: true, notes: 'Write: Happy 10th Birthday!' }
      ],
      subtotal: 18.20,
      tax: 0,
      discount: 0,
      total: 18.20,
      paymentMethod: 'EasyPaisa',
      date: '2026-06-03T12:32:00Z',
      status: 'Hold',
      cashierName: 'Admin Station 01'
    },
    {
      id: 'trans-9040',
      invoiceNumber: 'AB-9040',
      customerId: 'cust-3',
      customerName: 'Walk-in Customer',
      customerPhone: 'N/A',
      items: [
        { id: 'item-7', productId: 'prod-tart', name: 'Valrhona Chocolate Tart', price: 12.00, quantity: 10 }
      ],
      subtotal: 120.00,
      tax: 9.60,
      discount: 4.70,
      total: 124.90,
      paymentMethod: 'Card',
      date: '2026-06-03T12:15:00Z',
      status: 'Paid',
      cashierName: 'Admin Station 01'
    },
    {
      id: 'trans-9039',
      invoiceNumber: 'AB-9039',
      customerId: 'cust-4',
      customerName: 'Sarah Adams',
      customerPhone: '03215551122',
      items: [
        { id: 'item-8', productId: 'prod-fudge', name: 'Chocolate Fudge Cake', price: 5.20, quantity: 1 }
      ],
      subtotal: 5.20,
      tax: 0.40,
      discount: 5.60,
      total: 0.00,
      paymentMethod: 'Cash',
      date: '2026-06-03T11:58:00Z',
      status: 'Void',
      cashierName: 'Admin Station 01'
    }
  ];

  const purchases: PurchaseOrder[] = [
    {
      id: 'po-1',
      supplierId: 'sup-1',
      supplierName: 'Global Flour Co.',
      orderDate: '2026-05-24',
      status: 'Received',
      items: [
        { productId: 'prod-sourdough', name: 'Artisan Sourdough Loaf', quantity: 100, costPrice: 1.80 }
      ],
      totalCost: 180.00
    },
    {
      id: 'po-2',
      supplierId: 'sup-2',
      supplierName: 'Dairy & Dairy Co.',
      orderDate: '2026-06-01',
      status: 'Sent',
      items: [
        { productId: 'prod-croissant', name: 'Butter Croissant', quantity: 50, costPrice: 1.10 }
      ],
      totalCost: 55.00
    }
  ];

  const settings: BakerySettings = {
    bakeryName: 'Artisan Bakehouse',
    tagline: 'Freshly Baked Goodness Daily',
    address: '42 Wheatfield Road, Flour District',
    phone: '0300-BAKERY-1',
    taxRate: 8,
    receiptSize: '80mm',
    printerName: 'XP-80 Thermal Printer',
    barcodePrefix: 'AB'
  };

  return {
    products,
    categories,
    transactions,
    customers,
    suppliers,
    ledger,
    purchases,
    settings,
  };
};

function readDB(): Database {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, using fresh template', err);
    return getInitialDB();
  }
}

function writeDB(data: Database): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB', err);
  }
}

// REST API Endpoints
app.get('/api/db', (req, res) => {
  res.json(readDB());
});

app.post('/api/db/reset', (req, res) => {
  const initial = getInitialDB();
  writeDB(initial);
  res.json({ status: 'ok', message: 'Database reset to initial template state', db: initial });
});

// Sync transactions/inventory modifications
app.post('/api/sync', (req, res) => {
  const db = readDB();
  const { products, transactions, customers, purchases, settings, suppliers, ledger } = req.body;

  if (products) db.products = products;
  if (transactions) db.transactions = transactions;
  if (customers) db.customers = customers;
  if (purchases) db.purchases = purchases;
  if (settings) db.settings = settings;
  if (suppliers) db.suppliers = suppliers;
  if (ledger) db.ledger = ledger;

  writeDB(db);
  res.json({ status: 'success', db });
});

// Single Route Updaters for cleaner API calls
app.post('/api/transactions', (req, res) => {
  const db = readDB();
  const tx: Transaction = req.body;
  if (!tx.id) {
    tx.id = 'trans-' + Date.now();
  }
  db.transactions.unshift(tx); // Prepends to keep recent first!

  // Automatically deplete stock counts if Status is Paid
  if (tx.status === 'Paid') {
    tx.items.forEach(item => {
      if (item.productId) {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        }
      }
    });
  }

  // Update customer loyalty points if added
  if (tx.customerId && tx.customerId !== 'cust-3') {
    const cust = db.customers.find(c => c.id === tx.customerId);
    if (cust) {
      // 1 point per $10 spent
      cust.loyaltyPoints += Math.floor(tx.total / 10);
    }
  }

  writeDB(db);
  res.json({ status: 'success', transaction: tx, db });
});

app.put('/api/transactions/:id', (req, res) => {
  const db = readDB();
  const index = db.transactions.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    // If we transition to Paid from Hold, deplete stock
    const oldTx = db.transactions[index];
    const newTx = req.body;
    db.transactions[index] = newTx;

    if (oldTx.status !== 'Paid' && newTx.status === 'Paid') {
      newTx.items.forEach((item: any) => {
        if (item.productId) {
          const prod = db.products.find(p => p.id === item.productId);
          if (prod) {
            prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
          }
        }
      });
    }

    writeDB(db);
    res.json({ status: 'success', transaction: newTx, db });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// CRUD Products
app.post('/api/products', (req, res) => {
  const db = readDB();
  const prod: Product = req.body;
  if (!prod.id) prod.id = 'prod-' + Date.now();
  
  // Calculate Profit margin on server to be sure
  const margin = prod.salePrice > 0 ? Math.round(((prod.salePrice - prod.purchasePrice) / prod.salePrice) * 100) : 0;
  prod.profitMargin = margin;

  db.products.push(prod);
  writeDB(db);
  res.json({ status: 'success', product: prod, db });
});

app.put('/api/products/:id', (req, res) => {
  const db = readDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const prod: Product = req.body;
    const margin = prod.salePrice > 0 ? Math.round(((prod.salePrice - prod.purchasePrice) / prod.salePrice) * 100) : 0;
    prod.profitMargin = margin;
    db.products[index] = prod;
    writeDB(db);
    res.json({ status: 'success', product: prod, db });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const db = readDB();
  db.products = db.products.filter(p => p.id !== req.params.id);
  writeDB(db);
  res.json({ status: 'success', db });
});

// Customers
app.post('/api/customers', (req, res) => {
  const db = readDB();
  const cust: Customer = req.body;
  if (!cust.id) cust.id = 'cust-' + Date.now();
  db.customers.push(cust);
  writeDB(db);
  res.json({ status: 'success', customer: cust, db });
});

app.put('/api/customers/:id', (req, res) => {
  const db = readDB();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.customers[index] = req.body;
    writeDB(db);
    res.json({ status: 'success', customer: req.body, db });
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// Purchases / POs
app.post('/api/purchases', (req, res) => {
  const db = readDB();
  const po: PurchaseOrder = req.body;
  if (!po.id) po.id = 'po-' + Date.now();
  db.purchases.push(po);

  // If status is received, automatically add items into inventory and add to supplier ledger
  if (po.status === 'Received') {
    po.items.forEach(item => {
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity += item.quantity;
        prod.purchasePrice = item.costPrice; // Update cost price dynamically
        prod.profitMargin = prod.salePrice > 0 ? Math.round(((prod.salePrice - prod.purchasePrice) / prod.salePrice) * 100) : 0;
      }
    });

    // Supplier credit ledger update
    const ledgerEntry: SupplierLedgerEntry = {
      id: 'led-' + Date.now(),
      supplierId: po.supplierId,
      date: po.orderDate,
      description: `Stock Delivery - PO ${po.id}`,
      debit: 0,
      credit: po.totalCost,
      balance: po.totalCost // Increments balance owed
    };
    db.ledger.push(ledgerEntry);
  }

  writeDB(db);
  res.json({ status: 'success', purchase: po, db });
});

app.put('/api/purchases/:id', (req, res) => {
  const db = readDB();
  const index = db.purchases.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const oldPO = db.purchases[index];
    const newPO: PurchaseOrder = req.body;
    db.purchases[index] = newPO;

    if (oldPO.status !== 'Received' && newPO.status === 'Received') {
      newPO.items.forEach(item => {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          prod.stockQuantity += item.quantity;
          prod.purchasePrice = item.costPrice;
          prod.profitMargin = prod.salePrice > 0 ? Math.round(((prod.salePrice - prod.purchasePrice) / prod.salePrice) * 100) : 0;
        }
      });

      // Supplier ledger update
      const ledgerEntry: SupplierLedgerEntry = {
        id: 'led-' + Date.now() + '-update',
        supplierId: newPO.supplierId,
        date: newPO.orderDate,
        description: `Received PO ${newPO.id}`,
        debit: 0,
        credit: newPO.totalCost,
        balance: newPO.totalCost
      };
      db.ledger.push(ledgerEntry);
    }

    writeDB(db);
    res.json({ status: 'success', purchase: newPO, db });
  } else {
    res.status(404).json({ error: 'Purchase order not found' });
  }
});

// Suppliers Ledger payment option
app.post('/api/suppliers/:id/pay', (req, res) => {
  const db = readDB();
  const { amount, date } = req.body;
  const supplierId = req.params.id;

  const entry: SupplierLedgerEntry = {
    id: 'led-' + Date.now(),
    supplierId,
    date: date || new Date().toISOString().split('T')[0],
    description: `Cash Payment to Supplier`,
    debit: Number(amount),
    credit: 0,
    balance: -Number(amount)
  };
  db.ledger.push(entry);
  writeDB(db);
  res.json({ status: 'success', entry, db });
});

// Settings update
app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = req.body;
  writeDB(db);
  res.json({ status: 'success', settings: db.settings, db });
});

// Mount Vite Dev Server or Serve static build folder
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bakery POS is running on http://localhost:${PORT}`);
  });
}

startServer();
