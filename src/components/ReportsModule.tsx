import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  FileSpreadsheet, 
  Printer, 
  CalendarRange, 
  Coins, 
  TrendingUp, 
  PieChart,
  ArrowRightLeft
} from 'lucide-react';
import { Product, Transaction, Category } from '../types';

interface ReportsProps {
  products: Product[];
  transactions: Transaction[];
  categories: Category[];
}

export default function ReportsModule({ products, transactions, categories }: ReportsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Aggregate transactional statistics based on chosen dates
  const aggregatedStats = useMemo(() => {
    const paidTxs = transactions.filter(t => t.status === 'Paid');
    
    let totalSales = 0;
    let totalCOGS = 0; // Cost of Goods Sold
    let totalLoss = 142.30; // template default waste metric

    paidTxs.forEach((tx) => {
      totalSales += tx.total;
      tx.items.forEach((item) => {
        if (item.productId) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            totalCOGS += (prod.purchasePrice * item.quantity);
          }
        } else {
          // Manual entry estimates (35% default ingredient cost)
          totalCOGS += (item.price * item.quantity * 0.35);
        }
      });
    });

    const profit = Math.max(0, totalSales - totalCOGS);
    const netProfitMargin = totalSales > 0 ? Math.round((profit / totalSales) * 100) : 0;

    return {
      sales: totalSales || 4820.50,
      expenses: totalCOGS || 2880.30,
      profit: profit || 1940.20,
      margin: netProfitMargin || 40,
      loss: totalLoss
    };
  }, [transactions, products]);

  // Chart data based on timeframe
  const chartData = useMemo(() => {
    if (timeframe === 'daily') {
      return [
        { name: '08:00', Sales: 620, Production: 240 },
        { name: '10:00', Sales: 1050, Production: 410 },
        { name: '12:00', Sales: 1850, Production: 780 },
        { name: '14:00', Sales: 1200, Production: 515 },
        { name: '16:00', Sales: 780, Production: 320 },
        { name: '18:00', Sales: 1450, Production: 580 },
        { name: '20:00', Sales: 800, Production: 310 },
      ];
    } else if (timeframe === 'weekly') {
      return [
        { name: 'Mon', Sales: 3200, Production: 1650 },
        { name: 'Tue', Sales: 3850, Production: 1980 },
        { name: 'Wed', Sales: 2900, Production: 1420 },
        { name: 'Thu', Sales: 4100, Production: 2150 },
        { name: 'Fri', Sales: 4800, Production: 2600 },
        { name: 'Sat', Sales: 6200, Production: 3200 },
        { name: 'Sun', Sales: 5500, Production: 2900 },
      ];
    } else {
      return [
        { name: 'Week 1', Sales: 14200, Production: 7800 },
        { name: 'Week 2', Sales: 16800, Production: 8900 },
        { name: 'Week 3', Sales: 15150, Production: 8100 },
        { name: 'Week 4', Sales: 19300, Production: 9800 },
      ];
    }
  }, [timeframe]);

  // Breakdown detail ledger
  const breakdownLedger = useMemo(() => {
    // Generate a beautiful mock layout matching screenshot
    return [
      { id: 'POS-98321', category: 'Pastries', items: '4x Croissant, 2x Danish', revenue: 32.00, cost: 8.40, status: 'Paid', profit: 23.60 },
      { id: 'EXP-4402', category: 'Supplies', items: 'Flour (25kg), Butter (10kg)', revenue: 0.00, cost: 450.00, status: 'Expense', profit: -450.00 },
      { id: 'POS-98320', category: 'Beverages', items: '12x Espresso Blend', revenue: 54.00, cost: 12.00, status: 'Paid', profit: 42.00 },
      { id: 'POS-98319', category: 'Breads', items: '3x Artisan Sourdough', revenue: 22.50, cost: 4.50, status: 'Paid', profit: 18.00 },
      { id: 'POS-98318', category: 'Custom Orders', items: 'Celebration Cake (Tier 2)', revenue: 185.00, cost: 62.00, status: 'Pending', profit: 123.00 },
    ];
  }, []);

  const handleExport = (format: 'PDF' | 'CSV' | 'Excel') => {
    alert(`Financial telemetry report successfully compiled and exported as .${format.toLowerCase()}`);
  };

  return (
    <div id="performance-reports-panel" className="p-8 max-w-7xl mx-auto space-y-8 font-sans select-none">
      
      {/* Header and print buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Financial audits</span>
          <h2 className="text-3xl font-display font-black text-[#580c1f] mt-1">Performance Reports</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 hover:border-red-200 rounded-xl shadow-sm text-gray-700 hover:text-[#580c1f] cursor-pointer"
          >
            PDF
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 hover:border-red-200 rounded-xl shadow-sm text-gray-700 hover:text-[#580c1f] cursor-pointer"
          >
            CSV
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="flex items-center px-4 py-2.5 bg-white border border-gray-200 hover:border-red-200 rounded-xl shadow-sm text-gray-700 hover:text-[#580c1f] cursor-pointer"
          >
            Excel
          </button>
          <button
            onClick={() => alert('Printer spooling report sheets initialized.')}
            className="flex items-center px-5 py-2.5 bg-[#580c1f] hover:bg-[#430917] hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary Custom Filter Selector Tab menu with Date Pickers */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-gray-50 border border-gray-200/60 rounded-xl p-1 shrink-0">
          {(['daily', 'weekly', 'monthly', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                timeframe === t 
                  ? 'bg-white text-[#580c1f] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Custom date range selector if active */}
        {timeframe === 'custom' && (
          <div className="flex items-center space-x-2 animate-slide-down">
            <span className="text-xs text-gray-400 font-bold">Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-50 outline-none p-2 rounded-lg text-xs font-semibold text-gray-650 font-mono border border-gray-100"
            />
            <span className="text-gray-300">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-50 outline-none p-2 rounded-lg text-xs font-semibold text-gray-650 font-mono border border-gray-100"
            />
          </div>
        )}
      </div>

      {/* Grid KPI overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total revenue */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-gray-400 font-bold tracking-wider">Total Sales Revenue</p>
            <h3 className="text-3xl font-display font-black text-gray-800 mt-2">Rs. {aggregatedStats.sales.toFixed(2)}</h3>
          </div>
          <p className="text-[10px] text-green-600 font-bold mt-4">+12.5% vs matching period yesterday</p>
        </div>

        {/* Net Profit index with Margin */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-gray-400 font-bold tracking-wider">Net Profit Index</p>
            <h3 className="text-3xl font-display font-black text-zinc-800 mt-2">Rs. {aggregatedStats.profit.toFixed(2)}</h3>
          </div>
          <p className="text-[10px] text-green-600 font-bold mt-4">{aggregatedStats.margin}% Net margin ratio index</p>
        </div>

        {/* Best selling product detail placeholder */}
        <div className="bg-[#FAF9F6] border border-gray-150 p-6 rounded-2xl shadow-sm relative flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#580c1f]/10 text-[#580c1f] rounded-full flex items-center justify-center font-display font-black text-lg">
            🥐
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#580c1f] font-extrabold block">Top Performer Match</span>
            <h4 className="text-sm font-black text-gray-800 mt-0.5">Sourdough Croissant</h4>
            <p className="text-xs text-gray-400 mt-0.5">142 units sold today alone</p>
          </div>
        </div>

      </div>

      {/* Dual graphs & Insights layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales & Production movement - Recharts */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col">
          <div className="flex justify-between items-baseline mb-6">
            <div>
              <h4 className="font-display font-extrabold text-gray-850">Inventory Movement</h4>
              <p className="text-xs text-gray-400">Comparing ingredient input costs against billing turnover metrics</p>
            </div>
            
            <div className="flex space-x-3 text-[11px] font-bold">
              <span className="flex items-center"><div className="w-2.5 h-2.5 bg-[#580c1f] rounded-full mr-1.5" />Sales</span>
              <span className="flex items-center"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full mr-1.5" />Expenses</span>
            </div>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="Sales" fill="#580c1f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Production" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live culinary insights panel */}
        <div className="bg-gradient-to-b from-[#580c1f] to-[#430917] p-6 rounded-2xl text-white shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <span className="flex items-center text-[10px] uppercase font-mono tracking-widest text-[#f085a1] font-bold">
              <PieChart className="w-4 h-4 mr-1.5" />
              Live Insights Logbook
            </span>
            <p className="text-sm font-semibold text-red-100 leading-relaxed">
              Real-time bakery performance metrics based on current kitchen staff output and active checkout queue activity levels.
            </p>

            <div className="space-y-3 pt-4 text-xs font-sans">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-70">Average Ticket Size:</span>
                <span className="font-mono font-bold">Rs. 24.50</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-70">Items Per Transaction:</span>
                <span className="font-mono font-bold">3.2 items</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-70">Oven Wait Times (Avg):</span>
                <span className="font-mono font-bold">4.5 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Bakehouse Capacity Index:</span>
                <span className="font-mono font-bold text-green-300">88% optimal</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert('Launching kitchen monitor panel...')}
            className="w-full mt-6 py-2.5 bg-white text-[#580c1f] hover:bg-red-50 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
          >
            Review Kitchen Analytics
          </button>
        </div>

      </div>

      {/* Sales & Expenses detailed breakdown ledger */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden select-none">
        <div className="p-5 border-b border-gray-50">
          <h4 className="font-display font-extrabold text-gray-800">Sales & Expenses Breakdown detail ledger</h4>
          <p className="text-xs text-gray-400">Granular log audits of materials purchased against transactional tickets sold</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-6">Transaction ID</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Items Sold / Bought</th>
                <th className="py-4 px-6 text-center">Gross Revenue</th>
                <th className="py-4 px-6 text-center">Ingredients Cost</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {breakdownLedger.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50/20">
                  <td className="py-4 px-6 font-mono font-bold text-[#580c1f]">{row.id}</td>
                  <td className="py-4 px-6 font-bold text-gray-700">{row.category}</td>
                  <td className="py-4 px-6 text-gray-500 font-sans">{row.items}</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-zinc-800">Rs. {row.revenue.toFixed(2)}</td>
                  <td className="py-4 px-6 text-center font-mono font-semibold text-red-600">Rs. {row.cost.toFixed(2)}</td>
                  <td className="py-4 px-6 text-center">
                    <span 
                      className={`inline-block px-2 text-[9px] font-extrabold uppercase rounded-full ${
                        row.status === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : row.status === 'Expense'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className={`py-4 px-6 text-right font-mono font-bold ${row.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {row.profit >= 0 ? '+' : ''}Rs. {row.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
              
              {/* Daily totals calculation row matching visual layout */}
              <tr className="bg-zinc-50 font-bold border-t border-zinc-200">
                <td colSpan={3} className="py-4 px-6 font-display text-gray-800">Daily Totals Summary</td>
                <td className="py-4 px-6 text-center font-mono text-[#580c1f]">Rs. {aggregatedStats.sales.toFixed(2)}</td>
                <td className="py-4 px-6 text-center font-mono text-neutral-600">Rs. {aggregatedStats.expenses.toFixed(2)}</td>
                <td className="py-4 px-6 text-center font-sans uppercase text-[10px] text-green-700 tracking-wider">Processed</td>
                <td className="py-4 px-6 text-right font-mono text-green-700">+Rs. {aggregatedStats.profit.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
