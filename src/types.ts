export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  profitMargin: number; // Percent, e.g. 50%
  stockQuantity: number;
  minStockLevel: number;
  expiryDate: string; // YYYY-MM-DD
  imageUrl?: string;
  categoryName?: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  date: string;
  description: string;
  debit: number; // Money we owe/paid
  credit: number; // Value of goods received
  balance: number; // Outstanding balance
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: 'Draft' | 'Sent' | 'Received';
  items: PurchaseOrderItem[];
  totalCost: number;
}

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
}

export interface CartItem {
  id: string; // unique for the cart (can be productId or temp ID for manual entry)
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isManual?: boolean;
}

export interface Transaction {
  id: string; // e.g. #AB-9042
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'EasyPaisa' | 'JazzCash';
  splitPayments?: { method: string; amount: number }[];
  date: string; // ISO String or Date
  status: 'Paid' | 'Hold' | 'Void';
  cashierName: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
}

export interface BakerySettings {
  bakeryName: string;
  tagline: string;
  address: string;
  phone: string;
  taxRate: number; // e.g. 8 for 8%
  receiptSize: '58mm' | '80mm';
  printerName: string;
  barcodePrefix: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Cashier';

export interface AlertNotification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'near_expiry';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  productId?: string;
}
