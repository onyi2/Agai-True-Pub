import React, { useState } from "react";
import { Card } from "./ui/Card";
import { staffSchedule } from "../data";
import { Calendar as CalendarIcon, UserPlus, Clock, Users, AlertTriangle, Save, ClipboardList, Coins } from "lucide-react";
import { cn } from "../lib/utils";

const calculateShiftHours = (shiftStr: string) => {
  if (shiftStr === 'Off' || !shiftStr) return 0;
  return shiftStr.split(',').map(s => {
    const [startStr, endStr] = s.trim().split(' - ');
    if (!startStr || !endStr) return 0;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    let duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration < 0) duration += 24 * 60;
    return duration / 60;
  }).reduce((a, b) => a + b, 0);
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

export function StaffScheduling() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [schedule, setSchedule] = useState(staffSchedule);
  const [templates, setTemplates] = useState([
    { id: 't1', name: 'Standard Bar', pattern: { Mon: "18:00 - 02:00", Tue: "Off", Wed: "18:00 - 02:00", Thu: "18:00 - 02:00", Fri: "19:00 - 04:00", Sat: "19:00 - 04:00", Sun: "Off" } },
    { id: 't2', name: 'Standard Floor', pattern: { Mon: "16:00 - 00:00", Tue: "16:00 - 00:00", Wed: "Off", Thu: "16:00 - 00:00", Fri: "18:00 - 04:00", Sat: "18:00 - 04:00", Sun: "14:00 - 22:00" } },
  ]);

  const applyTemplate = (staffId: number, templateId: string) => {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    setSchedule(prev => prev.map(s => s.id === staffId ? { ...s, shifts: template.pattern } : s));
  };

  const saveAsTemplate = (staffId: number) => {
    const staff = schedule.find(s => s.id === staffId);
    if (!staff) return;
    const newTemplate = {
      id: Date.now().toString(),
      name: `${staff.name}'s Pattern`,
      pattern: staff.shifts
    };
    setTemplates([...templates, newTemplate]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h2 className="text-2xl font-bold text-gray-200">Staff Scheduling</h2>
             <p className="text-sm text-emerald-400 mt-1 font-medium tracking-wide">Manage shifts, roles, and weekly rotas</p>
          </div>
          <div className="flex gap-3">
             <button className="px-4 py-2 border border-gray-800 bg-[#0B0D11] text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-all flex items-center gap-2 shadow-sm">
                <CalendarIcon className="w-4 h-4" />
                This Week
             </button>
             <button className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Shift
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-[#15181E] border-gray-800 hover:border-emerald-500/50 transition-colors">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Staff</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center text-emerald-400">
                       <Users className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-emerald-500">14</p>
             </div>
          </Card>
          <Card className="bg-[#15181E] border-gray-800 hover:border-amber-500/50 transition-colors">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Est. Monthly Payroll</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-500">
                       <Coins className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-2xl font-bold text-amber-500">
                   KES {schedule.reduce((acc, s) => {
                      const weeklyHours: number = (Object.values((s as any).shifts as any) as any[]).reduce((h: number, shift: any) => h + calculateShiftHours(shift), 0);
                      return (acc + (weeklyHours * 4 * ((s as any).hourlyRate || 0))) as number;
                   }, 0).toLocaleString()}
                </p>
             </div>
          </Card>
          <Card className="bg-[#15181E] border-gray-800 hover:border-red-500/50 transition-colors">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Next Event</p>
                    <div className="w-8 h-8 rounded-lg bg-red-900/40 flex items-center justify-center text-red-500">
                       <CalendarIcon className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-lg font-bold text-red-500 truncate mt-2">Madaraka Day</p>
             </div>
          </Card>
       </div>

       <Card className="p-0 overflow-hidden border-gray-800 shadow-2xl">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0B0D11] text-gray-500 text-xs uppercase tracking-wider font-semibold">
                   <tr>
                      <th className="px-6 py-4 md:sticky md:left-0 z-10 bg-[#0B0D11]">Staff Member</th>
                      <th className="px-6 py-4">Role</th>
                      {days.map(day => (
                         <th key={day} className="px-4 py-4 text-center">{day}</th>
                      ))}
                      <th className="px-6 py-4 text-center">Templates</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#15181E]">
                   {schedule.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-800/30 transition-colors group">
                         <td className="px-6 py-4 font-medium text-gray-200 md:sticky md:left-0 z-10 bg-[#15181E] group-hover:bg-gray-800/80 transition-colors">
                            {staff.name}
                         </td>
                         <td className="px-6 py-4 text-gray-400 text-xs uppercase tracking-wider font-medium">{staff.role}</td>
                         {days.map(day => {
                            const shift = staff.shifts[day as keyof typeof staff.shifts];
                            const isOff = shift === 'Off';
                            return (
                               <td key={day} className="px-2 py-3 text-center align-top">
                                  {isOff ? (
                                    <div className="px-2 py-2 rounded-lg text-xs font-medium border flex items-center justify-center w-[110px] mx-auto transition-colors bg-[#0B0D11] border-gray-800 text-gray-500/50">
                                       Off
                                    </div>
                                  ) : (() => {
                                    const parsedShifts = shift.split(',').map(s => s.trim());
                                    const isConflicting = checkOverlap(shift);
                                    return (
                                       <div className="flex flex-col gap-1.5 items-center w-[110px] mx-auto relative group/shift">
                                         {parsedShifts.map((s, idx) => (
                                            <div key={idx} className={cn(
                                               "px-2 py-2 rounded-lg text-[11px] font-medium border flex items-center justify-center w-full transition-colors cursor-pointer",
                                               isConflicting 
                                                 ? "bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40" 
                                                 : "bg-emerald-900/40 border-emerald-500/30 text-emerald-400 font-mono hover:bg-emerald-900/60"
                                            )}>
                                               {s}
                                            </div>
                                         ))}
                                         {isConflicting && (
                                           <div className="text-[9px] text-red-500 font-bold tracking-wider flex items-center justify-center gap-1 uppercase mt-0.5 w-full">
                                              <AlertTriangle className="w-3 h-3" />
                                              Conflict
                                           </div>
                                         )}
                                       </div>
                                    );
                                  })()}
                               </td>
                            );
                         })}
                         <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2 relative">
                               <button onClick={() => saveAsTemplate(staff.id)} title="Save as Template" className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors">
                                  <Save className="w-4 h-4" />
                               </button>
                               <div className="relative group/template inline-block">
                                  <button className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-md transition-colors flex items-center gap-1">
                                     <ClipboardList className="w-4 h-4" />
                                  </button>
                                  <div className="hidden group-hover/template:block absolute right-0 top-full pt-2 z-50">
                                     <div className="bg-[#0B0D11] border border-gray-800 rounded-lg shadow-xl overflow-hidden min-w-[160px] py-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                                           Apply Template
                                        </div>
                                        {templates.map(t => (
                                           <button 
                                              key={t.id} 
                                              onClick={() => applyTemplate(staff.id, t.id)}
                                              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                                           >
                                              {t.name}
                                           </button>
                                        ))}
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </Card>
    </div>
  );
}
