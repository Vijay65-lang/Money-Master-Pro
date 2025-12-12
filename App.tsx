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
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    
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

    const resetState = () => {
        setError('');
        setSuccessMsg('');
        setPassword('');
    };

    // Handle Forgot Password
    const handleResetRequest = async (e: React.FormEvent) => {
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
            setSuccessMsg("Reset link sent! Check your email to set a new password.");
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

        if (mode === 'signup' && name.length < 2) {
             setError("Please enter your name.");
             setLoading(false);
             return;
        }

        if (mode === 'login') {
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
                    setMode('login'); // Switch to login mode
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
                
                {/* MODE TABS - ONLY LOGIN / SIGNUP */}
                {mode !== 'forgot' && (
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 relative z-10">
                        <button 
                            onClick={() => { setMode('login'); resetState(); }} 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => { setMode('signup'); resetState(); }} 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                <p className="text-center text-gray-500 mb-6 text-sm font-medium relative z-10">
                   {mode === 'forgot' ? 'Enter email to receive reset link.' : (mode === 'login' ? 'Welcome back! Log in to continue.' : 'Create your secure account.')}
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
                         <button onClick={() => { setSuccessMsg(''); setMode('login'); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                             Back to Login
                         </button>
                    </div>
                ) : (
                    <div className="relative z-10 animate-fade-in">
                        <form onSubmit={mode === 'forgot' ? handleResetRequest : handleAuth} className="space-y-4">
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">Full Name</label>
                                    <input 
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
                                        value={name} onChange={e => setName(e.target.value)}
                                        required={mode === 'signup'}
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

                            {mode !== 'forgot' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">
                                        {mode === 'signup' ? "Create a Password" : "Password"}
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
                                    
                                    {/* FORGOT PASSWORD LINK - LOGIN MODE ONLY */}
                                    {mode === 'login' && (
                                        <div className="flex justify-end mt-1">
                                            <button 
                                                type="button" 
                                                onClick={() => { setMode('forgot'); resetState(); }} 
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'signup' && (
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

                            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none mt-2 flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-transform active:scale-95 text-sm uppercase tracking-wider">
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>{longLoad ? "Securely Connecting..." : "Processing..."}</span>
                                    </div>
                                ) : (mode === 'forgot' ? "Send Reset Link" : (mode === 'login' ? "Log In" : "Create Account"))}
                            </button>

                            {/* Back to Login (Forgot Mode) */}
                            {mode === 'forgot' && (
                                <button 
                                    type="button" 
                                    onClick={() => { setMode('login'); resetState(); }}
                                    className="w-full text-gray-500 font-bold py-2 hover:text-indigo-600 transition-colors text-sm"
                                >
                                    Back to Login
                                </button>
                            )}
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
            </div>
        </div>
    );
};

// --- RESET PASSWORD SCREEN (LANDING PAGE) ---
const ResetPasswordScreen = ({ onComplete, user }: { onComplete: () => void, user: UserProfile | null }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [showPass, setShowPass] = useState(false);
    
    // We display the user's email if available, or allow them to type it manually
    const [emailDisplay, setEmailDisplay] = useState('');

    // SYNC: If user info becomes available (via magic link session), fill the email
    useEffect(() => {
        if (user?.email) {
            setEmailDisplay(user.email);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(newPassword.length < 6) {
            setStatus('error');
            setMsg('Password must be at least 6 characters.');
            return;
        }
        if(newPassword !== confirmPassword) {
            setStatus('error');
            setMsg('Passwords do not match.');
            return;
        }

        setStatus('loading');
        setMsg('');

        // NOTE: updatePassword requires an active session (e.g. from the reset link)
        const { error } = await sbUpdateUserPassword(newPassword);

        if(error) {
            setStatus('error');
            setMsg(error);
        } else {
            setStatus('success');
            setMsg('Password updated successfully! Redirecting...');
            setTimeout(onComplete, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 animate-slide-up relative overflow-hidden">
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none text-white">
                        <Wallet size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-extrabold text-center mb-2 text-gray-900 dark:text-white">Money Master Pro</h2>
                <p className="text-center text-gray-500 mb-8 text-sm font-medium">
                   Securely update your password.
                </p>

                {status === 'success' ? (
                     <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl text-center animate-fade-in">
                         <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-300">
                             <CheckCircle2 size={24} />
                         </div>
                         <p className="text-green-700 dark:text-green-300 font-bold">{msg}</p>
                     </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field - Unlocked for manual entry */}
                        <div>
                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-4 text-gray-400" size={20}/>
                                <input 
                                    type="email"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-11 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    value={emailDisplay} 
                                    onChange={e => setEmailDisplay(e.target.value)}
                                    required
                                    placeholder="Your Email"
                                    // Removed disabled prop to allow typing even if loading or no session
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-4 text-gray-400" size={20}/>
                                <input 
                                    type={showPass ? "text" : "password"}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-11 pr-12 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    disabled={status === 'loading'}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-gray-400 hover:text-indigo-600">
                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5 uppercase ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-4 text-gray-400" size={20}/>
                                <input 
                                    type="password"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3.5 pl-11 text-gray-900 dark:text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    disabled={status === 'loading'}
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                             <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-bold rounded-xl flex items-center gap-2">
                                <AlertCircle size={18} /> {msg}
                             </div>
                        )}

                        <button disabled={status === 'loading'} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none mt-2 flex items-center justify-center gap-2 disabled:opacity-70 transition-transform active:scale-95 text-sm uppercase tracking-wider">
                             {status === 'loading' ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
             </div>
        </div>
    );
};

const App = () => {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetMode, setResetMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth & Data Load Effect
  useEffect(() => {
    // Handle Magic Link / Recovery
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setResetMode(true);
      setLoading(false);
      return;
    }

    const initAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
           const profile = await sbGetOrCreateProfile(session.user);
           if (profile) {
               setUser(profile);
               const txs = await sbLoadTransactions(profile.id);
               setTransactions(txs);
           }
        }
        setLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setResetMode(true);
        } else if (event === 'SIGNED_IN' && session?.user) {
            setLoading(true);
            const profile = await sbGetOrCreateProfile(session.user);
            if (profile) {
                setUser(profile);
                const txs = await sbLoadTransactions(profile.id);
                setTransactions(txs);
            }
            setLoading(false);
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setTransactions([]);
            setView(ViewState.HOME);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Theme Sync
  useEffect(() => {
     if(user?.theme === 'dark') document.documentElement.classList.add('dark');
     else document.documentElement.classList.remove('dark');
  }, [user?.theme]);

  // Handlers
  const handleLogout = async () => {
      await sbLogout();
  };

  const handleAddTx = async (title: string, amount: number, type: TransactionType) => {
     if(!user) return;
     let category = type === TransactionType.INCOME ? Category.SALARY : Category.OTHERS;
     if(type === TransactionType.EXPENSE) {
         // Optimistic UI update could happen here, but we wait for category for better UX
         const catStr = await categorizeExpense(title);
         category = catStr as Category; 
     }
     
     const newTx: Transaction = {
         id: crypto.randomUUID(),
         title,
         amount,
         type,
         category,
         date: new Date().toISOString()
     };
     
     const updated = [newTx, ...transactions];
     setTransactions(updated);
     await sbSaveTransaction(user.id, newTx);
  };

  const handleDeleteTx = async (id: string) => {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      await sbDeleteTransaction(id);
  };

  if (loading) return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-gray-500 font-bold animate-pulse">Loading Finances...</p>
      </div>
  );

  if (resetMode) return <ResetPasswordScreen onComplete={() => setResetMode(false)} user={user} />;
  
  if (!user) return <AuthScreen onLogin={setUser} />;

  const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
        <Sidebar view={view} setView={setView} handleLogout={handleLogout} user={user} />
        
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
             <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
                 <div className="w-72 h-full bg-white dark:bg-gray-950 shadow-2xl animate-slide-right" onClick={e => e.stopPropagation()}>
                      <Sidebar view={view} setView={(v: ViewState) => { setView(v); setMobileMenuOpen(false); }} handleLogout={handleLogout} user={user} />
                 </div>
             </div>
        )}

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <span className="font-extrabold text-lg flex items-center gap-2">
                    <Wallet className="text-indigo-600" /> Money Master
                </span>
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
                    <Grid />
                </button>
            </div>

            <main className="flex-1 overflow-y-auto relative">
                {view === ViewState.TOOLS && <Tools currency={user.currency} userId={user.id} privacyMode={user.privacyMode} />}
                {view === ViewState.INVESTMENTS && <Investments currency={user.currency} privacyMode={user.privacyMode} />}
                {view === ViewState.PROFILE && (
                    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
                         <h2 className="text-3xl font-extrabold mb-8">Settings</h2>
                         <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                             <div className="flex items-center justify-between p-2">
                                 <div className="flex items-center gap-3">
                                     <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full"><EyeOff size={20}/></div>
                                     <span className="font-bold text-lg">Privacy Mode</span>
                                 </div>
                                 <button 
                                    onClick={() => {
                                        const updated = { ...user, privacyMode: !user.privacyMode };
                                        setUser(updated);
                                        sbUpdateProfile(user.id, updated);
                                    }}
                                    className={`w-14 h-8 rounded-full transition-colors relative ${user.privacyMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                 >
                                     <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${user.privacyMode ? 'translate-x-6' : ''}`} />
                                 </button>
                             </div>
                             <div className="flex items-center justify-between p-2">
                                 <div className="flex items-center gap-3">
                                     <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full"><Moon size={20}/></div>
                                     <span className="font-bold text-lg">Dark Mode</span>
                                 </div>
                                 <button 
                                    onClick={() => {
                                        const newTheme = user.theme === 'light' ? 'dark' : 'light';
                                        const updated = { ...user, theme: newTheme };
                                        setUser(updated);
                                        sbUpdateProfile(user.id, updated);
                                    }}
                                    className={`w-14 h-8 rounded-full transition-colors relative ${user.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                 >
                                     <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${user.theme === 'dark' ? 'translate-x-6' : ''}`} />
                                 </button>
                             </div>
                         </div>
                    </div>
                )}
                
                {/* DASHBOARD / EXPENSES / INCOME */}
                {(view === ViewState.HOME || view === ViewState.EXPENSES || view === ViewState.INCOME) && (
                    <DashboardContent 
                        view={view} 
                        user={user} 
                        transactions={transactions} 
                        balance={balance} 
                        income={income} 
                        expense={expense}
                        onAddTx={handleAddTx}
                        onDeleteTx={handleDeleteTx}
                    />
                )}
            </main>
        </div>
    </div>
  );
};

// Extracted Content Component for Cleaner Main App
const DashboardContent = ({ view, user, transactions, balance, income, expense, onAddTx, onDeleteTx }: any) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [loadingCat, setLoadingCat] = useState(false);
    
    // Filter transactions
    const displayTxs = view === ViewState.HOME 
        ? transactions.slice(0, 5) 
        : transactions.filter((t: Transaction) => t.type === (view === ViewState.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE));

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !amount) return;
        setLoadingCat(true);
        const type = view === ViewState.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE;
        await onAddTx(title, parseFloat(amount), type);
        setTitle('');
        setAmount('');
        setLoadingCat(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
             {view === ViewState.HOME && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Balance" amount={balance} type="neutral" currency={user.currency} privacyMode={user.privacyMode} />
                    <StatCard title="Total Income" amount={income} type="success" currency={user.currency} privacyMode={user.privacyMode} />
                    <StatCard title="Total Expenses" amount={expense} type="danger" currency={user.currency} privacyMode={user.privacyMode} />
                </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                     {(view === ViewState.EXPENSES || view === ViewState.INCOME) && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                             <h3 className="text-lg font-extrabold mb-4 px-2">Add {view === ViewState.INCOME ? 'Income' : 'Expense'}</h3>
                             <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
                                <input 
                                    value={title} onChange={e=>setTitle(e.target.value)}
                                    placeholder="Description (e.g. Salary, Rent)" 
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                                <div className="relative w-full md:w-40">
                                     <span className="absolute left-4 top-4 text-gray-500 font-bold">{CURRENCY_SYMBOLS[user.currency as CurrencyCode]}</span>
                                     <input 
                                        type="number"
                                        value={amount} onChange={e=>setAmount(e.target.value)}
                                        placeholder="0.00" 
                                        className="w-full bg-gray-50 dark:bg-gray-800 p-4 pl-10 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <button disabled={loadingCat} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[60px]">
                                    {loadingCat ? <Loader2 className="animate-spin" /> : <Plus />}
                                </button>
                             </form>
                        </div>
                     )}

                     <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 min-h-[400px]">
                        <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                             {view === ViewState.HOME ? <><TrendingUp className="text-indigo-600"/> Recent Activity</> : (view === ViewState.INCOME ? 'Income Records' : 'Expense Records')}
                        </h3>
                        
                        <div className="space-y-4">
                            {displayTxs.length === 0 ? (
                                <div className="text-center py-20 opacity-50 font-medium">No transactions found. Start adding some!</div>
                            ) : (
                                displayTxs.map((t: Transaction) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl group transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-base">{t.title}</p>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-extrabold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                                {t.type === TransactionType.INCOME ? '+' : '-'}
                                                {formatCurrency(t.amount, user.currency, user.privacyMode)}
                                            </span>
                                            <button onClick={() => onDeleteTx(t.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                     </div>
                 </div>

                 {/* Widgets */}
                 <div className="space-y-6">
                    {view === ViewState.HOME && (
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
                            <Bot className="mb-4 text-indigo-300" size={32}/>
                            <h3 className="text-2xl font-bold mb-2">Money Brain</h3>
                            <p className="text-indigo-200 mb-6 leading-relaxed">
                                {balance > 0 ? "You're in the green! Keep it up." : "Spending is high. Review your expenses."}
                            </p>
                            <div className="h-1 w-20 bg-indigo-500 rounded-full mb-6"></div>
                            <div className="opacity-50 text-xs uppercase tracking-widest font-bold">AI Status: Active</div>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};

export default App;