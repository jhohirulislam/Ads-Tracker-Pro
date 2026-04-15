import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { DateRange } from '@/src/types';
import { format, subDays, startOfToday, startOfYesterday } from 'date-fns';

interface DateBarProps {
  onRangeChange: (range: DateRange) => void;
  currentRange: DateRange;
}

export const DateBar: React.FC<DateBarProps> = ({ onRangeChange, currentRange }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const ranges = [
    { id: 'today', label: 'আজ' },
    { id: 'yesterday', label: 'গতকাল' },
    { id: '7', label: '৭ দিন' },
    { id: '30', label: '৩০ দিন' },
    { id: 'all', label: 'Lifetime' },
    { id: 'custom', label: 'কাস্টম ▾' },
  ];

  const handleRangeClick = (id: string) => {
    if (id === 'custom') {
      setShowCustom(!showCustom);
      return;
    }

    setShowCustom(false);
    let from: string | null = null;
    let to: string | null = null;
    let label = '';
    const today = format(startOfToday(), 'yyyy-MM-dd');

    if (id === 'today') {
      from = to = today;
      label = `আজ (${today})`;
    } else if (id === 'yesterday') {
      from = to = format(startOfYesterday(), 'yyyy-MM-dd');
      label = 'গতকাল';
    } else if (id === '7') {
      from = format(subDays(startOfToday(), 6), 'yyyy-MM-dd');
      to = today;
      label = 'গত ৭ দিন';
    } else if (id === '30') {
      from = format(subDays(startOfToday(), 29), 'yyyy-MM-dd');
      to = today;
      label = 'গত ৩০ দিন';
    } else {
      label = 'Lifetime';
    }

    onRangeChange({ from, to, label, mode: id });
  };

  const handleCustomApply = () => {
    if (!customFrom) return;
    const label = customTo && customFrom !== customTo ? `${customFrom} → ${customTo}` : customFrom;
    onRangeChange({ from: customFrom, to: customTo || null, label, mode: 'custom' });
  };

  return (
    <div className="card p-3 mb-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">📅 সময়কাল</span>
        <div className="flex gap-1 flex-wrap flex-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRangeClick(r.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                currentRange.mode === r.id
                  ? "bg-blue-600 text-white border-transparent shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {showCustom && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">From</label>
            <input
              type="date"
              className="input py-1 text-xs w-auto"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">To</label>
            <input
              type="date"
              className="input py-1 text-xs w-auto"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
          <button onClick={handleCustomApply} className="btn btn-primary py-1 px-3 text-xs">
            প্রয়োগ
          </button>
        </div>
      )}

      {currentRange.mode !== 'all' && (
        <div className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md border border-blue-100 animate-in zoom-in-95">
          {currentRange.label}
        </div>
      )}
    </div>
  );
};
