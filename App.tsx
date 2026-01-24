
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Home, Wallet, TrendingUp, Grid, Plus, PieChart, ArrowUpCircle, ArrowDownCircle, Trash2, Bot, X, Settings, LogOut, User as UserIcon, Lock, ChevronRight, Globe, Moon, Sun, Edit2, LayoutDashboard, Eye, EyeOff, ShieldAlert, Cloud, Server, Database, AlertCircle, CheckCircle2, Mail, KeyRound, BarChart3, ExternalLink, MessageCircle, HelpCircle, Loader2, Download, RefreshCw, Zap, List, FileText, UserCog, Save, Tag, Search, Calendar, Trophy, Sparkles, ChevronLeft, ArrowUp, ArrowLeft, History, FileDown, ShieldCheck } from 'lucide-react';
import { Transaction, TransactionType, ViewState, Category, UserProfile, CurrencyCode, CURRENCY_SYMBOLS, Theme } from './types';
import { Investments } from './components/Investments';
import { Tools } from './components/Tools';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { getFinancialAdvice } from './services/geminiService';
import { sbLogin, sbSignup, sbLogout, sbSaveTransaction, sbLoadTransactions, sbDeleteTransaction, sbUpdateProfile, sbResetPassword, sbUpdateUserPassword, sbGetOrCreateProfile, supabase } from './services/supabaseService';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

// --- ANIMATION COMPONENTS ---

const AnimatedNumber = ({ value, currency, privacyMode, precision = 0 }: { value: number, currency: CurrencyCode, privacyMode: boolean, precision?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        let start = displayValue;
        const end = value;
        const duration = 800;
        let startTimestamp: number | null = null;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOutQuad = (t: number) => t * (2 - t);
            const current = start + (end - start) * easeOutQuad(progress);
            setDisplayValue(current);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, privacyMode]);

    if (privacyMode) return <span>••••</span>;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return <span>{symbol}{displayValue.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}</span>;
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bg = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-indigo-600';
    
    return (
        <div className={`fixed top-6 right-6 z-[100] ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl animate-slide-down flex items-center gap-3 font-bold`}>
            {type === 'success' ? <CheckCircle2 size={20} /> : type === 'error' ? <AlertCircle size={20} /> : <Sparkles size={20} />}
            {message}
        </div>
    );
};

// --- CONSTANTS & HELPERS ---
const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#84cc16', '#06b6d4', '#d946ef', '#f97316'];

const INCOME_CATEGORIES = [
    Category.SALARY, Category.FREELANCE, Category.BUSINESS, Category.INVESTMENTS, 
    Category.RENTAL, Category.DIVIDENDS, Category.INTEREST, Category.BONUS, 
    Category.REFUNDS, Category.GIFTS, Category.GRANTS, Category.OTHERS
];

const EXPENSE_CATEGORIES = [
    Category.FOOD, Category.GROCERIES, Category.HOUSING, Category.BILLS, 
    Category.TRAVEL, Category.SHOPPING, Category.MEDICAL, Category.ENTERTAINMENT, 
    Category.EDUCATION, Category.DEBT, Category.INSURANCE, Category.PERSONAL, 
    Category.TAXES, Category.CHARITY, Category.OTHERS
];

// --- COMPONENTS ---

const GlassCard = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => (
    <div 
        style={{ animationDelay: `${delay}ms` }}
        className={`glass-morphism shadow-xl rounded-[2.5rem] card-hover animate-slide-up opacity-0 ${className}`}
    >
        {children}
    </div>
);

