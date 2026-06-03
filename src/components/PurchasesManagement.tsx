import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Wallet,
  Calendar,
  Layers
} from 'lucide-react';
import { Product, Supplier, PurchaseOrder, SupplierLedgerEntry, PurchaseOrderItem } from '../types';

interface PurchasesProps {
  products: Product[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  ledger: SupplierLedgerEntry[];
  onSubmitPO: (po: PurchaseOrder) => Promise<void>;
  onSubmitPayment: (supplierId: string, amount: number) => Promise<void>;
}

export default function PurchasesManagement({
  products,
  suppliers,
  purchases,
  ledger,
  onSubmitPO,
  onSubmitPayment
}: PurchasesProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'ledger'>('orders');

  // Supplier payments state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // PO creation state
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  
  // Helpers for items builder inside PO modal
  const [itemProductId, setItemProductId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemCost, setItemCost] = useState('');

  // Auto-select general/first supplier when creating PO modal opens
  React.useEffect(() => {
    if (isPOModalOpen && suppliers.length > 0) {
      const generalSupplier = suppliers.find(s => 
        s.name.toLowerCase().includes('general') || 
        s.name.toLowerCase().includes('global')
      ) || suppliers[0];
      setPoSupplierId(generalSupplier.id);
    }
  }, [isPOModalOpen, suppliers]);

  // Auto supplier calculation
  const selectedSupplierDetail = useMemo(() => {
    return suppliers.find(s => s.id === poSupplierId);
  }, [suppliers, poSupplierId]);

  const poTotalValue = useMemo(() => {
    return poItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  }, [poItems]);

  const handleAddPOItem = () => {
    if (!itemProductId || !itemQty || !itemCost) return;
    const prod = products.find(p => p.id === itemProductId);
    if (!prod) return;

    const qty = Math.max(1, parseInt(itemQty) || 1);
    const cost = Math.max(0, parseFloat(itemCost) || 0);

    const newItem: PurchaseOrderItem = {
      productId: itemProductId,
      name: prod.name,
      quantity: qty,
      costPrice: cost
    };

    setPoItems([...poItems, newItem]);
    setItemProductId('');
    setItemQty('1');
    setItemCost('');
  };

  const handleRemovePOItem = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleCreatePOSubmit = async (status: 'Sent' | 'Received') => {
    if (!poSupplierId || poItems.length === 0) {
      alert('Please select a supplier and add elements to restock!');
      return;
    }

    const order: PurchaseOrder = {
      id: 'po-' + Date.now(),
      supplierId: poSupplierId,
      supplierName: selectedSupplierDetail?.name || 'Unknown Supplier',
      orderDate: new Date().toISOString().split('T')[0],
      status,
      items: poItems,
      totalCost: poTotalValue
    };

    await onSubmitPO(order);
    alert(`Purchase order created successfully! ${status === 'Received' ? 'Stock quantities incremented.' : ''}`);
    
    // Clear forms
    setIsPOModalOpen(false);
    setPoSupplierId('');
    setPoItems([]);
  };

  const handleDirectRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemProductId) {
      alert('Please select a product to restock.');
      return;
    }
    const prod = products.find(p => p.id === itemProductId);
    if (!prod) return;

    const qty = Math.max(1, parseInt(itemQty) || 1);
    const cost = Math.max(0, parseFloat(itemCost) || 0);

    const supplierId = poSupplierId || (suppliers.length > 0 ? (suppliers.find(s => 
      s.name.toLowerCase().includes('general') || 
      s.name.toLowerCase().includes('global')
    )?.id || suppliers[0].id) : 'supplier-default');

    const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Global Flour Co.';

    const newItem: PurchaseOrderItem = {
      productId: itemProductId,
      name: prod.name,
      quantity: qty,
      costPrice: cost
    };

    const order: PurchaseOrder = {
      id: 'po-' + Date.now(),
      supplierId,
      supplierName,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'Received',
      items: [newItem],
      totalCost: qty * cost
    };

