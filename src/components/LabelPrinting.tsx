import { useState, useMemo } from 'react';
import { 
  Printer, 
  Tag, 
  Layers, 
  Check, 
  Barcode, 
  Grid3X3,
  Sparkles
} from 'lucide-react';
import { Product, BakerySettings } from '../types';

interface LabelPrintingProps {
  products: Product[];
  settings: BakerySettings;
}

export default function LabelPrinting({ products, settings }: LabelPrintingProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [labelType, setLabelType] = useState<'shelf' | 'product_tag' | 'barcode_only'>('shelf');
  
  // Custom print fields options overrides
  const [showLogo, setShowLogo] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [customTitleOverride, setCustomTitleOverride] = useState('');

  const targetProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const handlePrintCommand = () => {
    if (!targetProduct) {
      alert('Please select a product item to run sticker print command!');
      return;
    }
    alert(`Label printing spool initialized: 30x copies of [${targetProduct.name}] ${labelType.toUpperCase()} labels sent to ZP-450 Thermal Label Printer.`);
  };

  return (
    <div id="label-printing-module" className="p-8 max-w-7xl mx-auto space-y-6 font-sans select-none">
      
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-semibold">Sticker & Tag Layouts</span>
        <h2 className="text-3xl font-display font-black text-[#580c1f] mt-1">Label Printing System</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Controls & parameters configure */}
        <div className="lg:col-span-1 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-display font-black text-gray-800 text-sm flex items-center">
            <Layers className="w-4 h-4 mr-1.5 text-[#580c1f]" />
            Label Print Settings
          </h3>

          <div className="space-y-4">
            {/* Product selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Target Product SKU *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-zinc-55 bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none cursor-pointer text-gray-700 font-medium"
              >
                <option value="" disabled>Choose Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ${p.salePrice.toFixed(2)} ({p.sku})</option>
                ))}
              </select>
            </div>

            {/* Label design template selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 font-sans">Label Template Type</label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {([
                  { id: 'shelf', name: 'Shelf Edge Display (Larger, Logo)', icon: Grid3X3 },
                  { id: 'product_tag', name: 'Item Package Tag (Compact, Price)', icon: Tag },
                  { id: 'barcode_only', name: 'Scannable Barcode sticker', icon: Barcode }
                ] as const).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setLabelType(t.id)}
                      className={`flex items-center p-3 border rounded-xl font-bold transition-all ${
                        labelType === t.id 
                          ? 'bg-red-50 border-red-200 text-[#580c1f]' 
                          : 'bg-white border-zinc-200 hover:border-red-100 text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inclusions switches */}
            <div className="border-t border-zinc-100 pt-4 space-y-2.5">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold block uppercase mb-2">Display Fields</span>
              
              <label className="flex items-center space-x-3 text-xs font-semibold text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="accent-[#580c1f] w-4 h-4"
                />
                <span>Include Bakery Logo Display</span>
              </label>

              <label className="flex items-center space-x-3 text-xs font-semibold text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="accent-[#580c1f] w-4 h-4"
                />
                <span>Include Selling Price Value</span>
              </label>

              <label className="flex items-center space-x-3 text-xs font-semibold text-gray-650 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSKU}
                  onChange={(e) => setShowSKU(e.target.checked)}
                  className="accent-[#580c1f] w-4 h-4"
                />
                <span>Include SKU alphanumeric identifier</span>
              </label>
            </div>

            {/* Custom title override */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Display Title Overrides</label>
              <input
                type="text"
                placeholder="e.g. Fresh Daily!, Special Deal"
                value={customTitleOverride}
                onChange={(e) => setCustomTitleOverride(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right column: Dynamic label layout PREVIEW */}
        <div className="lg:col-span-2 bg-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-between shadow-inner min-h-[460px]">
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#f085a1] mb-6 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-green-400 animate-pulse" />
            Thermal CSS Template Render preview
          </span>

          {/* Sticker Render Canvas */}
          <div className="flex-1 flex items-center justify-center w-full">
            {targetProduct ? (
              <div 
                className={`bg-white text-zinc-900 border border-zinc-200/40 p-6 flex flex-col justify-between shadow-2xl relative transition-all duration-300 font-sans border-dashed rotate-[-0.5deg] ${
                  labelType === 'shelf'
                    ? 'w-96 h-56 rounded-2xl'
                    : labelType === 'product_tag'
                    ? 'w-72 h-44 rounded-xl'
                    : 'w-64 h-32 rounded-lg justify-center p-4'
                }`}
              >
                {/* 1. Shelf Template Display */}
                {labelType === 'shelf' && (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        {showLogo && <h4 className="font-display font-extrabold text-xs text-[#580c1f]">{settings.bakeryName}</h4>}
                        <h2 className="text-sm font-black text-gray-800 mt-1 uppercase tracking-tight">
                          {customTitleOverride || targetProduct.name}
                        </h2>
                      </div>
                      {showPrice && (
                        <div className="bg-[#580c1f] text-white p-2.5 rounded-xl text-center min-w-16">
                          <span className="block text-[8px] uppercase font-bold tracking-widest leading-none">Price</span>
                          <span className="font-mono font-black text-sm block mt-0.5">${targetProduct.salePrice.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end border-t border-dashed border-zinc-200 pt-3">
                      <div>
                        {showSKU && <span className="block text-[9px] font-mono text-zinc-400 uppercase font-semibold">SKU: {targetProduct.sku}</span>}
                        <span className="block text-[8px] font-mono text-zinc-400 mt-0.5">Best Before: {targetProduct.expiryDate || 'Freshly Baked!'}</span>
                      </div>
                      
                      {/* Barcode block rendering */}
                      <div className="text-center font-mono text-[9px]">
                        <div className="h-6 w-32 bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)] opacity-85" />
                        <span className="text-[8px] text-zinc-500 block mt-0.5">{targetProduct.barcode}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Product package sticker label template */}
                {labelType === 'product_tag' && (
                  <div className="flex flex-col justify-between h-full">
                    <div className="text-center border-b border-zinc-100 pb-2">
                      <p className="font-display font-extrabold text-[10px] text-zinc-500 uppercase">{settings.bakeryName}</p>
                      <h3 className="text-xs font-black text-zinc-800 uppercase mt-0.5 tracking-tight">
                        {customTitleOverride || targetProduct.name}
                      </h3>
                    </div>

                    <div className="text-center">
                      {showPrice && <span className="font-mono font-black text-xl text-[#580c1f] block">${targetProduct.salePrice.toFixed(2)}</span>}
                      {showSKU && <span className="text-[9px] font-mono text-zinc-400 block mt-1">SKU: {targetProduct.sku}</span>}
                    </div>

                    <div className="flex justify-center flex-col items-center">
                      <div className="h-4 w-28 bg-[repeating-linear-gradient(90deg,#000,#000_1.5px,#fff_1.5px,#fff_4px)] opacity-80" />
                      <span className="text-[7px] font-mono text-zinc-400 mt-0.5">{targetProduct.barcode}</span>
                    </div>
                  </div>
                )}

                {/* 3. Barcode sticker layout only */}
                {labelType === 'barcode_only' && (
                  <div className="flex flex-col items-center justify-center space-y-1.5 h-full">
                    <span className="text-[9px] font-bold text-gray-700 text-center uppercase tracking-wider block">
                      {targetProduct.name.substring(0, 24)}
                    </span>
                    <div className="h-8 w-44 bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)] opacity-90" />
                    <span className="text-[8px] font-mono font-semibold text-zinc-500 block">*{targetProduct.barcode}*</span>
                  </div>
                )}

              </div>
            ) : (
              <p className="text-zinc-400 text-xs py-12">Choose any catalog SKU on controls panel to construct display layouts.</p>
            )}
          </div>

          <button
            onClick={handlePrintCommand}
            className="w-full max-w-sm mt-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md text-center flex items-center justify-center cursor-pointer active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Spool Label Sticker Printing (30x copies)</span>
          </button>
        </div>

      </div>

    </div>
  );
}