const StatCard = ({ title, amount, type, currency, privacyMode, subtitle, delay = 0 }: { title: string, amount: number, type: 'neutral' | 'success' | 'danger', currency: CurrencyCode, privacyMode: boolean, subtitle?: React.ReactNode, delay?: number }) => {
  const getGradient = () => {
      switch(type) {
          case 'success': return 'from-emerald-500/10 to-teal-500/5 border-emerald-500/10 dark:from-emerald-500/20';
          case 'danger': return 'from-rose-500/10 to-orange-500/5 border-rose-500/10 dark:from-rose-500/20';
          default: return 'from-indigo-500/10 to-purple-500/5 border-indigo-500/10 dark:from-indigo-500/20';
      }
  };
  const getIconColor = () => {
      switch(type) {
          case 'success': return 'text-emerald-500';
          case 'danger': return 'text-rose-500';
          default: return 'text-indigo-500';
      }
  };

  return (
    <GlassCard delay={delay} className={`p-6 relative overflow-hidden group bg-gradient-to-br ${getGradient()}`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-all transform group-hover:scale-125 duration-700 ${getIconColor()}`}>
          {type === 'success' ? <TrendingUp size={100} /> : type === 'danger' ? <TrendingUp size={100} className="rotate-180"/> : <Wallet size={100}/>}
      </div>
      <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">{title}</p>
          <h3 className={`text-4xl font-black tracking-tight ${type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : type === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
            <AnimatedNumber value={amount} currency={currency} privacyMode={privacyMode} precision={0} />
          </h3>
          {subtitle && <div className="mt-4">{subtitle}</div>}
      </div>
    </GlassCard>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, desktop }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden active:scale-95 ${
      desktop 
        ? (active ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:text-gray-900 dark:hover:text-white') 
        : (active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600')
    }`}
  >
    {desktop && active && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />}
    <Icon size={desktop ? 22 : 26} strokeWidth={active ? 3 : 2} className={`transition-all duration-500 ${active && desktop ? 'scale-110 drop-shadow-md' : 'group-hover:scale-125'}`} />
    <span className={`${desktop ? 'text-sm font-black tracking-tight' : 'hidden'}`}>{label}</span>
  </button>
);

const MonthSelector = ({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (d: Date) => void }) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return (
        <div className="flex items-center gap-2 p-1.5 glass-morphism rounded-2xl overflow-x-auto no-scrollbar max-w-full">
            {months.map((m, idx) => {
                const isActive = selectedDate.getMonth() === idx;
                return (
                    <button 
                        key={m}
                        onClick={() => onDateChange(new Date(selectedDate.getFullYear(), idx, 1))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${isActive ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800'}`}
                    >
                        {m}
                    </button>
                );
            })}
        </div>
    );
};

const GoalCard = ({ income, expense, currency, privacyMode }: any) => {
    const savings = income - expense;
    const goal = income * 0.2; // 20% savings goal
    const progress = Math.min(100, Math.max(0, (savings / (goal || 1)) * 100));
    
    return (
        <GlassCard className="p-6 bg-gradient-to-br from-brand-600 to-violet-700 text-white border-none" delay={300}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Trophy size={20} className="text-brand-200" /> Savings Target
                    </h4>
                    <p className="text-xs text-brand-100 font-bold opacity-80 uppercase tracking-widest mt-1">Target: 20% of Income</p>
                </div>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <Sparkles size={20} className="text-brand-100 animate-pulse-slow" />
                </div>
            </div>
            
            <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                    <p className="text-3xl font-black">
                        <AnimatedNumber value={savings} currency={currency} privacyMode={privacyMode} />
                    </p>
                    <p className="text-sm font-bold text-brand-100">{progress.toFixed(0)}% Done</p>
                </div>
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div className="h-full bg-gradient-to-r from-brand-300 to-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            
            <p className="text-xs font-medium text-brand-50 italic">
                {progress >= 100 ? "Amazing! You've exceeded your goal. 🚀" : progress >= 50 ? "Over halfway there! Keep pushing. 💪" : "Start saving early to hit your mark. 🎯"}
            </p>
        </GlassCard>
    );
};

