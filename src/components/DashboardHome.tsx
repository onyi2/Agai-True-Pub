import React, { useState, useEffect } from "react";
import { Card } from "./ui/Card";
import { dashboardMetrics, salesData, topProducts, expensesData as initialExpenses, inventoryUsageData, staffSchedule } from "../data";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, X, Bell, AlertTriangle, Plus, FileSpreadsheet, Percent, Landmark } from "lucide-react";
import { cn } from "../lib/utils";
import { QuickTasks } from "./QuickTasks";
import { MiniCalendar } from "./MiniCalendar";

type Toast = {
  id: string;
  message: string;
  type: 'info' | 'warning';
};

const checkOverlap = (shiftStr: string) => {
  if (shiftStr === 'Off' || !shiftStr) return false;
  const shifts = shiftStr.split(',').map(s => s.trim());
  if (shifts.length <= 1) return false;

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const ranges = shifts.map(shift => {
    const [startStr, endStr] = shift.split(' - ');
    if (!startStr || !endStr) return { start: 0, end: 0 };
    let start = parseTime(startStr.trim());
    let end = parseTime(endStr.trim());
    if (end <= start) end += 24 * 60; // Next day
    return { start, end };
  });

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (Math.max(ranges[i].start, ranges[j].start) < Math.min(ranges[i].end, ranges[j].end)) {
        return true;
      }
    }
  }
  return false;
};

type DashboardHomeProps = {
  setCurrentView?: (view: 'dashboard' | 'inventory' | 'scheduling') => void;
};

