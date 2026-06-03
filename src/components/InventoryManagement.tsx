import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  Plus, 
  AlertTriangle,
  RefreshCw,
  Box,
  Coins
} from 'lucide-react';
import { Product, Category, Supplier } from '../types';

interface InventoryManagementProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onAddProduct: (prod: Product) => Promise<void>;
  onUpdateProduct: (prod: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function InventoryManagement({
  products,
  categories,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: InventoryManagementProps) {
  // Query states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, in_stock, low_stock, out_of_stock, expired

  // Add/Edit Product Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSKU, setFormSKU] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStockQty, setFormStockQty] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formExpiry, setFormExpiry] = useState('');

  // Active pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Auto Profit calculator helpers
  const computedProfit = useMemo(() => {
    const sale = parseFloat(formSalePrice) || 0;
    const purchase = parseFloat(formPurchasePrice) || 0;
    return Math.max(0, sale - purchase);
  }, [formSalePrice, formPurchasePrice]);

  const computedMargin = useMemo(() => {
    const sale = parseFloat(formSalePrice) || 0;
    if (sale <= 0) return 0;
    return Math.round((computedProfit / sale) * 100);
  }, [formSalePrice, computedProfit]);

  // Open Add/Edit
  const handleOpenForm = (prod: Product | null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormName(prod.name);
      setFormBarcode(prod.barcode);
      setFormSKU(prod.sku);
      setFormCategoryId(prod.categoryId);
      setFormPurchasePrice(String(prod.purchasePrice));
      setFormSalePrice(String(prod.salePrice));
      setFormStockQty(String(prod.stockQuantity));
      setFormMinStock(String(prod.minStockLevel));
      setFormExpiry(prod.expiryDate || '');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormBarcode('');
      setFormSKU('AB-' + Math.floor(100 + Math.random() * 900) + '-' + Math.random().toString(36).substr(2, 3).toUpperCase());
      setFormCategoryId(categories[0]?.id || '');
      setFormPurchasePrice('');
      setFormSalePrice('');
      setFormStockQty('');
      setFormMinStock('10');
      setFormExpiry('');
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategoryId) return;

    const sale = Math.max(0, parseFloat(formSalePrice) || 0);
    const purchase = Math.max(0, parseFloat(formPurchasePrice) || 0);
    const marginPercent = sale > 0 ? Math.round(((sale - purchase) / sale) * 100) : 0;

    const payload: Product = {
      id: editingProduct?.id || ('prod-' + Date.now()),
      name: formName,
      barcode: formBarcode,
      sku: formSKU,
      categoryId: formCategoryId,
      purchasePrice: purchase,
      salePrice: sale,
      profitMargin: marginPercent,
      stockQuantity: Math.max(0, parseInt(formStockQty) || 0),
      minStockLevel: Math.max(0, parseInt(formMinStock) || 0),
      expiryDate: formExpiry
    };

    if (editingProduct) {
      await onUpdateProduct(payload);
    } else {
      await onAddProduct(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you absolutely sure you want to delete this product from the central inventory catalog?')) {
      await onDeleteProduct(id);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();

    return products.filter((p) => {
      // Search Box matcher
      const matchSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.barcode.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      // Category matcher
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;

      // Status Badge filter
      let matchStatus = true;
      if (selectedStatus === 'in_stock') {
        matchStatus = p.stockQuantity > p.minStockLevel;
      } else if (selectedStatus === 'low_stock') {
        matchStatus = p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;
      } else if (selectedStatus === 'out_of_stock') {
        matchStatus = p.stockQuantity <= 0;
      } else if (selectedStatus === 'expired') {
        if (!p.expiryDate) {
          matchStatus = false;
        } else {
          const expMs = new Date(p.expiryDate).getTime();
          matchStatus = expMs < todayMs;
        }
      }

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleExportCSV = () => {
    // Generate CSV string
    const headers = ['SKU', 'Product Name', 'Barcode', 'Purchase Cost', 'Sale Price', 'Margin %', 'Stock Qty', 'Expiry Date'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.barcode,
      p.purchasePrice,
      p.salePrice,
      p.profitMargin,
      p.stockQuantity,
      p.expiryDate
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bakehouse_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="central-inventory-repository" className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Bakehouse Administration</span>
          <h2 className="text-3xl font-display font-black text-[#580c1f] mt-1">Central Stock Repository</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center py-2.5 px-4 bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#580c1f] rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenForm(null)}
            className="flex items-center py-2.5 px-4 bg-[#580c1f] hover:bg-[#430917] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Interactive Filters Area */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalog by name, barcode, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 focus:bg-white border border-transparent focus:border-[#580c1f] rounded-xl pl-10 pr-4 py-2 text-xs outline-none"
          />
        </div>

        {/* Category selector */}
        <div className="w-full md:w-44 flex flex-col">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-50 outline-none p-2.5 rounded-xl text-xs font-semibold text-gray-700 border border-gray-100 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status badges filter */}
        <div className="w-full md:w-36 flex flex-col">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-zinc-50 outline-none p-2.5 rounded-xl text-xs font-semibold text-gray-700 border border-gray-100 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expired">Expired Goods</option>
          </select>
        </div>

        <button 
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedSupplier('all');
            setSelectedStatus('all');
          }}
          className="text-xs text-gray-500 font-bold hover:text-[#580c1f] transition-colors whitespace-nowrap cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden select-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-6">Product Info</th>
                <th className="py-4 px-6">Barcode / SKU</th>
                <th className="py-4 px-6">Purchase Price</th>
                <th className="py-4 px-6">Sale Price</th>
                <th className="py-4 px-6 text-center">Profit Margin</th>
                <th className="py-4 px-6 text-center">Stock Qty</th>
                <th className="py-4 px-6">Expiry</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedData.map((p) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const expMs = p.expiryDate ? new Date(p.expiryDate).getTime() : Infinity;
                const todayMs = new Date(todayStr).getTime();
                const isExpired = expMs < todayMs;
                const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;
                const isOut = p.stockQuantity <= 0;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-lg bg-red-50/70 border border-red-50/30 flex items-center justify-center font-bold text-[#580c1f] text-sm flex-none">
                          {p.name.split(' ').map(x=>x[0]).join('').substring(0,2)}
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-800 block text-xs">{p.name}</span>
                          <span className="text-[10px] font-medium text-[#580c1f] uppercase mt-0.5 inline-block">
                            {categories.find(c => c.id === p.categoryId)?.name || 'Direct Import'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-gray-800 block">{p.barcode}</span>
                      <span className="text-[10px] text-gray-400 font-mono italic mt-0.5 block">SKU: {p.sku}</span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-gray-500">Rs. {p.purchasePrice.toFixed(2)}</td>
                    <td className="py-4 px-6 font-mono font-bold text-gray-800">Rs. {p.salePrice.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center bg-green-50 text-green-700 font-mono font-bold rounded-lg px-2.5 py-1 text-[11px]">
                        {p.profitMargin}%
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-gray-800">
                      {p.stockQuantity} <span className="text-[10px] text-gray-400 font-semibold block">units</span>
                    </td>
                    <td className="py-4 px-6">
                      {p.expiryDate ? (
                        <div className="font-mono text-zinc-500">
                          {new Date(p.expiryDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span 
                        className={`inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${
                          isExpired
                            ? 'bg-red-100 text-red-700'
                            : isOut
                            ? 'bg-stone-100 text-stone-500'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isExpired ? 'Expired' : isOut ? 'Out Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 flex justify-end">
                      <button
                        onClick={() => handleOpenForm(p)}
                        className="p-1 px-1.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 hover:text-[#580c1f] rounded-lg transition-colors cursor-pointer"
                        title="Edit goods fields"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 px-1.5 bg-gray-50 border border-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                    No products matching search parameters. Add new items above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginations bar */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 select-none">
          <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products</span>
          
          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="py-1.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#580c1f] font-bold rounded-xl disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-bold text-gray-800">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="py-1.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#580c1f] font-bold rounded-xl disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* FORM DIALOG: Add / Edit Product Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 bg-[#FDFCF7] flex items-center justify-between">
              <h3 className="font-display font-black text-[#580c1f] text-sm flex items-center">
                <Box className="w-4 h-4 mr-2" />
                {editingProduct ? 'Update Product Details' : 'Introduce New Product Item'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Product Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sourdough Loaf, French Chocolate Eclair"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Category Assignment *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Expiry Date / Best Before</label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">SKU identifier *</label>
                  <input
                    type="text"
                    required
                    value={formSKU}
                    onChange={(e) => setFormSKU(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">EAN/UPC Barcode *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Scan/Type Barcode..."
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      className="flex-1 min-w-0 bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormBarcode(String(Math.floor(100000000000 + Math.random() * 900000000000)))}
                      className="px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center border border-zinc-200 whitespace-nowrap active:scale-95"
                    >
                      Auto-Gen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Purchase Cost Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sale Selling Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Minimum Alert Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Automatic Margin percentage indicator */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center text-xs text-emerald-800">
                <span className="font-semibold flex items-center">
                  <Coins className="w-4 h-4 mr-1.5" />
                  Calculated Profit Index:
                </span>
                <span className="font-mono font-bold">
                  Profit: Rs. {computedProfit.toFixed(2)} | Margin: <span className="text-sm font-extrabold">{computedMargin}%</span>
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#580c1f] hover:bg-[#3f0916] text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
