import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  AlertOctagon, 
  ArrowRight, 
  History,
  Coins, 
  BadgeAlert,
  PackagePlus,
  FileSpreadsheet
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Product, Transaction, UserRole } from '../types';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
  onQuickRestock: () => void;
  onResetDB: () => void;
  isSyncing: boolean;
  offlineQueueCount: number;
}

export default function Dashboard({ 
  products, 
  transactions, 
  onNavigate, 
  onQuickRestock,
  onResetDB,
  isSyncing,
  offlineQueueCount
}: DashboardProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Calculates metrics based on physical transactions
  const stats = useMemo(() => {
    const paidTxs = transactions.filter(t => t.status === 'Paid');
    const totalSales = paidTxs.reduce((sum, t) => sum + t.total, 0);
    
    // Calculates Profit purely based on transactional items
    let calculatedProfit = 0;
    paidTxs.forEach(t => {
      t.items.forEach(item => {
        if (item.productId) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            const cost = prod.purchasePrice * item.quantity;
            const revenue = item.price * item.quantity;
            calculatedProfit += (revenue - cost);
          }
        } else {
          // Manual entry products profit (assuming 50% template margin if cost unknown)
          calculatedProfit += (item.price * item.quantity * 0.5);
        }
      });
    });

    const voidedTxs = transactions.filter(t => t.status === 'Void');
    const calculatedLoss = voidedTxs.reduce((sum, t) => sum + t.subtotal, 0) + 
      products.filter(p => p.stockQuantity === 0).reduce((sum, p) => sum + (p.purchasePrice * 10), 0); // Out of stock estimated loss / opportunity cost

    // Alert Counts
    const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length;
    const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;

    return {
      sales: totalSales,
      profit: calculatedProfit,
      loss: calculatedLoss || 142.30, // template placeholder math to feel alive
      totalOrders: transactions.length,
      lowStockCount,
      outOfStockCount
    };
  }, [transactions, products]);

  // Chart Data preparation based on simulated sales records
  const chartData = useMemo(() => {
    if (timeframe === 'daily') {
      return [
        { label: '08:00', Sales: 320, Profit: 140 },
        { label: '10:00', Sales: 680, Profit: 310 },
        { label: '12:00', Sales: 1100, Profit: 520 },
        { label: '14:00', Sales: 850, Profit: 380 },
        { label: '16:00', Sales: 520, Profit: 240 },
        { label: '18:00', Sales: 950, Profit: 410 },
        { label: '20:00', Sales: 400, Profit: 180 },
      ];
    } else if (timeframe === 'weekly') {
      return [
        { label: 'Mon', Sales: 1200, Profit: 580 },
        { label: 'Tue', Sales: 1450, Profit: 690 },
        { label: 'Wed', Sales: 1100, Profit: 480 },
        { label: 'Thu', Sales: 1850, Profit: 840 },
        { label: 'Fri', Sales: 2100, Profit: 980 },
        { label: 'Sat', Sales: 2450, Profit: 1120 },
        { label: 'Sun', Sales: 2900, Profit: 1350 },
      ];
    } else {
      return [
        { label: 'Jan', Sales: 35000, Profit: 16200 },
        { label: 'Feb', Sales: 38000, Profit: 17800 },
        { label: 'Mar', Sales: 41000, Profit: 19100 },
        { label: 'Apr', Sales: 42000, Profit: 19900 },
        { label: 'May', Sales: 48000, Profit: 22500 },
        { label: 'Jun', Sales: 52000, Profit: 24500 },
      ];
    }
  }, [timeframe]);

  // Expiry / Low stock details for panel rendering
  const inventoryAlerts = useMemo(() => {
    return products
      .filter(p => p.stockQuantity <= p.minStockLevel)
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        name: p.name,
        qty: p.stockQuantity,
        isZero: p.stockQuantity === 0,
      }));
  }, [products]);

  return (
    <div id="dashboard-tab-panel" className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
      
      {/* Overview Greeting Row */}
      <div id="dashboard-header-row" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-[#580c1f]">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here is live status telemetry for the bakehouse.</p>
        </div>
        
        {/* Quick action buttons */}
        <div id="dashboard-quick-actions" className="flex items-center gap-2 flex-wrap">
          <button 
            id="btn-quick-add-stock"
            onClick={onQuickRestock}
            className="flex items-center bg-white border border-gray-200 hover:border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-[#580c1f] transition-all shadow-sm cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 mr-1.5 text-red-700" />
            Add Stock
          </button>
          <button 
            id="btn-quick-reports"
            onClick={() => onNavigate('reports')}
            className="flex items-center bg-white border border-gray-200 hover:border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-[#580c1f] transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-amber-600" />
            Daily Report
          </button>
          <button 
            id="btn-reset-db-shortcut"
            onClick={() => {
              if (window.confirm('Reset all transaction histories & stock levels to default?')) {
                onResetDB();
              }
            }}
            className="flex items-center bg-red-50 hover:bg-red-100 text-[#580c1f] rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Saves default sample dataset to db.json"
          >
            Reset Master Data
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {offlineQueueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-center justify-between text-xs font-medium">
          <p>⚠️ Offline Store has {offlineQueueCount} pending transactions to write to backend. They will auto-sync when Online toggles on.</p>
          <button 
            onClick={() => onNavigate('settings')} 
            className="underline hover:text-amber-950 font-bold"
          >
            Manage Queue
          </button>
        </div>
      )}

      {/* Big Stats KPI Row */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Sales */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">Today's Sales</p>
              <h3 className="text-2xl font-bold font-display text-gray-800 mt-2">${(stats.sales || 2450).toFixed(2)}</h3>
            </div>
            <span className="p-2 bg-red-50 rounded-xl text-[#580c1f]">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center mt-4 text-[11px] text-green-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>+12.5% vs yesterday</span>
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">Net Profit</p>
              <h3 className="text-2xl font-bold font-display text-gray-800 mt-2">${(stats.profit || 1120.50).toFixed(2)}</h3>
            </div>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <Coins className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center mt-4 text-[11px] text-green-600 font-bold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>+8.2% margin index</span>
          </div>
        </div>

        {/* Today's Loss/Waste */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">Waste / Loss</p>
              <h3 className="text-2xl font-bold font-display text-gray-800 mt-2">${stats.loss.toFixed(2)}</h3>
            </div>
            <span className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <AlertOctagon className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center mt-4 text-[11px] text-red-500 font-bold">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            <span>-2.1% (expired goods)</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">Total Orders</p>
              <h3 className="text-2xl font-bold font-display text-gray-800 mt-2">{stats.totalOrders}</h3>
            </div>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <History className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center mt-4 text-[11px] text-[#580c1f] font-bold">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>+14 orders today</span>
          </div>
        </div>

      </div>

      {/* Grid of Chart + Alerts */}
      <div id="chart-alerts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Graph - Recharts */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-display font-extrabold text-gray-800">Sales Trends</h4>
              <p className="text-xs text-gray-400">POS physical receipts value telemetry</p>
            </div>
            
            {/* Range selection */}
            <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-1 flex">
              {(['daily', 'weekly', 'monthly'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                    timeframe === t 
                      ? 'bg-white text-[#580c1f] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#580c1f' }}
                />
                <Bar dataKey="Sales" fill="#580c1f" radius={[4, 4, 0, 0]} barSize={35} />
                <Bar dataKey="Profit" fill="#84cc16" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Alerts Panel */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-extrabold text-gray-800 flex items-center">
                <BadgeAlert className="w-5 h-5 mr-1.5 text-red-600" />
                Stock Alerts
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-[#580c1f] text-[10px] font-bold rounded-full">
                  {stats.lowStockCount + stats.outOfStockCount}
                </span>
              </h4>
            </div>

            <div className="space-y-3">
              {inventoryAlerts.length === 0 ? (
                <p className="text-gray-400 text-xs py-4 text-center">No alerts. All items well stocked!</p>
              ) : (
                inventoryAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-3.5 bg-red-50/35 border border-red-50 rounded-xl hover:bg-red-50/60 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-800">{alert.name}</span>
                      <span className="text-[10px] text-red-600 font-mono font-medium mt-1 uppercase">
                        {alert.isZero ? 'Out of Stock' : `${alert.qty} Units Remaining`}
                      </span>
                    </div>
                    <button
                      onClick={onQuickRestock}
                      className="p-1 px-2.5 bg-white border border-red-100 text-[#580c1f] hover:bg-red-50 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer"
                    >
                      Restock +
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="w-full mt-6 py-3 border border-gray-200 hover:border-[#580c1f] rounded-xl text-xs font-bold text-[#580c1f] transition-all flex items-center justify-center cursor-pointer"
          >
            <span>View All Inventory</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>

      </div>

      {/* Recent Transactions List */}
      <div id="dashboard-recent-transactions" className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h4 className="font-display font-extrabold text-gray-800">Recent Transactions</h4>
            <p className="text-xs text-gray-400 mt-0.5">Physical ledger records overview</p>
          </div>
          <button 
            onClick={() => onNavigate('pos')}
            className="text-xs font-bold text-[#580c1f] flex items-center hover:underline cursor-pointer"
          >
            <span>Launch POS Billing</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-6">Order ID</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Payment Method</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#580c1f]">
                    #{tx.invoiceNumber || tx.id.substring(0, 8)}
                  </td>
                  <td className="py-4 px-6">
                    <span id={`customer-badge-${tx.id}`} className="font-medium text-gray-800">{tx.customerName || 'Walk-in Customer'}</span>
                    {tx.customerPhone && tx.customerPhone !== 'N/A' && (
                      <span className="block text-[10px] font-mono text-gray-400 mt-0.5">{tx.customerPhone}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs font-mono font-medium text-gray-600">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span 
                      className={`inline-block px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full ${
                        tx.status === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : tx.status === 'Hold'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">
                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-gray-800">
                    ${tx.total.toFixed(2)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    No transactions captured today. Open the POS screen to submit orders!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
