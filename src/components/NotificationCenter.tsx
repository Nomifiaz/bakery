import React, { useState, useMemo } from 'react';
import { Bell, AlertTriangle, CalendarRange, Check, Layers3 } from 'lucide-react';
import { Product, AlertNotification } from '../types';

interface NotificationCenterProps {
  products: Product[];
  onCreatePO?: (productId: string) => void;
}

export default function NotificationCenter({ products, onCreatePO }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);

  const notifications = useMemo<AlertNotification[]>(() => {
    const alerts: AlertNotification[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMs = new Date(todayStr).getTime();

    products.forEach((p) => {
      // 1. Out of stock
      if (p.stockQuantity <= 0) {
        alerts.push({
          id: `out-of-stock-${p.id}`,
          type: 'out_of_stock',
          title: 'Out of Stock Alert',
          message: `${p.name} is completely out of stock!`,
          date: new Date().toLocaleDateString(),
          isRead: readAlertIds.includes(`out-of-stock-${p.id}`),
          productId: p.id,
        });
      }
      // 2. Low stock
      else if (p.stockQuantity <= p.minStockLevel) {
        alerts.push({
          id: `low-stock-${p.id}`,
          type: 'low_stock',
          title: 'Low Stock Warning',
          message: `${p.name} has only ${p.stockQuantity} units left (Min: ${p.minStockLevel}).`,
          date: new Date().toLocaleDateString(),
          isRead: readAlertIds.includes(`low-stock-${p.id}`),
          productId: p.id,
        });
      }

      // 3. Expiry Check (within 7 days or past)
      if (p.expiryDate) {
        const expMs = new Date(p.expiryDate).getTime();
        const diffDays = Math.ceil((expMs - todayMs) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `expired-${p.id}`,
            type: 'near_expiry',
            title: 'Critical: Product Expired',
            message: `${p.name} expired on ${p.expiryDate}. Please remove from shelves.`,
            date: new Date().toLocaleDateString(),
            isRead: readAlertIds.includes(`expired-${p.id}`),
            productId: p.id,
          });
        } else if (diffDays <= 7) {
          alerts.push({
            id: `near-expired-${p.id}`,
            type: 'near_expiry',
            title: 'Product Nearing Expiry',
            message: `${p.name} expires in ${diffDays} day(s) (${p.expiryDate}).`,
            date: new Date().toLocaleDateString(),
            isRead: readAlertIds.includes(`near-expired-${p.id}`),
            productId: p.id,
          });
        }
      }
    });

    return alerts;
  }, [products, readAlertIds]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadAlertIds(allIds);
  };

  const toggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readAlertIds.includes(id)) {
      setReadAlertIds(readAlertIds.filter(x => x !== id));
    } else {
      setReadAlertIds([...readAlertIds, id]);
    }
  };

  return (
    <div id="notif-center-root" className="relative font-sans select-none">
      {/* Drawer Triger Bell Icon */}
      <button
        id="btn-trigger-notif"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl transition-all shadow-sm flex items-center justify-center text-gray-600 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            id="notif-count-badge" 
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#580c1f] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div id="notif-backdrop" className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Notifications Dropdown Panel */}
          <div 
            id="notif-dropdown-panel" 
            className="absolute right-0 mt-2.5 w-90 max-h-[480px] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#FDFCF7]">
              <div>
                <h3 className="font-display font-bold text-sm text-gray-800 flex items-center">
                  <Layers3 className="w-4 h-4 mr-2 text-[#580c1f]" />
                  Stock Alerts Center
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{unreadCount} unread warnings</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#580c1f] font-semibold hover:underline flex items-center"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[350px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium">All systems normal!</p>
                  <p className="text-xs text-gray-400 mt-1">Inventory has excellent stock & dates.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors hover:bg-gray-50 flex items-start space-x-3 ${notif.isRead ? 'opacity-60' : 'bg-red-50/20'}`}
                  >
                    <div className="mt-0.5">
                      {notif.type === 'near_expiry' ? (
                        <CalendarRange className="w-4 h-4 text-amber-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-semibold text-gray-800">{notif.title}</p>
                        <span className="text-[10px] text-gray-400 font-mono">{notif.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 break-words">{notif.message}</p>
                      
                      {/* Action trigger standard restock order */}
                      {!notif.isRead && notif.productId && onCreatePO && (notif.type === 'low_stock' || notif.type === 'out_of_stock') && (
                        <button
                          onClick={() => {
                            onCreatePO(notif.productId!);
                            setIsOpen(false);
                          }}
                          className="mt-2 text-[11px] font-bold text-[#580c1f] bg-red-50 hover:bg-red-100 rounded-lg py-1 px-2.5 transition-colors"
                        >
                          + Quick Order Ingredients
                        </button>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleRead(notif.id, e)}
                      title={notif.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                    >
                      <Check className={`w-3.5 h-3.5 ${notif.isRead ? 'text-[#580c1f]' : 'text-gray-300'}`} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center text-[10px] text-gray-400 font-mono">
              Artisan POS Security Core v3.5
            </div>
          </div>
        </>
      )}
    </div>
  );
}
