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
                          • {item.name} <span className="font-mono text-gray-400 text-[10px]">({item.quantity} units @ ${item.costPrice.toFixed(2)})</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-gray-900">
                      ${po.totalCost.toFixed(2)}
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
                        <span className="font-mono font-bold text-gray-700">${totalDebits.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-mono">Shipped Value:</span>
                        <span className="font-mono font-bold text-gray-700">${totalCredits.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-baseline bg-zinc-50 rounded-xl p-3 border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">Balance Owed:</span>
                    <span className="text-base font-mono font-black text-[#580c1f]">${balanceOwed.toFixed(2)}</span>
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
                      <td className="py-4 px-6 text-center font-bold text-green-700">${entry.debit.toFixed(2)}</td>
                      <td className="py-4 px-6 text-center font-bold text-red-600">${entry.credit.toFixed(2)}</td>
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
                <label className="block text-xs font-bold text-gray-500 mb-1">Payment Debit Amount ($) *</label>
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
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex justify-between items-center">
              <h3 className="font-display font-extrabold text-[#580c1f] text-sm flex items-center">
                <Truck className="w-4 h-4 mr-1.5" />
                Draft Supplier Restock PO
              </h3>
              <button onClick={() => setIsPOModalOpen(false)} className="text-gray-400">✕</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Select Ingredient Supplier *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none cursor-pointer"
                >
                  <option value="">Choose Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>
                  ))}
                </select>
              </div>

              {/* Items builder frame */}
              <div className="bg-zinc-50 rounded-2xl p-4 space-y-3 border border-gray-50">
                <span className="text-xs font-extrabold text-zinc-600 block">Add Ingredient / Restock Item</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <select
                      value={itemProductId}
                      onChange={(e) => setItemProductId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none cursor-pointer"
                    >
                      <option value="">Select Catalog Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Current unit: {p.stockQuantity})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Quantity to Order</label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Replenish Unit Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1.20"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddPOItem}
                  className="w-full py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  + Append Item below
                </button>
              </div>

              {/* Added items list */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {poItems.map((item, idx) => (
                  <div key={idx} className="bg-[#FDFCF7] border border-gray-100 rounded-lg p-2 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-gray-800">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400 block">{item.quantity} units @ ${item.costPrice.toFixed(2)} each</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-700 font-mono">${(item.quantity * item.costPrice).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePOItem(idx)}
                        className="text-red-500 text-xs hover:underline cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              {poItems.length > 0 && (
                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-baseline text-xs font-bold text-gray-800">
                  <span>Grand PO Value:</span>
                  <span className="font-mono text-base text-[#580c1f]">${poTotalValue.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="py-2 px-4 border border-gray-200 hover:bg-zinc-100 text-xs font-extrabold text-gray-500 rounded-xl cursor-pointer"
              >
                Close
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCreatePOSubmit('Sent')}
                  className="py-2.5 px-4 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Send to Supplier
                </button>
                <button
                  type="button"
                  onClick={() => handleCreatePOSubmit('Received')}
                  className="py-2.5 px-4 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Receive Stock Directly
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
