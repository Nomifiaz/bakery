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
import { UserRole, BakerySettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resetCashierPOS: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  settings: BakerySettings;
}

export default function Sidebar({ activeTab, setActiveTab, resetCashierPOS, userRole, setUserRole, settings }: SidebarProps) {
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
    <aside id="sidebar-container" className="w-64 bg-[#FAF9F6] border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-30 font-sans select-none shrink-0">
      {/* Sidebar Header */}
      <div id="sidebar-header" className="p-6 pb-2">
        <h1 id="app-logo-title" className="font-display text-2xl font-bold tracking-tight text-[#580c1f] line-clamp-2 leading-tight">
          {settings.bakeryName || 'Artisan Bakehouse'}
        </h1>
        <p id="app-logo-subtitle" className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-wider line-clamp-1">
          {settings.tagline || 'Admin Terminal'}
        </p>
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
    </aside>
  );
}
