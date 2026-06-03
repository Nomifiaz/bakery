import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Percent, 
  Ticket, 
  Sparkles, 
  Pause, 
  Play, 
  Columns3, 
  Merge, 
  CreditCard, 
  Receipt, 
  Printer, 
  CornerDownLeft, 
  ShoppingCart,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { Product, Category, CartItem, Customer, Transaction, BakerySettings } from '../types';

interface POSBillingProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  settings: BakerySettings;
  onSubmitTransaction: (tx: Transaction) => Promise<void>;
  transactions: Transaction[]; // for merge/resume purposes
  onUpdateTransactionStatus?: (id: string, status: 'Paid' | 'Hold' | 'Void') => Promise<void>;
  onBack?: () => void;
}

export default function POSBilling({ 
  products, 
  categories, 
  customers, 
  settings, 
  onSubmitTransaction, 
  transactions,
  onUpdateTransactionStatus,
  onBack
}: POSBillingProps) {
  // Navigation & Filter States
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Cart & Invoice states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-3'); // default: Walk-in
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [taxOverride, setTaxOverride] = useState<boolean>(true); // toggles tax applying

  // Custom Product Manual entry modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualNotes, setManualNotes] = useState('');

  // Payment states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'EasyPaisa' | 'JazzCash'>('Cash');
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [paymentSplit, setPaymentSplit] = useState<{ active: boolean; amt1: number; method1: string; amt2: number; method2: string }>({
    active: false,
    amt1: 0,
    method1: 'Cash',
    amt2: 0,
    method2: 'Card'
  });

  // Hold & Resume States
  const [holdNotes, setHoldNotes] = useState('');
  const [isMergePickerOpen, setIsMergePickerOpen] = useState(false);

  // Completed Receipt Dialog
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [receiptSize, setReceiptSize] = useState<'58mm' | '80mm'>(settings.receiptSize || '80mm');

  // Input ref for barcode automation
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Barcode quick scan scanner automation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Find item with matching barcode or SKU
    const match = products.find(
      p => p.barcode === searchQuery.trim() || p.sku.toLowerCase() === searchQuery.toLowerCase().trim()
    );

    if (match) {
      handleAddToCart(match);
      setSearchQuery('');
    }
  };

  // Real-time instant auto-add on exact barcode/SKU scan match (Direct to Cart)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const match = products.find(
      p => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      // Ex stock depletion sanity warning
      if (match.stockQuantity <= 0) {
        alert(`Warning: ${match.name} is marked Out of Stock! Still billing, but check inventory.`);
      }

      setCart(prev => {
        const existing = prev.find(item => item.productId === match.id);
        if (existing) {
          return prev.map(item => 
            item.productId === match.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, {
          id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          productId: match.id,
          name: match.name,
          price: match.salePrice,
          quantity: 1
        }];
      });
      setSearchQuery('');
    }
  }, [searchQuery, products]);

  // Switch customer discount percentages if loyal
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const customerLoyaltyDiscount = useMemo(() => {
    if (!currentCustomer) return 0;
    if (currentCustomer.loyaltyPoints > 100) return 10; // 10% auto discount
    if (currentCustomer.loyaltyPoints > 50) return 5; // 5% auto discount
    return 0;
  }, [currentCustomer]);

  // Cart math
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Calculate taxes
  const taxAmount = useMemo(() => {
    if (!taxOverride) return 0;
    const rate = settings.taxRate || 8;
    return Number(((subtotal * rate) / 100).toFixed(2));
  }, [subtotal, taxOverride, settings.taxRate]);

  // Calculate discounts
  const calculatedDiscount = useMemo(() => {
    let baseDiscount = 0;
    if (discountType === 'fixed') {
      baseDiscount = discountAmount;
    } else {
      baseDiscount = (subtotal * discountAmount) / 100;
    }

    // Customer loyalty bonus points discount
    if (customerLoyaltyDiscount > 0) {
      baseDiscount += (subtotal * customerLoyaltyDiscount) / 100;
    }

    return Math.min(subtotal + taxAmount, baseDiscount);
  }, [subtotal, taxAmount, discountAmount, discountType, customerLoyaltyDiscount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - calculatedDiscount);
  }, [subtotal, taxAmount, calculatedDiscount]);

  // Split bill helper setup
  useEffect(() => {
    if (isCheckoutOpen) {
      setReceivedCash(total.toFixed(2));
      setPaymentSplit(prev => ({
        ...prev,
        amt1: Number((total / 2).toFixed(2)),
        amt2: Number((total / 2).toFixed(2))
      }));
    }
  }, [isCheckoutOpen, total]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategoryId === 'all' || p.categoryId === activeCategoryId;
      const matchText = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.barcode.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchText;
    });
  }, [products, activeCategoryId, searchQuery]);

  // Held Orders selector list
  const heldTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'Hold');
  }, [transactions]);

  // Add Item
  const handleAddToCart = (product: Product) => {
    // Ex stock depletion sanity warning
    if (product.stockQuantity <= 0) {
      alert(`Warning: ${product.name} is marked Out of Stock! Still billing, but check inventory.`);
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        productId: product.id,
        name: product.name,
        price: product.salePrice,
        quantity: 1
      }];
    });
  };

  // Manual Custom Product Entry Add
  const handleAddManualProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPrice) return;

    const price = Math.max(0, parseFloat(manualPrice) || 0);
    const quantity = Math.max(1, parseInt(manualQty) || 1);

    setCart(prev => [
      ...prev,
      {
        id: 'manual-' + Date.now(),
        name: manualName,
        price: price,
        quantity: quantity,
        isManual: true,
        notes: manualNotes || undefined
      }
    ]);

    // reset forms
    setIsManualModalOpen(false);
    setManualName('');
    setManualPrice('');
    setManualQty('1');
    setManualNotes('');
  };

  const handleUpdateQty = (itemId: string, increment: boolean) => {
    setCart(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const nextQty = increment ? item.quantity + 1 : item.quantity - 1;
          return nextQty > 0 ? { ...item, quantity: nextQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // HOLD billing logic
  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    const invNo = 'AB-' + Math.floor(1000 + Math.random() * 9000);
    const tx: Transaction = {
      id: 'trans-' + Date.now(),
      invoiceNumber: invNo,
      customerId: selectedCustomerId,
      customerName: currentCustomer?.name,
      customerPhone: currentCustomer?.phone,
      items: cart,
      subtotal,
      tax: taxAmount,
      discount: calculatedDiscount,
      total,
      paymentMethod: 'Cash', // Placeholder default
      date: new Date().toISOString(),
      status: 'Hold',
      cashierName: 'Admin Station 01',
      notes: holdNotes || 'Held Order draft'
    };

    await onSubmitTransaction(tx);
    // resets
    setCart([]);
    setHoldNotes('');
    alert(`Order ${invNo} saved to Hold ledger.`);
  };

  // RESUME held order
  const handleResumeOrder = (heldTx: Transaction) => {
    setCart(heldTx.items);
    setSelectedCustomerId(heldTx.customerId || 'cust-3');
    setTaxOverride(heldTx.tax > 0);
    
    // Auto erase the Hold status transaction or wait until checked out to update on database? 
    // We can change status of original to Void or just delete/overwrite it. Let's void the original so it's clean!
    if (onUpdateTransactionStatus) {
      onUpdateTransactionStatus(heldTx.id, 'Void');
    }
  };

  // MERGE multiple held orders
  const handleMergeBills = (heldTx: Transaction) => {
    // Append held items to current cart
    setCart(prev => {
      const mergedList = [...prev];
      heldTx.items.forEach(targetItem => {
        const matchIndex = mergedList.findIndex(x => x.productId === targetItem.productId);
        if (matchIndex !== -1 && targetItem.productId) {
          mergedList[matchIndex].quantity += targetItem.quantity;
        } else {
          mergedList.push({
            ...targetItem,
            id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
          });
        }
      });
      return mergedList;
    });

    if (onUpdateTransactionStatus) {
      onUpdateTransactionStatus(heldTx.id, 'Void');
    }
    setIsMergePickerOpen(false);
    alert('Billed items merged successfully.');
  };

  // COMPLETE transaction checkout
  const handleCompletePayment = async () => {
    const randomInv = 'AB-' + Math.floor(1000 + Math.random() * 9000);
    const splitPayments = paymentSplit.active ? [
      { method: paymentSplit.method1, amount: paymentSplit.amt1 },
      { method: paymentSplit.method2, amount: paymentSplit.amt2 }
    ] : undefined;

    const tx: Transaction = {
      id: 'trans-' + Date.now(),
      invoiceNumber: randomInv,
      customerId: selectedCustomerId,
      customerName: currentCustomer?.name,
      customerPhone: currentCustomer?.phone,
      items: cart,
      subtotal,
      tax: taxAmount,
      discount: calculatedDiscount,
      total,
      paymentMethod: paymentSplit.active ? 'Card' : paymentMethod, // Default main method identifier
      splitPayments,
      date: new Date().toISOString(),
      status: 'Paid',
      cashierName: 'Admin Station 01'
    };

    await onSubmitTransaction(tx);
    setCompletedTx(tx);
    setIsCheckoutOpen(false);
    setCart([]); // reset the cart
  };

  // Back of card calculator helpers
  const changeExpected = useMemo(() => {
    const received = parseFloat(receivedCash) || 0;
    return Math.max(0, received - total);
  }, [receivedCash, total]);

  return (
    <div id="pos-billing-module" className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 font-sans h-[calc(100vh-60px)]">
      
      {/* LEFT: Product selection grid and category filters */}
      <div id="pos-left-side" className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Search header with Barcode submission */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 hover:bg-red-50/50 hover:text-[#580c1f] hover:border-red-200 text-gray-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Exit POS</span>
            </button>
          )}
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              id="pos-search-barcode-input"
              ref={barcodeInputRef}
              type="text"
              placeholder="Search products by Name or Scan Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-[#580c1f] focus:ring-1 focus:ring-[#580c1f] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-700 outline-none shadow-sm font-sans"
            />
            {searchQuery && (
              <span className="absolute right-3.5 top-2.5 text-[9px] font-mono font-extrabold bg-[#580c1f]/10 text-[#580c1f] uppercase px-1.5 py-0.5 rounded">
                Hit Enter to Scan
              </span>
            )}
          </form>

          {/* Quick Active Held Order Resumes */}
          {heldTransactions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-none">
              <span className="text-[11px] font-bold text-amber-700 uppercase bg-amber-50 py-1.5 px-2.5 rounded-lg border border-amber-100 flex items-center">
                <Play className="w-3 h-3 mr-1" />
                {heldTransactions.length} Holds
              </span>
              
              <select
                onChange={(e) => {
                  const tx = heldTransactions.find(t => t.id === e.target.value);
                  if (tx) handleResumeOrder(tx);
                  e.target.value = ''; // Reset select
                }}
                className="text-xs bg-white border border-gray-200 outline-none rounded-xl px-2.5 py-2.5 shadow-sm font-semibold text-[#580c1f] cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>Resume Hold...</option>
                {heldTransactions.map(t => (
                  <option key={t.id} value={t.id}>
                    Invoice #{t.invoiceNumber} - Rs. {t.total.toFixed(2)} ({t.customerName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Categories Carousel Tab selector */}
        <div id="pos-category-tabs" className="flex items-center space-x-2 overflow-x-auto pb-3 flex-none select-none scrollbar-none">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-4.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
              activeCategoryId === 'all'
                ? 'bg-[#580c1f] border-[#580c1f] text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                activeCategoryId === cat.id
                  ? 'bg-[#580c1f] border-[#580c1f] text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Actionable item catalog grids */}
        <div id="products-catalog-grid" className="flex-1 overflow-y-auto pr-1 pb-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          
          {/* Custom products manual entry option block */}
          <div
            id="pos-manual-entry-tile"
            onClick={() => setIsManualModalOpen(true)}
            className="border-2 border-dashed border-red-200/60 rounded-2xl flex flex-col items-center justify-center p-6 bg-red-50/20 hover:bg-red-50/45 transition-all text-center cursor-pointer group hover:scale-[1.01] hover:border-[#580c1f]"
          >
            <div className="w-12 h-12 bg-red-100/65 text-[#580c1f] rounded-full flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
            </div>
            <h5 className="text-xs font-bold text-gray-800">Generic Manual Entry</h5>
            <p className="text-[10px] text-gray-400 mt-1">Special sweets, cakes, customized weights</p>
          </div>

          {/* Catalog listed products */}
          {filteredProducts.map((prod) => {
            const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= prod.minStockLevel;
            const isOut = prod.stockQuantity <= 0;
            return (
              <div
                id={`product-card-${prod.id}`}
                key={prod.id}
                onClick={() => handleAddToCart(prod)}
                className={`bg-white border border-gray-100 rounded-2xl p-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-pointer relative select-none hover:scale-[1.01] active:scale-[0.99] group ${
                  isOut ? 'opacity-55' : ''
                }`}
              >
                {/* Images mock visually custom icons or patterns */}
                <div className="aspect-square w-full rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden mb-3.5 relative">
                  {prod.stockQuantity <= 0 ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] uppercase font-bold text-white tracking-widest z-10">
                      Out of Stock
                    </div>
                  ) : isLow ? (
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-extrabold uppercase py-0.5 px-2 rounded-md tracking-wider z-10 animate-pulse">
                      Low Stock
                    </div>
                  ) : null}
                  
                  {/* Generate cozy styled initials based on names */}
                  <div className="text-4xl text-[#580c1f]/10 font-bold group-hover:scale-110 transition-transform">
                    {prod.name.split(' ').map(x=>x[0]).join('').substring(0,3)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-mono tracking-tight">{prod.sku}</p>
                  <h4 className="text-xs font-bold text-gray-800 mt-0.5 leading-tight truncate group-hover:text-[#580c1f]">
                    {prod.name}
                  </h4>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-xs font-bold text-gray-900">Rs. {prod.salePrice.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 font-mono font-medium">Qty: {prod.stockQuantity}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 text-xs">
              No products found matching the query.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Order Cart Column */}
      <div id="pos-right-side-cart" className="w-full lg:w-96 bg-white border border-gray-100 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden pb-4">
        
        {/* Cart list Header */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-[#580c1f]" />
            <h3 className="font-display font-extrabold text-sm text-gray-800">Current Basket</h3>
          </div>
          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="p-1.5 border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 cursor-pointer"
            title="Clear Basket"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Select Option with Auto Loyalty Check */}
        <div className="p-3 bg-[#FAF9F6] border-b border-gray-50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-gray-500">Bill Customer:</span>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="text-xs max-w-56 overflow-hidden text-[#580c1f] font-bold outline-none bg-transparent cursor-pointer"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone !== 'N/A' ? `(${c.phone})` : ''} - {c.loyaltyPoints}pts
              </option>
            ))}
          </select>
        </div>

        {/* Item Cards inside Cart */}
        <div id="cart-items-feed" className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item) => (
            <div 
              key={item.id}
              className="bg-gray-50/50 hover:bg-gray-50/80 border border-gray-100 rounded-2xl p-3 flex justify-between items-start transition-all"
            >
              <div className="flex-1 min-w-0 mr-2">
                <span className="text-[10px] uppercase font-mono tracking-tight font-extrabold text-[#580c1f]">
                  {item.isManual ? 'Manual Entry' : 'Physical SKU'}
                </span>
                <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{item.name}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Rs. {item.price.toFixed(2)} each</p>
                {item.notes && (
                  <p className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded italic mt-1 inline-block">
                    Notes: {item.notes}
                  </p>
                )}
              </div>

              {/* Increments and actions */}
              <div className="flex flex-col items-end justify-between h-full gap-2 flex-none">
                <span className="text-xs font-display font-bold text-gray-800">
                  Rs. {(item.price * item.quantity).toFixed(2)}
                </span>
                
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-xs">
                  <button 
                    onClick={() => handleUpdateQty(item.id, false)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-gray-700 min-w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => handleUpdateQty(item.id, true)}
                    className="p-1 text-gray-400 hover:text-[#580c1f] rounded hover:bg-gray-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <ShoppingCart className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-xs font-medium">Your basket is empty!</p>
              <p className="text-[10px] text-gray-400 mt-1">Select items on the catalog grid or manually add sweets.</p>
            </div>
          )}
        </div>

        {/* Footer Billing calculations */}
        <div id="cart-footer-calculations" className="p-4 border-t border-gray-100 bg-[#FDFCF7]/80 space-y-2.5 flex-none select-none">
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal:</span>
            <span className="font-semibold font-mono">Rs. {subtotal.toFixed(2)}</span>
          </div>

          {/* Loyalty auto disclaimer */}
          {customerLoyaltyDiscount > 0 && (
            <div className="flex justify-between text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
              <span>Loyalty Points Discount ({customerLoyaltyDiscount}%):</span>
              <span className="font-mono">-Rs. {((subtotal * customerLoyaltyDiscount) / 100).toFixed(2)}</span>
            </div>
          )}

          {/* Active adjustments widgets */}
          <div className="flex items-center gap-2 py-1 border-t border-b border-gray-100">
            {/* Discount override input */}
            <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px]">
              <Percent className="w-3 h-3 text-gray-400 mr-1.5" />
              <input
                type="number"
                min="0"
                placeholder="Discount"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent border-none outline-none font-sans font-medium"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}
                className="bg-transparent text-gray-600 font-semibold cursor-pointer outline-none ml-1 text-[10px]"
              >
                <option value="fixed">Rs.</option>
                <option value="percent">%</option>
              </select>
            </div>

            {/* Tax toggle */}
            <button
              onClick={() => setTaxOverride(!taxOverride)}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                taxOverride 
                  ? 'bg-red-50 border-red-200 text-[#580c1f]' 
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
              title="Toggle Tax rate on billing"
            >
              Tax: {taxOverride ? `${settings.taxRate || 8}%` : 'Off'}
            </button>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>Taxes & Levies:</span>
            <span className="font-semibold font-mono">Rs. {taxAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Discount Adjustments:</span>
            <span className="font-semibold font-mono">-Rs. {calculatedDiscount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-900 border-t border-zinc-200/60 pt-2 flex-none">
            <span className="font-extrabold font-display">Total Bill Value:</span>
            <span className="font-extrabold font-mono text-base text-[#580c1f]">Rs. {total.toFixed(2)}</span>
          </div>

          {/* Billing active flow shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              disabled={cart.length === 0}
              onClick={handleHoldOrder}
              className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-gray-700 disabled:opacity-40 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
            >
              <Pause className="w-3.5 h-3.5 mr-1" />
              <span>Hold Order</span>
            </button>
            <button
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="py-2.5 px-4 bg-[#580c1f] hover:bg-[#3f0916] text-white disabled:opacity-40 text-xs font-extrabold rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] shadow-md"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Generic Manual custom product entry */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex items-center justify-between">
              <h3 className="font-display font-extrabold text-[#580c1f] text-sm flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Generic/Custom Sweet Entry
              </h3>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddManualProductSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Product Name / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Caramel Cake, Wedding Fondant Tier"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Unit Selling Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 150.00"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Special Chef Notes / Requests</label>
                <textarea
                  placeholder="e.g. Blue icing, candle pack, eggless request..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#580c1f] hover:bg-[#3f0916] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Add generic Sweet to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Interactive Cash Change & Checkout split options */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex items-center justify-between">
              <h3 className="font-display font-extrabold text-[#580c1f] text-sm">
                Complete Checkout & Pay
              </h3>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[80vh]">
              {/* Grand total visual indicator */}
              <div className="bg-red-50/20 border border-red-50 text-[#580c1f] rounded-2xl p-4 text-center">
                <p className="text-xs font-mono uppercase tracking-widest font-semibold text-gray-400">Total Bill Payable</p>
                <p className="text-3xl font-mono font-bold mt-1">Rs. {total.toFixed(2)}</p>
              </div>

              {/* Direct multiple payment selector buttons */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Main Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['Cash', 'Card', 'Bank Transfer', 'EasyPaisa', 'JazzCash'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method as any)}
                      className={`py-3.5 px-2 text-center rounded-xl border text-xs font-bold transition-all relative cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-[#580c1f] border-[#580c1f] text-white shadow-md'
                          : 'bg-white border-zinc-200 hover:border-red-100 text-gray-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash change computation */}
              {paymentMethod === 'Cash' && (
                <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600">Calculated Cash Tendered (Rs.)</label>
                    <span 
                      onClick={() => setReceivedCash(total.toFixed(2))}
                      className="text-[10px] font-bold text-[#580c1f] underline cursor-pointer"
                    >
                      Exact Cash
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter cash given by customer..."
                    value={receivedCash}
                    onChange={(e) => setReceivedCash(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] focus:outline-none rounded-xl p-2.5 text-sm font-mono font-bold"
                  />

                  {parseFloat(receivedCash) > 0 && (
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200/50">
                      <span className="font-semibold text-gray-500">Return Change:</span>
                      <span className="font-mono font-bold text-lg text-[#580c1f]">
                        Rs. {changeExpected.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* POS Split Billing option */}
              <div className="border border-zinc-200/60 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 flex items-center">
                    <Columns3 className="w-4 h-4 mr-1 text-[#580c1f]" />
                    Split Bill Custom Option
                  </span>
                  <input
                    type="checkbox"
                    checked={paymentSplit.active}
                    onChange={(e) => setPaymentSplit(prev => ({ ...prev, active: e.target.checked }))}
                    className="accent-[#580c1f] w-4 h-4 cursor-pointer"
                  />
                </div>

                {paymentSplit.active && (
                  <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-zinc-100 animate-slide-down">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400">Method 1 Amt</label>
                      <input
                        type="number"
                        value={paymentSplit.amt1}
                        onChange={(e) => setPaymentSplit(prev => ({ ...prev, amt1: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-zinc-50 rounded-lg p-2 text-xs font-mono outline-none border border-gray-100"
                      />
                      <select
                        value={paymentSplit.method1}
                        onChange={(e) => setPaymentSplit(prev => ({ ...prev, method1: e.target.value }))}
                        className="text-xs border border-gray-100 rounded p-1"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400">Method 2 Amt</label>
                      <input
                        type="number"
                        value={paymentSplit.amt2}
                        onChange={(e) => setPaymentSplit(prev => ({ ...prev, amt2: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-zinc-50 rounded-lg p-2 text-xs font-mono outline-none border border-gray-100"
                      />
                      <select
                        value={paymentSplit.method2}
                        onChange={(e) => setPaymentSplit(prev => ({ ...prev, method2: e.target.value }))}
                        className="text-xs border border-gray-100 rounded p-1"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#FDFCF7] border-t border-gray-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 border border-blue-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 cursor-pointer"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handleCompletePayment}
                className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                Complete Payment & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Receipt thermal layouts switcher */}
      {completedTx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans animate-fade-in select-none">
          <div className="bg-zinc-800 rounded-3xl p-6 shadow-2xl max-w-md w-full flex flex-col h-[90vh]">
            
            <div className="flex items-center justify-between text-white mb-4 flex-none">
              <h3 className="font-display font-black text-sm flex items-center">
                <Printer className="w-4 h-4 mr-2 text-green-400" />
                Thermal Printer Layout Preview
              </h3>
              
              <div className="flex border border-zinc-700 rounded-lg p-0.5 text-xs">
                {['58mm', '80mm'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setReceiptSize(size as any)}
                    className={`px-3 py-1 font-bold rounded-md cursor-pointer ${
                      receiptSize === size 
                        ? 'bg-zinc-700 text-green-400 font-extrabold' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Thermal Paper */}
            <div className="flex-1 overflow-y-auto bg-white p-6 rounded-2xl shadow-inner receipt-paper relative text-black shrink-0">
              <div className={`mx-auto text-center ${receiptSize === '58mm' ? 'max-w-[220px] text-[11px]' : 'max-w-[340px] text-xs'}`}>
                
                {/* Bakery Header */}
                <h2 className="font-display font-extrabold text-base text-[#580c1f]">{settings.bakeryName}</h2>
                <p className="text-[10px] text-gray-500 italic mt-0.5">{settings.tagline}</p>
                <p className="text-[9px] text-gray-400 mt-1">{settings.address}</p>
                <p className="text-[9px] text-gray-400">Tel: {settings.phone}</p>
                
                <div className="border-t border-dashed border-zinc-300 my-4" />
                
                {/* Sale Details */}
                <div className="text-left space-y-1 text-[10px] text-zinc-600 font-mono">
                  <div className="flex justify-between">
                    <span>Invoice: #{completedTx.invoiceNumber}</span>
                    <span>Date: {new Date(completedTx.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier: {completedTx.cashierName}</span>
                    <span>Time: {new Date(completedTx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer: {completedTx.customerName || 'Walk-in'}</span>
                    <span>Method: {completedTx.paymentMethod}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-300 my-4" />

                {/* Items rows */}
                <div className="text-left font-mono text-[10px] space-y-2">
                  <div className="flex justify-between font-extrabold border-b border-dashed border-zinc-200 pb-1">
                    <span>Item Name</span>
                    <span>Qty x Price</span>
                    <span className="text-right">Total</span>
                  </div>
                  
                  {completedTx.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                       <div className="flex flex-col max-w-[50%]">
                        <span className="font-bold">{item.name}</span>
                        {item.notes && <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Note: {item.notes}</span>}
                      </div>
                      <span className="text-zinc-500 font-mono">
                        {item.quantity} x Rs. {item.price.toFixed(2)}
                      </span>
                      <span className="text-right font-bold font-mono">
                        Rs. {(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-zinc-300 my-4" />

                {/* Calculations summary */}
                <div className="text-right font-mono text-[10px] space-y-1 p-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {completedTx.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {completedTx.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount Given:</span>
                      <span>-Rs. {completedTx.discount.toFixed(2)}</span>
                    </div>
                  )}

                  {completedTx.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Sales Tax ({settings.taxRate}%):</span>
                      <span>Rs. {completedTx.tax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs font-bold border-t border-zinc-900 border-dashed pt-1.5 mt-1 text-[#580c1f]">
                    <span>Grand Total:</span>
                    <span>Rs. {completedTx.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-zinc-300 my-4" />

                {/* Split Details option */}
                {completedTx.splitPayments && completedTx.splitPayments.length > 0 && (
                  <div className="text-left text-[9px] font-mono mb-4 text-[#580c1f]">
                    <p className="font-bold">Split Bills Payments Checked:</p>
                    {completedTx.splitPayments.map((p, idx) => (
                      <p key={idx} className="pl-2">• {p.method}: Rs. {p.amount.toFixed(2)}</p>
                    ))}
                    <div className="border-t border-dashed border-zinc-300 my-4" />
                  </div>
                )}

                {/* Footer messages */}
                <p className="text-[10px] font-sans font-bold text-zinc-700 italic">Thank You For Dining With Us!</p>
                <p className="text-[9px] font-mono text-zinc-400 mt-1">Receipt Printed on {settings.printerName || 'XP-80'}</p>
                
                {/* Visual mock barcode */}
                <div className="mt-4 flex flex-col items-center">
                  <div className="h-8 w-44 bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)] opacity-70" />
                  <span className="text-[8px] font-mono text-zinc-400 mt-1">*{completedTx.id.substring(0, 10).toUpperCase()}*</span>
                </div>

              </div>
            </div>

            {/* Option CTA triggers */}
            <div className="mt-4 flex space-x-2 flex-none">
              <button
                type="button"
                onClick={() => {
                  alert('Receipt print command passed to thermal spooler.');
                }}
                className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md text-center flex items-center justify-center transition-all"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Physical Thermal Receipt
              </button>
              <button
                type="button"
                onClick={() => setCompletedTx(null)}
                className="py-3 px-6 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
