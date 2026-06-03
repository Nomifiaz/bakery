import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Phone, 
  MapPin, 
  Award, 
  History, 
  Plus, 
  Edit2, 
  Trash2,
  CalendarCheck
} from 'lucide-react';
import { Customer, Transaction } from '../types';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (cust: Customer) => Promise<void>;
  onUpdateCustomer: (cust: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export default function CustomersManagement({
  customers,
  transactions,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}: CustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPoints, setFormPoints] = useState('0');

  // Selected customer for purchase logs sidebar preview
  const [previewCustomerId, setPreviewCustomerId] = useState<string | null>('cust-1');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const selectedCustomerDetail = useMemo(() => {
    return customers.find(c => c.id === previewCustomerId);
  }, [customers, previewCustomerId]);

  // Customer transactions tracker
  const customerPurchaseHistory = useMemo(() => {
    if (!previewCustomerId) return [];
    return transactions.filter(t => t.customerId === previewCustomerId);
  }, [transactions, previewCustomerId]);

  const handleOpenForm = (cust: Customer | null) => {
    if (cust) {
      setEditingCustomer(cust);
      setFormName(cust.name);
      setFormPhone(cust.phone);
      setFormAddress(cust.address);
      setFormPoints(String(cust.loyaltyPoints));
    } else {
      setEditingCustomer(null);
      setFormName('');
      setFormPhone('');
      setFormAddress('');
      setFormPoints('0');
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const payload: Customer = {
      id: editingCustomer?.id || ('cust-' + Date.now()),
      name: formName,
      phone: formPhone,
      address: formAddress || 'N/A',
      loyaltyPoints: Math.max(0, parseInt(formPoints) || 0)
    };

    if (editingCustomer) {
      await onUpdateCustomer(payload);
    } else {
      await onAddCustomer(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (id === 'cust-3') {
      alert('Walk-in Customer registry cannot be deleted.');
      return;
    }
    if (window.confirm('Delete customer database profile? Points and histories will clear.')) {
      await onDeleteCustomer(id);
      if (previewCustomerId === id) {
        setPreviewCustomerId(null);
      }
    }
  };

  return (
    <div id="customers-module-panel" className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header and Add Customer Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">CRM Directories</span>
          <h2 className="text-3xl font-display font-black text-[#580c1f] mt-1">Loyalty Customer Registry</h2>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="flex items-center self-start sm:self-auto py-2 px-4 bg-[#580c1f] hover:bg-[#430917] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Main Grid: Directory List on Left, Purchase Histories on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Customers Directories Search List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center">
            <Users className="w-4 h-4 text-gray-400 mr-2.5" />
            <input
              type="text"
              placeholder="Search regular patrons by name, phone digit, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs outline-none"
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden select-none">
            {filteredCustomers.map((cust) => {
              const isSelected = previewCustomerId === cust.id;
              const isWalkIn = cust.id === 'cust-3';
              
              return (
                <div
                  key={cust.id}
                  onClick={() => setPreviewCustomerId(cust.id)}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-red-50/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-display font-extrabold text-sm border border-amber-100 flex-none">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-gray-800 truncate">{cust.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {cust.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 flex-none ml-4 text-xs font-sans">
                    <div className="text-right">
                      {!isWalkIn ? (
                        <div className="inline-flex items-center font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                          <Award className="w-3.5 h-3.5 mr-1 text-amber-600 animate-bounce" />
                          <span>{cust.loyaltyPoints} points</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">No points (Walk-in)</span>
                      )}
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenForm(cust);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#580c1f] transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={isWalkIn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cust.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-20"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="py-16 text-center text-gray-400 text-xs">
                No customer directory matches searching query.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details & Purchase Logs Panel */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-6">
          {selectedCustomerDetail ? (
            <>
              <div>
                <span className="text-[10px] bg-[#580c1f]/10 text-[#580c1f] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded">
                  Patron profile
                </span>
                <h3 className="font-display font-black text-gray-800 text-lg mt-2">{selectedCustomerDetail.name}</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">{selectedCustomerDetail.phone}</p>
                
                {/* Contact information details */}
                <div className="space-y-2.5 mt-4 text-xs font-sans text-gray-600">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-[#580c1f] mr-2 mt-0.5" />
                    <span>{selectedCustomerDetail.address}</span>
                  </div>
                  {selectedCustomerDetail.id !== 'cust-3' && (
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-[#580c1f] mr-2" />
                      <span className="font-bold text-[#5c0e21]">
                        {selectedCustomerDetail.loyaltyPoints >= 100 
                          ? 'Elite Tier Member (10% Checkout Discounts)' 
                          : selectedCustomerDetail.loyaltyPoints >= 54
                          ? 'Silver Tier Member (5% Checkout Discounts)'
                          : 'General Member (Accumulating points)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-50 pt-5 space-y-4">
                <h4 className="font-display font-extrabold text-xs text-gray-540 uppercase tracking-widest flex items-center">
                  <History className="w-4 h-4 mr-1.5 text-[#580c1f]" />
                  Checkout Purchase History ({customerPurchaseHistory.length})
                </h4>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {customerPurchaseHistory.map((tx) => (
                    <div key={tx.id} className="bg-zinc-50 rounded-xl p-3 border border-gray-100 flex justify-between items-start text-xs font-sans text-gray-600">
                      <div>
                        <span className="font-mono font-bold text-[#580c1f]">#{tx.invoiceNumber}</span>
                        <div className="text-[10px] text-gray-400 mt-0.5">{new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                        
                        {/* Sold items breakdown */}
                        <div className="mt-1.5 pl-1.5 border-l border-zinc-200">
                          {tx.items.map((item, key) => (
                            <div key={key} className="text-[10px]">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-[#580c1f]">Rs. {tx.total.toFixed(2)}</span>
                        <p className="text-[9px] text-emerald-700 font-bold block mt-0.5">{tx.paymentMethod}</p>
                      </div>
                    </div>
                  ))}

                  {customerPurchaseHistory.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-6">This customer doesn't have any purchase records today.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-gray-400 text-xs">
              Select any customer on the list to view loyalty stats & receipt history.
            </div>
          )}
        </div>

      </div>

      {/* FORM DIALOG: Register / Edit profiles models */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex items-center justify-between">
              <h3 className="font-display font-black text-[#580c1f] text-sm flex items-center">
                <CalendarCheck className="w-4 h-4 mr-2" />
                {editingCustomer ? 'Modify Patron Profile' : 'Register New Patron Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emma Watson"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 42-A, Baker Street Lane"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Initial Loyalty Points Balance</label>
                <input
                  type="number"
                  min="0"
                  value={formPoints}
                  onChange={(e) => setFormPoints(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-gray-200 text-xs font-bold text-gray-500 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-[#580c1f] hover:bg-[#3f0916] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Patron profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
