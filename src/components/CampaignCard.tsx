import React, { useState, useMemo } from 'react';
import { Campaign, AdEntry, Status } from '@/src/types';
import { cn, formatCurrency, formatUSD } from '@/src/lib/utils';
import { ChevronDown, ChevronUp, Edit2, Trash2, Plus, Activity, Clock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CampaignCardProps {
  campaign: Campaign;
  entries: AdEntry[];
  allEntries: AdEntry[];
  onEdit: (c: Campaign) => void;
  onDelete: (id: string) => void;
  onAddEntry: (campId: string) => void;
  onUpdateAdset: (campId: string, name: string, status: Status) => void;
  onEditEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, entries, allEntries, onEdit, onDelete, onAddEntry, onUpdateAdset, onEditEntry, onDeleteEntry 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = useMemo(() => {
    return entries.reduce((acc, e) => ({
      spend: acc.spend + e.spendBDT,
      rev: acc.rev + e.rev,
      profit: acc.profit + e.profit,
      sales: acc.sales + e.sales,
      tc: acc.tc + e.totalCost
    }), { spend: 0, rev: 0, profit: 0, sales: 0, tc: 0 });
  }, [entries]);

  const roas = stats.spend > 0 ? (stats.rev / stats.spend).toFixed(2) : '0.00';
  const cps = stats.sales > 0 ? Math.round(stats.tc / stats.sales) : 0;

  const adsets = useMemo(() => {
    const groups: Record<string, { name: string; entries: AdEntry[]; lastStatus: Status }> = {};
    entries.forEach(e => {
      const k = e.adset || 'Ad Set';
      if (!groups[k]) {
        groups[k] = { name: k, entries: [], lastStatus: e.adsetStatus };
      }
      groups[k].entries.push(e);
      // Update last status based on most recent date
      const currentLast = groups[k].entries.sort((a,b) => b.date.localeCompare(a.date))[0];
      groups[k].lastStatus = currentLast.adsetStatus;
    });
    return groups;
  }, [entries]);

  const statusColors = {
    active: 'bg-emerald-500',
    paused: 'bg-amber-500',
    ended: 'bg-slate-500'
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden group border-2 hover:border-blue-100"
    >
      {/* Main Header */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", statusColors[campaign.status])}>
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-black text-slate-900 truncate">{campaign.name}</h3>
              {campaign.company && (
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-tighter">
                  🏢 {campaign.company}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock className="w-3 h-3" /> {campaign.platform}
              </span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {campaign.start} {campaign.end ? `→ ${campaign.end}` : '→ চলমান'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => onEdit(campaign)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(campaign.id)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
              isExpanded ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="px-4 pb-4 grid grid-cols-5 gap-3">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Spend</p>
          <p className="text-xs font-black text-rose-600">৳{formatCurrency(stats.spend)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
          <p className="text-xs font-black text-emerald-600">৳{formatCurrency(stats.rev)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Profit</p>
          <p className={cn("text-xs font-black", stats.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {stats.profit >= 0 ? '+' : '−'}৳{formatCurrency(Math.abs(stats.profit))}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ROAS</p>
          <p className={cn("text-xs font-black", parseFloat(roas) >= 2 ? "text-blue-600" : "text-slate-900")}>{roas}x</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sales</p>
          <p className="text-xs font-black text-slate-900">{stats.sales} টি</p>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-4 space-y-4">
              {campaign.note && (
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex gap-2 items-start shadow-sm">
                  <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
                  <span className="font-medium">{campaign.note}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ad Set Breakdown</h4>
                <button 
                  onClick={() => onAddEntry(campaign.id)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> এন্ট্রি যোগ করুন
                </button>
              </div>

              <div className="space-y-3">
                {Object.values(adsets).length > 0 ? (
                  Object.values(adsets).map((group: any) => {
                    const gstats = group.entries.reduce((acc: any, e: any) => ({
                      spend: acc.spend + e.spendBDT,
                      rev: acc.rev + e.rev,
                      sales: acc.sales + e.sales,
                      tc: acc.tc + e.totalCost
                    }), { spend: 0, rev: 0, sales: 0, tc: 0 });
                    const groas = gstats.spend > 0 ? (gstats.rev / gstats.spend).toFixed(2) : '0.00';

                    return (
                      <div key={group.name} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", statusColors[group.lastStatus as Status])} />
                            <span className="text-[11px] font-black text-slate-900">{group.name}</span>
                          </div>
                          <button 
                            onClick={() => onUpdateAdset(campaign.id, group.name, group.lastStatus)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[9px] font-bold text-slate-600 transition-colors"
                          >
                            Status পরিবর্তন
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-slate-50 rounded-xl p-2">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Spend</p>
                            <p className="text-[10px] font-black text-slate-900">৳{formatCurrency(gstats.spend)}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Sales</p>
                            <p className="text-[10px] font-black text-slate-900">{gstats.sales} টি</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">ROAS</p>
                            <p className="text-[10px] font-black text-blue-600">{groas}x</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {group.entries.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((e: any) => {
                            return (
                              <div key={e.id} className="flex items-center justify-between py-1.5 border-t border-slate-50 group/entry">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-400 font-mono">{e.date}</span>
                                  <span className="text-[9px] font-black text-slate-700">৳{formatCurrency(e.spendBDT)}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover/entry:opacity-100 transition-opacity">
                                  <button onClick={() => onEditEntry(e.id)} className="p-1 hover:bg-blue-50 text-blue-600 rounded-md">
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button onClick={() => onDeleteEntry(e.id)} className="p-1 hover:bg-red-50 text-red-600 rounded-md">
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[11px] text-slate-400 italic">এই পিরিয়ডে কোনো এন্ট্রি নেই।</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