    await onSubmitPO(order);
    alert(`Successfully replenished stock! Added ${qty} units of ${prod.name} at Rs. ${cost.toFixed(2)} each.`);

    // Reset and close
    setIsPOModalOpen(false);
    setItemProductId('');
    setItemQty('1');
    setItemCost('');
  };

  // Turn Sent PO into Received PO
  const handleMarkReceived = async (po: PurchaseOrder) => {
    const updated = {
      ...po,
      status: 'Received' as const
    };
    await onSubmitPO(updated);
    alert(`PO marked Received. Stock inventory replenished automatically.`);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierId || !payAmount) return;

    await onSubmitPayment(paySupplierId, parseFloat(payAmount) || 0);
    alert('Payment credited to supplier accounts ledger.');
    setPayModalOpen(false);
    setPayAmount('');
    setPaySupplierId('');
  };

  return (
    <div id="purchases-management-tab" className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Tab headings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Ingredients replenishment</span>
          <h2 className="text-3xl font-display font-black text-[#580c1f] mt-1">Purchases & Supply ledger</h2>
        </div>

        {/* CTA triggers */}
        <div className="flex gap-2">
          <button
            onClick={() => setPayModalOpen(true)}
            className="flex items-center py-2.5 px-4 bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#580c1f] rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 mr-1.5 text-zinc-600" />
            <span>Record Supplier Payment</span>
          </button>
          <button
            onClick={() => setIsPOModalOpen(true)}
            className="flex items-center py-2.5 px-4 bg-[#580c1f] hover:bg-[#430917] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex border-b border-gray-100 font-sans">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3.5 px-6 font-display font-extrabold text-sm relative transition-all cursor-pointer ${
            activeSubTab === 'orders' ? 'text-[#580c1f]' : 'text-gray-400 hover:text-[#580c1f]'
          }`}
        >
          <span>Purchase Orders History</span>
          {activeSubTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#580c1f]" />}
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`pb-3.5 px-6 font-display font-extrabold text-sm relative transition-all cursor-pointer ${
            activeSubTab === 'ledger' ? 'text-[#580c1f]' : 'text-gray-400 hover:text-[#580c1f]'
          }`}
        >
          <span>Supplier Ledgers & Payments</span>
          {activeSubTab === 'ledger' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#580c1f]" />}
        </button>
      </div>

      {activeSubTab === 'orders' ? (
        /* Part A: POs list */
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                  <th className="py-4 px-6">Purchase ID</th>
                  <th className="py-4 px-6">Supplier Source</th>
                  <th className="py-4 px-6">PO Items Detail</th>
                  <th className="py-4 px-6">Value (Cost)</th>
                  <th className="py-4 px-6">Order Date</th>
                  <th className="py-4 px-6 text-center">Receipt Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#580c1f]">
                      #{po.id}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      {po.supplierName}
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      {po.items.map((item, id) => (
                        <div key={id} className="text-gray-600">
                          • {item.name} <span className="font-mono text-gray-400 text-[10px]">({item.quantity} units @ Rs. {item.costPrice.toFixed(2)})</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-gray-900">
                      Rs. {po.totalCost.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 font-mono text-zinc-500">
                      {po.orderDate}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span 
                        className={`inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full ${
                          po.status === 'Received' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {po.status === 'Sent' && (
                        <button
                          onClick={() => handleMarkReceived(po)}
                          className="flex items-center text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg ml-auto cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Receive Ingredients</span>
                        </button>
                      )}
                      {po.status === 'Received' && (
                        <span className="text-[10px] text-gray-400 italic">No action - complete</span>
                      )}
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                      No purchase records registered yet. Build a PO above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Part B: Ledger & Debits/Credits */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suppliers.map(sup => {
              // Aggregate supplier balance
              const supplierLedger = ledger.filter(l => l.supplierId === sup.id);
              const totalDebits = supplierLedger.reduce((sum, l) => sum + l.debit, 0); // Payment we made
              const totalCredits = supplierLedger.reduce((sum, l) => sum + l.credit, 0); // Goods received value
              const balanceOwed = totalCredits - totalDebits;

              return (
                <div key={sup.id} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-gray-800 text-base">{sup.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">Ref Contact: {sup.contact} | {sup.phone}</p>
                    
                    <div className="border-t border-gray-100/60 my-4" />
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block font-mono">Paid Total:</span>
                        <span className="font-mono font-bold text-gray-700">Rs. {totalDebits.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-mono">Shipped Value:</span>
                        <span className="font-mono font-bold text-gray-700">Rs. {totalCredits.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-baseline bg-zinc-50 rounded-xl p-3 border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">Balance Owed:</span>
                    <span className="text-base font-mono font-black text-[#580c1f]">Rs. {balanceOwed.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="font-display font-bold text-gray-700 flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-orange-600" />
                Ledger Transaction Registers (Audits)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                    <th className="py-4 px-6">Entry ID</th>
                    <th className="py-4 px-6">Supplier Source</th>
                    <th className="py-4 px-6">Audit Description</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-center text-green-700">Debits (Payments Made)</th>
                    <th className="py-4 px-6 text-center text-red-700">Credits (Value of Goods)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-mono">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/20">
                      <td className="py-4 px-6 text-[#580c1f] font-bold">#{entry.id}</td>
                      <td className="py-4 px-6 font-sans font-bold text-gray-700">
                        {suppliers.find(s=>s.id === entry.supplierId)?.name || 'Generic Ledger'}
                      </td>
                      <td className="py-4 px-6 font-sans text-gray-600">{entry.description}</td>
                      <td className="py-4 px-6 text-zinc-550">{entry.date}</td>
                      <td className="py-4 px-6 text-center font-bold text-green-700">Rs. {entry.debit.toFixed(2)}</td>
                      <td className="py-4 px-6 text-center font-bold text-red-600">Rs. {entry.credit.toFixed(2)}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                        No transactions registered in audit book. Add custom payment above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG 1: Record payment made to suppliers */}
      {payModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex justify-between items-center">
              <h3 className="font-display font-black text-[#580c1f] text-sm">Record Supplier Cash Remittance</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400">✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Target Supplier *</label>
                <select
                  required
                  value={paySupplierId}
                  onChange={(e) => setPaySupplierId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none cursor-pointer"
                >
                  <option value="" disabled>Select Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Payment Debit Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  placeholder="e.g. 500.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="py-2 px-4 border border-gray-200 text-xs font-bold text-gray-500 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-[#580c1f] hover:bg-[#3f0916] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Post Payment Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: Create Purchase Restock Order */}
      {isPOModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <form onSubmit={handleDirectRestockSubmit} className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex justify-between items-center">
              <h3 className="font-display font-extrabold text-[#580c1f] text-sm flex items-center">
                <Truck className="w-4 h-4 mr-1.5" />
                Direct Stock Replenishment
              </h3>
              <button type="button" onClick={() => setIsPOModalOpen(false)} className="text-gray-400">✕</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ingredient Supplier (Auto-Fixed)</label>
                <div className="bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl p-3 text-xs font-bold flex justify-between items-center">
                  <span>{selectedSupplierDetail?.name || 'Global Flour Co.'}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Contact: {selectedSupplierDetail?.contact || 'Michael Scott'}</span>
                </div>
              </div>

              {/* Items builder frame */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Select Catalog Product *</label>
                  <select
                    required
                    value={itemProductId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItemProductId(val);
                      const prod = products.find(p => p.id === val);
                      if (prod) {
                        setItemCost(prod.purchasePrice.toString());
                      } else {
                        setItemCost('');
                      }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none cursor-pointer font-bold text-zinc-800"
                  >
                    <option value="">Select Catalog Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Current unit: {p.stockQuantity})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block font-bold mb-1">Quantity to Restock *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block font-bold mb-1">Cost Price per Unit (Rs.) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 1.20"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="py-2.5 px-4 border border-gray-200 hover:bg-zinc-100 text-xs font-extrabold text-gray-500 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="py-2.5 px-5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-transform active:scale-[0.98]"
              >
                Add to Stock
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
