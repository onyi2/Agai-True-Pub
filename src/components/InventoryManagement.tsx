import React, { useState } from "react";
import { Card } from "./ui/Card";
import { inventoryList } from "../data";
import { 
  Plus, Search, Filter, AlertTriangle, Download, Info, X, Printer, Camera, 
  Mail, Check, RefreshCw, Send, Trash2, ArrowUpDown, ChevronDown, ChevronUp, Bell, CheckCircle2 
} from "lucide-react";
import { cn } from "../lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { BarcodeScanner } from "./BarcodeScanner";

export function InventoryManagement() {
  const [inventory, setInventory] = useState<any[]>(() => {
    // Initialize from our static data with reorderThreshold checks
    return inventoryList.map(item => {
      const threshold = item.reorderThreshold || 10;
      let status = 'Good';
      if (item.stock <= 5) status = 'Critical';
      else if (item.stock <= threshold) status = 'Low';
      return { ...item, status, reorderThreshold: threshold };
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // All, Good, Low, Critical
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [lastExport, setLastExport] = useState<Date>(new Date(Date.now() - 3600000)); // 1 hour ago
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(true);

  // Supplier Draft Email Modal state
  const [draftEmailItem, setDraftEmailItem] = useState<any | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Add Item Modal state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Beer");
  const [newItemLocation, setNewItemLocation] = useState("Cold Room");
  const [newItemStock, setNewItemStock] = useState<number>(20);
  const [newItemUnit, setNewItemUnit] = useState("Bottle");
  const [newItemPrice, setNewItemPrice] = useState<number>(300);
  const [newItemThreshold, setNewItemThreshold] = useState<number>(10);
  const [newItemSupplierName, setNewItemSupplierName] = useState("Local Wholesale");
  const [newItemSupplierEmail, setNewItemSupplierEmail] = useState("wholesale@local.com");
  const [newItemDailyRate, setNewItemDailyRate] = useState<number>(2);

  // Update Stock/Log Loss action states
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentType, setAdjustmentType] = useState<"restock" | "loss">("restock");
  const [adjustmentReason, setAdjustmentReason] = useState("Regular Stock Take");

  // Alert dismiss log state
  const [recentNotifications, setRecentNotifications] = useState<string[]>([]);

  // Update stock helper
  const updateStock = (itemId: number, change: number, actionName = "Manual Adjustment") => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStock = Math.max(0, item.stock + change);
        const newValue = newStock * item.price;
        let newStatus = 'Good';
        if (newStock <= 5) newStatus = 'Critical';
        else if (newStock <= item.reorderThreshold) newStatus = 'Low';
        
        return {
          ...item,
          stock: newStock,
          value: newValue,
          status: newStatus,
          changeLog: [
            {
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              action: actionName,
              change: (change > 0 ? "+" : "") + change
            },
            ...(item.changeLog || [])
          ]
        };
      }
      return item;
    }));
  };

  const handleBackup = () => {
    const backupContent = JSON.stringify(inventory, null, 2);
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

  const toggleItemSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (displayedItems: any[]) => {
    if (selectedIds.length === displayedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedItems.map(item => item.id));
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem = {
      id: Date.now(),
      name: newItemName,
      category: newItemCategory,
      location: newItemLocation,
      stock: newItemStock,
      unit: newItemUnit,
      price: newItemPrice,
      value: newItemStock * newItemPrice,
      dailyUsageRate: newItemDailyRate || 2,
      reorderThreshold: newItemThreshold || 10,
      status: newItemStock <= 5 ? 'Critical' : (newItemStock <= newItemThreshold ? 'Low' : 'Good'),
      supplier: {
        name: newItemSupplierName,
        email: newItemSupplierEmail
      },
      changeLog: [{
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        action: "Initial Ingest",
        change: `+${newItemStock}`
      }]
    };

    setInventory(prev => [...prev, newItem]);
    setRecentNotifications(prev => [`Added new item '${newItemName}' to stock.`, ...prev]);
    setIsAddingItem(false);
    
    // Reset form
    setNewItemName("");
    setNewItemStock(20);
    setNewItemPrice(300);
    setNewItemThreshold(10);
    setNewItemSupplierName("Local Wholesale");
    setNewItemSupplierEmail("wholesale@local.com");
    setNewItemDailyRate(2);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const change = adjustmentType === "restock" ? adjustmentQty : -adjustmentQty;
    const actionName = adjustmentType === "restock" ? "Restock Ingest" : `Loss Entry (${adjustmentReason})`;
    
    updateStock(adjustingItem.id, change, actionName);
    setRecentNotifications(prev => [
      `${adjustmentType === "restock" ? "Restocked" : "Logged loss for"} ${adjustingItem.name}: ${Math.abs(change)} ${adjustingItem.unit}s`,
      ...prev
    ]);
    
    setAdjustingItem(null);
    setAdjustmentQty(1);
    setAdjustmentReason("Regular Stock Take");
  };

  const categories = ['All', ...Array.from(new Set(inventory.map(item => item.category)))];
  const locations = ['All', ...Array.from(new Set(inventory.map(item => item.location)))];

  // Sorting and Filtering
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesLocation = selectedLocation === "All" || item.location === selectedLocation;
    const matchesStatus = selectedStatus === "All" || 
                          (selectedStatus === "Low" && (item.stock <= item.reorderThreshold && item.stock > 5)) ||
                          (selectedStatus === "Critical" && item.stock <= 5) ||
                          (selectedStatus === "Good" && item.stock > item.reorderThreshold);
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  }).sort((a, b) => {
    let propA = a[sortField];
    let propB = b[sortField];
    
    if (typeof propA === "string") {
      propA = propA.toLowerCase();
      propB = propB.toLowerCase();
    }
    
    if (propA < propB) return sortOrder === "asc" ? -1 : 1;
    if (propA > propB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const lowStockItems = inventory.filter(item => item.stock <= item.reorderThreshold);

  // Email simulation
  const handleDraftEmail = (item: any) => {
     setDraftEmailItem(item);
     const reorderQty = Math.max(20, item.reorderThreshold * 2);
     setEmailTo(item.supplier?.email || "orders@eabl.com");
     setEmailSubject(`REORDER REQUEST: ${item.name} replenishment for Agai True Pub`);
     setEmailBody(
`Dear ${item.supplier?.name || "Supplier Team"},

Agai True Pub would like to request an automated replenishment order for:
- Product: ${item.name}
- Current Stock Level: ${item.stock} ${item.unit}s (Threshold: ${item.reorderThreshold})
- Target Quantity: ${reorderQty} ${item.unit}s
- Unit Cost: KES ${item.price.toLocaleString()}

Please confirm this request, reply with the estimate/invoice, and notify us of the dispatch date.

Kind Regards,
Brian Agai, Owner
Agai True Pub, Nairobi
`
     );
     setEmailSentSuccess(false);
  };

  const handleSendEmail = () => {
     setIsSendingEmail(true);
     setTimeout(() => {
        setIsSendingEmail(false);
        setEmailSentSuccess(true);
        
        // Add log entry to the item showing order was dispatched
        setInventory(prev => prev.map(item => {
           if (item.id === draftEmailItem.id) {
              return {
                 ...item,
                 changeLog: [
                    {
                       date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                       action: "Supplier Email Sent",
                       change: `Request ${Math.max(20, item.reorderThreshold * 2)}`
                    },
                    ...(item.changeLog || [])
                 ]
              };
           }
           return item;
        }));

        setRecentNotifications(prev => [
          `Dispatched replenishment email to supplier for '${draftEmailItem.name}'`,
          ...prev
        ]);

        setTimeout(() => {
           setDraftEmailItem(null);
        }, 1200);
     }, 1200);
  };

  const handleDownloadCSV = () => {
    const headers = ['ID', 'Product Name', 'Category', 'Location', 'Stock Level', 'Unit', 'Unit Price', 'Total Value', 'Status', 'Reorder Threshold'];
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
        `"${item.stock <= item.reorderThreshold ? (item.stock <= 5 ? 'Critical' : 'Low') : 'Good'}"`,
        item.reorderThreshold
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {isScanning && (
          <BarcodeScanner 
            onScan={(result) => { setIsScanning(false); setSearchQuery(result); }} 
            onClose={() => setIsScanning(false)} 
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
              <h2 className="text-2xl font-bold text-gray-200 print:text-black">Inventory Management</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                 <p className="text-sm text-emerald-400 font-medium tracking-wide print:text-gray-600">Track stock levels, arrivals, and detect losses</p>
                 <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#16191F] px-3 py-1 rounded-full border border-gray-800">
                    <span>Backup: {lastExport.toLocaleTimeString()}</span>
                    <button onClick={handleBackup} className="text-amber-500 hover:text-amber-400 font-semibold underline ml-1">Backup now</button>
                 </div>
              </div>
           </div>
           <div className="flex flex-wrap gap-2.5 print:hidden">
              <button onClick={() => window.print()} className="px-3.5 py-2 border border-gray-800 bg-[#0B0D11]/90 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                 <Printer className="w-4 h-4" />
                 <span className="hidden sm:inline">Print</span>
              </button>
              <button onClick={() => window.print()} className="px-3.5 py-2 border border-gray-800 bg-[#0B0D11]/90 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                 <Download className="w-4 h-4" />
                 <span className="hidden sm:inline">Export PDF</span>
              </button>
              <button onClick={handleDownloadCSV} className="px-3.5 py-2 border border-gray-800 bg-[#0B0D11]/90 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                 <Download className="w-4 h-4" />
                 <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button 
                onClick={() => {
                  if (inventory.length > 0) {
                    setAdjustingItem(inventory[0]);
                    setAdjustmentType("loss");
                  }
                }}
                className="px-3.5 py-2 border border-amber-500/30 bg-amber-500/10 text-amber-500 text-sm font-semibold rounded-lg hover:bg-amber-500/20 hover:border-amber-500 transition-all flex items-center gap-2"
              >
                 <AlertTriangle className="w-4 h-4" />
                 Report Loss
              </button>
              <button 
                onClick={() => setIsAddingItem(true)}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.3)]"
              >
                 <Plus className="w-4 h-4" />
                 Add Stock
              </button>
           </div>
        </div>

        {/* Dynamic Warning Notifications System Feed */}
        {recentNotifications.length > 0 && (
          <div className="bg-[#111827]/70 border border-emerald-500/20 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-emerald-400 font-mono print:hidden">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span><strong>System Log:</strong> {recentNotifications[0]}</span>
            </div>
            <button 
              onClick={() => setRecentNotifications([])} 
              className="text-gray-500 hover:text-gray-300 text-[10px] uppercase font-bold tracking-wider"
            >
              Clear
            </button>
          </div>
        )}

        {/* AUTOMATED STOCK ALERT PANEL */}
        <div className="bg-[#161920] border border-orange-500/30 rounded-xl overflow-hidden shadow-2xl print:hidden transition-all duration-300">
           <div 
             onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
             className="bg-orange-500/5 px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-orange-500/10 transition-all"
           >
              <div className="flex items-center gap-3">
                 <span className="flex h-3 w-3 relative">
                    {lowStockItems.length > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-duration-1000"></span>
                    )}
                    <span className={cn("relative inline-flex rounded-full h-3 w-3", lowStockItems.length > 0 ? "bg-orange-500" : "bg-emerald-500")}></span>
                 </span>
                 <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                 <div>
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2.5">
                       Automated Alert & Reorder Assistant
                       {lowStockItems.length > 0 ? (
                         <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-500 font-mono font-bold animate-pulse">
                           {lowStockItems.length} Low / Critical Items
                         </span>
                       ) : (
                         <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-500 font-mono font-bold">
                           All Stock Levels Secure
                         </span>
                       )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Constantly monitors real-time sales velocity and compares present quantities against reorder thresholds.
                    </p>
                 </div>
              </div>
              <button className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-all">
                 {isAlertsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
           </div>

           {isAlertsExpanded && (
              <div className="p-5 border-t border-gray-800/80 bg-[#12141A] divide-y divide-gray-800/60 max-h-[380px] overflow-y-auto custom-scrollbar">
                 {lowStockItems.length === 0 ? (
                   <div className="py-6 text-center space-y-2">
                     <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                     <p className="text-sm font-semibold text-gray-300">All key items are adequately stocked!</p>
                     <p className="text-xs text-gray-500 max-w-sm mx-auto">No items are currently below safety thresholds. The system is scanning and will flag arrivals or drops dynamically.</p>
                   </div>
                 ) : (
                   lowStockItems.map(item => {
                      const reorderQty = Math.max(20, item.reorderThreshold * 2);
                      const isCritical = item.stock <= 5;
                      return (
                         <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1">
                               <div className="flex items-center flex-wrap gap-2.5">
                                  <span className="font-semibold text-gray-100 text-sm">{item.name}</span>
                                  <span className={cn(
                                     "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1",
                                     isCritical 
                                       ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                                       : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  )}>
                                     {isCritical ? "🚨 Critical Stock" : "⚠️ Low Stock Warning"}
                                  </span>
                                  <span className="text-[11px] text-gray-500 bg-[#161920] px-2 py-0.5 rounded border border-gray-800">
                                    Current: <strong className="text-gray-300 font-mono">{item.stock}</strong> / Reorder Level: <strong className="text-gray-400 font-mono">{item.reorderThreshold}</strong>
                                  </span>
                               </div>
                               <p className="text-xs text-gray-400 max-w-2xl">
                                  Located in <strong className="text-gray-300 font-medium">{item.location}</strong>. Usage rate is <strong className="text-gray-300 font-mono">{item.dailyUsageRate} bottles/day</strong>. Order suggested: <strong className="text-amber-500 font-mono">{reorderQty} {item.unit}s</strong> from <strong className="text-gray-300 font-semibold">{item.supplier?.name}</strong>.
                               </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2.5">
                               <div className="flex items-center bg-[#0B0D11] border border-gray-800/80 rounded-lg p-0.5">
                                  <button 
                                    onClick={() => updateStock(item.id, -1, "Stock Count Decrease")}
                                    disabled={item.stock <= 0}
                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
                                    title="Subtract 1 Stock"
                                  >
                                     -
                                  </button>
                                  <span className="font-mono text-xs w-9 text-center text-gray-200">{item.stock}</span>
                                  <button 
                                    onClick={() => updateStock(item.id, 1, "Quick Correct Increase")}
                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                                    title="Add 1 Stock"
                                  >
                                     +
                                  </button>
                               </div>
                               
                               <button 
                                 onClick={() => {
                                    updateStock(item.id, reorderQty, "Automated Quick Restock");
                                    setRecentNotifications(prev => [`Replenished ${item.name} with +${reorderQty} bottles immediately.`, ...prev]);
                                 }}
                                 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                               >
                                  <Check className="w-3.5 h-3.5" />
                                  Restock +{reorderQty}
                                </button>
                                
                               <button 
                                 onClick={() => handleDraftEmail(item)}
                                 className="px-3 py-1.5 border border-gray-800 bg-[#0B0D11]/90 hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                               >
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  Send Order Email
                               </button>
                            </div>
                         </div>
                      );
                   })
                 )}
              </div>
           )}
        </div>

        {/* FILTERING & STORAGE CONTROLS */}
        <Card className="p-0 overflow-hidden border-gray-800 shadow-2xl print:shadow-none print:border-none print:bg-white text-black">
           <div className="p-4 sm:p-5 border-b border-gray-800 flex flex-col gap-4 bg-[#1A1E25] print:hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 
                 {/* Standard Search */}
                 <div className="relative group flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search alcoholic brands, mixers..." 
                      className="bg-[#0B0D11] border border-gray-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full transition-all placeholder:text-gray-600 text-gray-200"
                    />
                 </div>
                 
                 {/* Secondary Segmented Level Filters */}
                 <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-[#0B0D11] border border-gray-800 rounded-lg p-1">
                      <span className="text-[11px] text-gray-500 px-2 uppercase font-bold">Status:</span>
                      {["All", "Good", "Low", "Critical"].map(status => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={cn(
                            "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                            selectedStatus === status 
                              ? (status === 'Good' ? "bg-emerald-500/10 text-emerald-400" : status === 'Low' ? "bg-orange-500/10 text-orange-400" : status === 'Critical' ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-500")
                              : "text-gray-400 hover:text-gray-200"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    <button onClick={() => {
                      setSelectedCategory("All");
                      setSelectedLocation("All");
                      setSelectedStatus("All");
                      setSearchQuery("");
                    }} className="px-3 py-2 border border-gray-800 rounded-lg bg-[#0B0D11] text-xs hover:bg-gray-800 text-gray-400 transition-colors" title="Clear Filters">
                      Reset
                    </button>

                    <button onClick={() => setIsScanning(true)} className="px-4 py-2.5 border border-gray-800 rounded-lg bg-[#0B0D11] text-sm flex items-center gap-2 hover:bg-gray-800 transition-all text-gray-300 font-medium">
                       <Camera className="w-4 h-4" /> 
                       <span className="hidden sm:inline">Scan Label</span>
                    </button>
                 </div>
              </div>
              
              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 hide-scrollbar">
                 <span className="text-[11px] text-gray-500 uppercase font-bold shrink-0">Category:</span>
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

           {/* MAIN TABLE */}
           <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-[#0B0D11] text-gray-500 text-xs uppercase tracking-wider font-semibold print:bg-gray-100 print:text-black print:border-b-2 print:border-black">
                    <tr>
                       <th className="px-6 py-4 w-[40px]">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length === filteredInventory.length && filteredInventory.length > 0}
                            onChange={() => toggleSelectAll(filteredInventory)}
                            className="accent-amber-500"
                          />
                       </th>
                       <th className="px-6 py-4 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort("name")}>
                         <div className="flex items-center gap-1">
                           Brand / Product
                           <ArrowUpDown className="w-3.5 h-3.5" />
                         </div>
                       </th>
                       <th className="px-6 py-4 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort("category")}>
                         <div className="flex items-center gap-1">
                           Category
                           <ArrowUpDown className="w-3.5 h-3.5" />
                         </div>
                       </th>
                       <th className="px-6 py-4 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort("location")}>
                         <div className="flex items-center gap-1">
                           Location / Area
                           <ArrowUpDown className="w-3.5 h-3.5" />
                         </div>
                       </th>
                       <th className="px-6 py-4 cursor-pointer hover:text-amber-500 transition-colors animate-pulse" onClick={() => handleSort("stock")}>
                         <div className="flex items-center gap-1">
                           Current Stock
                           <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />
                         </div>
                       </th>
                       <th className="px-6 py-4">Days Until Empty</th>
                       <th className="px-6 py-4 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort("price")}>
                         <div className="flex items-center gap-1">
                           Price
                           <ArrowUpDown className="w-3.5 h-3.5" />
                         </div>
                       </th>
                       <th className="px-6 py-4 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort("value")}>
                         <div className="flex items-center gap-1">
                           Value
                           <ArrowUpDown className="w-3.5 h-3.5" />
                         </div>
                       </th>
                       <th className="px-6 py-4 text-center print:text-black">Status Alert</th>
                       <th className="px-6 py-4 text-right print:hidden">Control Desk</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800 bg-[#15181E] print:bg-white print:divide-gray-300">
                    {filteredInventory.length === 0 ? (
                       <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-gray-500 bg-[#12141A]">
                             <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                             <p>No inventory items found matching the filter matrix.</p>
                             <button onClick={() => { setSelectedCategory("All"); setSelectedStatus("All"); setSearchQuery(""); }} className="text-amber-500 hover:underline text-xs mt-1 font-semibold">
                               Reset Filter Setup
                             </button>
                          </td>
                       </tr>
                    ) : (
                       filteredInventory.map((item) => {
                          const hasAlert = item.stock <= item.reorderThreshold;
                          const isCritical = item.stock <= 5;
                          return (
                             <tr 
                               key={item.id} 
                               className={cn(
                                 "hover:bg-gray-800/30 transition-all duration-150 group print:text-black print:border-b print:border-gray-200 border-l-2",
                                 hasAlert 
                                   ? (isCritical ? "border-l-red-500/80 bg-red-500/[0.01]" : "border-l-amber-500/80 bg-amber-500/[0.01]") 
                                   : "border-l-transparent"
                               )}
                             >
                             <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="accent-amber-500"
                                />
                             </td>
                             <td className="px-6 py-4 font-medium text-gray-200 print:text-black">
                                <div className="flex items-center gap-2">
                                  <span>{item.name}</span>
                                  {hasAlert && (
                                     <span className={cn(
                                        "w-2 h-2 rounded-full animate-ping shrink-0",
                                        isCritical ? "bg-red-500" : "bg-orange-500"
                                     )}></span>
                                  )}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-gray-400 print:text-gray-600">{item.category}</td>
                             <td className="px-6 py-4 text-gray-400 font-mono text-xs">{item.location || "Main Bar"}</td>
                             
                             {/* Stock Level with Warning Badges */}
                             <td className="px-6 py-4 text-gray-300 print:text-black">
                                <div className="flex items-center gap-2">
                                   <span className={cn(
                                      "font-mono text-[15px]",
                                      hasAlert ? "text-orange-400 font-bold" : "text-emerald-400"
                                   )}>{item.stock}</span> 
                                   <span className={cn(
                                      "text-xs uppercase",
                                      hasAlert ? "text-orange-400/70" : "text-gray-600"
                                   )}>{item.unit}s</span>
                                   
                                   {/* The core Low Stock Badge */}
                                   {hasAlert && (
                                      <span className={cn(
                                         "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border animate-pulse",
                                         isCritical 
                                           ? "bg-red-500/15 text-red-400 border-red-500/35" 
                                           : "bg-amber-500/15 text-amber-500 border-amber-500/35"
                                      )}>
                                         <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                         {isCritical ? "Critical" : "Warning"}
                                      </span>
                                   )}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                               {item.dailyUsageRate ? (
                                  <>
                                    <span>{Math.floor(item.stock / item.dailyUsageRate)}</span>
                                    <span className="text-[10px] text-gray-600 ml-1">days remaining</span>
                                  </>
                               ) : "∞"}
                             </td>
                             <td className="px-6 py-4 font-mono text-gray-400 text-xs print:text-gray-600">
                                <span className="text-gray-600 mr-1 print:text-gray-400">KES</span>
                                {item.price.toLocaleString()}
                             </td>
                             <td className="px-6 py-4 font-mono font-medium text-amber-500 text-[15px] print:text-black">
                                <span className="text-amber-500/50 text-xs mr-1 print:text-gray-400">KES</span>
                                {item.value.toLocaleString()}
                             </td>
                             
                             {/* Warnings / Good status col */}
                             <td className="px-6 py-4 text-center">
                                <span className={cn(
                                   "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
                                   !hasAlert && "bg-emerald-950/40 text-emerald-400 border-emerald-500/20",
                                   (hasAlert && !isCritical) && "bg-orange-950/40 text-orange-400 border-orange-500/20",
                                   isCritical && "bg-red-950/40 text-red-500 border-red-500/20"
                                )}>
                                   {isCritical ? "CRITICAL" : (hasAlert ? "LOW" : "OPTIMAL")}
                                </span>
                             </td>
                             
                             {/* Action buttons */}
                             <td className="px-6 py-4 text-right font-medium flex items-center justify-end gap-2.5 print:hidden">
                                <button 
                                  onClick={() => setSelectedItem(item)} 
                                  className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" 
                                  title="View Specs / QR Code"
                                >
                                   <Info className="w-4 h-4" />
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setAdjustingItem(item);
                                    setAdjustmentType("restock");
                                  }}
                                  className="p-1 px-2.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 hover:border-emerald-400 rounded-md bg-emerald-500/[0.03] hover:bg-emerald-500/10 transition-colors"
                                  title="Adjust or Add Stock"
                                >
                                  Update
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setAdjustingItem(item);
                                    setAdjustmentType("loss");
                                  }}
                                  className="p-1 px-2.5 text-xs text-red-400 border border-red-500/10 hover:border-red-400 rounded-md bg-red-500/[0.02] hover:bg-red-500/15 transition-colors"
                                >
                                  Loss
                                </button>
                             </td>
                          </tr>
                       );
                    }))}
                 </tbody>
              </table>
           </div>
        </Card>

        {/* MODAL: SUPPLIER ORDER EMAIL DRAFTER CLIENT */}
        {draftEmailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-all duration-200">
             <Card className="w-full max-w-xl bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                   <div className="flex items-center gap-2">
                     <Mail className="w-5 h-5 text-amber-500" />
                     <h3 className="text-md font-semibold text-gray-200">Supplier Order Email Draft</h3>
                   </div>
                   <button onClick={() => setDraftEmailItem(null)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                {emailSentSuccess ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/30">
                      <Check className="w-8 h-8 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-gray-100">Order Dispatched!</h4>
                      <p className="text-sm text-gray-400 max-w-sm mx-auto">The secure reorder draft was pushed to {emailTo} successfully. Reorder tracking details appended.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4 text-left">
                     <p className="text-xs text-gray-400 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                       Review this system recommendation. Sending triggers a secure purchase requisition simulation and tracks the status in the brand’s history log.
                     </p>

                     <div className="space-y-3">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">To</label>
                          <input 
                            type="email" 
                            className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Subject</label>
                          <input 
                            type="text" 
                            className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Email Body</label>
                          <textarea 
                            rows={8}
                            className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-xs text-gray-300 font-mono leading-relaxed"
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                          />
                        </div>
                     </div>

                     <div className="p-4 border-t border-gray-800 pt-5 bg-[#0B0D11]/30 flex justify-end gap-3">
                        <button 
                          onClick={() => setDraftEmailItem(null)} 
                          className="px-4 py-2 border border-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all"
                        >
                           Cancel
                        </button>
                        <button 
                          disabled={isSendingEmail}
                          onClick={handleSendEmail} 
                          className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                           {isSendingEmail ? (
                             <>
                               <RefreshCw className="w-4 h-4 animate-spin" />
                               Simulating Transmission...
                             </>
                           ) : (
                             <>
                               <Send className="w-4 h-4" />
                               Send Purchase Order
                             </>
                           )}
                        </button>
                     </div>
                  </div>
                )}
             </Card>
          </div>
        )}

        {/* MODAL: GENERAL STOCK ADJUSTMENTS (UPDATE STOCK & LOG LOSS) */}
        {adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
             <Card className="w-full max-w-md bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-2xl">
                 <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("w-5 h-5", adjustmentType === "restock" ? "text-emerald-500" : "text-red-500")} />
                      <h3 className="text-md font-semibold text-gray-200">
                        {adjustmentType === "restock" ? `Restock: ${adjustingItem.name}` : `Log Stock Loss: ${adjustingItem.name}`}
                      </h3>
                    </div>
                    <button onClick={() => setAdjustingItem(null)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <form onSubmit={handleApplyAdjustment} className="p-6 space-y-4 text-left">
                     <div className="bg-[#0B0D11] p-3.5 rounded-lg border border-gray-800/80">
                       <span className="text-xs text-gray-500 block">Current Stock level</span>
                       <span className="text-xl font-bold font-mono text-gray-200">{adjustingItem.stock} <span className="text-xs text-gray-500 uppercase">{adjustingItem.unit}s</span></span>
                     </div>

                     <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                          {adjustmentType === "restock" ? "Restock Quantity" : "Loss Quantity"}
                        </label>
                        <input 
                          type="number"
                          required
                          min={1}
                          className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                          value={adjustmentQty}
                          onChange={(e) => setAdjustmentQty(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                     </div>

                     {adjustmentType === "loss" && (
                       <div>
                          <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1.5">Reason for Deficit</label>
                          <select 
                            className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                            value={adjustmentReason}
                            onChange={(e) => setAdjustmentReason(e.target.value)}
                          >
                             <option value="Regular Stock Take">Regular Stock Take (Discrepancy)</option>
                             <option value="Broken / Damaged Bottle">Broken / Damaged Bottle</option>
                             <option value="Staff Spill / Overpour">Staff Spill / Overpour</option>
                             <option value="Theft / Untracked Pour">Theft / Untracked Pour</option>
                             <option value="Expired Product">Expired Product</option>
                          </select>
                       </div>
                     )}

                     <div className="p-4 border-t border-gray-800 pt-5 flex justify-end gap-3 bg-[#0B0D11]/20">
                        <button 
                          type="button"
                          onClick={() => setAdjustingItem(null)} 
                          className="px-4 py-2 border border-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                           Cancel
                        </button>
                        <button 
                          type="submit"
                          className={cn(
                            "px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md",
                            adjustmentType === "restock" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                          )}
                        >
                           Confirm {adjustmentType === "restock" ? "Ingest" : "Deduction"}
                        </button>
                     </div>
                 </form>
             </Card>
          </div>
        )}

        {/* MODAL: ADD NEW STOCK ITEM */}
        {isAddingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
             <Card className="w-full max-w-lg bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-2xl">
                 <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                    <h3 className="text-md font-semibold text-gray-200">Add New Inventory Item</h3>
                    <button onClick={() => setIsAddingItem(false)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <form onSubmit={handleAddNewItem} className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-left">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Product / Brand Name</label>
                           <input 
                             type="text"
                             required
                             placeholder="e.g. Jameson Triple Distilled"
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemName}
                             onChange={(e) => setNewItemName(e.target.value)}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Category</label>
                           <select 
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemCategory}
                             onChange={(e) => setNewItemCategory(e.target.value)}
                           >
                              <option value="Beer">Beer</option>
                              <option value="Whisky">Whisky</option>
                              <option value="Gin">Gin</option>
                              <option value="Rum">Rum</option>
                              <option value="Vodka">Vodka</option>
                              <option value="Tequila">Tequila</option>
                              <option value="Wine">Wine</option>
                              <option value="Mixer">Mixer</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Location Area</label>
                           <select 
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemLocation}
                             onChange={(e) => setNewItemLocation(e.target.value)}
                           >
                              <option value="Cold Room">Cold Room</option>
                              <option value="Shelf A1">Shelf A1</option>
                              <option value="Shelf A2">Shelf A2</option>
                              <option value="Bar Counter">Bar Counter</option>
                              <option value="Store Room 2">Store Room 2</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Initial Stock Level</label>
                           <input 
                             type="number"
                             required
                             min={0}
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemStock}
                             onChange={(e) => setNewItemStock(Math.max(0, parseInt(e.target.value) || 0))}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Unit Type</label>
                           <input 
                             type="text"
                             required
                             placeholder="e.g. Bottle, Case"
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemUnit}
                             onChange={(e) => setNewItemUnit(e.target.value)}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Unit Price (KES)</label>
                           <input 
                             type="number"
                             required
                             min={1}
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemPrice}
                             onChange={(e) => setNewItemPrice(Math.max(1, parseInt(e.target.value) || 1))}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Reorder Threshold Level</label>
                           <input 
                             type="number"
                             required
                             min={1}
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemThreshold}
                             onChange={(e) => setNewItemThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Est. Daily Usage Rate</label>
                           <input 
                             type="number"
                             required
                             min={1}
                             step="0.1"
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemDailyRate}
                             onChange={(e) => setNewItemDailyRate(Math.max(0.1, parseFloat(e.target.value) || 1))}
                           />
                        </div>

                        <div className="col-span-2 pt-2 border-t border-gray-800 mt-2">
                           <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Supplier Coordinates</h4>
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Supplier Name</label>
                           <input 
                             type="text"
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemSupplierName}
                             onChange={(e) => setNewItemSupplierName(e.target.value)}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Supplier Order Email</label>
                           <input 
                             type="email"
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemSupplierEmail}
                             onChange={(e) => setNewItemSupplierEmail(e.target.value)}
                           />
                        </div>
                     </div>

                     <div className="p-4 border-t border-gray-800 pt-5 flex justify-end gap-3 bg-[#0B0D11]/20 mt-4">
                        <button 
                          type="button"
                          onClick={() => setIsAddingItem(false)} 
                          className="px-4 py-2 border border-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                           Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-md"
                        >
                           Add Product
                        </button>
                     </div>
                 </form>
             </Card>
          </div>
        )}

        {/* MODAL: ITEM DETAIL SHEET (DETAILS DIALOG) */}
        {selectedItem && (
          (() => {
             // Read current up-to-date item from state array
             const currentItem = inventory.find(i => i.id === selectedItem.id) || selectedItem;
             return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                   <Card className="w-full max-w-md bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                         <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Product Catalog Details</h3>
                         <button onClick={() => setSelectedItem(null)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                         </button>
                      </div>
                      <div className="p-6 space-y-6 max-h-[420px] overflow-y-auto">
                         <div className="flex justify-between items-start">
                            <div>
                               <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Product Name</h4>
                               <p className="text-gray-100 font-bold text-lg">{currentItem.name}</p>
                               <span className="text-[11px] text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-800">
                                 {currentItem.category}
                               </span>
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-gray-500 mb-0.5">Physical Area</p>
                               <p className="text-gray-200 font-mono font-medium text-xs bg-[#0B0D11] border border-gray-800 px-2 py-1 rounded">
                                 {currentItem.location || "Shelf A1"}
                               </p>
                            </div>
                         </div>
                         
                         <div className="flex justify-center p-3 bg-white rounded-xl border border-gray-800">
                            <QRCodeSVG value={`product-spec-id-${currentItem.id}`} size={120} />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-[#0B0D11] p-3 rounded-lg border border-gray-800/80">
                               <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Qty on premises</p>
                               <p className={cn(
                                  "font-mono font-extrabold text-lg",
                                  (currentItem.stock <= currentItem.reorderThreshold) ? "text-orange-400" : "text-emerald-400"
                               )}>
                                  {currentItem.stock} <span className="text-xs text-gray-500 uppercase font-bold">{currentItem.unit}s</span>
                               </p>
                            </div>
                            <div className="bg-[#0B0D11] p-3 rounded-lg border border-gray-800/80">
                               <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Unit Wholsale Price</p>
                               <p className="font-mono font-extrabold text-lg text-amber-500">
                                  <span className="text-xs text-amber-500/60 mr-1">KES</span>
                                  {currentItem.price.toLocaleString()}
                               </p>
                            </div>
                         </div>

                         {currentItem.supplier && (
                            <div className="pt-3.5 border-t border-gray-800">
                               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Supplier Information</h4>
                               <div className="flex flex-col gap-2.5">
                                   <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-500">Contact Brand</span>
                                      <span className="text-gray-300 font-semibold">{currentItem.supplier.name}</span>
                                   </div>
                                   <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-500">Purchase Email</span>
                                      <a href={`mailto:${currentItem.supplier.email}`} className="text-blue-400 hover:text-blue-300 hover:underline font-semibold font-mono">{currentItem.supplier.email}</a>
                                   </div>
                               </div>
                            </div>
                         )}

                         {currentItem.changeLog && currentItem.changeLog.length > 0 && (
                            <div className="pt-3.5 border-t border-gray-800">
                               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Ledger Logs</h4>
                               <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                  {currentItem.changeLog.map((log: any, index: number) => (
                                     <div key={index} className="flex justify-between items-center text-[11px] font-mono hover:bg-gray-800/10 p-1 rounded">
                                        <span className="text-gray-500">{log.date}</span>
                                        <span className="text-gray-300 font-medium">{log.action}</span>
                                        <span className={cn("font-bold text-right", log.change.startsWith('+') ? "text-emerald-400" : "text-red-400")}>{log.change}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                      <div className="p-4 border-t border-gray-800 bg-[#0B0D11] flex justify-end">
                         <button onClick={() => setSelectedItem(null)} className="px-4 py-2 border border-gray-800 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
                            Close Spec Sheet
                         </button>
                      </div>
                   </Card>
                </div>
             );
          })()
        )}
    </div>
  );
}
