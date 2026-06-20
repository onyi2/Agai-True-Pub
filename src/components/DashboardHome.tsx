import React, { useState, useEffect } from "react";
import { Card } from "./ui/Card";
import { dashboardMetrics, salesData, topProducts, expensesData, inventoryUsageData, staffSchedule } from "../data";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, X, Bell, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { QuickTasks } from "./QuickTasks";
import { MiniCalendar } from "./MiniCalendar";

type Toast = {
  id: string;
  message: string;
  type: 'info' | 'warning';
};

const checkOverlap = (shiftStr: string) => {
  if (shiftStr === 'Off') return false;
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

export function DashboardHome() {
  const [toasts, setToasts] = useState<Toast[]>([]);

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
                   {expensesData.map((exp, i) => (
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
                         data={expensesData}
                         innerRadius={65}
                         outerRadius={90}
                         paddingAngle={3}
                         dataKey="value"
                         stroke="none"
                      >
                         {expensesData.map((entry, index) => (
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
                <button className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11] hover:border-emerald-500 hover:bg-emerald-900/10 transition-all text-left group flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
                   <div className="text-emerald-500 mb-2 font-medium text-sm">Add Stock</div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Register arrival (S02)</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11] hover:border-amber-500 hover:bg-amber-900/10 transition-all text-left group flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
                   <div className="text-amber-500 mb-2 font-medium text-sm">Record Loss</div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Breakages & comps</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11] hover:border-red-500 hover:bg-red-900/10 transition-all text-left group flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors"></div>
                   <div className="text-red-500 mb-2 font-medium text-sm">Add Expense</div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Track general costs</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-800 bg-[#0B0D11] hover:border-blue-500 hover:bg-blue-900/10 transition-all text-left group flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                   <div className="text-blue-500 mb-2 font-medium text-sm">Generate Report</div>
                   <div className="text-xs text-gray-500 group-hover:text-gray-300 leading-relaxed">Export real-time data</div>
                </button>
             </div>
          </Card>
          <div className="lg:col-span-1 h-[400px]">
             <MiniCalendar /><QuickTasks onTaskAdd={(msg) => addToast(`New task added: ${msg}`, 'info')} />
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
    </div>
  );
}
