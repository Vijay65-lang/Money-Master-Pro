import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Wallet, TrendingUp, Grid, Plus, PieChart, ArrowUpCircle, ArrowDownCircle, Trash2, Bot, X, Settings, LogOut, User as UserIcon, Lock, ChevronRight, Globe, Moon, Sun, Edit2, LayoutDashboard, Eye, EyeOff, ShieldAlert, Cloud, Server, Database, AlertCircle, CheckCircle2, Mail, KeyRound, BarChart3, ExternalLink, MessageCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Transaction, TransactionType, ViewState, Category, UserProfile, CurrencyCode, CURRENCY_SYMBOLS } from './types';
import { Investments } from './components/Investments';
import { Tools } from './components/Tools';
import { getFinancialAdvice, categorizeExpense } from './services/geminiService';
import { sbLogin, sbSignup, sbLogout, sbSaveTransaction, sbLoadTransactions, sbDeleteTransaction, sbUpdateProfile, sbResetPassword, sbUpdateUserPassword, sbGetOrCreateProfile, supabase } from './services/supabaseService';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// --- SECURITY CONSTANTS ---
const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Minutes auto-logout

// --- Helper Functions ---
const formatCurrency = (amount: number, code: CurrencyCode, privacyMode: boolean = false) => {
  if (privacyMode) return '****';
  const symbol = CURRENCY_SYMBOLS[code] || code;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// --- Storage Helpers (Obfuscation for Local Cache) ---
const secureSave = (key: string, data: any) => {
    try {
        const json = JSON.stringify(data);
        const encoded = btoa(encodeURIComponent(json)); // Simple obfuscation
        localStorage.setItem(key, encoded);
    } catch (e) {
        console.error("Save failed", e);
    }
};

const secureLoad = (key: string): any | null => {
    try {
        const encoded = localStorage.getItem(key);
        if (!encoded) return null;
        const decoded = decodeURIComponent(atob(encoded));
        return JSON.parse(decoded);
    } catch (e) {
        return null; 
    }
};

// --- Ad Component ---
const AdBanner = ({ className, text = "Premium Wealth Management", cta = "OPEN" }: { className?: string, text?: string, cta?: string }) => (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between cursor-pointer group shadow-sm hover:shadow-md transition-all ${className}`}>
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ExternalLink size={14} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Sponsored</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{text}</p>
            </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-1.5 rounded-lg text-[10px] font-bold text-gray-900 dark:text-white group-hover:bg-indigo-600 group-hover:text-white transition-all">
            {cta}
        </div>
    </div>
);

// --- Sub Components ---
const StatCard = ({ title, amount, type, currency, privacyMode }: { title: string, amount: number, type: 'neutral' | 'success' | 'danger', currency: CurrencyCode, privacyMode: boolean }) => {
  return (
    <div className={`p-6 rounded-3xl flex flex-col justify-center shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${type === 'success' ? 'from-emerald-500/10' : type === 'danger' ? 'from-rose-500/10' : 'from-indigo-500/10'} to-transparent rounded-bl-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-2">
          {type === 'success' ? <ArrowUpCircle size={14}/> : type === 'danger' ? <ArrowDownCircle size={14}/> : <Wallet size={14}/>}
          {title}
      </span>
      <span className={`text-3xl font-extrabold ${type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : type === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
        {formatCurrency(amount, currency, privacyMode)}
      </span>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, desktop }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3.5 rounded-2xl transition-all duration-300 ${
      desktop 
        ? (active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-x-1' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100') 
        : (active ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 dark:text-gray-500 flex-col justify-center py-2')
    }`}
  >
    <Icon size={desktop ? 20 : 24} strokeWidth={active ? 2.5 : 2} />
    <span className={`${desktop ? 'text-sm font-bold' : 'text-[10px] mt-1 font-medium'}`}>{label}</span>
  </button>
);

const Sidebar = ({ view, setView, handleLogout, user }: any) => (
    <div className="hidden md:flex flex-col w-72 h-full bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 p-6 sticky top-0">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Wallet size={24} fill="currentColor" fillOpacity={0.2} />
            </div>
            <div>
                <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">Money</h1>
                <h1 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none tracking-tight">Master Pro</h1>
            </div>
        </div>

        <div className="space-y-2 flex-1">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Menu</p>
            <NavButton desktop active={view === ViewState.HOME} onClick={() => setView(ViewState.HOME)} icon={Home} label="Dashboard" />
            <NavButton desktop active={view === ViewState.EXPENSES} onClick={() => setView(ViewState.EXPENSES)} icon={PieChart} label="Expenses" />
            <NavButton desktop active={view === ViewState.INCOME} onClick={() => setView(ViewState.INCOME)} icon={ArrowDownCircle} label="Income" />
            <NavButton desktop active={view === ViewState.INVESTMENTS} onClick={() => setView(ViewState.INVESTMENTS)} icon={TrendingUp} label="Investments" />
            <NavButton desktop active={view === ViewState.TOOLS} onClick={() => setView(ViewState.TOOLS)} icon={Grid} label="Toolbox" />
            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Account</p>
                <NavButton desktop active={view === ViewState.PROFILE} onClick={() => setView(ViewState.PROFILE)} icon={Settings} label="Settings" />
            </div>
        </div>
        
        <div className="mt-6 mb-6">
             <AdBanner className="border-dashed bg-gray-50/50" />
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-3 px-2 mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl">
                 <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-gray-100 dark:border-gray-700">
                     {user.name.charAt(0)}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                     <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        {user.cloudConnected ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> : <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>}
                        {user.cloudConnected ? 'Online' : 'Offline'}
                     </p>
                 </div>
             </div>
             <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-600 font-bold w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <LogOut size={16} /> Sign Out
             </button>
        </div>
    </div>
);

// --- AUTH COMPONENT ---

const AuthScreen = ({ onLogin }: { onLogin: (p: UserProfile) => void }) => {
    const [isLogin, setIsLogin] = useState(true); // Login vs Signup mode
    const [showForgot, setShowForgot] = useState(false); // Forgot Password mode
    
    // Inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState<CurrencyCode>('USD');
    const [showPassword, setShowPassword] = useState(false);
    
    // Status
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [longLoad, setLongLoad] = useState(false);

    useEffect(() => {
        let t: any;
        if(loading) {
            t = setTimeout(() => setLongLoad(true), 2500);
        } else {
            setLongLoad(false);
        }
        return () => clearTimeout(t);
    }, [loading]);

    // Handle Forgot Password
    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
             setError("Please enter a valid email.");
             setLoading(false);
             return;
        }

        const { success, error } = await sbResetPassword(cleanEmail);
        setLoading(false);
        if (success) {
            setSuccessMsg("Reset link sent! Check your email.");
        } else {
            setError(error || "Failed to send reset link.");
        }
    };

    // Handle Auth
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const cleanEmail = email.trim().toLowerCase();
        
        // Validation
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            setError("Please enter a valid email.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
             setError("Password must be at least 6 characters.");
             setLoading(false);
             return;
        }

        if (!isLogin && name.length < 2) {
             setError("Please enter your name.");
             setLoading(false);
             return;
        }

        if (isLogin) {
            // LOGIN FLOW
            const { user, error } = await sbLogin(cleanEmail, password);
            setLoading(false);
            if (error) {
                setError(error);
            } else if (user) {
                onLogin(user);
            }
        } else {
            // SIGNUP FLOW
            const { success, error, msg } = await sbSignup(cleanEmail, password, name, currency);
            setLoading(false);
            if (error) {
                setError(error);
            } else if (success) {
                if (msg) {
                    setSuccessMsg(msg);
                    setIsLogin(true); // Switch to login mode
                    setPassword(''); // Clear password
                } else {
                    // Auto-login if no verification needed
                    const { user } = await sbLogin(cleanEmail, password);
                    if(user) onLogin(user);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 animate-slide-up relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="flex justify-center mb-6 relative z-10">
                    <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
                        <Wallet size={32} className="text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-center mb-2 text-gray-900 dark:text-white relative z-10 tracking-tight">Money Master Pro</h2>
                <p className="text-center text-gray-500 mb-8 text-sm font-medium relative z-10">
                   {showForgot ? 'Reset your password.' : (isLogin ? 'Welcome back! Log in to continue.' : 'Create your secure account.')}
                </p>

                {successMsg ? (
                    <div className="animate-fade-in bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl text-center">
                         <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-300">
                             <Mail size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Check Your Email</h3>
                         <p className="text-sm text-gray-900 dark:text-white mb-4">
                            {successMsg}
                         </p>
                         <button onClick={() => { setSuccessMsg(''); setShowForgot(false); setIsLogin(true); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                             Back to Login
                         </button>
                    </div>
                ) : (
                    <div className="relative z-10 animate-fade-in">
                        <form onSubmit={showForgot ? handleForgot : handleAuth} className="space-y-4">
                            {!isLogin && !showForgot && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">Full Name</label>
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                                        value={name} onChange={e => setName(e.target.value)}
                                        required={!isLogin}
                                        placeholder="e.g. John Doe"
                                        disabled={loading}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-4 text-gray-400" size={20}/>
                                    <input 
                                        type="email"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-11 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {!showForgot && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">
                                        {!isLogin ? "Create a Password" : "Password"}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-4 text-gray-400" size={20}/>
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-11 pr-12 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            disabled={loading}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-4 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isLogin && !showForgot && (
                                <div>
                                        <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">Select Currency</label>
                                        <div className="relative">
                                        <Globe size={18} className="absolute left-4 top-4 text-gray-400 pointer-events-none" />
                                        <select 
                                            value={currency} 
                                            onChange={e => setCurrency(e.target.value as CurrencyCode)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-11 font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer disabled:opacity-50 transition-colors"
                                            disabled={loading}
                                        >
                                            {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c as CurrencyCode]})</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {isLogin && !showForgot && (
                                <div className="text-right">
                                    <button type="button" onClick={() => { setShowForgot(true); setError(''); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none mt-2 flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-transform active:scale-95 text-sm uppercase tracking-wider">
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>{longLoad ? "Waking up Secure Database..." : "Processing..."}</span>
                                    </div>
                                ) : (showForgot ? "Send Reset Link" : (isLogin ? "Log In" : "Create Account"))}
                            </button>
                        </form>
                    </div>
                )}

                {/* ALERTS */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-bold rounded-xl flex items-start gap-2 animate-fade-in border border-red-100 dark:border-red-900/50">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span className="break-words">{error}</span>
                    </div>
                )}

                {/* TOGGLE MODE */}
                {!successMsg && !showForgot && (
                    <div className="mt-6 text-center relative z-10">
                        <button disabled={loading} onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-sm font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors">
                            {isLogin ? "New here? Create Account" : "Already have an account? Log In"}
                        </button>
                    </div>
                )}
                {showForgot && !successMsg && (
                    <div className="mt-6 text-center relative z-10">
                         <button disabled={loading} onClick={() => { setShowForgot(false); setError(''); }} className="text-sm font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors">
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- APP COMPONENT ---

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Transaction Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false); // AI Chat Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false); // Password Reset Modal
  const [aiChatInput, setAiChatInput] = useState('');
  const [transType, setTransType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('');
  
  // AI & Utils
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{type: 'success'|'error', text: string}|null>(null);

  // Inactivity Timer
  const lastActivity = useRef(Date.now());
  
  // ⚡️ RACE CONDITION FIX
  const isRecoveryMode = useRef(window.location.hash.includes('type=recovery'));

  const handleLogin = async (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setPrivacyMode(loggedInUser.privacyMode || false);
    secureSave('mmp_current_user', loggedInUser);
    
    // 1. Load Local Backup First (Fast & Offline)
    const localTx = secureLoad(`mmp_transactions_${loggedInUser.id}`) || [];
    setTransactions(localTx);
    
    // 2. Try Loading from Cloud
    const cloudTx = await sbLoadTransactions(loggedInUser.id);
    if(cloudTx.length > 0) {
        setTransactions(cloudTx);
    }
    
    // ⚡️ IF this was a recovery link, force the Password Modal open immediately
    if (isRecoveryMode.current) {
        setShowPasswordModal(true);
        setPassMsg({ type: 'success', text: 'Recovery verified. Set your new password now.' });
        isRecoveryMode.current = false;
        window.history.replaceState(null, '', window.location.pathname);
    } else {
        setView(ViewState.HOME);
    }
  };
  
  const handleLogout = async () => {
    try {
        await sbLogout();
    } catch (e) {
        console.warn("Logout error:", e);
    }
    setUser(null);
    setTransactions([]);
    localStorage.removeItem('mmp_current_user');
    setView(ViewState.AUTH);
  };

  // --- SESSION CHECKER ---
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !user && mounted) {
            const profile = await sbGetOrCreateProfile(session.user);
            if (profile) {
                handleLogin(profile);
                return;
            }
        }
        const localUser = secureLoad('mmp_current_user');
        if (localUser && !user && mounted) {
             handleLogin(localUser);
        }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
             if (!user && mounted) {
                 const profile = await sbGetOrCreateProfile(session.user);
                 if (profile) handleLogin(profile);
             }
        }
        if (event === 'PASSWORD_RECOVERY') {
            isRecoveryMode.current = true;
            setShowPasswordModal(true); // Ensure modal pops up
            setPassMsg({ type: 'success', text: 'Recovery successful. Please set a new password.' });
        }
        if (event === 'SIGNED_OUT' && mounted) {
            setUser(null);
            setView(ViewState.AUTH);
        }
    });

    return () => { 
        mounted = false; 
        subscription.unsubscribe(); 
    };
  }, []);

  const handleActivity = useCallback(() => {
      lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    const interval = setInterval(() => {
        if (user && Date.now() - lastActivity.current > INACTIVITY_LIMIT) {
            handleLogout();
        }
    }, 10000); 
    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        clearInterval(interval);
    };
  }, [user, handleActivity]);

  useEffect(() => {
    if (user) {
        if (user.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
  }, [user]);

  useEffect(() => {
      if(user && transactions.length > 0) {
          secureSave(`mmp_transactions_${user.id}`, transactions);
      }
  }, [transactions, user]);

  const updateUser = async (updates: Partial<UserProfile>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      setUser(updated);
      secureSave('mmp_current_user', updated);
      await sbUpdateProfile(user.id, updated);
  };

  const togglePrivacy = () => {
      const newVal = !privacyMode;
      setPrivacyMode(newVal);
      updateUser({ privacyMode: newVal });
  };
  
  const changePassword = async () => {
      if(newPassword.length < 6) {
          setPassMsg({type: 'error', text: "Password must be at least 6 characters"});
          return;
      }
      setPassMsg(null);
      const { error } = await sbUpdateUserPassword(newPassword);
      if(error) {
          setPassMsg({type: 'error', text: error});
      } else {
          setPassMsg({type: 'success', text: "Password updated successfully!"});
          setNewPassword('');
          setTimeout(() => {
              setShowPasswordModal(false);
              setPassMsg(null);
          }, 1500);
      }
  };

  const addTransaction = async () => {
    if (!title || !amount || !user) return;
    const newTrans: Transaction = {
      id: Date.now().toString(),
      title,
      amount: parseFloat(amount),
      type: transType,
      category: category || (transType === TransactionType.EXPENSE ? await categorizeExpense(title) : 'Income'),
      date: new Date().toISOString(),
    };
    const updated = [newTrans, ...transactions];
    setTransactions(updated);
    await sbSaveTransaction(user.id, newTrans);
    setTitle('');
    setAmount('');
    setCategory('');
    setShowAddModal(false);
  };

  const deleteTransaction = async (id: string) => {
      if(!user) return;
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      await sbDeleteTransaction(id);
  };

  const getBalance = () => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const askAI = async (customQuery?: string) => {
    if (!user) return;
    setLoadingAI(true);
    const { balance } = getBalance();
    const context = `User: ${user.name}, Currency: ${user.currency}, Balance: ${balance}. Transactions: ${transactions.length}`;
    const query = customQuery || "Give me a brief summary of my financial health.";
    const advice = await getFinancialAdvice(query, context);
    setAiResponse(advice);
    setLoadingAI(false);
  };

  const { income, expense, balance } = getBalance();

  if (view === ViewState.AUTH) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // --- RENDERERS ---

  const renderHome = () => {
      const chartData = [
          { name: 'Income', value: income, fill: '#10b981' },
          { name: 'Expenses', value: expense, fill: '#ef4444' }
      ];

      return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Daily Overview</h2>
                    <p className="text-gray-500 text-sm font-medium flex items-center gap-2 mt-1">
                        <span className="text-emerald-500 font-bold flex items-center gap-1"><Cloud size={12}/> {user?.cloudConnected ? 'Cloud Sync Active' : 'Offline Mode'}</span>
                        Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={togglePrivacy} className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                        {privacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                    <button onClick={() => { setTransType(TransactionType.EXPENSE); setShowAddModal(true); }} className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2 hover:-translate-y-1 transition-transform">
                        <Plus size={20} /> Add New
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Balance" amount={Number(balance)} type="neutral" currency={user!.currency} privacyMode={privacyMode} />
                <StatCard title="Monthly Income" amount={Number(income)} type="success" currency={user!.currency} privacyMode={privacyMode} />
                <StatCard title="Monthly Expenses" amount={Number(expense)} type="danger" currency={user!.currency} privacyMode={privacyMode} />
            </div>
            
            <AdBanner text="Sponsored: High Yield Savings Accounts" cta="OPEN" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* CHART SECTION */}
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><BarChart3 size={18}/></div>
                            Cash Flow Trend
                        </h3>
                        <div className="h-64 w-full" style={{ minHeight: '250px' }}>
                            {income === 0 && expense === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 font-medium">
                                    <BarChart3 size={40} className="mb-2 opacity-20"/>
                                    Add transactions to see trends
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                    <BarChart data={chartData} layout="vertical" barSize={36}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#6b7280', fontSize: 12, fontWeight: '600'}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                                padding: '12px 16px'
                                            }}
                                            itemStyle={{ color: '#111827', fontWeight: 'bold', fontSize: '14px' }}
                                            formatter={(val: any) => formatCurrency(Number(val), user!.currency, privacyMode)}
                                        />
                                        <Bar dataKey="value" radius={[0, 12, 12, 0] as any} background={{ fill: '#f3f4f6', radius: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p className="font-bold">No transactions yet.</p>
                                <p className="text-sm">Tap "Add New" to start tracking.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all border border-gray-50 dark:border-gray-800 group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3.5 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.title}</p>
                                                <p className="text-xs text-gray-500 font-medium mt-0.5">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                            {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount, user!.currency, privacyMode)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">My Net Balance</p>
                            <h3 className="text-4xl font-extrabold mb-6 tracking-tight">{formatCurrency(balance, user!.currency, privacyMode)}</h3>
                            
                            <div className="mb-6">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-2">
                                    <span>Savings Rate</span>
                                    <span className="text-white">{income > 0 ? ((balance/income)*100).toFixed(0) : 0}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{width: `${Math.min(100, Math.max(0, income > 0 ? (balance/income)*100 : 0))}%`}}></div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-2">
                                <div>
                                    <p className="text-xs text-emerald-400 font-bold uppercase mb-1">Income</p>
                                    <p className="font-bold text-lg">{formatCurrency(income, user!.currency, privacyMode)}</p>
                                </div>
                                <div className="w-px bg-gray-800"></div>
                                <div>
                                    <p className="text-xs text-rose-400 font-bold uppercase mb-1">Expense</p>
                                    <p className="font-bold text-lg">{formatCurrency(expense, user!.currency, privacyMode)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[40px] opacity-20 -ml-10 -mb-10 pointer-events-none"></div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { setTransType(TransactionType.INCOME); setShowAddModal(true); }} className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-center">Add Income</button>
                            <button onClick={() => { setView(ViewState.TOOLS); }} className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-center">Tools</button>
                            <button onClick={() => { setView(ViewState.INVESTMENTS); }} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold text-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center">Invest</button>
                            <button onClick={() => { setView(ViewState.PROFILE); }} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const renderManager = (type: TransactionType) => {
    const filtered = transactions.filter(t => t.type === type);
    const categoryTotals: Record<string, number> = {};
    filtered.forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
    const pieData = Object.keys(categoryTotals).map(cat => ({ name: cat, value: categoryTotals[cat] })).sort((a,b) => b.value - a.value);
    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#84cc16'];

    return (
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto w-full">
         <div className="flex justify-between items-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight">{type === TransactionType.EXPENSE ? 'Expenses' : 'Income'}</h2>
             <button onClick={() => { setTransType(type); setShowAddModal(true); }} className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2 hover:-translate-y-1 transition-transform">
                <Plus size={20} /> Add New
            </button>
         </div>

         {pieData.length > 0 && (
             <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-around gap-12">
                 <div className="w-full md:w-1/2 h-72 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(val: any) => formatCurrency(Number(val), user!.currency, privacyMode)}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                    padding: '12px 16px'
                                }}
                                itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(pieData.reduce((a,b)=>a+b.value,0), user!.currency, privacyMode)}</p>
                    </div>
                 </div>
                 
                 <div className="w-full md:w-1/2 grid grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                     {pieData.map((entry, index) => (
                         <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                             <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                             <div className="overflow-hidden">
                                 <p className="text-xs text-gray-500 font-bold truncate uppercase">{entry.name}</p>
                                 <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(entry.value, user!.currency, privacyMode)}</p>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-40">
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                    {type === TransactionType.EXPENSE ? <Wallet size={56} /> : <TrendingUp size={56} />}
                </div>
                <p className="font-bold text-xl">No {type === TransactionType.EXPENSE ? 'expenses' : 'income'} recorded yet.</p>
            </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 relative group hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800">{t.category}</span>
                            <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">{t.title}</h4>
                        <p className="text-xs text-gray-400 font-medium mb-5">{new Date(t.date).toLocaleDateString()}</p>
                        <div className="flex justify-between items-end border-t border-gray-50 dark:border-gray-800 pt-4">
                             <span className={`text-2xl font-extrabold ${type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrency(t.amount, user!.currency, privacyMode)}
                             </span>
                        </div>
                    </div>
                ))}
             </div>
         )}
      </div>
    );
  };

  const renderProfile = () => {
      return (
          <div className="max-w-2xl mx-auto w-full animate-fade-in space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Settings</h2>
            
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0 border-4 border-white dark:border-gray-800 shadow-lg">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Display Name</label>
                        <input 
                            value={user?.name} 
                            onChange={(e) => updateUser({ name: e.target.value })}
                            className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none w-full transition-colors pb-1"
                        />
                        <p className="text-gray-500 font-medium text-sm mt-2">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm"><Globe size={20} className="text-indigo-600 dark:text-indigo-400"/></div>
                            <span className="font-bold text-gray-900 dark:text-white">Currency</span>
                         </div>
                         <select 
                            value={user?.currency}
                            onChange={(e) => updateUser({ currency: e.target.value as CurrencyCode })}
                            className="bg-transparent font-bold text-gray-600 dark:text-gray-300 outline-none text-right cursor-pointer"
                         >
                             {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c as CurrencyCode]})</option>)}
                         </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm">{user?.theme === 'dark' ? <Moon size={20} className="text-purple-500"/> : <Sun size={20} className="text-orange-500"/>}</div>
                            <span className="font-bold text-gray-900 dark:text-white">Appearance</span>
                         </div>
                         <button onClick={() => updateUser({ theme: user?.theme === 'dark' ? 'light' : 'dark' })} className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {user?.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                         </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm">{privacyMode ? <EyeOff size={20} className="text-gray-600 dark:text-gray-300"/> : <Eye size={20} className="text-gray-600 dark:text-gray-300"/>}</div>
                            <span className="font-bold text-gray-900 dark:text-white">Privacy Mode</span>
                         </div>
                         <button onClick={togglePrivacy} className={`w-12 h-7 rounded-full transition-colors relative ${privacyMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                             <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${privacyMode ? 'translate-x-5' : ''}`}></div>
                         </button>
                    </div>

                    {/* Change Password Button */}
                    <button 
                        onClick={() => { setShowPasswordModal(true); setPassMsg(null); }}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group"
                    >
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><KeyRound size={20} className="text-indigo-600 dark:text-indigo-400"/></div>
                            <span className="font-bold text-gray-900 dark:text-white">Change Password</span>
                         </div>
                         <ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"/>
                    </button>

                    {/* NEW SIGN OUT BUTTON */}
                    <button 
                        onClick={handleLogout}
                        className="w-full p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-between group mt-4 border border-red-100 dark:border-red-900/20"
                    >
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white dark:bg-red-900/30 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><LogOut size={20} className="text-red-600 dark:text-red-400"/></div>
                            <span className="font-bold text-red-700 dark:text-red-400">Sign Out</span>
                         </div>
                    </button>
                </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] p-8 border border-rose-100 dark:border-rose-900/20">
                 <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <ShieldAlert size={20}/> Danger Zone
                 </h4>
                 <p className="text-sm text-rose-600/70 dark:text-rose-400/70 mb-6 leading-relaxed">
                    Clear local transaction history. Useful if the app feels slow. Cloud data (if synced) restores on next login.
                 </p>
                 <button 
                    onClick={() => { 
                        if(window.confirm("Are you sure? This will remove all transactions from this device.")) {
                            setTransactions([]); 
                            secureSave(`mmp_transactions_${user!.id}`, []);
                        }
                    }} 
                    className="bg-white dark:bg-transparent text-rose-600 border-2 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-6 py-3 rounded-xl font-bold text-sm transition-colors"
                 >
                    Reset Local Data
                 </button>
            </div>
            
             <p className="text-center text-xs text-gray-400 font-medium pt-8">Version 2.0 • Pro Edition</p>
          </div>
      );
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 overflow-hidden">
        <Sidebar view={view} setView={setView} handleLogout={handleLogout} user={user} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scroll-smooth">
            <header className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
                <div className="flex items-center gap-2 font-extrabold text-lg text-gray-900 dark:text-white">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Wallet size={18} /></div> MMP
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={togglePrivacy} className="p-2 text-gray-600 dark:text-gray-300">
                        {privacyMode ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                     <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                        {user?.name.charAt(0)}
                     </div>
                </div>
            </header>

            <div className="flex-1 p-4 md:p-10 flex flex-col max-w-[1600px] mx-auto w-full pb-24 md:pb-10">
                {view === ViewState.HOME && renderHome()}
                {view === ViewState.EXPENSES && renderManager(TransactionType.EXPENSE)}
                {view === ViewState.INCOME && renderManager(TransactionType.INCOME)}
                {view === ViewState.INVESTMENTS && <Investments currency={user!.currency} privacyMode={privacyMode} />}
                {view === ViewState.TOOLS && <Tools currency={user!.currency} userId={user!.id} privacyMode={privacyMode} />}
                {view === ViewState.PROFILE && renderProfile()}
            </div>

            <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 flex justify-around sticky bottom-0 z-20 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <NavButton active={view === ViewState.HOME} onClick={() => setView(ViewState.HOME)} icon={Home} label="Home" />
                <NavButton active={view === ViewState.TOOLS} onClick={() => setView(ViewState.TOOLS)} icon={Grid} label="Tools" />
                <NavButton active={view === ViewState.EXPENSES || view === ViewState.INCOME} onClick={() => setView(ViewState.EXPENSES)} icon={PieChart} label="Money" />
                <NavButton active={view === ViewState.INVESTMENTS} onClick={() => setView(ViewState.INVESTMENTS)} icon={TrendingUp} label="Invest" />
                <NavButton active={view === ViewState.PROFILE} onClick={() => setView(ViewState.PROFILE)} icon={Settings} label="Settings" />
            </div>
        </main>

        <button 
            onClick={() => { setShowAIChat(true); setAiResponse(''); }}
            className="fixed bottom-24 md:bottom-10 right-6 md:right-10 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-400/40 dark:shadow-indigo-900/40 z-30 transition-all hover:scale-110 active:scale-95 animate-fade-in group"
        >
            <MessageCircle size={28} fill="currentColor" className="group-hover:animate-pulse" />
        </button>

        {showAIChat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2rem] p-6 shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800 flex flex-col max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bot className="text-indigo-600 dark:text-indigo-400" size={24}/> Money Brain Chat
                        </h3>
                        <button onClick={() => setShowAIChat(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 bg-indigo-50 dark:bg-gray-800/30 rounded-2xl p-4 custom-scrollbar">
                        {aiResponse ? (
                            <div className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-line text-sm md:text-base">
                                {aiResponse.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 mt-10">
                                <p className="mb-2 text-lg font-bold">Ask me anything!</p>
                                <p className="text-xs">"How can I save more?"</p>
                                <p className="text-xs">"Explain crypto risks"</p>
                                <p className="text-xs">"Plan a budget for $2000"</p>
                            </div>
                        )}
                        {loadingAI && <div className="text-indigo-600 dark:text-indigo-400 font-bold text-center mt-4 animate-pulse">Thinking...</div>}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            placeholder="Type your question..." 
                            value={aiChatInput}
                            onChange={e => setAiChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !loadingAI && askAI(aiChatInput)}
                            className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 font-medium text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                        <button 
                            onClick={() => askAI(aiChatInput)}
                            disabled={!aiChatInput || loadingAI}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white p-3 rounded-xl font-bold transition-colors"
                        >
                            <ArrowUpCircle size={24} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* PASSWORD RESET MODAL */}
        {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2"><KeyRound size={22} className="text-indigo-600"/> Security</h3>
                        <button onClick={() => { setShowPasswordModal(false); setPassMsg(null); }} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">New Password</label>
                             <input 
                                type="password"
                                placeholder="Min. 6 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                             />
                        </div>
                        
                        {passMsg && (
                             <div className={`p-3 rounded-xl text-sm font-bold flex items-start gap-2 ${passMsg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                                 {passMsg.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5"/> : <AlertCircle size={18} className="mt-0.5"/>}
                                 {passMsg.text}
                             </div>
                        )}

                        <button 
                            onClick={changePassword} 
                            disabled={!newPassword || newPassword.length < 6}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none mt-4 transition-transform active:scale-95 text-sm uppercase tracking-wider"
                        >
                            Update Password
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Add {transType === TransactionType.EXPENSE ? 'Expense' : 'Income'}</h3>
                        <button onClick={() => setShowAddModal(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Title</label>
                             <input 
                                placeholder="e.g. Grocery Shopping"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Amount</label>
                             <input 
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                             />
                        </div>
                        {transType === TransactionType.EXPENSE && (
                             <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Category (Optional)</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">Auto-Detect with AI</option>
                                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                             </div>
                        )}

                        <button onClick={addTransaction} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none mt-4 transition-transform active:scale-95 text-sm uppercase tracking-wider">
                            Save Transaction
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;