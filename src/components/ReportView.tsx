import React, { useState } from 'react';
import { AdEntry, Campaign, DateRange } from '@/src/types';
import { formatCurrency, formatUSD, cn } from '@/src/lib/utils';
import { FileText, Copy, Check, BarChart3, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportViewProps {
  entries: AdEntry[];
  campaigns: Campaign[];
  dateRange: DateRange;
}

export const ReportView: React.FC<ReportViewProps> = ({ entries, campaigns, dateRange }) => {
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState('');

  const generateReport = () => {
    let data = entries;
    if (selectedCampId) data = data.filter(e => e.campId === selectedCampId);
    
    if (data.length === 0) {
      setReportText('এই ফিল্টারে কোনো ডেটা নেই।');
      return;
    }

    const tot = data.reduce((acc, e) => ({
      usd: acc.usd + e.spendUSD,
      bdt: acc.bdt + e.spendBDT,
      rev: acc.rev + e.rev,
      profit: acc.profit + e.profit,
      sales: acc.sales + e.sales,
      tc: acc.tc + e.totalCost,
      pc: acc.pc + e.prodCostTotal
    }), { usd: 0, bdt: 0, rev: 0, profit: 0, sales: 0, tc: 0, pc: 0 });

    const roas = tot.bdt > 0 ? (tot.rev / tot.bdt) : 0;
    const cpp = tot.sales > 0 ? (tot.usd / tot.sales) : 0;
    const cps = tot.sales > 0 ? (tot.tc / tot.sales) : 0;
    const usdRate = data[0]?.usdRate || 110;

    const byCamp: Record<string, { name: string; adsets: Record<string, any> }> = {};
    data.forEach(e => {
      if (!byCamp[e.campId]) byCamp[e.campId] = { name: e.campName, adsets: {} };
      const k = e.adset || 'Ad Set';
      if (!byCamp[e.campId].adsets[k]) byCamp[e.campId].adsets[k] = { name: k, n: 0, usd: 0, bdt: 0, rev: 0, profit: 0, sales: 0, tc: 0, dates: [] };
      const as = byCamp[e.campId].adsets[k];
      as.n++; as.usd += e.spendUSD; as.bdt += e.spendBDT; as.rev += e.rev; as.profit += e.profit; as.sales += e.sales; as.tc += e.totalCost;
      if (!as.dates.includes(e.date)) as.dates.push(e.date);
    });

    const campLines = Object.values(byCamp).map(g => {
      const campObj = campaigns.find(c => c.name === g.name);
      const companyStr = campObj?.company ? ` [Company: ${campObj.company}]` : '';
      
      const ct = Object.values(g.adsets).reduce((acc, as) => ({
        usd: acc.usd + as.usd,
        bdt: acc.bdt + as.bdt,
        rev: acc.rev + as.rev,
        profit: acc.profit + as.profit,
        sales: acc.sales + as.sales,
        tc: acc.tc + as.tc
      }), { usd: 0, bdt: 0, rev: 0, profit: 0, sales: 0, tc: 0 });

      const croas = ct.bdt > 0 ? (ct.rev / ct.bdt).toFixed(2) : '—';
      const ccps = ct.sales > 0 ? Math.round(ct.tc / ct.sales) : 0;

      const asLines = Object.values(g.adsets).map(as => {
        const aroas = as.bdt > 0 ? (as.rev / as.bdt).toFixed(2) : '—';
        const acps = as.sales > 0 ? Math.round(as.tc / as.sales) : 0;
        const sortedDates = [...as.dates].sort();
        const dateRangeStr = sortedDates.length > 1 
          ? `${sortedDates[0]} → ${sortedDates[sortedDates.length - 1]}` 
          : sortedDates[0] || '';
        
        return `      • ${as.name} (${as.n}টি এন্ট্রি | ${dateRangeStr})\n        Spend: $${formatUSD(as.usd)} = ৳${formatCurrency(as.bdt)} | Sale: ${as.sales} | Rev: ৳${formatCurrency(as.rev)}\n        ${as.profit >= 0 ? 'লাভ  +' : 'ক্ষতি −'}৳${formatCurrency(Math.abs(as.profit))} | ROAS: ${aroas}x | খরচ/Sale: ৳${formatCurrency(acps)}`;
      }).join('\n');

      return `  ▪ ${g.name}${companyStr}\n    Spend: $${formatUSD(ct.usd)} = ৳${formatCurrency(ct.bdt)} | Sale: ${formatCurrency(ct.sales)} | Rev: ৳${formatCurrency(ct.rev)}\n    ${ct.profit >= 0 ? 'লাভ  +' : 'ক্ষতি −'}৳${formatCurrency(Math.abs(ct.profit))} | ROAS: ${croas}x | খরচ/Sale: ৳${formatCurrency(ccps)}\n${asLines}`;
    }).join('\n\n');

    const campTitle = selectedCampId ? (campaigns.find(c => c.id === selectedCampId)?.name || 'Campaign') : 'সব Campaign';
    const dateCount = [...new Set(data.map(e => e.date))].length;

    const txt = `📊 Ads রিপোর্ট
সময়কাল   : ${dateRange.label}
Campaign  : ${campTitle}
মোট দিন   : ${dateCount} দিনের ডেটা (${data.length}টি এন্ট্রি)
USD Rate  : ১ USD = ৳${usdRate}
${'─'.repeat(52)}

💵 মোট Ad Spend        : $${formatUSD(tot.usd)} = ৳${formatCurrency(tot.bdt)}
📦 Product Cost        : ৳${formatCurrency(tot.pc)}
💰 মোট Revenue         : ৳${formatCurrency(tot.rev)}
${tot.profit >= 0 ? '✅' : '❌'} নেট লাভ/ক্ষতি       : ${tot.profit >= 0 ? 'লাভ  +' : 'ক্ষতি −'}৳${formatCurrency(Math.abs(tot.profit))}

📌 মূল মেট্রিক্স
  ROAS                 : ${roas.toFixed(2)}x
  CPP (FB)             : $${formatUSD(cpp)}
  মোট খরচ / প্রতি Sale : ৳${formatCurrency(cps)}
  মোট Sale             : ${formatCurrency(tot.sales)} টি

📁 Campaign → Ad Set বিভাজন
${campLines}
${'─'.repeat(52)}
রিপোর্ট তৈরি: ${new Date().toLocaleString('bn-BD')}`;

    setReportText(txt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">পারফরম্যান্স রিপোর্ট</h2>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">আপনার ব্যবসার লাভ-ক্ষতির বিস্তারিত বিশ্লেষণ</p>
        </div>
      </div>

      <div className="card p-6 border-2">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Generate Report</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select 
              className="input py-1.5 text-xs w-auto rounded-xl" 
              value={selectedCampId} 
              onChange={(e) => setSelectedCampId(e.target.value)}
            >
              <option value="">সব Campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={generateReport} className="btn btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
              রিপোর্ট বানান
            </button>
            <button 
              onClick={copyToClipboard} 
              disabled={!reportText || reportText.includes('ফিল্টারে')}
              className="btn btn-secondary py-2 px-4 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copy
            </button>
          </div>
        </div>

        <motion.div 
          layout
          className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap overflow-x-auto min-h-[200px] shadow-inner"
        >
          {reportText || (
            <div className="flex flex-col items-center justify-center h-full py-12 opacity-30 gap-3">
              <FileText className="w-8 h-8" />
              <p className="text-xs font-black uppercase tracking-widest">Campaign বা তারিখ বেছে "রিপোর্ট বানান" চাপুন</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
