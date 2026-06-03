import React, { useState } from 'react';
import { 
  Building2, 
  Percent, 
  Receipt, 
  Database,
  Printer,
  Barcode,
  Save,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { BakerySettings } from '../types';

interface SettingsProps {
  settings: BakerySettings;
  onSaveSettings: (settings: BakerySettings) => Promise<void>;
  isSyncing: boolean;
  onSyncForce: () => Promise<void>;
  offlineQueueLength: number;
}

export default function SettingsModule({
  settings,
  onSaveSettings,
  isSyncing,
  onSyncForce,
  offlineQueueLength
}: SettingsProps) {
  // Input fields initial state
  const [name, setName] = useState(settings.bakeryName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [taxRate, setTaxRate] = useState(String(settings.taxRate || 8));
  const [receiptSize, setReceiptSize] = useState<'58mm' | '80mm'>(settings.receiptSize || '80mm');
  const [printerName, setPrinterName] = useState(settings.printerName);
  const [barcodePrefix, setBarcodePrefix] = useState(settings.barcodePrefix);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BakerySettings = {
      bakeryName: name,
      tagline,
      address,
      phone,
      taxRate: Math.max(0, parseFloat(taxRate) || 0),
      receiptSize,
      printerName,
      barcodePrefix
    };

    await onSaveSettings(payload);
    alert('Bakehouse configurations persisted successfully.');
  };

  const handleBackupExport = () => {
    // Collect local database and download as JSON file
    const localDb = localStorage.getItem('artisan_bakehouse_local_db');
    if (!localDb) {
      alert('Local cache database empty, nothing to backup!');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(localDb);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ArtisanBakehouse_POS_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    alert('Master JSON database backup compiled. Download initialized.');
  };

  const handleResetCaches = () => {
    if (window.confirm('WARNING: This will clear all offline registers, cart structures, and settings, rebuilding them to default template values. Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div id="general-pos-settings-panel" className="p-8 max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Header title */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Config adjustments</span>
        <h2 className="text-3xl font-display font-black text-[#580c1f] mt-1">Terminal Settings</h2>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Module A: Bakery General Information metadata */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-extrabold text-gray-800 text-sm flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-[#580c1f]" />
            Bakery Profile Metadata
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Bakehouse Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-transparent focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Tagline / Slogan</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-zinc-50 border border-transparent focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Company Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-50 border border-transparent focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Street Address District *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-zinc-50 border border-transparent focus:border-[#580c1f] rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Module B: Billing rate adjustments & Thermal Printers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Box 1: Taxes slider */}
          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-gray-800 text-sm flex items-center">
              <Percent className="w-4 h-4 mr-2 text-[#580c1f]" />
              Sales Tax Levies
            </h3>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-gray-400 block">General Tax Rate percentage (%)</label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full accent-[#580c1f] h-1 bg-zinc-200.rounded-lg cursor-pointer"
                />
                <span className="font-mono text-xs font-black bg-red-50 text-[#580c1f] px-2.5 py-1 rounded-lg">
                  {taxRate}%
                </span>
              </div>
              <p className="text-[10px] text-gray-400">This percentage value aggregates on POS Billing checkouts by default unless toggled off by cashier.</p>
            </div>
          </div>

          {/* Box 2: Receipt layout sizes and scanner suffix */}
          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-gray-800 text-sm flex items-center">
              <Printer className="w-4 h-4 mr-2 text-[#580c1f]" />
              Printer Core
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Spooler Name</label>
                <input
                  type="text"
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  className="w-full bg-zinc-50 border border-transparent focus:border-[#580c1f] rounded-xl p-2 py-1.5 text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1.5 font-sans">Default Paper Size</label>
                <div className="flex gap-2">
                  {(['58mm', '80mm'] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setReceiptSize(size)}
                      className={`flex-1 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        receiptSize === size 
                          ? 'bg-[#580c1f] border-[#580c1f] text-white shadow-sm' 
                          : 'bg-white border-zinc-200 text-gray-600'
                      }`}
                    >
                      {size} Paper Panel
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Module C: System offline database local sync controls */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="font-display font-extrabold text-gray-800 text-sm flex items-center">
            <Database className="w-5 h-5 mr-2 text-[#580c1f]" />
            Local Database & Offline queue
          </h3>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans text-gray-600">
            <div className="space-y-1">
              <p className="font-bold text-gray-700">Offline Queue Cache:</p>
              <p className="text-[11px] text-gray-450">
                You have <span className="font-bold text-rose-700">{offlineQueueLength}</span> transactions awaiting synchronization writes to db.json.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSyncForce}
                disabled={isSyncing || offlineQueueLength === 0}
                className="flex items-center px-4 py-2 bg-[#580c1f] hover:bg-[#430917] disabled:opacity-40 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Force Write API Sync</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row gap-2 select-none">
            <button
              type="button"
              onClick={handleBackupExport}
              className="flex-1 py-2.5 border border-zinc-250 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Backup database (JSON)
            </button>
            
            <button
              type="button"
              onClick={handleResetCaches}
              className="flex-1 py-2.5 border border-dashed border-red-200 text-[#580c1f] hover:bg-red-50 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Hard reset local cache
            </button>
          </div>
        </div>

        {/* Submit Form CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-[#580c1f] hover:bg-[#430917] hover:scale-[1.01] active:scale-[0.99] text-white text-xs font-extrabold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Save All Configurations
          </button>
        </div>

      </form>

    </div>
  );
}
