
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Wallet, TrendingUp, Grid, Plus, PieChart, ArrowUpCircle, ArrowDownCircle, Trash2, Bot, X, Settings, LogOut, User as UserIcon, Lock, ChevronRight, Globe, Moon, Sun, Edit2, LayoutDashboard, Eye, EyeOff, ShieldAlert, Cloud, Server, Database, AlertCircle, CheckCircle2, Mail, KeyRound, BarChart3, ExternalLink, MessageCircle, HelpCircle, Loader2, Download, RefreshCw, Zap, List, FileText, UserCog, Save, Tag } from 'lucide-react';
import { Transaction, TransactionType, ViewState, Category, UserProfile, CurrencyCode, CURRENCY_SYMBOLS, Theme } from './types';
import { Investments } from './components/Investments';
import { Tools } from './components/Tools';
import { getFinancialAdvice } from './services/geminiService';
import { sbLogin, sbSignup, sbLogout, sbSaveTransaction, sbLoadTransactions, sbDeleteTransaction, sbUpdateProfile, sbResetPassword, sbUpdateUserPassword, sbGetOrCreateProfile, supabase } from './services/supabaseService';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

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

const formatCurrency = (amount: number, code: CurrencyCode, privacyMode: boolean = false) => {
  if (privacyMode) return '••••';
  const symbol = CURRENCY_SYMBOLS[code] || code;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// --- COMPONENTS ---

// 1. Futuristic Card Component
const GlassCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl rounded-[2rem] ${className}`}>
        {children}
    </div>
);

// 2. Stat Card
const StatCard = ({ title, amount, type, currency, privacyMode, subtitle }: { title: string, amount: number, type: 'neutral' | 'success' | 'danger', currency: CurrencyCode, privacyMode: boolean, subtitle?: React.ReactNode }) => {
  const getGradient = () => {
      switch(type) {
          case 'success': return 'from-emerald-500/20 to-teal-500/5 border-emerald-500/20';
          case 'danger': return 'from-rose-500/20 to-orange-500/5 border-rose-500/20';
          default: return 'from-indigo-500/20 to-purple-500/5 border-indigo-500/20';
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
    <GlassCard className={`p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${getGradient()}`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 ${getIconColor()}`}>
          {type === 'success' ? <TrendingUp size={80} /> : type === 'danger' ? <TrendingUp size={80} className="rotate-180"/> : <Wallet size={80}/>}
      </div>
      <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">{title}</p>
          <h3 className={`text-3xl md:text-4xl font-black ${type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : type === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
            {formatCurrency(amount, currency, privacyMode)}
          </h3>
          {subtitle && <div className="mt-3">{subtitle}</div>}
      </div>
    </GlassCard>
  );
};

// 3. Navigation Button
const NavButton = ({ active, onClick, icon: Icon, label, desktop }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
      desktop 
        ? (active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white') 
        : (active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600')
    }`}
  >
    {desktop && active && <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />}
    <Icon size={desktop ? 20 : 24} strokeWidth={active ? 2.5 : 2} className={`transition-transform duration-300 ${active && desktop ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className={`${desktop ? 'text-sm font-bold tracking-wide' : 'hidden'}`}>{label}</span>
  </button>
);

// 4. Sidebar
const Sidebar = ({ view, setView, handleLogout, user, isMobile }: any) => (
    <div className={`${isMobile ? 'flex w-full' : 'hidden md:flex w-72 sticky top-0 z-40 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800'} flex-col h-full p-6`}>
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                <Wallet size={24} fill="currentColor" fillOpacity={0.2} />
            </div>
            <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">MONEY</h1>
                <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 leading-none tracking-tight">MASTER PRO</h1>
            </div>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Main Menu</p>
            <NavButton desktop active={view === ViewState.HOME} onClick={() => setView(ViewState.HOME)} icon={LayoutDashboard} label="Dashboard" />
            <NavButton desktop active={view === ViewState.EXPENSES} onClick={() => setView(ViewState.EXPENSES)} icon={PieChart} label="Expenses" />
            <NavButton desktop active={view === ViewState.INCOME} onClick={() => setView(ViewState.INCOME)} icon={TrendingUp} label="Income" />
            <NavButton desktop active={view === ViewState.INVESTMENTS} onClick={() => setView(ViewState.INVESTMENTS)} icon={BarChart3} label="Investments" />
            <NavButton desktop active={view === ViewState.TOOLS} onClick={() => setView(ViewState.TOOLS)} icon={Grid} label="Power Tools" />
            
            <div className="my-6 border-t border-gray-200 dark:border-gray-800"></div>
            
            <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">System</p>
            <NavButton desktop active={view === ViewState.PROFILE} onClick={() => setView(ViewState.PROFILE)} icon={Settings} label="Settings" />
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
             <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md flex items-center justify-center text-white font-bold text-sm">
                     {user.name.charAt(0)}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${user.cloudConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`}></span>
                        {user.cloudConnected ? 'Online' : 'Offline'}
                     </p>
                 </div>
             </div>
             <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 w-full p-3 rounded-xl transition-all uppercase tracking-wide">
                <LogOut size={16} /> Disconnect
             </button>
        </div>
    </div>
);

