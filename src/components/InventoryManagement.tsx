import React, { useState } from "react";
import { Card } from "./ui/Card";
import { inventoryList } from "../data";
import { 
  Plus, Search, Filter, AlertTriangle, Download, Info, X, Printer, Camera, 
  Mail, Check, RefreshCw, Send, Trash2, Upload, ArrowUpDown, ChevronDown, ChevronUp, Bell, CheckCircle2 
} from "lucide-react";
import { cn } from "../lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { BarcodeScanner } from "./BarcodeScanner";

export function InventoryManagement() {
  const [inventory, setInventory] = useState<any[]>(() => {
    // Initialize from our static data with reorderLevel checks
    return inventoryList.map(item => {
      const closingStock = (item.openingStock || 0) + (item.received || 0) - (item.sold || 0) + (item.variance || 0);
      const threshold = item.reorderLevel || 10;
      let status = 'Good';
      if (closingStock <= 5) status = 'Critical';
      else if (closingStock <= threshold) status = 'Low';
      const profit = ((item.sellingPrice || 0) - (item.buyingPrice || 0)) * (item.sold || 0);
      const value = closingStock * (item.buyingPrice || 0);
      return { 
        ...item, 
        stock: closingStock,
        closingStock,
        price: item.sellingPrice || 0,
        value,
        status, 
        profit,
        reorderThreshold: threshold
      };
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // All, Good, Low, Critical
  const [sortField, setSortField] = useState<string>("brand");
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
  const [newItemPackSize, setNewItemPackSize] = useState("750ml Bottle");
  const [newItemOpeningStock, setNewItemOpeningStock] = useState<number>(20);
  const [newItemReceived, setNewItemReceived] = useState<number>(0);
  const [newItemSold, setNewItemSold] = useState<number>(0);
  const [newItemVariance, setNewItemVariance] = useState<number>(0);
  const [newItemBuyingPrice, setNewItemBuyingPrice] = useState<number>(1000);
  const [newItemSellingPrice, setNewItemSellingPrice] = useState<number>(1500);
  const [newItemThreshold, setNewItemThreshold] = useState<number>(10);
  const [newItemSupplierName, setNewItemSupplierName] = useState("EABL Distribution");
  const [newItemSupplierEmail, setNewItemSupplierEmail] = useState("orders@eabl.com");
  const [newItemDailyRate, setNewItemDailyRate] = useState<number>(2);

  // Bulk Import state
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);
  const [bulkImportSuccessMsg, setBulkImportSuccessMsg] = useState<string | null>(null);
  const [parsedBulkItems, setParsedBulkItems] = useState<any[]>([]);

  // Update Stock/Log Loss action states
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentType, setAdjustmentType] = useState<"restock" | "loss" | "sold">("restock");
  const [adjustmentReason, setAdjustmentReason] = useState("Regular Stock Take");

  // Alert dismiss log state
  const [recentNotifications, setRecentNotifications] = useState<string[]>([]);

  // Update stock helper
  const updateStock = (itemId: number, change: number, actionName = "Manual Adjustment", type: "restock" | "loss" | "sold" = "restock") => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        let op = item.openingStock || 0;
        let rec = item.received || 0;
        let sold = item.sold || 0;
        let varVal = item.variance || 0;

        if (type === "restock") {
          rec += change;
        } else if (type === "loss") {
          varVal -= change; // loss is decrement to variance
        } else if (type === "sold") {
          sold += change;
        }

        const newClosing = Math.max(0, op + rec - sold + varVal);
        const newValue = newClosing * (item.buyingPrice || 0);
        const newProfit = Math.max(0, ((item.sellingPrice || 0) - (item.buyingPrice || 0)) * sold);
        let newStatus = 'Good';
        if (newClosing <= 5) newStatus = 'Critical';
        else if (newClosing <= (item.reorderLevel || 10)) newStatus = 'Low';
        
        return {
          ...item,
          received: rec,
          variance: varVal,
          sold,
          stock: newClosing,
          closingStock: newClosing,
          value: newValue,
          profit: newProfit,
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

    const op = newItemOpeningStock;
    const rec = newItemReceived;
    const sld = newItemSold;
    const vr = newItemVariance;
    const closing = op + rec - sld + vr;
    const profit = (newItemSellingPrice - newItemBuyingPrice) * sld;
    const value = closing * newItemBuyingPrice;

    const newItem = {
      id: Date.now(),
      brand: newItemName,
      name: newItemName,
      category: newItemCategory,
      packSize: newItemPackSize,
      openingStock: op,
      received: rec,
      sold: sld,
      variance: vr,
      closingStock: closing,
      stock: closing,
      buyingPrice: newItemBuyingPrice,
      sellingPrice: newItemSellingPrice,
      price: newItemSellingPrice,
      profit: profit,
      value: value,
      reorderLevel: newItemThreshold,
      reorderThreshold: newItemThreshold,
      location: newItemLocation,
      dailyUsageRate: newItemDailyRate || 2,
      status: closing <= 5 ? 'Critical' : (closing <= newItemThreshold ? 'Low' : 'Good'),
      supplier: {
        name: newItemSupplierName,
        email: newItemSupplierEmail
      },
      changeLog: [{
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        action: "Initial Ingest",
        change: `+${closing}`
      }]
    };

    setInventory(prev => [...prev, newItem]);
    setRecentNotifications(prev => [`Added new brand '${newItemName}' with profit/unit calculation.`, ...prev]);
    setIsAddingItem(false);
    
    // Reset form
    setNewItemName("");
    setNewItemPackSize("750ml Bottle");
    setNewItemOpeningStock(20);
    setNewItemReceived(0);
    setNewItemSold(0);
    setNewItemVariance(0);
    setNewItemBuyingPrice(1000);
    setNewItemSellingPrice(1500);
    setNewItemThreshold(10);
    setNewItemSupplierName("EABL Distribution");
    setNewItemSupplierEmail("orders@eabl.com");
    setNewItemDailyRate(2);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const actionName = adjustmentType === "restock" 
      ? "Restock Ingest" 
      : adjustmentType === "sold" 
        ? "Logged Sales" 
        : `Loss Entry (${adjustmentReason})`;
    
    updateStock(adjustingItem.id, adjustmentQty, actionName, adjustmentType);
    setRecentNotifications(prev => [
      `${adjustmentType === "restock" ? "Restocked" : adjustmentType === "sold" ? "Registered sales for" : "Logged loss for"} ${adjustingItem.brand || adjustingItem.name}: ${adjustmentQty} units`,
      ...prev
    ]);
    
    setAdjustingItem(null);
    setAdjustmentQty(1);
    setAdjustmentReason("Regular Stock Take");
  };

  const parseBulkText = (text: string) => {
    if (!text.trim()) {
      setParsedBulkItems([]);
      setBulkImportError(null);
      return;
    }

    try {
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        setBulkImportError("Please provide a CSV/TSV with at least a header line and one data row.");
        setParsedBulkItems([]);
        return;
      }

      const firstLine = lines[0];
      const isTab = firstLine.includes('\t');
      const separator = isTab ? '\t' : ',';

      const splitLine = (lineStr: string) => {
        if (isTab) {
          return lineStr.split('\t').map(field => field.replace(/^["']|["']$/g, '').trim());
        }
        const fields = [];
        let currentField = '';
        let insideQuotes = false;
        for (let i = 0; i < lineStr.length; i++) {
          const char = lineStr[i];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            fields.push(currentField.trim().replace(/^["']|["']$/g, ''));
            currentField = '';
          } else {
            currentField += char;
          }
        }
        fields.push(currentField.trim().replace(/^["']|["']$/g, ''));
        return fields;
      };

      const headers = splitLine(firstLine).map(h => h.toLowerCase());
      
      const bIndex = headers.findIndex(h => h.includes('brand') || h.includes('name') || h === 'product');
      const cIndex = headers.findIndex(h => h.includes('category') || h === 'type');
      const pIndex = headers.findIndex(h => h.includes('pack') || h.includes('size'));
      const oIndex = headers.findIndex(h => h.includes('opening') || h.includes('start') || h.includes('stock') || h.includes('qty') || h.includes('quantity'));
      const buyIndex = headers.findIndex(h => h.includes('buying') || h.includes('buy') || h === 'cost');
      const sellIndex = headers.findIndex(h => h.includes('selling') || h.includes('sell') || h.includes('retail') || h.includes('price'));
      const reorderIndex = headers.findIndex(h => h.includes('reorder') || h.includes('threshold') || h.includes('level'));
      const supIndex = headers.findIndex(h => h.includes('supplier') || h.includes('vendor'));
      const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('contact'));

      if (bIndex === -1) {
        setBulkImportError("Could not find a 'Brand' or 'Name' column in headers. Try 'Brand Name, Category, Pack Size, Opening Stock, Buying Price, Selling Price, Reorder Level, Supplier Name' format.");
        setParsedBulkItems([]);
        return;
      }

      const itemsTemp = [];
      for (let i = 1; i < lines.length; i++) {
        const fields = splitLine(lines[i]);
        if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;

        const brandName = fields[bIndex] || "";
        if (!brandName) continue;

        const category = cIndex !== -1 && fields[cIndex] ? fields[cIndex] : "Beer";
        const packSize = pIndex !== -1 && fields[pIndex] ? fields[pIndex] : "750ml Bottle";
        const opening = oIndex !== -1 ? (parseInt(fields[oIndex], 10) || 0) : 20;
        const buyPrice = buyIndex !== -1 ? (parseFloat(fields[buyIndex]) || 1000) : 1000;
        const sellPrice = sellIndex !== -1 ? (parseFloat(fields[sellIndex]) || 1500) : 1500;
        const reorder = reorderIndex !== -1 ? (parseInt(fields[reorderIndex], 10) || 10) : 10;
        const supplierName = supIndex !== -1 && fields[supIndex] ? fields[supIndex] : "EABL Distribution";
        const supplierEmail = emailIndex !== -1 && fields[emailIndex] ? fields[emailIndex] : "orders@eabl.com";

        const closingStock = opening;
        const profitValue = (sellPrice - buyPrice) * 0;
        const stockValue = closingStock * buyPrice;

        itemsTemp.push({
          id: Date.now() + i,
          brand: brandName,
          name: brandName,
          category,
          packSize,
          openingStock: opening,
          received: 0,
          sold: 0,
          variance: 0,
          closingStock,
          stock: closingStock,
          price: sellPrice,
          buyingPrice: buyPrice,
          sellingPrice: sellPrice,
          profit: profitValue,
          value: stockValue,
          reorderLevel: reorder,
          reorderThreshold: reorder,
          location: "Cold Room",
          dailyUsageRate: 2,
          status: closingStock <= 5 ? 'Critical' : (closingStock <= reorder ? 'Low' : 'Good'),
          supplier: {
            name: supplierName,
            email: supplierEmail
          },
          changeLog: [{
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            action: "Bulk Ingest",
            change: `+${closingStock}`
          }]
        });
      }

      if (itemsTemp.length === 0) {
        setBulkImportError("No valid rows were parsed. Make sure brand names are filled.");
        setParsedBulkItems([]);
      } else {
        setParsedBulkItems(itemsTemp);
        setBulkImportError(null);
      }
    } catch (err: any) {
      setBulkImportError("Failed to parse CSV/TSV data: " + err.message);
      setParsedBulkItems([]);
    }
  };

  const handleImportAction = () => {
    if (parsedBulkItems.length === 0) return;
    setInventory(prev => [...prev, ...parsedBulkItems]);
    setRecentNotifications(prev => [
      `Bulk imported ${parsedBulkItems.length} new liquor brands into inventory.`,
      ...prev
    ]);
    setIsBulkImporting(false);
    setBulkImportText("");
    setParsedBulkItems([]);
    setBulkImportError(null);
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkImportText(text);
      parseBulkText(text);
    };
    reader.readAsText(file);
  };

  const [isDraggingBulk, setIsDraggingBulk] = useState(false);
  const handleDragOverBulk = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBulk(true);
  };
  const handleDragLeaveBulk = () => {
    setIsDraggingBulk(false);
  };
  const handleDropBulk = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBulk(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setBulkImportText(text);
        parseBulkText(text);
      };
      reader.readAsText(file);
    }
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
    const term = searchQuery.toLowerCase();
    const brandName = (item.brand || item.name || "").toLowerCase();
    const matchesSearch = brandName.includes(term) || 
                          item.category.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesLocation = selectedLocation === "All" || item.location === selectedLocation;
    const matchesStatus = selectedStatus === "All" || 
                          (selectedStatus === "Low" && (item.stock <= (item.reorderLevel || 10) && item.stock > 5)) ||
                          (selectedStatus === "Critical" && item.stock <= 5) ||
                          (selectedStatus === "Good" && item.stock > (item.reorderLevel || 10));
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

  const lowStockItems = inventory.filter(item => item.stock <= (item.reorderLevel || 10));

  // Email simulation
  const handleDraftEmail = (item: any) => {
     setDraftEmailItem(item);
     const reorderQty = Math.max(20, (item.reorderLevel || item.reorderThreshold || 10) * 2);
     setEmailTo(item.supplier?.email || "orders@eabl.com");
     setEmailSubject(`REORDER REQUEST: ${item.brand || item.name} replenishment for Agai True Pub`);
     setEmailBody(
`Dear ${item.supplier?.name || "Supplier Team"},

Agai True Pub would like to request an automated replenishment order for:
- Product Brand: ${item.brand || item.name}
- Pack Size: ${item.packSize || "Bottle"}
- Current Stock Level: ${item.stock} (Reorder Level: ${item.reorderLevel || 10})
- Target Quantity: ${reorderQty} cases/bottles
- Wholesale Purchase Cost: KES ${(item.buyingPrice || 1000).toLocaleString()}

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
              const rLevel = item.reorderLevel || item.reorderThreshold || 10;
              return {
                 ...item,
                 changeLog: [
                    {
                       date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                       action: "Supplier Email Sent",
                       change: `Request ${Math.max(20, rLevel * 2)}`
                    },
                    ...(item.changeLog || [])
                  ]
              };
           }
           return item;
        }));

        setRecentNotifications(prev => [
          `Dispatched replenishment email to supplier for '${draftEmailItem.brand || draftEmailItem.name}'`,
          ...prev
        ]);

        setTimeout(() => {
           setDraftEmailItem(null);
        }, 1200);
     }, 1200);
  };

  const handleDownloadCSV = () => {
    const headers = ['Category', 'Brand Name', 'Pack Size', 'Opening Stock', 'Received', 'Sold', 'Closing Stock', 'Variance', 'Buying Price (KES)', 'Selling Price (KES)', 'Profit (KES)', 'Reorder Level', 'Supplier'];
    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(item => [
        `"${item.category}"`,
        `"${item.brand || item.name}"`,
        `"${item.packSize || "Bottle"}"`,
        item.openingStock || 0,
        item.received || 0,
        item.sold || 0,
        item.stock || 0,
        item.variance || 0,
        item.buyingPrice || 0,
        item.sellingPrice || 0,
        item.profit || 0,
        item.reorderLevel || 10,
        `"${item.supplier?.name || ""}"`
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

  // OCR Ingest Simulation Cabinet
  const [showOcrCabinet, setShowOcrCabinet] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "scanning" | "completed">("idle");
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [ocrResults, setOcrResults] = useState<any[]>([]);

  // Print Configuration Center State
  const [showPrintConfig, setShowPrintConfig] = useState(false);
  const [printLayout, setPrintLayout] = useState<"ledger" | "countsheet">("ledger");
  const [printHideFinancials, setPrintHideFinancials] = useState(false);
  const [printShowSignatureLines, setPrintShowSignatureLines] = useState(true);

  const sampleReceipts = [
    {
      id: 1,
      supplierName: "EABL Distribution",
      supplierEmail: "orders@eabl.com",
      imageLabel: "EABL Delivery Invoice #9042",
      items: [
        { brand: "Tusker Lager", category: "Beer", packSize: "500ml Bottle x 25 Case", receivedQty: 15, buyingPrice: 4000, sellingPrice: 6250 },
        { brand: "Captain Morgan", category: "Rum", packSize: "750ml Bottle", receivedQty: 6, buyingPrice: 1100, sellingPrice: 1650 }
      ]
    },
    {
      id: 2,
      supplierName: "KWAL Distribution",
      supplierEmail: "sales@kwal.co.ke",
      imageLabel: "KWAL Delivery Dispatch #590B",
      items: [
        { brand: "Gilbey's Gin", category: "Gin", packSize: "750ml Bottle", receivedQty: 10, buyingPrice: 900, sellingPrice: 1350 }
      ]
    }
  ];

  const handleSimulateOcr = (receiptId: number) => {
    setSelectedReceiptId(receiptId);
    setOcrStatus("scanning");
    const receipt = sampleReceipts.find(r => r.id === receiptId);
    setTimeout(() => {
      setOcrStatus("completed");
      if (receipt) {
        setOcrResults(receipt.items);
      }
    }, 2000);
  };

  const handleSaveOcrIngestion = () => {
    if (!selectedReceiptId) return;
    const receipt = sampleReceipts.find(r => r.id === selectedReceiptId);
    if (!receipt) return;

    setInventory(prev => {
      const updated = [...prev];
      receipt.items.forEach(ocrItem => {
        const index = updated.findIndex(existing => (existing.brand || existing.name || "").toLowerCase() === ocrItem.brand.toLowerCase());
        if (index !== -1) {
          const existing = updated[index];
          const newReceived = (existing.received || 0) + ocrItem.receivedQty;
          const newClosing = (existing.openingStock || 0) + newReceived - (existing.sold || 0) + (existing.variance || 0);
          const value = newClosing * ocrItem.buyingPrice;
          const profit = (ocrItem.sellingPrice - ocrItem.buyingPrice) * (existing.sold || 0);

          updated[index] = {
            ...existing,
            received: newReceived,
            buyingPrice: ocrItem.buyingPrice,
            sellingPrice: ocrItem.sellingPrice,
            price: ocrItem.sellingPrice,
            stock: newClosing,
            closingStock: newClosing,
            value,
            profit,
            status: newClosing <= 5 ? 'Critical' : (newClosing <= (existing.reorderLevel || 10) ? 'Low' : 'Good'),
            changeLog: [
              {
                date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                action: "OCR Photo Ingestion",
                change: `+${ocrItem.receivedQty} received`
              },
              ...(existing.changeLog || [])
            ]
          };
        } else {
          const newClosing = ocrItem.receivedQty;
          const value = newClosing * ocrItem.buyingPrice;
          const profit = 0;

          updated.push({
            id: Date.now() + Math.random(),
            brand: ocrItem.brand,
            name: ocrItem.brand,
            category: ocrItem.category,
            packSize: ocrItem.packSize,
            openingStock: 0,
            received: ocrItem.receivedQty,
            sold: 0,
            variance: 0,
            closingStock: newClosing,
            stock: newClosing,
            buyingPrice: ocrItem.buyingPrice,
            sellingPrice: ocrItem.sellingPrice,
            price: ocrItem.sellingPrice,
            profit,
            value,
            reorderLevel: 8,
            location: "Cold Room",
            dailyUsageRate: 3,
            status: 'Good',
            supplier: {
              name: receipt.supplierName,
              email: receipt.supplierEmail
            },
            changeLog: [{
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              action: "OCR Ingestion (New)",
              change: `+${ocrItem.receivedQty}`
            }]
          });
        }
      });
      return updated;
    });

    setRecentNotifications(prev => [
      `Securely ingested photo invoice from ${receipt.supplierName} via OCR text analysis!`,
      ...prev
    ]);

    setOcrStatus("idle");
    setSelectedReceiptId(null);
    setOcrResults([]);
    setShowOcrCabinet(false);
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
              <button 
                onClick={() => setShowPrintConfig(!showPrintConfig)} 
                className={cn(
                  "px-3.5 py-2 border rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm",
                  showPrintConfig
                    ? "bg-blue-500/20 border-blue-500 text-blue-400 font-bold"
                    : "border-gray-800 bg-[#0B0D11]/90 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                 <Printer className="w-4 h-4" />
                 <span>Print & Audit</span>
              </button>
              <button onClick={() => {
                 setPrintLayout("ledger");
                 setPrintHideFinancials(false);
                 setTimeout(() => window.print(), 100);
              }} className="px-3.5 py-2 border border-gray-800 bg-[#0B0D11]/90 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
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
                onClick={() => {
                  setShowOcrCabinet(!showOcrCabinet);
                }}
                className={cn(
                  "px-3.5 py-2 border rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                  showOcrCabinet 
                    ? "bg-amber-500/20 border-amber-500 text-amber-400 font-bold" 
                    : "border-gray-800 bg-[#0B0D11]/90 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                 <Camera className="w-4 h-4 text-amber-400 animate-pulse" />
                 <span>Photo OCR Intake</span>
              </button>
              <button 
                onClick={() => setIsBulkImporting(true)}
                className="px-3.5 py-2 border border-sky-500/25 bg-sky-500/10 text-sky-400 text-sm font-semibold rounded-lg hover:bg-sky-500/20 hover:border-sky-500/50 transition-all flex items-center gap-2"
              >
                 <Upload className="w-4 h-4" />
                 <span>Bulk Import</span>
              </button>
              <button 
                onClick={() => setIsAddingItem(true)}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.3)]"
              >
                 <Plus className="w-4 h-4" />
                 Add Brand
              </button>
           </div>
        </div>

        {/* COLLAPSIBLE PRINT CONFIG DESK */}
         {showPrintConfig && (
           <div className="bg-[#11141B] border border-blue-500/25 rounded-2xl p-6 shadow-[0_4px_30px_rgba(59,130,246,0.05)] print:hidden space-y-5 my-6 animate-in fade-in zoom-in-95 duration-200 text-left">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h3 className="text-md font-bold text-gray-200 flex items-center gap-2">
                   <Printer className="w-5 h-5 text-blue-400" />
                   Print Studio & Audit Sheet Generator
                 </h3>
                 <p className="text-xs text-gray-400 mt-0.5">
                   Configure physical report templates, hide sensitive inventory cost variables, and create custom count worksheets.
                 </p>
               </div>
               <button 
                 type="button"
                 onClick={() => setShowPrintConfig(false)} 
                 className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 rounded border border-gray-800 font-semibold transition-all"
               >
                 Close Studio
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-gray-800/85 pt-4">
               {/* Option 1: Layout Selection */}
               <div className="space-y-2">
                 <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold">
                   Report Template Layout
                 </label>
                 <div className="grid grid-cols-2 gap-2 font-sans">
                   <button
                     type="button"
                     onClick={() => setPrintLayout("ledger")}
                     className={cn(
                       "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center",
                       printLayout === "ledger"
                         ? "bg-blue-500/10 border-blue-500/80 text-blue-400 font-bold"
                         : "bg-[#181D26] border-gray-800 text-gray-400 hover:bg-gray-800"
                     )}
                   >
                     <span className="text-xs">Standard Ledger</span>
                     <span className="text-[9px] text-gray-500 font-normal mt-0.5 mt-auto">Full quantities & totals</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setPrintLayout("countsheet")}
                     className={cn(
                       "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center",
                       printLayout === "countsheet"
                         ? "bg-blue-500/10 border-blue-500/80 text-blue-400 font-bold"
                         : "bg-[#181D26] border-gray-800 text-gray-400 hover:bg-gray-800"
                     )}
                   >
                     <span className="text-xs">Physical Worksheet</span>
                     <span className="text-[9px] text-gray-500 font-normal mt-0.5 mt-auto">Clipboard blank count grid</span>
                   </button>
                 </div>
               </div>

               {/* Option 2: Financial Masking Toggle */}
               <div className="space-y-2">
                 <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold">
                   Confidential Financial Data
                 </label>
                 <button
                   type="button"
                   onClick={() => setPrintHideFinancials(!printHideFinancials)}
                   className={cn(
                     "w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                     printHideFinancials
                       ? "bg-blue-500/10 border-blue-500/80"
                       : "bg-[#181D26] border-gray-805"
                   )}
                 >
                   <div>
                     <span className="text-xs font-bold block text-gray-200">Hide Costs & Yield Profits</span>
                     <span className="text-[10px] text-gray-500 block mt-0.5">Prints custom staff-safe blank sheet</span>
                   </div>
                   <input
                     type="checkbox"
                     checked={printHideFinancials}
                     readOnly
                     className="accent-blue-500 w-4 h-4 cursor-pointer"
                   />
                 </button>
               </div>

               {/* Option 3: Legal Stamp / Signature Box */}
               <div className="space-y-2">
                 <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold">
                   Audit Certification Box
                 </label>
                 <button
                   type="button"
                   onClick={() => setPrintShowSignatureLines(!printShowSignatureLines)}
                   className={cn(
                     "w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                     printShowSignatureLines
                       ? "bg-blue-500/10 border-blue-500/80"
                       : "bg-[#181D26] border-gray-805"
                   )}
                 >
                   <div>
                     <span className="text-xs font-bold block text-gray-200">Manager Sign-off Lines</span>
                     <span className="text-[10px] text-gray-500 block mt-0.5">Appends witness log and verification</span>
                   </div>
                   <input
                     type="checkbox"
                     checked={printShowSignatureLines}
                     readOnly
                     className="accent-blue-500 w-4 h-4 cursor-pointer"
                   />
                 </button>
               </div>
             </div>

             <div className="bg-[#0B0D11]/85 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-800">
               <div className="text-xs text-gray-400">
                 <span className="font-semibold text-gray-200">Active Audit Focus:</span> Category: <span className="text-amber-500 font-semibold">{selectedCategory}</span> • Status Alert: <span className="text-amber-500 font-semibold">{selectedStatus}</span> {searchQuery && <span> • Search: <span className="text-amber-400 font-mono">"{searchQuery}"</span></span>}
               </div>
               <div className="flex gap-2 shrink-0">
                 <button
                   type="button"
                   onClick={() => {
                     setPrintLayout("ledger");
                     setPrintHideFinancials(false);
                     setPrintShowSignatureLines(true);
                   }}
                   className="px-3 py-1.5 border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800 text-xs font-semibold rounded-lg transition-colors"
                 >
                   Reset Defaults
                 </button>
                 <button
                   type="button"
                   onClick={() => window.print()}
                   className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-900/25 transition-all"
                 >
                   <Printer className="w-3.5 h-3.5" />
                   Generate Copy
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* COLLAPSIBLE OCR CABINET PANEL */}
        {showOcrCabinet && (
          <div className="bg-[#11141B] border border-amber-500/25 rounded-2xl p-6 shadow-[0_4px_30px_rgba(245,158,11,0.05)] print:hidden space-y-5 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-gray-200 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-500 animate-pulse" />
                  Wholesale Photo → OCR Ingestion Pipeline
                </h3>
                <p className="text-xs text-gray-400">
                  Select a wholesaler receipt snapshot to simulate real-time Optical Character Recognition pattern recognition.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowOcrCabinet(false);
                  setOcrStatus("idle");
                  setOcrResults([]);
                }} 
                className="p-1 px-2.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Receipt Samples Selection */}
              <div className="md:col-span-4 space-y-3">
                <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold font-semibold">
                  Step 1: SELECT PHYSICAL RECEIPT SNAPSHOT
                </label>
                <div className="space-y-2">
                  {sampleReceipts.map(receipt => (
                    <button
                      type="button"
                      key={receipt.id}
                      onClick={() => handleSimulateOcr(receipt.id)}
                      disabled={ocrStatus === "scanning"}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                        selectedReceiptId === receipt.id 
                          ? "bg-amber-500/[0.04] border-amber-500 text-amber-400" 
                          : "bg-[#181D26] border-gray-800 text-gray-300 hover:border-gray-750"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 font-bold shrink-0">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-gray-200 font-sans">{receipt.imageLabel}</p>
                        <p className="text-[10px] text-gray-500 font-mono truncate font-semibold">Supplier: {receipt.supplierName} • {receipt.items.length} items</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border border-dashed border-gray-800 p-4 rounded-xl text-center cursor-pointer hover:border-gray-750 transition" onClick={() => handleSimulateOcr(1)}>
                  <p className="text-xs text-gray-500 font-sans">Or Drag & Drop Custom Bottle Photo</p>
                  <span className="text-[10px] text-amber-500 font-semibold hover:underline mt-1 block font-sans">Simulate Custom Capture</span>
                </div>
              </div>

              {/* Live Scanning Screen simulation */}
              <div className="md:col-span-8 bg-gray-950/70 border border-gray-850 rounded-2xl p-5 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
                {/* Horizontal scanner beam laser line */}
                {ocrStatus === "scanning" && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_15px_#f59e0b] animate-bounce z-20" style={{ top: '30%' }}></div>
                )}

                {ocrStatus === "idle" && (
                  <div className="my-auto text-center space-y-2 text-gray-650">
                    <Camera className="w-12 h-12 text-gray-800 mx-auto" />
                    <p className="text-xs text-gray-400 font-sans">Scanner is standby. Choose an invoice receipt snapshot on the left to activate engine.</p>
                  </div>
                )}

                {ocrStatus === "scanning" && (
                  <div className="my-auto text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                    <div className="space-y-1">
                      <p className="text-xs text-amber-400 font-mono font-bold animate-pulse">EXTRACTING METRIC CODES...</p>
                      <p className="text-[10px] text-gray-500 font-mono">Recognizing Category, Brand name, Pack size, and Inbound wholesale quantities.</p>
                    </div>
                  </div>
                )}

                {ocrStatus === "completed" && (
                  <div className="space-y-4 text-left">
                     <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                       <span className="text-xs uppercase font-extrabold tracking-wider text-gray-500 font-bold font-sans">Step 2: CONFIRM OCR PARSER RESULTS</span>
                       <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">OCR Parsed 100% Success</span>
                     </div>

                     <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                       {ocrResults.map((ocrItem, i) => (
                         <div key={i} className="bg-[#12161E] border border-gray-850 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                           <div>
                             <p className="font-bold text-gray-200">{ocrItem.brand}</p>
                             <span className="text-[10px] text-gray-500 block uppercase font-bold">{ocrItem.category} • Size: {ocrItem.packSize}</span>
                           </div>
                           <div className="text-right flex items-center gap-4">
                             <div>
                               <p className="text-[10px] text-gray-550 uppercase">Received qty</p>
                               <strong className="text-emerald-400 text-sm">+{ocrItem.receivedQty}</strong>
                             </div>
                             <div>
                               <p className="text-[10px] text-gray-550 uppercase font-semibold">Cost Price</p>
                               <strong className="text-gray-300 font-medium">KES {ocrItem.buyingPrice.toLocaleString()}</strong>
                             </div>
                             <div>
                               <p className="text-[10px] text-gray-550 uppercase font-semibold">Est. Retail Price</p>
                               <strong className="text-amber-500 font-bold font-semibold">KES {ocrItem.sellingPrice.toLocaleString()}</strong>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>

                     <div className="flex justify-end gap-3 pt-3 border-t border-gray-900">
                       <button 
                         type="button"
                         onClick={() => { setOcrStatus("idle"); setOcrResults([]); }}
                         className="px-4 py-2 border border-gray-800 text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-800 font-sans"
                       >
                         Reset / Re-Scan
                       </button>
                       <button 
                         type="button"
                         onClick={handleSaveOcrIngestion}
                         className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md transition font-sans"
                       >
                         Approve & Ingest to Stock Ledger
                       </button>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

           {/* PRINT ONLY DOCUMENT HEADER */}
            <div className="hidden print:block mb-8 border-b-4 border-double border-black pb-5 text-black text-left">
               <div className="flex justify-between items-end">
                  <div>
                     <h1 className="text-3xl font-black uppercase tracking-tight text-black">Liquor Store Inventory Ledger</h1>
                     <p className="text-xs text-gray-700 uppercase tracking-widest font-bold mt-1">
                        Certified Audit Copy & Stock Stock Level count Worksheet
                     </p>
                     <div className="flex gap-4 mt-2.5 text-xs text-gray-800 font-mono">
                        <div>
                           <strong>Report Layout:</strong> {printLayout === "countsheet" ? "Physical Count Checklist (Confidential)" : "Comprehensive Stock Ledger"}
                        </div>
                        <div>
                           <strong>Active Filter Group:</strong> {selectedCategory === "All" ? "All Categories" : selectedCategory}
                        </div>
                     </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-gray-800 leading-tight">
                     <div><strong>Date Printed:</strong> {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                     <div><strong>Time Code:</strong> {new Date().toLocaleTimeString()}</div>
                     <div><strong>Registry Stamp:</strong> BAR-STK-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
                  </div>
               </div>
            </div>

            {/* MAIN TABLE */}
           <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-[#0B0D11] text-gray-500 text-xs uppercase tracking-wider font-semibold print:bg-gray-100 print:text-black print:border-b-2 print:border-black">
                    <tr className="bg-[#0D1017]">
                       <th className="px-5 py-4 w-[40px] text-center print:hidden">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length === filteredInventory.length && filteredInventory.length > 0}
                            onChange={() => toggleSelectAll(filteredInventory)}
                            className="accent-amber-500"
                          />
                       </th>
                       <th className="px-5 py-4 cursor-pointer hover:text-amber-500 transition-colors text-xs font-bold uppercase tracking-wider text-gray-500 print:text-black" onClick={() => handleSort("category")}>
                         Category
                       </th>
                       <th className="px-5 py-4 cursor-pointer hover:text-amber-500 transition-colors text-xs font-bold uppercase tracking-wider text-gray-400 print:text-black" onClick={() => handleSort("brand")}>
                         Brand / Product
                       </th>
                       <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                         Pack Size
                       </th>
                       <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">
                         Opening
                       </th>
                       <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#10B981] text-center bg-emerald-950/10 font-bold">
                         Received
                       </th>
                       <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#3B82F6] text-center bg-blue-950/10 font-bold">
                         Sold
                       </th>
                       <th className="px-5 py-4 cursor-pointer hover:text-amber-500 transition-colors text-xs font-bold uppercase tracking-wider text-amber-500 text-center print:text-black" onClick={() => handleSort("stock")}>
                         Closing Stock
                       </th>
                       <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-red-400 text-center">
                         Variance
                       </th>
                       <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                         <span className={cn(printHideFinancials && "print:hidden")}>Buying Cost</span>
                       </th>
                       <th className={cn("px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 print:text-black", printHideFinancials && "print:hidden")}>
                         Retail Price
                       </th>
                       <th className={cn("px-5 py-4 text-xs font-bold uppercase tracking-wider text-emerald-400 font-extrabold bg-emerald-950/20 print:bg-transparent print:text-black", printHideFinancials && "print:hidden")}>
                         Yield Profit
                       </th>
                       <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-orange-400 text-center">
                         Reorder Lv.
                       </th>
                       <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                         Supplier
                       </th>
                       <th className="px-5 py-4 text-right print:hidden text-xs font-bold uppercase tracking-wider text-gray-450">
                         Controls
                       </th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800 bg-[#15181E] print:bg-white print:divide-gray-300">
                    {filteredInventory.length === 0 ? (
                       <tr>
                          <td colSpan={15} className="px-6 py-12 text-center text-gray-500 bg-[#12141A]">
                             <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                             <p>No inventory items found matching the filter matrix.</p>
                             <button onClick={() => { setSelectedCategory("All"); setSelectedStatus("All"); setSearchQuery(""); }} className="text-amber-500 hover:underline text-xs mt-1 font-semibold">
                               Reset Filter Setup
                             </button>
                          </td>
                       </tr>
                    ) : (
                       filteredInventory.map((item) => {
                          const reorderLevel = item.reorderLevel || item.reorderThreshold || 10;
                          const hasAlert = item.stock <= reorderLevel;
                          const isCritical = item.stock <= 5;
                          const buyPrice = item.buyingPrice || 0;
                          const sellPrice = item.sellingPrice || item.price || 0;
                          const totalProfit = (sellPrice - buyPrice) * (item.sold || 0);

                          return (
                             <tr 
                               key={item.id} 
                               className={cn(
                                 "hover:bg-gray-850 bg-[#141821] border-b border-gray-800/80 transition-all duration-155 group print:text-black print:border-b print:border-gray-200 border-l-2",
                                 hasAlert 
                                   ? (isCritical ? "border-l-red-500/80 bg-red-500/[0.01]" : "border-l-amber-500/80 bg-amber-500/[0.01]") 
                                   : "border-l-transparent"
                               )}
                             >
                             <td className="px-5 py-4 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={selectedIds.includes(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="accent-amber-500"
                                />
                             </td>
                             <td className="px-5 py-4 text-gray-400 uppercase text-[10px] font-extrabold tracking-widest">{item.category}</td>
                             <td className="px-5 py-4 font-bold text-gray-100 print:text-black">
                                <div className="flex items-center gap-2">
                                  <span>{item.brand || item.name}</span>
                                  {hasAlert && (
                                     <span className={cn(
                                        "w-2 h-2 rounded-full animate-ping shrink-0",
                                        isCritical ? "bg-red-500" : "bg-orange-500"
                                     )}></span>
                                  )}
                                </div>
                             </td>
                             <td className="px-5 py-4 text-gray-400 text-xs font-mono">{item.packSize || "750ml Bottle"}</td>
                             <td className="px-4 py-4 text-center text-gray-400 font-mono text-xs">{item.openingStock || 0}</td>
                             <td className="px-4 py-4 text-center text-emerald-400 font-mono font-bold text-xs bg-emerald-500/[0.01]">
                               {item.received ? `+${item.received}` : "0"}
                             </td>
                             <td className="px-4 py-4 text-center text-blue-400 font-mono font-bold text-xs bg-blue-500/[0.01]">
                               {item.sold || 0}
                             </td>
                             <td className="px-5 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                   <span className={cn(
                                      "font-mono font-extrabold text-[14px]",
                                      hasAlert ? "text-orange-400" : "text-emerald-400",
                                       printLayout === "countsheet" && "print:hidden"
                                   )}>{item.stock}</span>
                                    {printLayout === "countsheet" && (
                                       <span className="hidden print:inline-block border border-black w-24 h-6 text-center text-black font-normal rounded font-sans text-xs bg-white">
                                          &nbsp;
                                       </span>
                                    )} 
                                   
                                   {hasAlert && (
                                      <span className={cn(
                                         "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border print:hidden",
                                         isCritical 
                                           ? "bg-red-500/15 text-red-300 border-red-500/15" 
                                           : "bg-amber-500/15 text-amber-400 border-amber-500/15"
                                      )}>
                                         {isCritical ? "Crit" : "Low"}
                                      </span>
                                   )}
                                </div>
                             </td>
                             <td className={cn(
                                "px-4 py-4 text-center font-mono text-xs font-bold",
                                (item.variance || 0) < 0 ? "text-red-400 bg-red-500/[0.02]" : "text-gray-500",
                                 printLayout === "countsheet" && "print:hidden"
                             )}>
                               {item.variance || 0}
                             </td>
                             <td className={cn("px-5 py-4 font-mono text-gray-400 text-xs text-left print:text-black", printHideFinancials && "print:hidden")}>
                                <span className="text-gray-650 mr-0.5">KES</span>
                                {buyPrice.toLocaleString()}
                             </td>
                             <td className={cn("px-5 py-4 font-mono text-gray-300 text-xs text-left print:text-black", printHideFinancials && "print:hidden")}>
                                <span className="text-gray-655 mr-0.5 font-medium">KES</span>
                                {sellPrice.toLocaleString()}
                             </td>
                             <td className={cn("px-5 py-4 font-mono font-bold text-emerald-400 text-[14px] bg-emerald-950/10 text-left print:text-black", printHideFinancials && "print:hidden")}>
                                <span className="text-emerald-500/50 text-[10px] mr-1">KES</span>
                                {totalProfit.toLocaleString()}
                             </td>
                             <td className="px-4 py-4 text-center text-orange-400 font-mono text-xs font-semibold">{reorderLevel}</td>
                             <td className="px-5 py-4 text-xs font-medium">
                                <div className="flex flex-col">
                                   <span className="text-gray-300 font-semibold">{item.supplier?.name || "EABL"}</span>
                                   <span className="text-gray-600 text-[10px] font-mono">{item.supplier?.email || "orders@eabl.com"}</span>
                                </div>
                             </td>
                             
                             {/* Action buttons */}
                             <td className="px-5 py-4 text-right font-medium flex items-center justify-end gap-2 print:hidden">
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
                                  className="p-1 px-2 text-[10px] uppercase font-mono font-extrabold tracking-widest text-[#10B981] border border-emerald-500/20 rounded-md bg-emerald-500/[0.02] hover:bg-emerald-500/10 transition-colors"
                                  title="Record Supplier Delivery Volume"
                                >
                                  Restock
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setAdjustingItem(item);
                                    setAdjustmentType("sold");
                                  }}
                                  className="p-1 px-2 text-[10px] uppercase font-mono font-extrabold tracking-widest text-[#3B82F6] border border-blue-500/20 rounded-md bg-blue-500/[0.02] hover:bg-blue-500/10 transition-colors"
                                  title="Record Daily Waiter Checkout Sales"
                                >
                                  Sales
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setAdjustingItem(item);
                                    setAdjustmentType("loss");
                                  }}
                                  className="p-1 px-2 text-[10px] uppercase font-mono font-extrabold tracking-widest text-red-400 border border-red-500/15 hover:border-red-400 rounded-md bg-red-500/[0.02] hover:bg-red-500/15 transition-colors"
                                  title="Log Variance Spillage/Loss"
                                >
                                  Loss
                                </button>
                             </td>
                          </tr>
                          );
                       })
                    )}
                 </tbody>
              </table>
           </div>
        </Card>

                    {/* PRINT ONLY SIGNATURE BLOCK */}
            {printShowSignatureLines && (
               <div className="hidden print:block mt-12 border-t border-gray-400 pt-8 text-black text-left">
                  <div className="grid grid-cols-2 gap-12 font-sans">
                     <div className="space-y-6 font-sans">
                        <p className="text-xs uppercase tracking-wider font-bold text-gray-700">Audit Verification Sign-off</p>
                        <div className="space-y-4 font-mono text-[11px] text-gray-800">
                           <div className="flex items-end gap-2">
                              <span>Primary Manager Name:</span>
                              <div className="border-b border-zinc-500 flex-1 h-[14px]"></div>
                           </div>
                           <div className="flex items-end gap-2">
                              <span>Authorized Signature:</span>
                              <div className="border-b border-zinc-500 flex-1 h-[14px]"></div>
                           </div>
                           <div className="flex items-end gap-2">
                              <span>Audit Completion Date:</span>
                              <div className="border-b border-zinc-500 flex-1 h-[14px]">..................................................</div>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-6 font-sans">
                        <p className="text-xs uppercase tracking-wider font-bold text-gray-700">Witness Log Certification</p>
                        <div className="space-y-4 font-mono text-[11px] text-gray-800">
                           <div className="flex items-end gap-2">
                              <span>Neutral Staff Witness Name:</span>
                              <div className="border-b border-zinc-500 flex-1 h-[14px]"></div>
                           </div>
                           <div className="flex items-end gap-2">
                              <span>Witness Signature:</span>
                              <div className="border-b border-zinc-500 flex-1 h-[14px]"></div>
                           </div>
                           <div className="flex items-end gap-2 mt-4 text-left">
                              <span className="text-[10px] text-gray-600 leading-snug">
                                 * We hereby certify that the physical stock counts tabulated herein conform to the real values present in our facility lockers and shelves.
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-155">
             <Card className="w-full max-w-md bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-2xl">
                 <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        "w-5 h-5", 
                        adjustmentType === "restock" ? "text-emerald-500" : adjustmentType === "sold" ? "text-blue-500" : "text-red-500"
                      )} />
                      <h3 className="text-md font-semibold text-gray-200">
                        {adjustmentType === "restock" 
                          ? `Restock: ${adjustingItem.brand || adjustingItem.name}` 
                          : adjustmentType === "sold"
                            ? `Log Sales Volume: ${adjustingItem.brand || adjustingItem.name}`
                            : `Log Variance Deficit: ${adjustingItem.brand || adjustingItem.name}`
                        }
                      </h3>
                    </div>
                    <button onClick={() => setAdjustingItem(null)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <form onSubmit={handleApplyAdjustment} className="p-6 space-y-4 text-left">
                     <div className="bg-[#0B0D11] p-3.5 rounded-lg border border-gray-800/80 flex justify-between items-center">
                       <div>
                         <span className="text-xs text-gray-500 block">Current Stock</span>
                         <span className="text-xl font-bold font-mono text-gray-200">{adjustingItem.stock} <span className="text-xs text-gray-500 uppercase">{adjustingItem.unit || "Btl"}s</span></span>
                       </div>
                       <div className="text-right">
                         <span className="text-xs text-gray-500 block">Pack Size</span>
                         <span className="text-sm font-semibold font-mono text-gray-400">{adjustingItem.packSize || "750ml Bottle"}</span>
                       </div>
                     </div>

                     <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                          {adjustmentType === "restock" 
                            ? "Wholesale Received Quantity" 
                            : adjustmentType === "sold"
                              ? "Daily Units Sold"
                              : "Loss Deficit Quantity"
                          }
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
                            className="w-full bg-[#0B0D11] border border-gray-805 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
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
                          className="px-4 py-2 border border-gray-805 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                           Cancel
                        </button>
                        <button 
                          type="submit"
                          className={cn(
                            "px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md",
                            adjustmentType === "restock" 
                              ? "bg-emerald-600 hover:bg-emerald-500" 
                              : adjustmentType === "sold"
                                ? "bg-blue-600 hover:bg-blue-500"
                                : "bg-red-600 hover:bg-red-500"
                          )}
                        >
                           Confirm {
                             adjustmentType === "restock" 
                               ? "Restock" 
                               : adjustmentType === "sold"
                                 ? "Sales Ingest"
                                 : "Deduction"
                           }
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
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Opening Stock Level</label>
                           <input 
                             type="number"
                             required
                             min={0}
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemOpeningStock}
                             onChange={(e) => setNewItemOpeningStock(Math.max(0, parseInt(e.target.value) || 0))}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Pack Size / Dimension</label>
                           <input 
                             type="text"
                             required
                             placeholder="e.g. 750ml Bottle"
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                             value={newItemPackSize}
                             onChange={(e) => setNewItemPackSize(e.target.value)}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Buying Price (KES)</label>
                           <input 
                             type="number"
                             required
                             min={1}
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemBuyingPrice}
                             onChange={(e) => setNewItemBuyingPrice(Math.max(1, parseInt(e.target.value) || 1))}
                           />
                        </div>

                        <div>
                           <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Retail Price (KES Selling Price)</label>
                           <input 
                             type="number"
                             required
                             min={1}
                             className="w-full bg-[#0B0D11] border border-gray-800 focus:border-amber-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                             value={newItemSellingPrice}
                             onChange={(e) => setNewItemSellingPrice(Math.max(1, parseInt(e.target.value) || 1))}
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

        {/* MODAL: BULK IMPORT LIQUORS */}
        {isBulkImporting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
             <Card className="w-full max-w-2xl bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-2xl">
                 <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                    <div className="flex items-center gap-2">
                       <Upload className="w-5 h-5 text-sky-400" />
                       <h3 className="text-md font-semibold text-gray-200 font-sans">Bulk Import Liquors (CSV / Excel Format)</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setIsBulkImporting(false);
                        setBulkImportText("");
                        setBulkImportError(null);
                        setParsedBulkItems([]);
                      }} 
                      className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    >
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <div className="p-6 space-y-5 max-h-[600px] overflow-y-auto text-left">
                     {/* Template Guide */}
                     <div className="bg-sky-950/10 border border-sky-500/15 rounded-xl p-4 space-y-2 text-xs">
                        <h4 className="font-bold text-sky-400 flex items-center gap-1.5 font-sans">
                           <Info className="w-4 h-4 text-sky-450" /> Recommended Column Format Guide
                        </h4>
                        <p className="text-gray-400 font-sans">
                           Copy-paste tab-separated columns from Excel, or select a comma-separated CSV file. The first row must be the headers:
                        </p>
                        <div className="bg-[#0B0D11] p-2.5 rounded-lg font-mono text-[10.5px] text-gray-300 overflow-x-auto select-all">
                           Brand Name, Category, Pack Size, Opening Stock, Buying Cost, Retail Price, Reorder Level, Supplier Name
                        </div>
                        <p className="text-gray-500 italic font-sans text-[10.5px]">
                           * Brand Name or Name is required. Categorised items template: Beer, Whisky, Gin, Rum, Vodka, Tequila, Wine, Mixer.
                        </p>
                     </div>

                     {/* Upload Drag & Drop Area */}
                     <div 
                       onDragOver={handleDragOverBulk}
                       onDragLeave={handleDragLeaveBulk}
                       onDrop={handleDropBulk}
                       className={cn(
                         "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                         isDraggingBulk 
                           ? "border-sky-500 bg-sky-950/20 animate-pulse" 
                           : "border-gray-800 hover:border-gray-700 bg-[#0B0D11]/40"
                       )}
                       onClick={() => document.getElementById("bulk-file-input")?.click()}
                     >
                        <input 
                          type="file"
                          id="bulk-file-input"
                          accept=".csv,.tsv,.txt"
                          onChange={handleBulkFileUpload}
                          className="hidden"
                        />
                        <Upload className="w-8 h-8 text-sky-400/85 mx-auto mb-2" />
                        <span className="text-xs font-semibold text-gray-300 block font-sans">
                           Drag & drop your CSV / TSV file here or <span className="text-sky-400 hover:underline">browse files</span>
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-1 font-mono">Supports .csv, .tsv, and .txt files</span>
                     </div>

                     {/* Paste Area */}
                     <div className="space-y-1.5">
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold font-sans">Or paste spreadsheet rows below:</label>
                        <textarea 
                          rows={4}
                          value={bulkImportText}
                          onChange={(e) => {
                            setBulkImportText(e.target.value);
                            parseBulkText(e.target.value);
                          }}
                          placeholder="Brand Name, Category, Pack Size, Opening Stock, Buying Cost, Retail Price, Reorder Level&#10;Jameson Irish, Whisky, 750ml, 30, 2300, 3500, 10"
                          className="w-full bg-[#0B0D11] border border-gray-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 outline-none rounded-lg p-3 text-xs text-gray-200 font-mono"
                        />
                     </div>

                     {/* Error Alert */}
                     {bulkImportError && (
                        <div className="bg-red-950/20 border border-red-500/20 text-red-500 p-3.5 rounded-lg text-xs flex items-center gap-2.5 font-sans">
                           <AlertTriangle className="w-4 h-4 shrink-0" />
                           <span className="font-sans font-medium">{bulkImportError}</span>
                        </div>
                     )}

                     {/* Preview Of Parsed Items */}
                     {parsedBulkItems.length > 0 && (
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1 font-sans">
                                 <Check className="w-4 h-4 text-sky-450" /> Parsed Results Preview ({parsedBulkItems.length} liquors)
                              </h4>
                              <button 
                                onClick={() => {
                                  setBulkImportText("");
                                  setParsedBulkItems([]);
                                  setBulkImportError(null);
                                }}
                                className="text-[10px] text-red-400 hover:underline cursor-pointer"
                              >
                                Reset import data
                              </button>
                           </div>

                           <div className="border border-gray-800 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                              <table className="w-full text-[11px] text-left">
                                 <thead className="bg-[#1A1E25] text-gray-400 uppercase font-semibold">
                                    <tr>
                                       <th className="px-3 py-2">Brand / Name</th>
                                       <th className="px-3 py-2">Category</th>
                                       <th className="px-3 py-2">Size</th>
                                       <th className="px-3 py-2 text-right">Stock</th>
                                       <th className="px-3 py-2 text-right">Cost</th>
                                       <th className="px-3 py-2 text-right">Retail</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-850 bg-[#0B0D11]/35">
                                    {parsedBulkItems.map((item, idx) => (
                                       <tr key={idx} className="text-gray-300 hover:bg-gray-800/30 transition-colors">
                                          <td className="px-3 py-1.5 font-medium text-gray-100 font-sans">{item.brand}</td>
                                          <td className="px-3 py-1.5 font-sans">{item.category}</td>
                                          <td className="px-3 py-1.5 font-mono">{item.packSize}</td>
                                          <td className="px-3 py-1.5 text-right font-mono text-gray-400">{item.openingStock}</td>
                                          <td className="px-3 py-1.5 text-right font-mono text-gray-400">KES {item.buyingPrice.toLocaleString()}</td>
                                          <td className="px-3 py-1.5 text-right font-mono text-emerald-400 font-bold">KES {item.sellingPrice.toLocaleString()}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     )}
                 </div>

                 <div className="p-4 border-t border-gray-800 pt-5 flex justify-end gap-3 bg-[#0B0D11]/20">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsBulkImporting(false);
                        setBulkImportText("");
                        setBulkImportError(null);
                        setParsedBulkItems([]);
                      }} 
                      className="px-4 py-2 border border-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                       Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={parsedBulkItems.length === 0}
                      onClick={handleImportAction}
                      className={cn(
                        "px-5 py-2 font-bold text-sm rounded-lg transition-all shadow-md flex items-center gap-2",
                        parsedBulkItems.length > 0 
                          ? "bg-sky-600 hover:bg-sky-500 text-white cursor-pointer" 
                          : "bg-gray-800 text-gray-650 cursor-not-allowed"
                      )}
                    >
                       <CheckCircle2 className="w-4 h-4" />
                       Confirm Bulk Import ({parsedBulkItems.length})
                    </button>
                 </div>
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