// --- MAIN APP ---
const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetMode, setResetMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const userRef = useRef<UserProfile | null>(null);

  // AI Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Settings State
  const [editName, setEditName] = useState("");

  useEffect(() => { userRef.current = user; }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ msg, type });
  };

  const handleLogin = async (loggedInUser: UserProfile) => {
      setLoading(true);
      try {
          setUser(loggedInUser);
          setEditName(loggedInUser.name);
          const txs = await sbLoadTransactions(loggedInUser.id);
          setTransactions(txs);
          showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
      } catch (e) {
          console.error("Login Data Load Error", e);
          showToast("Failed to load your data.", 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleLogout = async () => {
      await sbLogout();
      setUser(null);
      setTransactions([]);
      setView(ViewState.HOME);
      showToast("Logged out successfully.", 'info');
  };

  useEffect(() => {
    const initAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && !window.location.hash.includes('reset-password')) {
               const profile = await sbGetOrCreateProfile(session.user);
               if (profile) { 
                   setUser(profile); 
                   setEditName(profile.name);
                   const txs = await sbLoadTransactions(profile.id); 
                   setTransactions(txs); 
               }
            }
        } catch(e) { console.error("Init Auth Error", e); }
        finally { setLoading(false); }
    };
    initAuth();
  }, []);

  useEffect(() => {
     if(user?.theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, [user?.theme]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        const matchesDate = tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesDate && matchesSearch;
    });
  }, [transactions, selectedDate, searchQuery]);

  const income = useMemo(() => filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const expense = useMemo(() => filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const balance = income - expense;

  const handleAddTx = async (title: string, amount: number, type: TransactionType, selectedCategory: string) => {
     if(!user) return;
     const newTx: Transaction = { id: crypto.randomUUID(), title, amount, type, category: selectedCategory as Category, date: new Date().toISOString() };
     
     // Optimistic UI update
     const updatedTxs = [newTx, ...transactions];
     setTransactions(updatedTxs);
     
     // Background sync
     await sbSaveTransaction(user.id, newTx);
     showToast("Transaction added successfully!", 'success');
     setShowAddTxModal(false);
  };

  const handleDeleteTx = async (id: string) => {
      setTransactions(transactions.filter(t => t.id !== id));
      await sbDeleteTransaction(id);
      showToast("Transaction deleted.", 'info');
  };

  const handleAskAi = async () => {
    if (!chatQuery || !user) return;
    setChatLoading(true);
    const context = `User: ${user.name}, Balance: ${balance}. Month: ${selectedDate.toLocaleString('default', { month: 'long' })}. Txs: ${JSON.stringify(filteredTransactions.slice(0, 5))}`;
    const response = await getFinancialAdvice(chatQuery, context);
    setChatResponse(response);
    setChatLoading(false);
  };

  if (loading) return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 flex flex-col items-center justify-center gap-6">
          <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <Wallet size={24} className="text-brand-600 animate-pulse" />
              </div>
          </div>
          <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-white animate-pulse">Initializing Money Master Pro</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Loading Cloud Sync...</p>
          </div>
      </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-[#fdfdff] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* SIDEBAR */}
        <div className={`hidden md:flex w-80 sticky top-0 z-40 bg-white/50 dark:bg-gray-950/50 backdrop-blur-3xl border-r border-gray-100 dark:border-gray-800 flex-col h-full p-8 transition-all`}>
            <div className="flex items-center gap-4 px-2 mb-12 animate-fade-in">
                <div className="bg-gradient-to-br from-brand-600 to-violet-700 p-4 rounded-3xl text-white shadow-2xl shadow-brand-500/40 animate-scale-up">
                    <Wallet size={28} fill="currentColor" fillOpacity={0.2} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-950 dark:text-white leading-none tracking-tighter">MONEY</h1>
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-violet-700 leading-none tracking-tighter">MASTER</h1>
                </div>
            </div>

            <nav className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Financial Dashboard</p>
                <NavButton desktop active={view === ViewState.HOME} onClick={() => setView(ViewState.HOME)} icon={LayoutDashboard} label="Global Overview" />
                <NavButton desktop active={view === ViewState.EXPENSES} onClick={() => setView(ViewState.EXPENSES)} icon={PieChart} label="Expense Analytics" />
                <NavButton desktop active={view === ViewState.INCOME} onClick={() => setView(ViewState.INCOME)} icon={TrendingUp} label="Income Streams" />
                <NavButton desktop active={view === ViewState.INVESTMENTS} onClick={() => setView(ViewState.INVESTMENTS)} icon={BarChart3} label="Wealth Planner" />
                <NavButton desktop active={view === ViewState.TOOLS} onClick={() => setView(ViewState.TOOLS)} icon={Grid} label="Power Utilities" />
                
                <div className="my-8 border-t border-gray-100 dark:border-gray-800 opacity-50"></div>
                
                <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Profile & Sync</p>
                <NavButton desktop active={view === ViewState.PROFILE} onClick={() => setView(ViewState.PROFILE)} icon={Settings} label="System Settings" />
            </nav>

            <div className="mt-auto pt-8">
                 <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all hover:bg-white dark:hover:bg-gray-800 group cursor-default">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-violet-500 shadow-xl flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-black text-gray-950 dark:text-white truncate">{user.name}</p>
                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                Online Secure
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-[10px] font-black text-rose-500 hover:text-white hover:bg-rose-500 w-full py-3 rounded-2xl transition-all uppercase tracking-widest border border-rose-200 dark:border-rose-900/30">
                        <LogOut size={14} /> Disconnect
                    </button>
                 </div>
            </div>
        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-morphism border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
             <NavButton active={view === ViewState.HOME} onClick={() => setView(ViewState.HOME)} icon={LayoutDashboard} />
             <NavButton active={view === ViewState.EXPENSES} onClick={() => setView(ViewState.EXPENSES)} icon={PieChart} />
             <button onClick={() => setShowAddTxModal(true)} className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white -mt-16 shadow-2xl shadow-brand-500/40 animate-float border-4 border-white dark:border-gray-950 active:scale-90 transition-all">
                <Plus size={28} />
             </button>
             <NavButton active={view === ViewState.TOOLS} onClick={() => setView(ViewState.TOOLS)} icon={Grid} />
             <NavButton active={view === ViewState.PROFILE} onClick={() => setView(ViewState.PROFILE)} icon={Settings} />
        </div>

        {/* GLOBAL FLOATING ACTION BUTTON FOR ADDING TX */}
        <button 
            onClick={() => setShowAddTxModal(true)}
            className="fixed bottom-24 md:bottom-28 right-10 z-50 p-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] shadow-[0_15px_50px_rgba(16,185,129,0.4)] transition-all hover:scale-110 active:scale-90 group hidden md:flex items-center gap-3 overflow-hidden border-2 border-white/20"
        >
            <Plus size={28} />
            <span className="font-black uppercase tracking-widest text-[10px]">Log Entry</span>
        </button>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 glass-morphism z-30 sticky top-0 border-b border-gray-50 dark:border-gray-900">
                <div>
                    <h2 className="text-3xl font-black text-gray-950 dark:text-white tracking-tighter">
                        {view === ViewState.HOME && "Overview"}
                        {view === ViewState.EXPENSES && "Expenses"}
                        {view === ViewState.INCOME && "Income"}
                        {view === ViewState.INVESTMENTS && "Investment Lab"}
                        {view === ViewState.TOOLS && "Utility Center"}
                        {view === ViewState.PROFILE && "Settings"}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-4">
                    <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    <button onClick={() => setShowAddTxModal(true)} className="hidden md:flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 active:scale-95 transition-all">
                        <Plus size={18}/> Quick Add
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#fdfdff] dark:bg-[#0b0f19]">
                <div className="p-8 max-w-7xl mx-auto space-y-10 pb-32">
                    {view === ViewState.HOME && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <StatCard delay={100} title="Liquid Wealth" amount={balance} type="neutral" currency={user.currency} privacyMode={user.privacyMode} subtitle={<div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest"><TrendingUp size={14}/> +4.2% This Month</div>} />
                                <StatCard delay={200} title="Total Inflow" amount={income} type="success" currency={user.currency} privacyMode={user.privacyMode} />
                                <StatCard delay={300} title="Total Outflow" amount={expense} type="danger" currency={user.currency} privacyMode={user.privacyMode} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-10">
                                    <GoalCard income={income} expense={expense} currency={user.currency} privacyMode={user.privacyMode} />
                                    
                                    <GlassCard className="p-8" delay={400}>
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
                                                <Zap className="text-brand-600" size={20} /> Latest Activity
                                            </h3>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    placeholder="Search..."
                                                    className="pl-10 pr-4 py-2 text-xs font-bold glass-morphism rounded-xl outline-none focus:ring-2 ring-brand-500/20 w-40 md:w-60 border-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {filteredTransactions.length === 0 ? (
                                                <div className="py-20 text-center opacity-40">
                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-float"><FileText className="text-gray-400"/></div>
                                                    <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">No Data Found</p>
                                                </div>
                                            ) : (
                                                filteredTransactions.slice(0, 10).map((t, i) => (
                                                    <div key={t.id} className="flex items-center justify-between p-4 glass-morphism rounded-3xl border-transparent hover:border-brand-500/30 transition-all duration-300 group cursor-default hover:scale-[1.02] shadow-sm" style={{ animationDelay: `${i * 100}ms` }}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${t.type === TransactionType.INCOME ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-100/50 text-rose-600 dark:bg-rose-500/10'}`}>
                                                                {t.type === TransactionType.INCOME ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-gray-950 dark:text-white text-base tracking-tight">{t.title}</p>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <span className={`font-black text-xl tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                                                                {t.type === TransactionType.EXPENSE ? '-' : '+'}<AnimatedNumber value={t.amount} currency={user.currency} privacyMode={user.privacyMode} precision={0} />
                                                            </span>
                                                            <button onClick={() => handleDeleteTx(t.id)} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100 active:scale-75">
                                                                <Trash2 size={18}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </GlassCard>
                                </div>

                                <div className="space-y-10">
                                    <div onClick={() => setShowAiChat(true)} className="bg-gradient-to-br from-indigo-900 via-brand-900 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:shadow-brand-500/20 transition-all border border-white/10 card-hover">
                                        <div className="absolute top-0 right-0 w-60 h-60 bg-brand-500/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-brand-500/40 transition-all"></div>
                                        <div className="relative z-10">
                                            <div className="bg-white/10 w-fit p-4 rounded-3xl backdrop-blur-md mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                                <Bot className="text-brand-300" size={32}/>
                                            </div>
                                            <h3 className="text-3xl font-black mb-3 tracking-tighter">AI Financial Brain</h3>
                                            <p className="text-brand-100 mb-8 leading-relaxed font-bold opacity-80 text-sm">
                                                Real-time analysis of your net worth and spending patterns.
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-3">
                                                    {[1,2,3].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-indigo-900 bg-brand-${300 + i*100}`} />)}
                                                </div>
                                                <span className="text-[10px] uppercase tracking-widest font-black text-brand-300">Live Strategic Advice</span>
                                            </div>
                                        </div>
                                    </div>

                                    <GlassCard className="p-8" delay={500}>
                                        <h4 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2"><Sparkles size={18} className="text-brand-600"/> Smart Insights</h4>
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><CheckCircle2 size={18}/></div>
                                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">You saved 12% more than last month. You're on track for your retirement goal.</p>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl"><AlertCircle size={18}/></div>
                                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">Dining out costs increased by $140. Consider setting a weekly limit.</p>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === ViewState.EXPENSES && (
                        <div className="animate-fade-in space-y-8">
                            <StatCard title="Total Expenses" amount={expense} type="danger" currency={user.currency} privacyMode={user.privacyMode} />
                            <TransactionHistoryList transactions={filteredTransactions.filter(t => t.type === TransactionType.EXPENSE)} onDeleteTx={handleDeleteTx} user={user} />
                        </div>
                    )}
                    {view === ViewState.INCOME && (
                        <div className="animate-fade-in space-y-8">
                            <StatCard title="Total Income" amount={income} type="success" currency={user.currency} privacyMode={user.privacyMode} />
                            <TransactionHistoryList transactions={filteredTransactions.filter(t => t.type === TransactionType.INCOME)} onDeleteTx={handleDeleteTx} user={user} />
                        </div>
                    )}
                    {view === ViewState.TOOLS && <Tools currency={user.currency} userId={user.id} privacyMode={user.privacyMode} />}
                    {view === ViewState.INVESTMENTS && <Investments currency={user.currency} privacyMode={user.privacyMode} />}
                    {view === ViewState.PROFILE && (
                        <div className="max-w-4xl mx-auto animate-fade-in space-y-10 pb-20">
                            <GlassCard className="p-10">
                                <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><UserCog size={28} className="text-brand-600"/> Master Profile Settings</h3>
                                <div className="space-y-12">
                                    <div className="flex flex-col md:flex-row items-center gap-8 p-8 glass-morphism rounded-[2.5rem] border-brand-500/10">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-600 to-violet-600 flex items-center justify-center text-white font-black text-5xl shadow-2xl relative group overflow-hidden">
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Edit2 size={24}/></div>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 w-full space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Display Identity</label>
                                                <div className="flex gap-4">
                                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="bg-transparent text-2xl font-black outline-none w-full border-b-4 border-gray-100 dark:border-gray-800 focus:border-brand-600 transition-all pb-3" />
                                                    <button onClick={async () => { await sbUpdateProfile(user.id, {...user, name: editName}); setUser({...user, name: editName}); showToast("Identity Updated", "success"); }} className="px-6 py-4 bg-brand-600 text-white rounded-2xl shadow-xl hover:bg-brand-500 active:scale-95 transition-all flex items-center gap-2 font-black text-xs tracking-widest uppercase"><Save size={18}/> Update</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Global Currency</label>
                                                    <select 
                                                        value={user.currency} 
                                                        onChange={async (e) => { 
                                                            const newCurr = e.target.value as CurrencyCode; 
                                                            const u = {...user, currency: newCurr}; 
                                                            setUser(u); 
                                                            await sbUpdateProfile(user.id, u); 
                                                            showToast("Currency Refreshed", "info");
                                                        }}
                                                        className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl font-black outline-none border-2 border-transparent focus:border-brand-500"
                                                    >
                                                        {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c as CurrencyCode]})</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">System Theme</label>
                                                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                                        <button onClick={async () => { const u = {...user, theme: 'light' as Theme}; setUser(u); await sbUpdateProfile(user.id, u); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${user.theme === 'light' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}><Sun size={18}/> <span className="font-black text-[10px] uppercase">Light</span></button>
                                                        <button onClick={async () => { const u = {...user, theme: 'dark' as Theme}; setUser(u); await sbUpdateProfile(user.id, u); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${user.theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}><Moon size={18}/> <span className="font-black text-[10px] uppercase">Dark</span></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 glass-morphism rounded-[2.5rem] space-y-6">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><ShieldCheck size={16}/> Privacy & Security</h4>
                                            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl">
                                                <div><p className="font-black text-sm">Privacy Shield</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Mask all financial balances</p></div>
                                                <button onClick={() => { const u = {...user, privacyMode: !user.privacyMode}; setUser(u); sbUpdateProfile(user.id, u); }} className={`w-14 h-8 rounded-full transition-all relative ${user.privacyMode ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${user.privacyMode ? 'translate-x-6' : ''}`} /></button>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl opacity-50 cursor-not-allowed">
                                                <div><p className="font-black text-sm">Biometric Lock</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Require ID on Startup</p></div>
                                                <button className="w-14 h-8 rounded-full bg-gray-200 dark:bg-gray-900 relative"><div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"></div></button>
                                            </div>
                                        </div>

                                        <div className="p-8 glass-morphism rounded-[2.5rem] space-y-6">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Database size={16}/> Data Lifecycle</h4>
                                            <button onClick={() => showToast("Exporting data as JSON...", "info")} className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 transition-all">
                                                <div className="flex items-center gap-3"><FileDown size={20}/><span className="font-black text-sm">Export Financial Log</span></div>
                                                <ChevronRight size={16}/>
                                            </button>
                                            <button onClick={() => { if(confirm("Are you ABSOLUTELY sure? This deletes ALL your transaction history forever.")) { setTransactions([]); showToast("All data purged.", "error"); } }} className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 transition-all group">
                                                <div className="flex items-center gap-3 group-hover:animate-shake"><Trash2 size={20}/><span className="font-black text-sm">Purge Account Data</span></div>
                                                <ChevronRight size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            </main>

            {/* AI CHAT MODAL */}
            {showAiChat && (
                <div className="fixed inset-0 z-[60] glass-morphism backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-10 animate-fade-in" onClick={(e) => { if(e.target === e.currentTarget) setShowAiChat(false); }}>
                    <div className="bg-white dark:bg-gray-950 w-full md:max-w-3xl h-[90vh] md:h-[700px] rounded-t-[3rem] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden animate-slide-up border border-white/20 dark:border-gray-800">
                        <div className="p-8 bg-brand-600 text-white flex justify-between items-center z-10">
                             <div className="flex items-center gap-5">
                                 <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md shadow-inner">
                                     <Bot size={32} />
                                 </div>
                                 <div>
                                     <h3 className="font-black text-2xl tracking-tighter">Money Strategic Brain</h3>
                                     <div className="flex items-center gap-2">
                                         <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]"></span>
                                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Quantum Processor Active</p>
                                     </div>
                                 </div>
                             </div>
                             <button onClick={() => setShowAiChat(false)} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-75"><X size={24} /></button>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50 dark:bg-[#0b0f19] custom-scrollbar space-y-8">
                            {chatResponse ? (
                                <div className="space-y-8">
                                    <div className="flex justify-end animate-slide-up">
                                        <div className="bg-brand-600 text-white p-6 rounded-3xl rounded-tr-none max-w-[85%] shadow-xl font-bold leading-relaxed">
                                            {chatQuery}
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
                                        <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center shrink-0 mt-2 shadow-lg">
                                            <Bot size={20} className="text-white"/>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] rounded-tl-none max-w-[90%] shadow-sm prose dark:prose-invert font-medium text-gray-700 dark:text-gray-300 leading-loose border border-gray-100 dark:border-gray-800">
                                            <div dangerouslySetInnerHTML={{ __html: chatResponse.replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-600 dark:text-brand-400">$1</strong>').replace(/\n/g, '<br/>') }} />
                                        </div>
                                    </div>
                                    <div className="flex justify-center pt-10">
                                        <button onClick={() => { setChatResponse(""); setChatQuery(""); }} className="flex items-center gap-3 bg-white dark:bg-gray-900 border-2 border-brand-100 dark:border-gray-800 text-brand-600 dark:text-brand-400 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-50 transition-all shadow-md active:scale-95">
                                            <RefreshCw size={16}/> New Strategic Query
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="p-8 bg-brand-50 dark:bg-brand-900/10 rounded-full mb-8 animate-float">
                                        <Bot size={100} className="text-brand-600 opacity-40" />
                                    </div>
                                    <h4 className="font-black text-3xl text-gray-950 dark:text-white mb-3 tracking-tighter">Strategic Insights Await</h4>
                                    <p className="text-sm font-bold text-gray-500 max-w-sm leading-relaxed uppercase tracking-wide opacity-60">Ready to optimize your net worth or simulate retirement scenarios.</p>
                                </div>
                            )}
                        </div>
                        {!chatResponse && (
                            <div className="p-8 glass-morphism z-10">
                                <div className="relative flex items-center gap-4">
                                    <input 
                                        autoFocus
                                        value={chatQuery}
                                        onChange={e => setChatQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAskAi()}
                                        placeholder="Ask for strategic advice..."
                                        className="w-full bg-white dark:bg-gray-900 rounded-[2rem] p-6 pr-20 font-bold outline-none ring-4 ring-transparent focus:ring-brand-500/10 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-xl border border-gray-100 dark:border-gray-800"
                                        disabled={chatLoading}
                                    />
                                    <button 
                                        onClick={handleAskAi}
                                        disabled={chatLoading || !chatQuery}
                                        className="absolute right-3 top-3 p-4 bg-brand-600 text-white rounded-2xl shadow-xl shadow-brand-500/30 hover:bg-brand-500 disabled:opacity-50 transition-all active:scale-90"
                                    >
                                        {chatLoading ? <Loader2 className="animate-spin" size={24} /> : <ArrowUpCircle size={24} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* QUICK ADD TRANSACTION MODAL */}
            {showAddTxModal && (
                <div className="fixed inset-0 z-[70] glass-morphism backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={(e) => { if(e.target === e.currentTarget) setShowAddTxModal(false); }}>
                    <div className="bg-white dark:bg-gray-950 w-full max-w-lg rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] p-8 animate-scale-up border border-gray-100 dark:border-gray-800 relative">
                        <button onClick={() => setShowAddTxModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
                        <h3 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-2"><Plus className="text-emerald-600" size={24}/> Log Transaction</h3>
                        <AddTransactionForm onAdd={handleAddTx} user={user} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

// Sub-component for Transaction History
const TransactionHistoryList = ({ transactions, onDeleteTx, user }: any) => (
    <GlassCard className="p-8">
        <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight mb-8">History Log</h3>
        <div className="space-y-4">
            {transactions.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                    <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">No Data Recorded</p>
                </div>
            ) : (
                transactions.map((t: Transaction, i: number) => (
                    <div key={t.id} className="flex items-center justify-between p-4 glass-morphism rounded-3xl border-transparent hover:border-brand-500/30 transition-all duration-300 group cursor-default">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-100/50 text-rose-600 dark:bg-rose-500/10'}`}>
                                {t.type === TransactionType.INCOME ? <ArrowUpCircle size={24}/> : <ArrowDownCircle size={24}/>}
                            </div>
                            <div>
                                <p className="font-black text-gray-950 dark:text-white text-base tracking-tight">{t.title}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className={`font-black text-xl tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                                {t.type === TransactionType.EXPENSE ? '-' : '+'}<AnimatedNumber value={t.amount} currency={user.currency} privacyMode={user.privacyMode} precision={0} />
                            </span>
                            <button onClick={() => onDeleteTx(t.id)} className="text-gray-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))
            )}
        </div>
    </GlassCard>
);

// Form for Adding Transactions
const AddTransactionForm = ({ onAdd, user }: any) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [category, setCategory] = useState('');

    const availableCategories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    useEffect(() => {
        setCategory(availableCategories[0]);
    }, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amtValue = parseFloat(amount);
        if (!title || isNaN(amtValue)) return;
        onAdd(title, amtValue, type, category);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-700 shadow-md text-rose-500' : 'text-gray-400'}`}>Expense</button>
                <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-gray-700 shadow-md text-emerald-500' : 'text-gray-400'}`}>Income</button>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Rent, Salary, Dinner..." className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-500 transition-all text-gray-950 dark:text-white"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{CURRENCY_SYMBOLS[user.currency as CurrencyCode]}</span>
                        <input type="number" step="any" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 dark:bg-gray-900 p-5 pl-10 rounded-2xl font-black outline-none border-2 border-transparent focus:border-brand-500 transition-all text-gray-950 dark:text-white"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-500 transition-all text-gray-950 dark:text-white appearance-none cursor-pointer">
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-500/20 active:scale-95 transition-all mt-4">Save Entry</button>
        </form>
    );
};

const AuthScreen = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [isReset, setIsReset] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState<CurrencyCode>('USD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            if (isReset) {
                const { success, error } = await sbResetPassword(email);
                if (success) setMessage("Password reset link sent to your email.");
                else setError(error);
            } else if (isSignup) {
                const { success, error, msg } = await sbSignup(email, password, name, currency);
                if (success) setMessage(msg || "Signup successful! Please check your email or log in.");
                else setError(error);
            } else {
                const { user, error } = await sbLogin(email, password);
                if (user) onLogin(user);
                else setError(error);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (window.location.hash.includes('reset-password')) {
        return <ResetPasswordPage onCancel={() => { window.location.hash = ""; window.location.reload(); }} />;
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <Wallet size={32} className="text-white" />
                    </div>
                </div>
                
                <h2 className="text-3xl font-black text-center mb-2 text-white tracking-tight">
                    {isReset ? "Reset Access" : isSignup ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-center text-indigo-200 mb-8 font-medium text-sm">
                    {isReset ? "We'll send you a recovery link" : isSignup ? "Join Money Master Pro today" : "Login to your secure dashboard"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Full Name</label>
                            <input 
                                value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white transition-all" 
                                placeholder="John Doe" required={isSignup}
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Email Address</label>
                        <input 
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white transition-all" 
                            placeholder="name@company.com" required
                        />
                    </div>
                    {!isReset && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Password</label>
                            <input 
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white transition-all" 
                                placeholder="••••••••" required={!isReset} minLength={6}
                            />
                        </div>
                    )}
                    {isSignup && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Preferred Currency</label>
                            <select 
                                value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}
                                className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white transition-all appearance-none"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                        </div>
                    )}

                    <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" /> : (isReset ? "SEND LINK" : isSignup ? "CREATE ACCOUNT" : "SIGN IN")}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                    {!isReset ? (
                        <>
                            <button onClick={() => setIsSignup(!isSignup)} className="text-center text-xs font-bold text-indigo-300 hover:text-white transition-colors">
                                {isSignup ? "ALREADY HAVE AN ACCOUNT? LOG IN" : "NEED AN ACCOUNT? SIGN UP"}
                            </button>
                            {!isSignup && (
                                <button onClick={() => setIsReset(true)} className="text-center text-xs font-bold text-gray-400 hover:text-white transition-colors">
                                    FORGOT PASSWORD?
                                </button>
                            )}
                        </>
                    ) : (
                        <button onClick={() => setIsReset(false)} className="text-center text-xs font-bold text-indigo-300 hover:text-white transition-colors">
                            BACK TO LOGIN
                        </button>
                    )}
                </div>

                {error && <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl text-xs font-bold text-center">{error}</div>}
                {message && <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-xl text-xs font-bold text-center">{message}</div>}
            </div>
        </div>
    );
};

export default App;
