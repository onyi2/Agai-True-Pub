import React, { useState } from "react";
import { Card } from "./ui/Card";
import { staffSchedule } from "../data";
import { Calendar as CalendarIcon, UserPlus, Clock, Users, AlertTriangle, Save, ClipboardList, Coins, X } from "lucide-react";
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [shiftValue, setShiftValue] = useState("18:00 - 02:00");
  const [isOff, setIsOff] = useState(false);

  const openShiftEditor = (staffId: number, day: string, currentShift: string) => {
    setSelectedStaffId(staffId);
    setSelectedDay(day);
    if (currentShift === 'Off') {
      setIsOff(true);
      setShiftValue("18:00 - 02:00");
    } else {
      setIsOff(false);
      setShiftValue(currentShift);
    }
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = isOff ? 'Off' : shiftValue.trim() || 'Off';
    setSchedule(prev => prev.map(s => {
      if (s.id === selectedStaffId) {
        return {
          ...s,
          shifts: {
            ...s.shifts,
            [selectedDay]: finalVal
          }
        };
      }
      return s;
    }));
    setIsModalOpen(false);
  };

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
             <button 
                onClick={() => {
                   setSelectedStaffId(schedule[0]?.id || 1);
                   setSelectedDay("Mon");
                   setIsOff(false);
                   setShiftValue("18:00 - 02:00");
                   setIsModalOpen(true);
                }}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-2"
             >
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
                               <td 
                                  key={day} 
                                  onClick={() => openShiftEditor(staff.id, day, shift)}
                                  className="px-2 py-3 text-center align-top cursor-pointer hover:bg-gray-800/10 transition-colors"
                               >
                                  {isOff ? (
                                    <div className="px-2 py-2 rounded-lg text-xs font-medium border flex items-center justify-center w-[110px] mx-auto transition-colors bg-[#0B0D11] border-gray-800 text-gray-500/50 hover:border-gray-600">
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

        {/* Dynamic Shift Editor Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all duration-300 session-modal">
            <Card className="w-full max-w-md bg-[#15181E] border-gray-800 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)]">
               <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#1A1E25]">
                  <div className="flex items-center gap-2">
                     <Clock className="w-5 h-5 text-emerald-500" />
                     <h3 className="text-md font-semibold text-gray-200">
                        Edit Shift: {schedule.find(s => s.id === selectedStaffId)?.name}
                     </h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleSaveShift} className="p-6 space-y-4 text-left">
                  <div>
                     <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Staff Member</label>
                     <select 
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                        className="w-full bg-[#0B0D11] border border-gray-800 focus:border-emerald-500 outline-none rounded-lg p-2.5 text-sm text-gray-300"
                     >
                        {schedule.map(s => (
                           <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Day of Week</label>
                        <select 
                           value={selectedDay}
                           onChange={(e) => setSelectedDay(e.target.value)}
                           className="w-full bg-[#0B0D11] border border-gray-800 focus:border-emerald-500 outline-none rounded-lg p-2.5 text-sm text-gray-300"
                        >
                           {days.map(d => (
                              <option key={d} value={d}>{d}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Status</label>
                        <div className="flex items-center gap-2 h-[42px]">
                           <input 
                              type="checkbox" 
                              id="isOffCheck"
                              checked={isOff}
                              onChange={(e) => setIsOff(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                           />
                           <label htmlFor="isOffCheck" className="text-sm text-gray-400 cursor-pointer select-none">Staff is Off</label>
                        </div>
                     </div>
                  </div>

                  {!isOff && (
                     <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 font-extrabold mb-1.5">Shift Pattern Hours</label>
                        <input 
                           type="text"
                           required
                           value={shiftValue}
                           onChange={(e) => setShiftValue(e.target.value)}
                           placeholder="e.g. 18:00 - 02:00, or multiple: 12:00 - 16:00, 18:00 - 00:00"
                           className="w-full bg-[#0B0D11] border border-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none rounded-lg p-2.5 text-sm text-gray-200 font-mono"
                        />
                     </div>
                  )}

                  <div className="p-4 border-t border-gray-800 pt-5 mt-4 flex justify-end gap-3">
                     <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)} 
                        className="px-4 py-2 border border-gray-800 text-gray-400 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center cursor-pointer"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer"
                     >
                        Save Shift
                     </button>
                  </div>
               </form>
            </Card>
          </div>
        )}
    </div>
  );
}
