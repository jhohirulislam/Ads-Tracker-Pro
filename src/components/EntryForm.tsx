import React, { useState, useEffect } from 'react';
import { Campaign, AdEntry, Status } from '@/src/types';
import { formatCurrency, formatUSD } from '@/src/lib/utils';
import { Plus, Calculator, Trash2 } from 'lucide-react';

interface EntryFormProps {
  campaigns: Campaign[];
  entries: AdEntry[];
  onAdd: (entry: Partial<AdEntry>) => void;
  initialCampId?: string;
  usdRate: number;
}

export const EntryForm: React.FC<EntryFormProps> = ({ campaigns, entries, onAdd, initialCampId, usdRate }) => {
  const [campId, setCampId] = useState(initialCampId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [adsetMode, setAdsetMode] = useState<'existing' | 'new'>('existing');
  const [adsetName, setAdsetName] = useState('');
  const [status, setStatus] = useState<Status>('active');
  const [spendUSD, setSpendUSD] = useState('');
  const [sales, setSales] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [other, setOther] = useState('');
  const [rev, setRev] = useState('');
  const [note, setNote] = useState('');
  const [manualRev, setManualRev] = useState(false);

  useEffect(() => {
    if (initialCampId) setCampId(initialCampId);
  }, [initialCampId]);

  useEffect(() => {
    const c = campaigns.find(x => x.id === campId);
    if (c) {
      if (c.defaultPrice) setPrice(c.defaultPrice.toString());
      if (c.defaultCost) setCost(c.defaultCost.toString());
      
      const campAdsets = [...new Set(entries.filter(e => e.campId === campId).map(e => e.adset))];
      if (campAdsets.length === 0) setAdsetMode('new');
      else setAdsetMode('existing');
    }
  }, [campId, campaigns, entries]);

  const spendBDT = Math.round((parseFloat(spendUSD) || 0) * usdRate);
  const calculatedRev = (parseInt(sales) || 0) * (parseFloat(price) || 0);
  const currentRev = manualRev ? (parseFloat(rev) || 0) : calculatedRev;
  const prodCostTotal = (parseInt(sales) || 0) * (parseFloat(cost) || 0);
  const totalCost = spendBDT + prodCostTotal + (parseFloat(other) || 0);
  const profit = currentRev - totalCost;
  const roas = spendBDT > 0 ? (currentRev / spendBDT) : 0;
  const cps = (parseInt(sales) || 0) > 0 ? (totalCost / (parseInt(sales) || 0)) : 0;

  const clearForm = () => {
    setSpendUSD('');
    setSales('');
    setNote('');
    setManualRev(false);
    setRev('');
    setAdsetName('');
    setPrice('');
    setCost('');
    setOther('');
  };

  const handleSubmit = () => {
    if (!campId) return alert('Campaign বেছে নিন!');
    const finalAdsetName = adsetMode === 'new' ? adsetName.trim() : adsetName;
    if (!finalAdsetName) return alert('Ad Set নাম দিন!');

    onAdd({
      campId,
      date,
      adset: finalAdsetName,
      adsetStatus: status,
      spendUSD: parseFloat(spendUSD) || 0,
      spendBDT,
      sales: parseInt(sales) || 0,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      other: parseFloat(other) || 0,
      rev: currentRev,
      prodCostTotal,
      totalCost,
      profit,
      roas: parseFloat(roas.toFixed(2)),
      cpp: (parseInt(sales) || 0) > 0 ? (parseFloat(spendUSD) || 0) / (parseInt(sales) || 0) : 0,
      cps: Math.round(cps),
      usdRate,
      note
    });

    clearForm();
  };

  const campAdsets = [...new Set(entries.filter(e => e.campId === campId).map(e => e.adset))];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-500" /> নতুন Ad Set এন্ট্রি
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="field">
            <label className="label">Campaign</label>
            <select className="input" value={campId} onChange={(e) => setCampId(e.target.value)}>
              <option value="">— Campaign বেছে নিন —</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name} [{c.platform}]</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">তারিখ</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="pt-2">
            <label className="label">AD SET</label>
            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => setAdsetMode('existing')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${adsetMode === 'existing' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                বিদ্যমান Ad Set
              </button>
              <button 
                onClick={() => setAdsetMode('new')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${adsetMode === 'new' ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                নতুন Ad Set
              </button>
            </div>

            {adsetMode === 'existing' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Ad Set বেছে নিন</label>
                  <select className="input" value={adsetName} onChange={(e) => setAdsetName(e.target.value)}>
                    <option value="">— Ad Set বেছে নিন —</option>
                    {campAdsets.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Status</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                    <option value="active">🟢 Active</option>
                    <option value="paused">🟡 Paused</option>
                    <option value="ended">⚫ Ended</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">নতুন Ad Set নাম</label>
                  <input type="text" className="input" placeholder="যেমন: 18-35 Women" value={adsetName} onChange={(e) => setAdsetName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Status</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                    <option value="active">🟢 Active</option>
                    <option value="paused">🟡 Paused</option>
                    <option value="ended">⚫ Ended</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Spend (USD)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={spendUSD} onChange={(e) => setSpendUSD(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Spend (BDT) — auto</label>
              <input type="number" className="input bg-slate-50" value={spendBDT} readOnly />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="field">
              <label className="label">মোট Sale</label>
              <input type="number" className="input" placeholder="০" value={sales} onChange={(e) => setSales(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Product দাম</label>
              <input type="number" className="input" placeholder="০" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Revenue</label>
              <input 
                type="number" 
                className="input" 
                placeholder="০" 
                value={manualRev ? rev : calculatedRev} 
                onChange={(e) => { setManualRev(true); setRev(e.target.value); }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Product Cost</label>
              <input type="number" className="input" placeholder="০" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">অন্যান্য খরচ</label>
              <input type="number" className="input" placeholder="০" value={other} onChange={(e) => setOther(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">নোট</label>
            <input type="text" className="input" placeholder="ঐচ্ছিক" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Calculator className="w-3 h-3" /> লাইভ হিসাব
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-[10px] text-slate-500 font-medium mb-1">মোট খরচ</div>
            <div className="text-sm font-bold font-mono text-red-600">৳{formatCurrency(totalCost)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium mb-1">Revenue</div>
            <div className="text-sm font-bold font-mono text-green-600">৳{formatCurrency(currentRev)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium mb-1">নেট লাভ</div>
            <div className={`text-sm font-bold font-mono ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : '−'}৳{formatCurrency(Math.abs(profit))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium mb-1">ROAS</div>
            <div className="text-sm font-bold font-mono text-blue-600">{roas.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium mb-1">খরচ/Sale</div>
            <div className="text-sm font-bold font-mono text-amber-600">৳{formatCurrency(cps)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button onClick={handleSubmit} className="btn btn-primary flex-1">
          + Ad Set যোগ করুন
        </button>
        <button onClick={() => { setCampId(''); clearForm(); }} className="btn btn-secondary px-3">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
