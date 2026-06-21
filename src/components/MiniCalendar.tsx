import React from 'react';
import { inventoryList, staffSchedule } from '../data';
import { cn } from '../lib/utils';
import { AlertTriangle, Package } from 'lucide-react';

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

const getDayConflicts = () => {
    const conflictDays: string[] = [];
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
        let hasConflict = false;
        staffSchedule.forEach(staff => {
            if (checkOverlap(staff.shifts[day as keyof typeof staff.shifts])) {
                hasConflict = true;
            }
        });
        if(hasConflict) conflictDays.push(day);
    });
    return conflictDays;
};

export function MiniCalendar() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const conflictDaysOfWeek = getDayConflicts();
  const hasPendingInventory = inventoryList.some(item => {
    const stock = item.openingStock + (item.received || 0) - (item.sold || 0) + (item.variance || 0);
    return stock <= (item.reorderLevel || 10);
  });

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - startDay + 1;
    if (dayNum <= 0 || dayNum > daysInMonth) return null;
    const d = new Date(year, month, dayNum);
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    // Adjust Mon-Sun mapping for data (Mon=1, Sun=0 in getDay())
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    // The data uses Mon-Sun as keys
    const dataDayName = dayName === 'Sun' ? 'Sun' : dayName; 
    
    return {
      dayNum,
      isConflict: conflictDaysOfWeek.includes(dataDayName),
      hasReorder: hasPendingInventory
    };
  });

  return (
    <div className="bg-[#1A1E25] rounded-xl border border-gray-800 p-4">
      <h3 className="text-gray-200 font-semibold mb-4">Calendar</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className={cn(
            "h-8 rounded-md flex items-center justify-center text-sm relative",
            day ? "bg-[#0B0D11] text-gray-400" : "bg-transparent"
          )}>
            {day?.dayNum}
            {day?.isConflict && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
            {day?.hasReorder && <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Conflict</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Reorder</div>
      </div>
    </div>
  );
}