export function DashboardHome({ setCurrentView }: DashboardHomeProps = {}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Licensing");

  const addToast = (message: string, type: 'info' | 'warning' = 'info') => {
    const newToast = { id: Date.now().toString() + Math.random().toString(), message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  useEffect(() => {
    let hasConflict = false;
    staffSchedule.forEach(staff => {
      Object.entries(staff.shifts).forEach(([day, shift]) => {
        if (checkOverlap(shift)) {
          hasConflict = true;
          addToast(`Shift conflict detected for ${staff.name} on ${day}`, 'warning');
        }
      });
    });
  }, []);

  const handleAddCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(amountNum) || amountNum <= 0) {
      addToast("Please enter a valid name and amount", "warning");
      return;
    }

    setExpenses(prev => {
      const exists = prev.find(item => item.name.toLowerCase() === expenseCategory.toLowerCase());
      if (exists) {
        return prev.map(item => 
          item.name.toLowerCase() === expenseCategory.toLowerCase()
            ? { ...item, value: item.value + amountNum }
            : item
        );
      } else {
        // Fallback to stock costs
        return prev.map(item => 
          item.name === "Stock Costs" 
            ? { ...item, value: item.value + amountNum }
            : item
        );
      }
    });

    addToast(`Logged custom expense: ${expenseName} (${expenseCategory}) - KES ${amountNum.toLocaleString()}`, "info");
    setExpenseName("");
    setExpenseAmount("");
    setIsAddingExpense(false);
  };

  const handleDownloadQuickReport = () => {
    // Generate a simple report for the owner
    const csvContent = [
      ["AGAI TRUE PUB - REALTIME BUSINESS INTELLIGENCE METRICS"],
      [],
      ["Metric", "Value", "Trend"],
      ["Net Sales (Month)", "KES 2,481,200", "+12.4%"],
      ["Registered Ingress", "KES 840,400", "+8.2%"],
      ["Breakages & Loss Rate", "KES 41,200", "-4.1%"],
      ["Operational Expenses", "KES 724,100", "+3.5%"],
      [],
      ["EXPENSES BREAKDOWN"],
      ...expenses.map(e => [e.name, `KES ${e.value.toLocaleString()}`]),
      [],
      ["TOP PRODUCTS BY VOLUME"],
      ...topProducts.map(p => [p.name, p.sales])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `agai_pub_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    addToast("Real-time Business Intelligence Report Exported!", "info");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
       {/* Toast Container */}
       <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {toasts.map(toast => (
             <div key={toast.id} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border w-80 animate-in slide-in-from-bottom-5 fade-in duration-300",
                toast.type === 'warning' ? "bg-red-900/90 border-red-500/50 text-white" : "bg-[#1A1E25] border-gray-700 text-gray-200"
             )}>
                {toast.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" /> : <Bell className="w-5 h-5 text-amber-500 shrink-0" />}
                <p className="text-sm font-medium flex-1">{toast.message}</p>
                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                   <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                </button>
             </div>
          ))}
       </div>

       {/* Metrics Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardMetrics.map((metric, idx) => (
             <Card key={idx} className="relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                   <TrendingUp className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">{metric.title}</h3>
                <p className="text-3xl font-bold text-gray-200 mb-4">{metric.value}</p>
                <div className={cn(
                   "flex items-center text-xs font-semibold px-2 py-1 rounded-full w-fit",
                   metric.isPositive ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-500"
                )}>
                   {metric.isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                   {metric.trend}
                </div>
             </Card>
          ))}
       </div>

       {/* Charts Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 flex flex-col">
             <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="font-semibold text-lg text-gray-200">Sales Trend</h3>
                   <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">This Month</p>
                </div>
             </div>
             <div className="flex-1 min-h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${val/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#15181E', borderColor: '#1F2937', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#10B981', fontWeight: 600 }}
                        labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                        cursor={{ stroke: '#1F2937', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#10B981" 
                        strokeWidth={3} 
                        dot={{ r: 0 }} 
                        activeDot={{ r: 6, fill: '#0B0D11', stroke: '#10B981', strokeWidth: 2 }} 
                      />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </Card>

          <Card className="flex flex-col">
             <div className="mb-6">
                <h3 className="font-semibold text-lg text-gray-200">Top Selling</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">By Volume</p>
             </div>
             <div className="space-y-6 flex-1 justify-center flex flex-col">
                {topProducts.map((product, idx) => (
                   <div key={idx} className="group cursor-default">
                      <div className="flex justify-between text-sm mb-2">
                         <span className="text-gray-400 group-hover:text-gray-200 transition-colors">{product.name}</span>
                         <span className="font-mono text-amber-500 font-medium">{product.sales}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0B0D11] rounded-full overflow-hidden border border-gray-800">
                         <div 
                           className="h-full bg-amber-500 rounded-full" 
                           style={{ width: `${(product.sales / product.max) * 100}%` }}
                         />
                      </div>
                   </div>
                ))}
             </div>
          </Card>
       </div>

       {/* Secondary Charts / Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col xl:flex-row items-center justify-between gap-6 lg:col-span-1">
             <div className="w-full xl:w-1/2">
                <h3 className="font-semibold text-lg mb-1 text-gray-200">Expenses Breakdown</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-6">This Month</p>
                <ul className="space-y-3 text-sm">
                   {expenses.map((exp, i) => (
                      <li key={i} className="flex items-center gap-3">
                         <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: exp.color, boxShadow: `0 0 8px ${exp.color}40` }}></span>
                         <span className="text-gray-400">{exp.name}</span>
                         <span className="ml-auto font-mono text-gray-500">{((exp.value / 10000)*100).toFixed(0)}%</span>
                      </li>
                   ))}
                </ul>
             </div>
             <div className="min-h-[160px] w-full xl:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={expenses}
                         innerRadius={65}
                         outerRadius={90}
                         paddingAngle={3}
                         dataKey="value"
                         stroke="none"
                      >
                         {expenses.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#15181E', borderColor: '#1F2937', borderRadius: '12px' }}
                        itemStyle={{ color: '#E5E7EB', fontSize: '14px', fontWeight: 500 }}
                      />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </Card>

          <Card className="flex flex-col">
             <div className="mb-6">
                <h3 className="font-semibold text-lg text-gray-200">Process Shortcuts</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Quick Actions</p>
             </div>
             <div className="grid grid-cols-2 gap-4 flex-1">
                <button 
                  onClick={() => setCurrentView?.('inventory')}
                  className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11]/90 hover:border-emerald-500 hover:bg-emerald-900/10 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-98 cursor-pointer transition-all text-left group flex flex-col justify-center relative overflow-hidden"
                >
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors animate-pulse"></div>
                   <div className="text-emerald-500 mb-2 font-medium text-sm flex items-center gap-1.5">
                     <span>Add Stock</span>
                     <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Register arrivals dynamically (S02)</div>
                </button>
                <button 
                  onClick={() => setCurrentView?.('inventory')}
                  className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11]/90 hover:border-amber-500 hover:bg-amber-900/10 hover:shadow-lg hover:shadow-amber-950/20 active:scale-98 cursor-pointer transition-all text-left group flex flex-col justify-center relative overflow-hidden"
                >
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
                   <div className="text-amber-500 mb-2 font-medium text-sm flex items-center gap-1.5">
                     <span>Record Loss</span>
                     <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Breakages & comp tracking</div>
                </button>
                <button 
                  onClick={() => setIsAddingExpense(true)}
                  className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11]/90 hover:border-red-500 hover:bg-red-900/10 hover:shadow-lg hover:shadow-red-950/20 active:scale-98 cursor-pointer transition-all text-left group flex flex-col justify-center relative overflow-hidden"
                >
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors"></div>
                   <div className="text-red-500 mb-2 font-medium text-sm flex items-center gap-1.5">
                     <span>Add Expense</span>
                     <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Track utility & overhead costs</div>
                </button>
                <button 
                  onClick={handleDownloadQuickReport}
                  className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11]/90 hover:border-blue-500 hover:bg-blue-900/10 hover:shadow-lg hover:shadow-blue-950/20 active:scale-98 cursor-pointer transition-all text-left group flex flex-col justify-center relative overflow-hidden"
                >
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                   <div className="text-blue-500 mb-2 font-medium text-sm flex items-center gap-1.5">
                     <span>Generate Report</span>
                     <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Export real-time pub sheet</div>
                </button>
             </div>
          </Card>

          <div className="lg:col-span-1 flex flex-col gap-6">
             <MiniCalendar />
             <QuickTasks onTaskAdd={(msg) => addToast(`New task added: ${msg}`, 'info')} />
          </div>
       </div>

       {/* Inventory Usage Trend */}
       <div className="grid grid-cols-1 gap-6">
          <Card className="flex flex-col">
             <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="font-semibold text-lg text-gray-200">Inventory Usage Trend</h3>
                   <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Last 30 Days</p>
                </div>
             </div>
             <div className="flex-1 min-h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={inventoryUsageData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#15181E', borderColor: '#1F2937', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#F59E0B', fontWeight: 600 }}
                        labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                        cursor={{ stroke: '#1F2937', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#F59E0B" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorUsage)"
                        activeDot={{ r: 6, fill: '#0B0D11', stroke: '#F59E0B', strokeWidth: 2 }} 
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </Card>
       </div>

       {/* Dynamic Modal - Log Custom Expense */}
       {isAddingExpense && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all duration-300">
           <Card className="w-full max-w-md bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)]">
             <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
               <div className="flex items-center gap-2">
                 <Landmark className="w-5 h-5 text-red-500" />
                 <h3 className="text-md font-semibold text-gray-200">Log Overhead Expense</h3>
               </div>
               <button onClick={() => setIsAddingExpense(false)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                 <X className="w-5 h-5" />
               </button>
             </div>

             <form onSubmit={handleAddCustomExpense} className="p-6 space-y-4 text-left">
               <div>
                 <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Expense Label</label>
                 <input 
                   type="text" 
                   required
                   value={expenseName}
                   onChange={(e) => setExpenseName(e.target.value)}
                   placeholder="e.g. Electricity, Water bill, DJ Hire"
                   className="w-full bg-[#0B0D11] border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none rounded-lg p-2.5 text-sm text-gray-200"
                 />
               </div>

               <div>
                 <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Expense Category</label>
                 <select 
                   value={expenseCategory}
                   onChange={(e) => setExpenseCategory(e.target.value)}
                   className="w-full bg-[#0B0D11] border border-gray-800 focus:border-red-500 outline-none rounded-lg p-2.5 text-sm text-gray-300"
                 >
                   <option value="Licensing">Licensing / Gov Fees</option>
                   <option value="Utilities">Utilities & Bills</option>
                   <option value="Staff Costs">Staff Costs & Extras</option>
                   <option value="Stock Costs">Stock Replenishment</option>
                   <option value="Marketing">Marketing / Events</option>
                 </select>
               </div>

               <div>
                 <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Amount (KES)</label>
                 <input 
                   type="number" 
                   required
                   min={1}
                   value={expenseAmount}
                   onChange={(e) => setExpenseAmount(e.target.value)}
                   placeholder="e.g. 15000"
                   className="w-full bg-[#0B0D11] border border-gray-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                 />
               </div>

               <div className="p-4 border-t border-gray-800 pt-5 mt-4 flex justify-end gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsAddingExpense(false)} 
                   className="px-4 py-2 border border-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-all"
                 >
                   Log Expense
                 </button>
               </div>
             </form>
           </Card>
         </div>
       )}
     </div>
  );
}
