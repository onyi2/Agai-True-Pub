import { useState } from "react";
import { Card } from "./ui/Card";
import { inventoryList } from "../data";
import { Plus, Search, Filter, AlertTriangle, Download, Info, X, Printer, Camera } from "lucide-react";
import { cn } from "../lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { BarcodeScanner } from "./BarcodeScanner";

export function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedItem, setSelectedItem] = useState<typeof inventoryList[0] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastExport, setLastExport] = useState<Date>(new Date(Date.now() - 3600000)); // Mock: 1 hour ago

  const toggleItemSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBackup = () => {
    const backupContent = JSON.stringify(inventoryList, null, 2);
    const blob = new Blob([backupContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_backup_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLastExport(new Date());
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInventory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInventory.map(item => item.id));
    }
  };

  const categories = ['All', ...Array.from(new Set(inventoryList.map(item => item.category)))];
  const locations = ['All', ...Array.from(new Set(inventoryList.map(item => item.location)))];

  const filteredInventory = inventoryList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesLocation = selectedLocation === "All" || item.location === selectedLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const lowStockItems = filteredInventory.filter(item => item.status === 'Low' || item.status === 'Critical');

  const handleDownloadCSV = () => {
    const headers = ['ID', 'Product Name', 'Category', 'Location', 'Stock Level', 'Unit', 'Unit Price', 'Total Value', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(item => [
        item.id,
        `"${item.name}"`,
        `"${item.category}"`,
        `"${item.location}"`,
        item.stock,
        `"${item.unit}"`,
        item.price,
        item.value,
        `"${item.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {isScanning && <BarcodeScanner onScan={(result) => { setIsScanning(false); setSearchQuery(result); }} onClose={() => setIsScanning(false)} />}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h2 className="text-2xl font-bold text-gray-200 print:text-black">Inventory Management</h2>
             <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-emerald-400 font-medium tracking-wide print:text-gray-600">Track stock levels, arrivals, and detect losses</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#0B0D11] px-3 py-1 rounded-full border border-gray-800">
                   <span>Last backup: {lastExport.toLocaleTimeString()}</span>
                   <button onClick={handleBackup} className="text-amber-500 hover:text-amber-400 font-semibold underline">Backup now</button>
                </div>
             </div>
          </div>
          <div className="flex gap-3 print:hidden">
             <button onClick={() => window.print()} className="px-4 py-2 border border-gray-800 bg-[#0B0D11] text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
             </button>
             <button onClick={() => window.print()} className="px-4 py-2 border border-gray-800 bg-[#0B0D11] text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
             </button>
             <button onClick={handleDownloadCSV} className="px-4 py-2 border border-gray-800 bg-[#0B0D11] text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
             </button>
             <button className="px-4 py-2 border border-amber-500/50 bg-amber-500/10 text-amber-500 text-sm font-semibold rounded-lg hover:bg-amber-500/20 hover:border-amber-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <AlertTriangle className="w-4 h-4" />
                Report Loss
             </button>
             <button className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Stock
             </button>
          </div>
       </div>

       {lowStockItems.length > 0 && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3 print:hidden">
             <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
             <div>
                <h3 className="text-sm font-medium text-orange-400">Low Stock Alert</h3>
                <p className="text-sm text-orange-400/80 mt-1">
                   You have {lowStockItems.length} item{lowStockItems.length === 1 ? '' : 's'} currently showing as Low or Critical stock. Please review and reorder.
                </p>
             </div>
          </div>
       )}

       <Card className="p-0 overflow-hidden border-gray-800 shadow-2xl print:shadow-none print:border-none print:bg-white text-black">
          <div className="p-4 sm:p-5 border-b border-gray-800 flex flex-col gap-4 bg-[#1A1E25] print:hidden">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative group flex-1 max-w-md">
                   <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search products, categories..." 
                     className="bg-[#0B0D11] border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full transition-all placeholder:text-gray-600 text-gray-200"
                   />
                </div>
                <button className="px-4 py-2.5 border border-gray-800 rounded-lg bg-[#0B0D11] text-sm flex items-center gap-2 hover:bg-gray-800 transition-all text-gray-300 font-medium">
                   <Filter className="w-4 h-4" /> 
                   <span className="hidden sm:inline">Filters</span>
                </button>
                <button onClick={() => setIsScanning(true)} className="px-4 py-2.5 border border-gray-800 rounded-lg bg-[#0B0D11] text-sm flex items-center gap-2 hover:bg-gray-800 transition-all text-gray-300 font-medium">
                   <Camera className="w-4 h-4" /> 
                   <span className="hidden sm:inline">Scan</span>
                </button>
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar pt-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border",
                      selectedCategory === category 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                        : "bg-[#0B0D11] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-gray-200"
                    )}
                  >
                    {category}
                  </button>
                ))}
             </div>
          </div>
          <div className="overflow-x-auto print:overflow-visible">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0B0D11] text-gray-500 text-xs uppercase tracking-wider font-semibold print:bg-gray-100 print:text-black print:border-b-2 print:border-black">
                   <tr>
                      <th className="px-6 py-4 w-[40px]">
                         <input 
                           type="checkbox" 
                           checked={selectedIds.length === filteredInventory.length && filteredInventory.length > 0}
                           onChange={toggleSelectAll}
                           className="accent-amber-500"
                         />
                      </th>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Stock Level</th>
                      <th className="px-6 py-4">Days Until Empty</th>
                      <th className="px-6 py-4">Unit Price</th>
                      <th className="px-6 py-4">Total Value</th>
                      <th className="px-6 py-4 text-center print:text-black">Status</th>
                      <th className="px-6 py-4 text-right print:hidden">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#15181E] print:bg-white print:divide-gray-300">
                   {filteredInventory.length === 0 ? (
                      <tr>
                         <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                            No inventory items found matching your search.
                         </td>
                      </tr>
                   ) : (
                      filteredInventory.map((item) => (
                         <tr key={item.id} className="hover:bg-gray-800/30 transition-colors group print:text-black print:border-b print:border-gray-200">
                         <td className="px-6 py-4.5 font-medium text-gray-200 print:text-black">{item.name}</td>
                         <td className="px-6 py-4.5 text-gray-400 print:text-gray-600">{item.category}</td>
                         <td className="px-6 py-4.5 text-gray-300 print:text-black">
                            <span className={cn(
                               "font-mono text-[15px]",
                               (item.status === 'Low' || item.status === 'Critical') && "text-orange-400 font-bold"
                            )}>{item.stock}</span> 
                            <span className={cn(
                               "text-xs ml-1.5 uppercase",
                               (item.status === 'Low' || item.status === 'Critical') ? "text-orange-400/70" : "text-gray-600"
                            )}>{item.unit}s</span>
                         </td>
                         <td className="px-6 py-4.5 text-gray-400 font-mono text-sm">
                           {Math.floor(item.stock / item.dailyUsageRate)} days
                         </td>
                         <td className="px-6 py-4.5 font-mono text-gray-400 text-xs print:text-gray-600">
                            <span className="text-gray-600 mr-1 print:text-gray-400">KES</span>
                            {item.price.toLocaleString()}
                         </td>
                         <td className="px-6 py-4.5 font-mono font-medium text-amber-500 text-[15px] print:text-black">
                            <span className="text-amber-500/50 text-xs mr-1 print:text-gray-400">KES</span>
                            {item.value.toLocaleString()}
                         </td>
                         <td className="px-6 py-4.5 text-center">
                            <span className={cn(
                               "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                               item.status === 'Good' && "bg-emerald-900/40 text-emerald-400 border-emerald-500/30",
                               item.status === 'Low' && "bg-orange-900/40 text-orange-400 border-orange-500/30",
                               item.status === 'Critical' && "bg-red-900/40 text-red-500 border-red-500/30"
                            )}>
                               {item.status}
                            </span>
                         </td>
                         <td className="px-6 py-4.5 text-right font-medium flex items-center justify-end gap-3 print:hidden">
                            <button onClick={() => setSelectedItem(item)} className="p-1.5 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="View Details">
                               <Info className="w-4 h-4" />
                            </button>
                            <button className="text-emerald-500 hover:underline transition-colors">Update</button>
                            <button className="text-red-500 hover:underline transition-colors">Log Loss</button>
                         </td>
                      </tr>
                   )))}
                </tbody>
             </table>
          </div>
       </Card>

       {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <Card className="w-full max-w-md bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                   <h3 className="text-lg font-semibold text-gray-200">Item Details</h3>
                   <button onClick={() => setSelectedItem(null)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="p-6 space-y-6">
                   <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Product Info</h4>
                      <p className="text-gray-200 font-medium text-lg">{selectedItem.name}</p>
                      <p className="text-gray-500 text-sm">{selectedItem.category}</p>
                   </div>
                   
                   <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCodeSVG value={`product-history-${selectedItem.id}`} size={128} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0B0D11] p-3 rounded-lg border border-gray-800">
                         <p className="text-xs text-gray-500 mb-1">Stock Level</p>
                         <p className={cn(
                            "font-mono font-medium text-lg",
                            (selectedItem.status === 'Low' || selectedItem.status === 'Critical') ? "text-orange-400" : "text-emerald-400"
                         )}>
                            {selectedItem.stock} <span className="text-xs text-gray-600 uppercase">{selectedItem.unit}s</span>
                         </p>
                      </div>
                      <div className="bg-[#0B0D11] p-3 rounded-lg border border-gray-800">
                         <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                         <p className="font-mono font-medium text-lg text-gray-300">
                            <span className="text-xs text-gray-600 mr-1">KES</span>
                            {selectedItem.price.toLocaleString()}
                         </p>
                      </div>
                   </div>

                   {selectedItem.supplier && (
                      <div className="pt-2 border-top border-gray-800">
                         <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Supplier Info</h4>
                         <div className="flex flex-col gap-2">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Name</span>
                                <span className="text-gray-200 font-medium">{selectedItem.supplier.name}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Email</span>
                                <a href={`mailto:${selectedItem.supplier.email}`} className="text-blue-400 hover:text-blue-300 hover:underline">{selectedItem.supplier.email}</a>
                             </div>
                         </div>
                      </div>
                   )}
                </div>
                    {selectedItem.changeLog && selectedItem.changeLog.length > 0 && (
                       <div className="pt-4 border-t border-gray-800">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Change Log</h4>
                          <div className="space-y-2">
                             {selectedItem.changeLog.map((log: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                   <span className="text-gray-400 w-1/3">{log.date.split(' ')[0]}</span>
                                   <span className="text-gray-400 w-1/3 text-center">{log.action}</span>
                                   <span className={cn("font-medium w-1/3 text-right", log.change.startsWith('+') ? "text-emerald-400" : "text-red-400")}>{log.change}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                <div className="p-5 border-t border-gray-800 bg-[#0B0D11] flex justify-end gap-3">
                   <button onClick={() => setSelectedItem(null)} className="px-4 py-2 border border-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                      Close
                   </button>
                </div>
             </Card>
          </div>
       )}
    </div>
  );
}
