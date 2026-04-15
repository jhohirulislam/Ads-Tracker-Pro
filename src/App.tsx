import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, AdEntry, DateRange, Status } from './types';
import { storage, formatCurrency, cn } from './lib/utils';
import { StatsCard } from './components/StatsCard';
import { DateBar } from './components/DateBar';
import { CampaignCard } from './components/CampaignCard';
import { EntryForm } from './components/EntryForm';
import { HistoryTable } from './components/HistoryTable';
import { ReportView } from './components/ReportView';
import { Modal } from './components/Modal';
import { Combobox } from './components/Combobox';
import { LayoutDashboard, PlusCircle, History, FileBarChart, DollarSign, TrendingUp, ShoppingBag, Wallet, LogOut, LogIn, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

const CAMP_KEY = 'adt4_campaigns';
const ENTRIES_KEY = 'adt4_entries';
const RATE_KEY = 'adt4_rate';
const PUBLIC_UID = 'public_admin'; // Default ID for "No Login" mode

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'entry' | 'history' | 'report'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [entries, setEntries] = useState<AdEntry[]>([]);
  const [usdRate, setUsdRate] = useState(110);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null, label: 'Lifetime', mode: 'all' });
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  
  const effectiveUid = user?.uid || PUBLIC_UID;
  
  // Modals
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);
  
  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      const uid = u?.uid || PUBLIC_UID;
      // Create user profile if not exists
      const userRef = doc(db, 'users', uid);
      getDoc(userRef).then(snap => {
        if (!snap.exists()) {
          setDoc(userRef, {
            uid: uid,
            email: u?.email || 'public@example.com',
            displayName: u?.displayName || 'Public User',
            photoURL: u?.photoURL || '',
            createdAt: Date.now(),
            role: 'user'
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${uid}`));
        }
      });
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!isAuthReady) return;

    const campsRef = collection(db, 'users', effectiveUid, 'campaigns');
    const entriesRef = collection(db, 'users', effectiveUid, 'entries');

    const unsubCamps = onSnapshot(query(campsRef, orderBy('createdAt', 'desc')), 
      (snap) => {
        setCampaigns(snap.docs.map(d => d.data() as Campaign));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/campaigns`)
    );

    const unsubEntries = onSnapshot(query(entriesRef, orderBy('date', 'desc')), 
      (snap) => {
        setEntries(snap.docs.map(d => d.data() as AdEntry));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/entries`)
    );

    return () => {
      unsubCamps();
      unsubEntries();
    };
  }, [effectiveUid, isAuthReady]);

  useEffect(() => {
    if (editingCamp) {
      setEditCampCompany(editingCamp.company || '');
    }
  }, [editingCamp]);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [updatingAdset, setUpdatingAdset] = useState<{ campId: string; name: string; status: Status } | null>(null);
  const [quickAddCampId, setQuickAddCampId] = useState<string | undefined>(undefined);

  // Form States for Combobox
  const [newCampCompany, setNewCampCompany] = useState('');
  const [editCampCompany, setEditCampCompany] = useState('');

  // Load rate from localStorage (still fine for settings)
  useEffect(() => {
    const savedRate = localStorage.getItem(RATE_KEY);
    if (savedRate) setUsdRate(parseFloat(savedRate));
  }, []);

  // Save rate
  useEffect(() => {
    localStorage.setItem(RATE_KEY, usdRate.toString());
  }, [usdRate]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    
    // Date Filter
    if (dateRange.from || dateRange.to) {
      result = result.filter(e => {
        if (dateRange.from && e.date < dateRange.from) return false;
        if (dateRange.to && e.date > dateRange.to) return false;
        return true;
      });
    }

    // Company Filter
    if (selectedCompany !== 'all') {
      const companyCampIds = campaigns
        .filter(c => c.company === selectedCompany)
        .map(c => c.id);
      result = result.filter(e => companyCampIds.includes(e.campId));
    }

    return result;
  }, [entries, dateRange, selectedCompany, campaigns]);

  const filteredCampaigns = useMemo(() => {
    if (selectedCompany === 'all') return campaigns;
    return campaigns.filter(c => c.company === selectedCompany);
  }, [campaigns, selectedCompany]);

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, e) => ({
      spend: acc.spend + e.spendBDT,
      rev: acc.rev + e.rev,
      profit: acc.profit + e.profit,
      sales: acc.sales + e.sales
    }), { spend: 0, rev: 0, profit: 0, sales: 0 });
  }, [filteredEntries]);

  const uniqueCompanies = useMemo(() => {
    return [...new Set(campaigns.map(c => c.company).filter(Boolean))].sort();
  }, [campaigns]);

  const handleAddCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = Math.random().toString(36).substring(2, 9);
    const newCamp: Campaign & { uid: string } = {
      id,
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      platform: formData.get('platform') as string,
      start: formData.get('start') as string,
      end: formData.get('end') as string,
      defaultPrice: parseFloat(formData.get('price') as string) || 0,
      defaultCost: parseFloat(formData.get('cost') as string) || 0,
      note: formData.get('note') as string,
      status: 'active',
      createdAt: Date.now(),
      uid: effectiveUid
    };
    
    try {
      await setDoc(doc(db, 'users', effectiveUid, 'campaigns', id), newCamp);
      setIsCampModalOpen(false);
      setNewCampCompany('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/campaigns/${id}`);
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCamp) return;
    const formData = new FormData(e.currentTarget);
    const updated = {
      ...editingCamp,
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      platform: formData.get('platform') as string,
      start: formData.get('start') as string,
      end: formData.get('end') as string,
      defaultPrice: parseFloat(formData.get('price') as string) || 0,
      defaultCost: parseFloat(formData.get('cost') as string) || 0,
      note: formData.get('note') as string,
      status: formData.get('status') as Status
    };
    
    try {
      await setDoc(doc(db, 'users', effectiveUid, 'campaigns', editingCamp.id), updated);
      setEditingCamp(null);
      setEditCampCompany('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/campaigns/${editingCamp.id}`);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('এই Campaign এবং এর সব এন্ট্রি মুছে যাবে! মুছবেন?')) {
      try {
        await deleteDoc(doc(db, 'users', effectiveUid, 'campaigns', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${effectiveUid}/campaigns/${id}`);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('মুছবেন?')) {
      try {
        await deleteDoc(doc(db, 'users', effectiveUid, 'entries', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${effectiveUid}/entries/${id}`);
      }
    }
  };

  const handleClearAllEntries = async () => {
    if (confirm('সব এন্ট্রি মুছবেন?')) {
      try {
        await Promise.all(entries.map(e => deleteDoc(doc(db, 'users', effectiveUid, 'entries', e.id))));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${effectiveUid}/entries/batch`);
      }
    }
  };

  const handleAddEntry = async (entry: Partial<AdEntry>) => {
    const camp = campaigns.find(c => c.id === entry.campId);
    const id = Math.random().toString(36).substring(2, 9);
    const newEntry: AdEntry & { uid: string } = {
      id,
      campName: camp?.name || '',
      ...entry as any,
      uid: effectiveUid
    };
    
    try {
      await setDoc(doc(db, 'users', effectiveUid, 'entries', id), newEntry);
      setQuickAddCampId(undefined);
      if (activeTab === 'entry') setActiveTab('campaigns');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/entries/${id}`);
    }
  };

  const tabs = [
    { id: 'campaigns', label: '📁 Campaigns', icon: LayoutDashboard },
    { id: 'entry', label: '➕ Ad Set এন্ট্রি', icon: PlusCircle },
    { id: 'history', label: '📋 ইতিহাস', icon: History },
    { id: 'report', label: '📈 রিপোর্ট', icon: FileBarChart },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20"
            >
              <TrendingUp className="w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">Ads Tracker Pro</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Performance Monitor</p>
              </div>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Rate</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500">$1 =</span>
                  <input 
                    type="number" 
                    className="w-10 bg-transparent border-none focus:ring-0 text-sm font-mono font-bold text-blue-600 p-0 text-right"
                    value={usdRate}
                    onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Status</span>
                  <span className="text-[10px] font-black text-slate-900">Connected</span>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {!isAuthReady ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border border-slate-200 p-1.5 mb-8 rounded-2xl flex gap-1 shadow-sm sticky top-4 z-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all relative overflow-hidden group",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon className={cn("w-4 h-4 transition-transform duration-300", activeTab === tab.id ? "scale-110" : "group-hover:scale-110")} />
              <span className="text-[10px] font-bold tracking-wide">{tab.label.split(' ')[1]}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <main className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'campaigns' && (
              <motion.div 
                key="campaigns"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <DateBar currentRange={dateRange} onRangeChange={setDateRange} />
                  
                  {/* Company Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSelectedCompany('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border",
                        selectedCompany === 'all' 
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                          : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                      )}
                    >
                      🏢 সব কোম্পানি
                    </button>
                    {uniqueCompanies.map(company => (
                      <button
                        key={company}
                        onClick={() => setSelectedCompany(company)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border",
                          selectedCompany === company 
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                            : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                        )}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">
                      {selectedCompany === 'all' ? 'সব Campaign একনজরে' : `${selectedCompany}-এর Campaign`}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">আপনার সব ক্যাম্পেইনের বিস্তারিত রিপোর্ট</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCampModalOpen(true)} 
                    className="btn btn-primary py-2 px-4 text-xs gap-2 rounded-2xl"
                  >
                    <PlusCircle className="w-4 h-4" /> নতুন Campaign
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <StatsCard label="মোট Spend" value={totals.spend} type="danger" icon={<DollarSign className="w-4 h-4" />} />
                  <StatsCard label="মোট Revenue" value={totals.rev} type="success" icon={<Wallet className="w-4 h-4" />} />
                  <StatsCard label="নেট লাভ" value={totals.profit} type={totals.profit >= 0 ? 'success' : 'danger'} icon={<TrendingUp className="w-4 h-4" />} />
                  <StatsCard label="মোট Sale" value={totals.sales + ' টি'} type="info" icon={<ShoppingBag className="w-4 h-4" />} />
                </div>

                <div className="space-y-3">
                  {filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map(c => (
                      <CampaignCard 
                        key={c.id}
                        campaign={c}
                        entries={filteredEntries.filter(e => e.campId === c.id)}
                        allEntries={entries}
                        onEdit={setEditingCamp}
                        onDelete={handleDeleteCampaign}
                        onAddEntry={(id) => { setQuickAddCampId(id); setActiveTab('entry'); }}
                        onUpdateAdset={(campId, name, status) => setUpdatingAdset({ campId, name, status })}
                        onEditEntry={setEditingEntryId}
                        onDeleteEntry={handleDeleteEntry}
                      />
                    ))
                  ) : (
                    <div className="card p-12 text-center text-slate-400 italic text-sm">
                      {selectedCompany === 'all' 
                        ? 'কোনো Campaign নেই। উপরে "+ নতুন Campaign" চাপুন।' 
                        : `"${selectedCompany}"-এর কোনো Campaign পাওয়া যায়নি।`}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'entry' && (
              <motion.div 
                key="entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <EntryForm 
                  campaigns={campaigns} 
                  entries={entries} 
                  onAdd={handleAddEntry} 
                  initialCampId={quickAddCampId}
                  usdRate={usdRate}
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <DateBar currentRange={dateRange} onRangeChange={setDateRange} />
                  
                  {/* Company Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      onClick={() => setSelectedCompany('all')}
                      className={cn(
                        "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                        selectedCompany === 'all' 
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                      )}
                    >
                      🏢 সব কোম্পানি
                    </button>
                    {uniqueCompanies.map(company => (
                      <button
                        key={company}
                        onClick={() => setSelectedCompany(company)}
                        className={cn(
                          "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                          selectedCompany === company 
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                        )}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
                <HistoryTable 
                  entries={filteredEntries} 
                  onEdit={setEditingEntryId}
                  onDelete={handleDeleteEntry}
                  onClearAll={handleClearAllEntries}
                />
              </motion.div>
            )}

            {activeTab === 'report' && (
              <motion.div 
                key="report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <DateBar currentRange={dateRange} onRangeChange={setDateRange} />
                  
                  {/* Company Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      onClick={() => setSelectedCompany('all')}
                      className={cn(
                        "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                        selectedCompany === 'all' 
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                      )}
                    >
                      🏢 সব কোম্পানি
                    </button>
                    {uniqueCompanies.map(company => (
                      <button
                        key={company}
                        onClick={() => setSelectedCompany(company)}
                        className={cn(
                          "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2",
                          selectedCompany === company 
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                        )}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
                <ReportView entries={filteredEntries} campaigns={campaigns} dateRange={dateRange} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Modals */}
        <Modal 
          isOpen={isCampModalOpen} 
          onClose={() => setIsCampModalOpen(false)} 
          title="🆕 নতুন Campaign"
        >
          <form onSubmit={handleAddCampaign} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Campaign নাম</label>
                <input name="name" type="text" className="input" placeholder="যেমন: Course FB Ad" required />
              </div>
              <Combobox
                label="Company / Client"
                name="company"
                options={uniqueCompanies}
                value={newCampCompany}
                onChange={setNewCampCompany}
                placeholder="যেমন: XYZ Ltd"
              />
            </div>
            <div className="field">
              <label className="label">Platform</label>
              <select name="platform" className="input">
                <option>Facebook</option><option>Instagram</option><option>Google</option>
                <option>TikTok</option><option>YouTube</option><option>Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label">শুরুর তারিখ</label>
                <input name="start" type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="field">
                <label className="label">শেষের তারিখ (ঐচ্ছিক)</label>
                <input name="end" type="date" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Product দাম (BDT)</label>
                <input name="price" type="number" className="input" placeholder="০" />
              </div>
              <div className="field">
                <label className="label">Product Cost (BDT)</label>
                <input name="cost" type="number" className="input" placeholder="০" />
              </div>
            </div>
            <div className="field">
              <label className="label">নোট</label>
              <input name="note" type="text" className="input" placeholder="ঐচ্ছিক" />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">তৈরি করুন</button>
          </form>
        </Modal>

        <Modal 
          isOpen={!!editingCamp} 
          onClose={() => setEditingCamp(null)} 
          title="✏️ Campaign সম্পাদনা"
        >
          {editingCamp && (
            <form 
              onSubmit={handleUpdateCampaign} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Campaign নাম</label>
                  <input name="name" type="text" className="input" defaultValue={editingCamp.name} required />
                </div>
                <Combobox
                  label="Company / Client"
                  name="company"
                  options={uniqueCompanies}
                  value={editCampCompany}
                  onChange={setEditCampCompany}
                  placeholder="যেমন: XYZ Ltd"
                />
              </div>
              <div className="field">
                <label className="label">Platform</label>
                <select name="platform" className="input" defaultValue={editingCamp.platform}>
                  <option>Facebook</option><option>Instagram</option><option>Google</option>
                  <option>TikTok</option><option>YouTube</option><option>Other</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Status</label>
                <select name="status" className="input" defaultValue={editingCamp.status}>
                  <option value="active">🟢 Active</option>
                  <option value="paused">🟡 Paused</option>
                  <option value="ended">⚫ Ended</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">শুরুর তারিখ</label>
                  <input name="start" type="date" className="input" defaultValue={editingCamp.start} />
                </div>
                <div className="field">
                  <label className="label">শেষের তারিখ</label>
                  <input name="end" type="date" className="input" defaultValue={editingCamp.end} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Product দাম (BDT)</label>
                  <input name="price" type="number" className="input" defaultValue={editingCamp.defaultPrice} />
                </div>
                <div className="field">
                  <label className="label">Product Cost (BDT)</label>
                  <input name="cost" type="number" className="input" defaultValue={editingCamp.defaultCost} />
                </div>
              </div>
              <div className="field">
                <label className="label">নোট</label>
                <input name="note" type="text" className="input" defaultValue={editingCamp.note} />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2">আপডেট করুন</button>
            </form>
          )}
        </Modal>

        {/* Update Adset Status Modal */}
        <Modal
          isOpen={!!updatingAdset}
          onClose={() => setUpdatingAdset(null)}
          title="🔄 Ad Set আপডেট করুন"
        >
          {updatingAdset && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 font-medium">
                Ad Set: <span className="text-slate-900">{updatingAdset.name}</span>
              </div>
              <div className="field">
                <label className="label">Status আপডেট</label>
                <select 
                  className="input" 
                  defaultValue={updatingAdset.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as Status;
                    const affectedEntries = entries.filter(ent => 
                      ent.campId === updatingAdset.campId && ent.adset === updatingAdset.name
                    );
                    
                    try {
                      await Promise.all(affectedEntries.map(ent => 
                        setDoc(doc(db, 'users', effectiveUid, 'entries', ent.id), { ...ent, adsetStatus: newStatus })
                      ));
                      setUpdatingAdset(null);
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/entries/batch`);
                    }
                  }}
                >
                  <option value="active">🟢 Active</option>
                  <option value="paused">🟡 Paused</option>
                  <option value="ended">⚫ Ended</option>
                </select>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                * এটি এই Ad Set-এর সব এন্ট্রির স্ট্যাটাস পরিবর্তন করবে।
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Entry Modal */}
        <Modal
          isOpen={editingEntryId !== null}
          onClose={() => setEditingEntryId(null)}
          title="✏️ এন্ট্রি সম্পাদনা"
        >
          {editingEntryId !== null && entries.find(e => e.id === editingEntryId) && (() => {
            const entry = entries.find(e => e.id === editingEntryId)!;
            return (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) return;
                  const formData = new FormData(e.currentTarget);
                  const spendUSD = parseFloat(formData.get('spendUSD') as string) || 0;
                  const spendBDT = Math.round(spendUSD * usdRate);
                  const sales = parseInt(formData.get('sales') as string) || 0;
                  const price = parseFloat(formData.get('price') as string) || 0;
                  const cost = parseFloat(formData.get('cost') as string) || 0;
                  const other = parseFloat(formData.get('other') as string) || 0;
                  const rev = parseFloat(formData.get('rev') as string) || (sales * price);
                  const prodCostTotal = sales * cost;
                  const totalCost = spendBDT + prodCostTotal + other;
                  const profit = rev - totalCost;
                  
                  const updated: AdEntry = {
                    ...entry,
                    date: formData.get('date') as string,
                    adsetStatus: formData.get('status') as Status,
                    spendUSD,
                    spendBDT,
                    sales,
                    price,
                    cost,
                    other,
                    rev,
                    prodCostTotal,
                    totalCost,
                    profit,
                    roas: spendBDT > 0 ? parseFloat((rev / spendBDT).toFixed(2)) : 0,
                    cpp: sales > 0 ? spendUSD / sales : 0,
                    cps: sales > 0 ? Math.round(totalCost / sales) : 0,
                    note: formData.get('note') as string
                  };
                  
                  try {
                    await setDoc(doc(db, 'users', effectiveUid, 'entries', entry.id), updated);
                    setEditingEntryId(null);
                  } catch (err) {
                    handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/entries/${entry.id}`);
                  }
                }} 
                className="space-y-4"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {entry.campName} &gt; {entry.adset}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label className="label">তারিখ</label>
                    <input name="date" type="date" className="input" defaultValue={entry.date} />
                  </div>
                  <div className="field">
                    <label className="label">Status</label>
                    <select name="status" className="input" defaultValue={entry.adsetStatus}>
                      <option value="active">🟢 Active</option>
                      <option value="paused">🟡 Paused</option>
                      <option value="ended">⚫ Ended</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label className="label">Spend (USD)</label>
                    <input name="spendUSD" type="number" step="0.01" className="input" defaultValue={entry.spendUSD} />
                  </div>
                  <div className="field">
                    <label className="label">Sale</label>
                    <input name="sales" type="number" className="input" defaultValue={entry.sales} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label className="label">Product দাম</label>
                    <input name="price" type="number" className="input" defaultValue={entry.price} />
                  </div>
                  <div className="field">
                    <label className="label">Revenue</label>
                    <input name="rev" type="number" className="input" defaultValue={entry.rev} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label className="label">Product Cost</label>
                    <input name="cost" type="number" className="input" defaultValue={entry.cost} />
                  </div>
                  <div className="field">
                    <label className="label">অন্যান্য খরচ</label>
                    <input name="other" type="number" className="input" defaultValue={entry.other} />
                  </div>
                </div>
                <div className="field">
                  <label className="label">নোট</label>
                  <input name="note" type="text" className="input" defaultValue={entry.note} />
                </div>
                <button type="submit" className="btn btn-primary w-full mt-2">আপডেট করুন</button>
              </form>
            );
          })()}
        </Modal>
      </>
    )}
  </div>
</div>
  );
}
