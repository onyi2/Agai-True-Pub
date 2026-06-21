export const dashboardMetrics = [
  { title: "Total Revenue", value: "KES 24,780", trend: "+18.5% vs yesterday", isPositive: true },
  { title: "Net Profit", value: "KES 12,650", trend: "+16.3% vs yesterday", isPositive: true },
  { title: "Expenses", value: "KES 6,230", trend: "-4.2% vs yesterday", isPositive: false },
  { title: "Stock Value", value: "KES 158,900", trend: "+7.3% vs yesterday", isPositive: true },
];

export const salesData = [
  { day: "1", sales: 20000 },
  { day: "5", sales: 25000 },
  { day: "10", sales: 21000 },
  { day: "15", sales: 30000 },
  { day: "20", sales: 28000 },
  { day: "25", sales: 35000 },
  { day: "30", sales: 32000 },
];

export const topProducts = [
  { name: "Johnnie Walker Black", sales: 230, max: 250 },
  { name: "Tusker Lager", sales: 180, max: 250 },
  { name: "Gilbey's Gin", sales: 120, max: 250 },
  { name: "Captain Morgan", sales: 90, max: 250 },
  { name: "Coca Cola", sales: 80, max: 250 },
];

export const expensesData = [
  { name: 'Salaries', value: 4000, color: '#00D4A5' },
  { name: 'Rent', value: 2000, color: '#FFB84C' },
  { name: 'Utilities', value: 1500, color: '#FF5B5B' },
  { name: 'Transport', value: 1000, color: '#3B82F6' },
  { name: 'Others', value: 1500, color: '#8b5cf6' },
];

export const inventoryList = [
  { 
    id: 1, 
    brand: "Johnnie Walker Black", 
    name: "Johnnie Walker Black", 
    category: "Whisky", 
    packSize: "750ml Bottle",
    openingStock: 40,
    received: 15,
    sold: 9,
    variance: -1, // breakage
    buyingPrice: 3200, 
    sellingPrice: 4500, 
    reorderLevel: 12,
    location: "Shelf A1", 
    dailyUsageRate: 1.5,
    supplier: { name: "EABL Distribution", email: "orders@eabl.com" }, 
    changeLog: [{ date: "2026-06-18 10:00", action: "Stock Count", change: "System Initialized" }]
  },
  { 
    id: 2, 
    brand: "Tusker Lager", 
    name: "Tusker Lager", 
    category: "Beer", 
    packSize: "500ml Bottle x 25 Case",
    openingStock: 10,
    received: 8,
    sold: 14,
    variance: 0,
    buyingPrice: 4000, 
    sellingPrice: 6250, 
    reorderLevel: 8,
    location: "Cold Room", 
    dailyUsageRate: 4,
    supplier: { name: "EABL Distribution", email: "orders@eabl.com" }, 
    changeLog: [{ date: "2026-06-19 14:00", action: "Audit Ingestion", change: "System Initialized" }]
  },
  { 
    id: 3, 
    brand: "Gilbey's Gin", 
    name: "Gilbey's Gin", 
    category: "Gin", 
    packSize: "750ml Bottle",
    openingStock: 20,
    received: 12,
    sold: 8,
    variance: 0,
    buyingPrice: 900, 
    sellingPrice: 1350, 
    reorderLevel: 10,
    location: "Shelf A2", 
    dailyUsageRate: 2,
    supplier: { name: "KWAL", email: "sales@kwal.co.ke" }, 
    changeLog: [{ date: "2026-06-17 09:00", action: "Audit Ingestion", change: "System Initialized" }]
  },
  { 
    id: 4, 
    brand: "Captain Morgan", 
    name: "Captain Morgan", 
    category: "Rum", 
    packSize: "750ml Bottle",
    openingStock: 8,
    received: 5,
    sold: 10,
    variance: -1, // spill
    buyingPrice: 1100, 
    sellingPrice: 1650, 
    reorderLevel: 6,
    location: "Bar Counter", 
    dailyUsageRate: 3,
    supplier: { name: "EABL Distribution", email: "orders@eabl.com" }, 
    changeLog: [{ date: "2026-06-19 22:00", action: "Loss Log", change: "System Initialized" }]
  },
  { 
    id: 5, 
    brand: "Coca Cola", 
    name: "Coca Cola", 
    category: "Mixer", 
    packSize: "300ml Glass x 24 Case",
    openingStock: 100,
    received: 48,
    sold: 72,
    variance: -2, // client dropped
    buyingPrice: 1200, 
    sellingPrice: 1800, 
    reorderLevel: 40,
    location: "Cold Room", 
    dailyUsageRate: 20,
    supplier: { name: "Coca-Cola Bottlers", email: "supply@coca-cola.co.ke" }, 
    changeLog: [{ date: "2026-06-20 08:00", action: "Audit Ingestion", change: "System Initialized" }]
  },
  { 
    id: 6, 
    brand: "Heineken", 
    name: "Heineken", 
    category: "Beer", 
    packSize: "330ml Can x 24 Case",
    openingStock: 12,
    received: 0,
    sold: 8,
    variance: 0,
    buyingPrice: 4200, 
    sellingPrice: 6500, 
    reorderLevel: 5,
    location: "Cold Room", 
    dailyUsageRate: 5,
    supplier: { name: "Maxam Ltd", email: "orders@maxam.co.ke" }, 
    changeLog: [{ date: "2026-06-19 18:00", action: "Audit Ingestion", change: "System Initialized" }]
  },
];

export const inventoryUsageData = [
  { day: "1", usage: 120 },
  { day: "5", usage: 150 },
  { day: "10", usage: 110 },
  { day: "15", usage: 180 },
  { day: "20", usage: 160 },
  { day: "25", usage: 200 },
  { day: "30", usage: 190 },
];

export const staffSchedule = [
  { id: 1, name: "David M.", role: "Bartender", hourlyRate: 500, shifts: { Mon: "18:00 - 02:00", Tue: "Off", Wed: "18:00 - 02:00, 20:00 - 04:00", Thu: "18:00 - 02:00", Fri: "19:00 - 04:00", Sat: "19:00 - 04:00", Sun: "Off" } },
  { id: 2, name: "Sarah K.", role: "Waitress", hourlyRate: 450, shifts: { Mon: "16:00 - 00:00", Tue: "16:00 - 00:00", Wed: "Off", Thu: "16:00 - 00:00", Fri: "18:00 - 04:00", Sat: "18:00 - 04:00", Sun: "14:00 - 22:00" } },
  { id: 3, name: "James W.", role: "Manager", hourlyRate: 800, shifts: { Mon: "14:00 - 22:00", Tue: "14:00 - 22:00", Wed: "14:00 - 22:00", Thu: "14:00 - 22:00", Fri: "16:00 - 02:00", Sat: "16:00 - 02:00", Sun: "Off" } },
  { id: 4, name: "Peter N.", role: "Bouncer", hourlyRate: 400, shifts: { Mon: "Off", Tue: "Off", Wed: "20:00 - 04:00", Thu: "20:00 - 04:00", Fri: "20:00 - 06:00", Sat: "20:00 - 06:00", Sun: "18:00 - 02:00" } },
];