// 5. Auth Screen
const AuthScreen = ({ onLogin }: { onLogin: (p: UserProfile) => Promise<void> | void }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState<CurrencyCode>('USD');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccessMsg(''); setLoading(true);
        const cleanEmail = email.trim().toLowerCase();
        
        try {
            if (mode === 'forgot') {
                const { success, error } = await sbResetPassword(cleanEmail);
                setLoading(false);
                if (success) setSuccessMsg("Reset link sent! Check your email."); else setError(error || "Failed.");
                return;
            }

            if (mode === 'login') {
                const { user, error } = await sbLogin(cleanEmail, password);
                if (error) {
                    setLoading(false);
                    setError(error);
                } else if (user) {
                    // Pass to App to handle loading data
                    await onLogin(user);
                    // Loading state is managed by App now, but just in case:
                    setLoading(false);
                }
            } else {
                const { success, error, msg } = await sbSignup(cleanEmail, password, name, currency);
                setLoading(false);
                if (error) setError(error); else if (success) {
                    if (msg) { setSuccessMsg(msg); setMode('login'); setPassword(''); } else { 
                        // Auto login after signup
                        const { user } = await sbLogin(cleanEmail, password); 
                        if(user) await onLogin(user); 
                    }
                }
            }
        } catch (e) {
            setLoading(false);
            setError("An unexpected error occurred.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <Wallet size={40} className="text-white" />
                    </div>
                </div>
                <h2 className="text-4xl font-black text-center mb-2 text-white tracking-tight">Money Master Pro</h2>
                <p className="text-center text-indigo-200 mb-8 font-medium">Next Gen Financial Management</p>
                
                {mode !== 'forgot' && (
                    <div className="flex p-1.5 bg-black/20 rounded-2xl mb-6 backdrop-blur-md">
                        <button onClick={() => setMode('login')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>LOG IN</button>
                        <button onClick={() => setMode('signup')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>SIGN UP</button>
                    </div>
                )}

                {successMsg ? (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 p-6 rounded-2xl text-center">
                         <Mail className="mx-auto mb-4 text-emerald-400" size={32} />
                         <p className="text-emerald-200 font-bold mb-4">{successMsg}</p>
                         <button onClick={() => { setSuccessMsg(''); setMode('login'); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all">Back to Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleAuth} className="space-y-4">
                        {mode === 'signup' && (
                            <input className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white placeholder-gray-500 transition-all" value={name} onChange={e => setName(e.target.value)} required placeholder="Full Name" />
                        )}
                        <input type="email" className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white placeholder-gray-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address" />
                        
                        {mode !== 'forgot' && (
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white placeholder-gray-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-500 hover:text-white">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                            </div>
                        )}
                        {mode === 'login' && <div className="flex justify-end"><button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Forgot Password?</button></div>}

                        {mode === 'signup' && (
                            <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white transition-all cursor-pointer">
                                {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c} className="bg-gray-900">{c} ({CURRENCY_SYMBOLS[c as CurrencyCode]})</option>)}
                            </select>
                        )}

                        <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-4 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="animate-spin" /> : (mode === 'forgot' ? "SEND RESET LINK" : (mode === 'login' ? "ACCESS ACCOUNT" : "CREATE PROFILE"))}
                        </button>
                        {mode === 'forgot' && <button type="button" onClick={() => setMode('login')} className="w-full text-gray-400 font-bold py-3 text-sm hover:text-white">Back to Login</button>}
                    </form>
                )}
                {error && <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 text-red-200 font-bold rounded-xl text-sm flex items-center gap-2"><AlertCircle size={18} className="shrink-0"/> {error}</div>}
            </div>
        </div>
    );
};

// 6. Dashboard & Content
const DashboardContent = ({ view, user, transactions, balance, income, expense, onAddTx, onDeleteTx, onOpenAi }: any) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loadingCat, setLoadingCat] = useState(false);
    
    // Determine categories based on view
    const availableCategories = view === ViewState.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Set default category when view changes
    useEffect(() => {
        setSelectedCategory(availableCategories[0]);
    }, [view]);

    // Filter transactions
    const displayTxs = view === ViewState.HOME 
        ? transactions.slice(0, 5) 
        : transactions.filter((t: Transaction) => t.type === (view === ViewState.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE));
    
    // Chart Data Preparation
    const getChartData = (type: TransactionType) => {
        const relevantTxs = transactions.filter((t: Transaction) => t.type === type);
        const map = new Map<string, number>();
        relevantTxs.forEach((t: Transaction) => {
            const current = map.get(t.category as string) || 0;
            map.set(t.category as string, current + t.amount);
        });
        return Array.from(map).map(([name, value]) => ({ name, value }));
    };

    const incomeData = getChartData(TransactionType.INCOME);
    const expenseData = getChartData(TransactionType.EXPENSE);
    const activeChartData = view === ViewState.INCOME ? incomeData : expenseData;
    
    // Dashboard Specific Data (Summary)
    const dashboardChartData = [
        { name: 'Income', value: income, fill: '#10b981' },
        { name: 'Expenses', value: expense, fill: '#ef4444' },
    ];
    
    // Percentage Calculation (Savings Rate)
    const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !amount) return;
        setLoadingCat(true);
        const type = view === ViewState.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE;
        
        // Instant add - no AI wait
        await onAddTx(title, parseFloat(amount), type, selectedCategory);
        
        setTitle('');
        setAmount('');
        setLoadingCat(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-32">
             {view === ViewState.HOME && (
                <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Real-time financial overview</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Total Balance" 
                        amount={balance} 
                        type="neutral" 
                        currency={user.currency} 
                        privacyMode={user.privacyMode} 
                        subtitle={
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                                    <span>Savings Rate</span>
                                    <span>{savingsRate.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, savingsRate)}%` }}></div>
                                </div>
                            </div>
                        }
                    />
                    <StatCard title="Total Income" amount={income} type="success" currency={user.currency} privacyMode={user.privacyMode} />
                    <StatCard title="Total Expenses" amount={expense} type="danger" currency={user.currency} privacyMode={user.privacyMode} />
                </div>

                {/* DASHBOARD BAR CHART - INCOME VS EXPENSE */}
                <GlassCard className="p-6 md:p-8 min-h-[350px]">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" /> Financial Overview
                    </h3>
                    <div className="h-[250px] w-full min-w-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.2} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    formatter={(val: number) => formatCurrency(val, user.currency, user.privacyMode)}
                                />
                                <Bar dataKey="value" barSize={30} radius={[0, 10, 10, 0]}>
                                    {dashboardChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
                </>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                     {(view === ViewState.EXPENSES || view === ViewState.INCOME) && (
                        <>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            {view === ViewState.INCOME ? <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><TrendingUp/></div> : <div className="p-2 bg-rose-500/20 rounded-lg text-rose-500"><TrendingUp className="rotate-180"/></div>}
                            {view === ViewState.INCOME ? 'Income Stream' : 'Expense Tracker'}
                        </h2>
                        
                        {/* CHART SECTION */}
                        {activeChartData.length > 0 && (
                            <GlassCard className="p-6 md:p-8 min-h-[300px] flex flex-col md:flex-row items-center justify-around">
                                <div className="w-full md:w-1/2 h-[250px] relative min-w-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={activeChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {activeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                formatter={(val: number) => formatCurrency(val, user.currency, user.privacyMode)}
                                            />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(activeChartData.reduce((a, b) => a + b.value, 0), user.currency, user.privacyMode)}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/2 grid grid-cols-2 gap-3 mt-4 md:mt-0">
                                    {activeChartData.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-gray-500 truncate">{entry.name}</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {formatCurrency(entry.value, user.currency, user.privacyMode)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        )}

                        <GlassCard className="p-1">
                             <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-2 p-2">
                                <div className="flex-1 flex flex-col md:flex-row gap-2">
                                     <input 
                                        value={title} onChange={e=>setTitle(e.target.value)}
                                        placeholder="Description (e.g. Salary, Rent)" 
                                        className="flex-1 bg-transparent p-4 font-bold outline-none text-gray-900 dark:text-white placeholder-gray-400 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800"
                                     />
                                     <div className="relative md:w-48">
                                         <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                         <select 
                                            value={selectedCategory} 
                                            onChange={e => setSelectedCategory(e.target.value)}
                                            className="w-full h-full bg-transparent p-4 pl-10 font-bold outline-none text-gray-500 dark:text-gray-400 cursor-pointer appearance-none"
                                         >
                                            {availableCategories.map(c => <option key={c} value={c} className="bg-white dark:bg-gray-900 text-black dark:text-white">{c}</option>)}
                                         </select>
                                     </div>
                                </div>

                                <div className="h-px md:h-auto md:w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>
                                
                                <div className="relative w-full md:w-40">
                                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">{CURRENCY_SYMBOLS[user.currency as CurrencyCode]}</span>
                                     <input 
                                        type="number"
                                        value={amount} onChange={e=>setAmount(e.target.value)}
                                        placeholder="0.00" 
                                        className="w-full bg-transparent p-4 pl-10 font-bold outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>
                                <button disabled={loadingCat} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[60px]">
                                    {loadingCat ? <Loader2 className="animate-spin" /> : <Plus />}
                                </button>
                             </form>
                        </GlassCard>
                        </>
                     )}

                     <GlassCard className="p-6 md:p-8 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                {view === ViewState.HOME ? <><Zap className="text-indigo-500"/> Recent Activity</> : <><List className="text-indigo-500"/> Transaction History</>}
                            </h3>
                            {view !== ViewState.HOME && <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">{displayTxs.length} Records</span>}
                        </div>
                        
                        <div className="space-y-3">
                            {displayTxs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4"><FileText className="text-gray-400"/></div>
                                    <p className="font-medium text-gray-500">No transactions recorded yet.</p>
                                </div>
                            ) : (
                                displayTxs.map((t: Transaction) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-2xl group transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-base">{t.title}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-black text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                                {t.type === TransactionType.INCOME ? '+' : '-'}
                                                {formatCurrency(t.amount, user.currency, user.privacyMode)}
                                            </span>
                                            <button onClick={() => onDeleteTx(t.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                     </GlassCard>
                 </div>

                 {/* Widgets Column */}
                 <div className="space-y-6">
                    {view === ViewState.HOME && (
                        <div onClick={onOpenAi} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:shadow-indigo-500/20 transition-all border border-white/10">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/30 rounded-full blur-[60px] -mr-10 -mt-10 group-hover:bg-indigo-500/40 transition-all"></div>
                            <div className="relative z-10">
                                <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                    <Bot className="text-indigo-300" size={32}/>
                                </div>
                                <h3 className="text-2xl font-black mb-2 tracking-tight">AI Financial Brain</h3>
                                <p className="text-indigo-200 mb-6 leading-relaxed font-medium">
                                    {balance > 0 ? "You're in the green! Tap to analyze your surplus strategy." : "High spending detected. Tap to get a reduction plan."}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">System Online</span>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
             </div>
        </div>
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
  const userRef = useRef<UserProfile | null>(null); // To track user in closure

  // AI Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Settings State
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Keep ref in sync
  useEffect(() => { userRef.current = user; }, [user]);

  // Enhanced Login Handler to load data immediately
  const handleLogin = async (loggedInUser: UserProfile) => {
      setLoading(true);
      try {
          setUser(loggedInUser);
          setEditName(loggedInUser.name);
          const txs = await sbLoadTransactions(loggedInUser.id);
          setTransactions(txs);
      } catch (e) {
          console.error("Login Data Load Error", e);
      } finally {
          setLoading(false);
      }
  };

  // Init
  useEffect(() => {
    // Safety timeout - prevent loading forever if Supabase hangs
    const timer = setTimeout(() => setLoading(false), 5000);

    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) { setResetMode(true); setLoading(false); clearTimeout(timer); return; }

    const initAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') setResetMode(true);
        else if (event === 'SIGNED_IN' && session?.user) {
            // Check if user is already loaded to avoid double loading or overwriting state unexpectedly
            if (userRef.current?.id !== session.user.id) {
                setLoading(true);
                try {
                    const profile = await sbGetOrCreateProfile(session.user);
                    if (profile) { 
                        setUser(profile); 
                        setEditName(profile.name);
                        const txs = await sbLoadTransactions(profile.id); 
                        setTransactions(txs); 
                    }
                } catch(e) { console.error("Auth Change Error", e); }
                finally { setLoading(false); }
            }
        } else if (event === 'SIGNED_OUT') { 
            setUser(null); 
            setTransactions([]); 
            setView(ViewState.HOME); 
            setLoading(false);
        }
    });
    return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
    };
  }, []);

  // Sync Theme
  useEffect(() => {
     if(user?.theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, [user?.theme]);

  const handleLogout = async () => { await sbLogout(); };

  const handleUpdateProfile = async () => {
      if (!user) return;
      const updatedUser = { ...user, name: editName };
      setUser(updatedUser);
      setIsEditingProfile(false);
      await sbUpdateProfile(user.id, updatedUser);
  };

  const handleAddTx = async (title: string, amount: number, type: TransactionType, selectedCategory: string) => {
     if(!user) return;
     
     // Manual selection is prioritized. 
     // If no category selected (shouldn't happen due to default), fallback to Others.
     let category = selectedCategory;
     if (!category) {
        category = Category.OTHERS;
     }

     const newTx: Transaction = { id: crypto.randomUUID(), title, amount, type, category: category as Category, date: new Date().toISOString() };
     const updated = [newTx, ...transactions];
     setTransactions(updated);
     await sbSaveTransaction(user.id, newTx);
  };

  const handleDeleteTx = async (id: string) => {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      await sbDeleteTransaction(id);
  };
  
  const handleClearData = async () => {
      if(!user) return;
      // Optimistic clear
      setTransactions([]);
      // In a real app, delete from DB here
      transactions.forEach(t => sbDeleteTransaction(t.id));
      setDeleteConfirm(false);
  };

  const handleAskAi = async () => {
    if (!chatQuery || !user) return;
    setChatLoading(true);
    const context = `User: ${user.name}, Currency: ${user.currency}. Total Balance: ${transactions.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0)}. Recent Txs: ${JSON.stringify(transactions.slice(0, 5))}`;
    const response = await getFinancialAdvice(chatQuery, context);
    setChatResponse(response);
    setChatLoading(false);
  };

  if (loading) return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-gray-500 font-bold animate-pulse">Loading System...</p>
          <button onClick={() => setLoading(false)} className="mt-4 text-xs font-bold text-indigo-500 hover:text-indigo-600 underline cursor-pointer">
              Taking too long? Click here
          </button>
      </div>
  );
  if (resetMode) return <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4"><div className="max-w-md mx-auto mt-20 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl"><h2 className="text-2xl font-bold mb-4 dark:text-white">Reset Password</h2><p className="mb-4 text-gray-500">Enter your new password below.</p>{/* Reset Logic Here */}<button onClick={() => setResetMode(false)} className="text-indigo-600 font-bold">Cancel</button></div></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 overflow-hidden font-sans selection:bg-indigo-500/30">
        <Sidebar view={view} setView={setView} handleLogout={handleLogout} user={user} />
        
        {mobileMenuOpen && (
             <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
                 <div className="w-72 h-full bg-white dark:bg-gray-950 shadow-2xl animate-slide-right" onClick={e => e.stopPropagation()}>
                      <Sidebar view={view} setView={(v: ViewState) => { setView(v); setMobileMenuOpen(false); }} handleLogout={handleLogout} user={user} isMobile={true} />
                 </div>
             </div>
        )}

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shrink-0 z-30 sticky top-0">
                <span className="font-black text-lg flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Money Master Pro</span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300"><Grid /></button>
            </div>

            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                {view === ViewState.TOOLS && <Tools currency={user.currency} userId={user.id} privacyMode={user.privacyMode} />}
                {view === ViewState.INVESTMENTS && <Investments currency={user.currency} privacyMode={user.privacyMode} />}
                {view === ViewState.PROFILE && (
                    <div className="p-4 md:p-10 max-w-3xl mx-auto animate-fade-in pb-24">
                         <h2 className="text-4xl font-black mb-8 dark:text-white">Settings</h2>

                         {/* PROFILE MANAGEMENT SECTION */}
                         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Profile Details</h3>
                         <GlassCard className="p-6 mb-8">
                             <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                 <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl flex items-center justify-center text-white font-bold text-3xl">
                                     {user.name.charAt(0)}
                                 </div>
                                 <div className="flex-1 w-full space-y-4">
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Full Name</label>
                                        <div className="flex gap-3">
                                            <input 
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl p-3 font-bold text-gray-900 dark:text-white outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                            <button 
                                                onClick={handleUpdateProfile}
                                                disabled={editName === user.name || !editName.trim()}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
                                            >
                                                <Save size={18} /> Save
                                            </button>
                                        </div>
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Email Address</label>
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Mail size={16} /> {user.email}
                                        </div>
                                     </div>
                                 </div>
                             </div>
                             <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                 <button onClick={handleLogout} className="text-red-500 hover:text-red-600 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                                     <LogOut size={16} /> Sign Out of Account
                                 </button>
                             </div>
                         </GlassCard>
                         
                         {/* APP PREFERENCES */}
                         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">App Preferences</h3>
                         <GlassCard className="p-2 mb-8 space-y-1">
                             <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><EyeOff size={20}/></div>
                                     <div><p className="font-bold text-gray-900 dark:text-white">Privacy Mode</p><p className="text-xs text-gray-500">Hide balances on dashboard</p></div>
                                 </div>
                                 <button onClick={() => { const u = { ...user, privacyMode: !user.privacyMode }; setUser(u); sbUpdateProfile(user.id, u); }} className={`w-14 h-8 rounded-full transition-colors relative ${user.privacyMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                     <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${user.privacyMode ? 'translate-x-6' : ''}`} />
                                 </button>
                             </div>
                             <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl"><Moon size={20}/></div>
                                     <div><p className="font-bold text-gray-900 dark:text-white">Dark Mode</p><p className="text-xs text-gray-500">Switch between light and dark themes</p></div>
                                 </div>
                                 <button onClick={() => { const newTheme: Theme = user.theme === 'light' ? 'dark' : 'light'; const u = { ...user, theme: newTheme }; setUser(u); sbUpdateProfile(user.id, u); }} className={`w-14 h-8 rounded-full transition-colors relative ${user.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                     <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${user.theme === 'dark' ? 'translate-x-6' : ''}`} />
                                 </button>
                             </div>
                             <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Globe size={20}/></div>
                                     <div><p className="font-bold text-gray-900 dark:text-white">Currency</p><p className="text-xs text-gray-500">Display currency symbol</p></div>
                                 </div>
                                 <select value={user.currency} onChange={(e) => { const u = { ...user, currency: e.target.value as CurrencyCode }; setUser(u); sbUpdateProfile(user.id, u); }} className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2 px-4 font-bold text-sm outline-none cursor-pointer">
                                     {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                             </div>
                         </GlassCard>

                         {/* ACCOUNT SECURITY */}
                         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Account Security</h3>
                         <GlassCard className="p-2 mb-8 space-y-1">
                             <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors cursor-pointer" onClick={() => setResetMode(true)}>
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl"><KeyRound size={20}/></div>
                                     <div><p className="font-bold text-gray-900 dark:text-white">Change Password</p><p className="text-xs text-gray-500">Update your login credentials</p></div>
                                 </div>
                                 <ChevronRight size={20} className="text-gray-400"/>
                             </div>
                         </GlassCard>

                         {/* DATA MANAGEMENT */}
                         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Data Management</h3>
                         <GlassCard className="p-2 mb-8 space-y-1">
                             <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors cursor-pointer">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><Download size={20}/></div>
                                     <div><p className="font-bold text-gray-900 dark:text-white">Export Data</p><p className="text-xs text-gray-500">Download transaction history (CSV)</p></div>
                                 </div>
                                 <button className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Download</button>
                             </div>
                             <div className="flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors cursor-pointer" onClick={() => setDeleteConfirm(true)}>
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl"><Trash2 size={20}/></div>
                                     <div><p className="font-bold text-red-600 dark:text-red-400">Clear All Data</p><p className="text-xs text-red-400/70">Permanently delete all transactions</p></div>
                                 </div>
                             </div>
                         </GlassCard>

                         {/* Delete Confirm Modal */}
                         {deleteConfirm && (
                             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                 <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-slide-up">
                                     <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto"><ShieldAlert size={32}/></div>
                                     <h3 className="text-xl font-bold text-center mb-2 dark:text-white">Are you sure?</h3>
                                     <p className="text-center text-gray-500 text-sm mb-6">This action cannot be undone. All your transaction data will be erased.</p>
                                     <div className="flex gap-3">
                                         <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-3 font-bold bg-gray-100 dark:bg-gray-800 rounded-xl dark:text-white">Cancel</button>
                                         <button onClick={handleClearData} className="flex-1 py-3 font-bold bg-red-600 text-white rounded-xl hover:bg-red-700">Yes, Delete</button>
                                     </div>
                                 </div>
                             </div>
                         )}
                    </div>
                )}
                
                {(view === ViewState.HOME || view === ViewState.EXPENSES || view === ViewState.INCOME) && (
                    <DashboardContent view={view} user={user} transactions={transactions} balance={balance} income={income} expense={expense} onAddTx={handleAddTx} onDeleteTx={handleDeleteTx} onOpenAi={() => setShowAiChat(true)} />
                )}
            </main>

            {/* FLOATING AI BUTTON - ALWAYS VISIBLE */}
            <button 
                onClick={() => setShowAiChat(true)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.4)] transition-all hover:scale-110 active:scale-95 group"
            >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                <Bot size={28} />
            </button>

            {/* AI CHAT MODAL */}
            {showAiChat && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={(e) => { if(e.target === e.currentTarget) setShowAiChat(false); }}>
                    <div className="bg-white dark:bg-gray-900 w-full md:max-w-2xl h-[85vh] md:h-[600px] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden animate-slide-up border border-gray-200 dark:border-gray-700">
                        {/* Header */}
                        <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center z-10">
                             <div className="flex items-center gap-4">
                                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                                     <Bot size={24} />
                                 </div>
                                 <div>
                                     <h3 className="font-black text-xl text-gray-900 dark:text-white tracking-tight">Money Brain</h3>
                                     <div className="flex items-center gap-2">
                                         <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Online</p>
                                     </div>
                                 </div>
                             </div>
                             <button onClick={() => setShowAiChat(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={20} className="text-gray-600 dark:text-gray-300"/></button>
                        </div>
                        
                        {/* Chat Area */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-[#0b0f19] custom-scrollbar">
                            {chatResponse ? (
                                <div className="space-y-6">
                                    <div className="flex justify-end">
                                        <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none max-w-[85%] shadow-md">
                                            <p className="font-medium leading-relaxed">{chatQuery}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-2">
                                            <Bot size={16} className="text-white"/>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl rounded-tl-none max-w-[90%] shadow-sm prose dark:prose-invert">
                                            <div dangerouslySetInnerHTML={{ __html: chatResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                        </div>
                                    </div>
                                    <div className="flex justify-center pt-8">
                                        <button onClick={() => { setChatResponse(""); setChatQuery(""); }} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                            <RefreshCw size={14}/> New Analysis
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Bot size={64} className="text-indigo-300 dark:text-indigo-900 mb-6" />
                                    <h4 className="font-black text-2xl text-gray-900 dark:text-white mb-2">How can I help?</h4>
                                    <p className="text-sm font-medium text-gray-500 max-w-xs leading-relaxed">I can analyze your spending, suggest budget cuts, or plan your investments.</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {!chatResponse && (
                            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-10">
                                <div className="relative flex items-center gap-2">
                                    <input 
                                        value={chatQuery}
                                        onChange={e => setChatQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAskAi()}
                                        placeholder="Ask for financial advice..."
                                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 pr-14 font-bold outline-none focus:ring-2 ring-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                        disabled={chatLoading}
                                    />
                                    <button 
                                        onClick={handleAskAi}
                                        disabled={chatLoading || !chatQuery}
                                        className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                                    >
                                        {chatLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpCircle size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default App;
