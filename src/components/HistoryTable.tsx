import React from 'react';
import { AdEntry } from '@/src/types';
import { formatCurrency, formatUSD, cn } from '@/src/lib/utils';
import { Edit2, Trash2, Calendar, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryTableProps {
  entries: AdEntry[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ entries, onEdit, onDelete, onClearAll }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">এন্ট্রি হিস্ট্রি</h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">আপনার সব এন্ট্রির বিস্তারিত তালিকা</p>
        </div>
        <button 
          onClick={onClearAll} 
          className="btn btn-danger py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-2xl"
        >
          সব মুছুন
        </button>
      </div>

      <div className="card overflow-hidden border-2">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">তারিখ</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Campaign & Ad Set</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Spend</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Revenue</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Profit</th>
                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.length > 0 ? (
                entries.map((e) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={e.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-500 font-mono">{e.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] font-black text-slate-900 truncate max-w-[150px]" title={e.campName}>{e.campName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", e.adsetStatus === 'active' ? 'bg-emerald-500' : e.adsetStatus === 'paused' ? 'bg-amber-500' : 'bg-slate-400')} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">{e.adset}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-[11px] font-black text-rose-600">৳{formatCurrency(e.spendBDT)}</div>
                      <div className="text-[9px] font-bold text-slate-400 font-mono">${formatUSD(e.spendUSD)}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-[11px] font-black text-emerald-600">৳{formatCurrency(e.rev)}</div>
                      <div className="text-[9px] font-bold text-slate-400">{e.sales} Sales</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={cn(
                        "inline-flex px-2 py-1 rounded-lg text-[10px] font-black border-2",
                        e.profit >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                      )}>
                        {e.profit >= 0 ? '+' : '−'}৳{formatCurrency(Math.abs(e.profit))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(e.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(e.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <ShoppingBag className="w-8 h-8" />
                      <p className="text-xs font-black uppercase tracking-widest">এখনো কোনো ডেটা নেই</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
