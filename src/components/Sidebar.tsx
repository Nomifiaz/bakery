import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Boxes, 
  FileSpreadsheet, 
  Users, 
  BarChart3, 
  Printer, 
  Settings as SettingsIcon,
  Plus
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resetCashierPOS: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

export default function Sidebar({ activeTab, setActiveTab, resetCashierPOS, userRole, setUserRole }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager'] },
    { id: 'pos', name: 'POS', icon: ShoppingBag, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'products', name: 'Products', icon: Package, roles: ['Admin', 'Manager'] },
    { id: 'inventory', name: 'Inventory', icon: Boxes, roles: ['Admin', 'Manager'] },
    { id: 'purchases', name: 'Purchases', icon: FileSpreadsheet, roles: ['Admin', 'Manager'] },
    { id: 'customers', name: 'Customers', icon: Users, roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'reports', name: 'Reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
    { id: 'labels', name: 'Label Printing', icon: Printer, roles: ['Admin', 'Manager'] },
    { id: 'settings', name: 'Settings', icon: SettingsIcon, roles: ['Admin', 'Manager'] },
  ];

  // Filter menu items by role access
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside id="sidebar-container" className="w-64 bg-[#FAF9F6] border-r border-gray-100 flex flex-col h-screen sticky top-0 font-sans select-none shrink-0">
      {/* Sidebar Header */}
      <div id="sidebar-header" className="p-6 pb-2">
        <h1 id="app-logo-title" className="font-display text-2xl font-bold tracking-tight text-[#580c1f]">Artisan Bakehouse</h1>
        <p id="app-logo-subtitle" className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wider">Admin Terminal</p>
      </div>

      {/* Role Selection Dropdown */}
      <div id="role-selection-wrapper" className="px-6 mb-4 mt-2">
        <div className="bg-[#FAF9F6] border border-gray-200 rounded-lg p-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Role:</span>
          <select 
            id="role-switch-dropdown"
            value={userRole} 
            onChange={(e) => {
              const r = e.target.value as UserRole;
              setUserRole(r);
              // Fallback view to POS if cashier is selected
              if (r === 'Cashier' && !['pos', 'customers'].includes(activeTab)) {
                setActiveTab('pos');
              }
            }}
            className="text-xs font-semibold text-[#580c1f] bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="Admin">Owner (Admin)</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
          </select>
        </div>
      </div>

      {/* Primary Navigation Menus */}
      <nav id="sidebar-navigation" className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`tab-btn-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-red-50 text-[#580c1f] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#580c1f]'
              }`}
            >
              <IconComponent 
                className={`w-5 h-5 mr-3 transition-colors ${
                  isActive ? 'text-[#580c1f]' : 'text-gray-400 group-hover:text-[#580c1f]'
                }`} 
              />
              <span>{item.name}</span>
              
              {isActive && (
                <div className="absolute right-0 top-3 bottom-3 w-1 bg-[#580c1f] rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* New Sale Button Container */}
      <div id="sidebar-footer-cta" className="p-4 border-t border-gray-100 bg-[#FAF9F6]">
        <button
          id="btn-sidebar-new-sale"
          onClick={() => {
            resetCashierPOS();
            setActiveTab('pos');
          }}
          className="w-full flex items-center justify-center py-3 px-4 bg-[#580c1f] hover:bg-[#430917] text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.982]"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>New Sale</span>
        </button>
      </div>
    </aside>
  );
}
