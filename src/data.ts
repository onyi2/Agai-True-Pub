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
  { id: 1, name: "Johnnie Walker Black", category: "Whisky", stock: 45, unit: "Bottle", price: 4500, value: 202500, status: "Good", dailyUsageRate: 1.5, location: "Shelf A1", supplier: { name: "EABL Distribution", email: "orders@eabl.com" }, changeLog: [{ date: "2026-06-18 10:00", action: "Restock", change: "+5" }], reorderThreshold: 10 },
  { id: 2, name: "Tusker Lager", category: "Beer", stock: 12, unit: "Bottle", price: 250, value: 3000, status: "Low", dailyUsageRate: 4, location: "Cold Room", supplier: { name: "EABL Distribution", email: "orders@eabl.com" }, changeLog: [{ date: "2026-06-19 14:00", action: "Sale", change: "-2" }], reorderThreshold: 15 },
  { id: 3, name: "Gilbey's Gin", category: "Gin", stock: 24, unit: "Bottle", price: 1200, value: 28800, status: "Good", dailyUsageRate: 2, location: "Shelf A2", supplier: { name: "KWAL", email: "sales@kwal.co.ke" }, changeLog: [{ date: "2026-06-17 09:00", action: "Restock", change: "+12" }], reorderThreshold: 10 },
  { id: 4, name: "Captain Morgan", category: "Rum", stock: 5, unit: "Bottle", price: 1500, value: 7500, status: "Critical", dailyUsageRate: 3, location: "Bar Counter", supplier: { name: "EABL Distribution", email: "orders@eabl.com" }, changeLog: [{ date: "2026-06-19 22:00", action: "Sale", change: "-1" }], reorderThreshold: 8 },
  { id: 5, name: "Coca Cola", category: "Mixer", stock: 120, unit: "Bottle", price: 100, value: 12000, status: "Good", dailyUsageRate: 20, location: "Cold Room", supplier: { name: "Coca-Cola Bottlers", email: "supply@coca-cola.co.ke" }, changeLog: [{ date: "2026-06-20 08:00", action: "Restock", change: "+24" }], reorderThreshold: 50 },
  { id: 6, name: "Heineken", category: "Beer", stock: 8, unit: "Bottle", price: 300, value: 2400, status: "Low", dailyUsageRate: 5, location: "Cold Room", supplier: { name: "Maxam Ltd", email: "orders@maxam.co.ke" }, changeLog: [{ date: "2026-06-19 18:00", action: "Sale", change: "-3" }], reorderThreshold: 10 },
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
