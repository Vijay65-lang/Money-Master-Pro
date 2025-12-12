
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Percent, TrendingUp, PieChart, Target, RefreshCcw, FileText, Scale, 
  BarChart3, ShieldCheck, Landmark, Tag, CheckCircle, Car, ShoppingCart, Bitcoin, 
  Clock, Umbrella, HeartPulse, Briefcase, Coins, DollarSign, PiggyBank, Building2, 
  Receipt, Sliders, Grid, RotateCcw, Flame, Key, ArrowRightLeft, Plus, Trash2, CheckSquare, Square, Home
} from 'lucide-react';
import { CurrencyCode, CURRENCY_SYMBOLS } from '../types';
import { sbSaveToolData } from '../services/supabaseService';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip 
} from 'recharts';

interface ToolsProps {
  currency: CurrencyCode;
  userId: string;
  privacyMode: boolean;
}

// --- COLORS & CONSTANTS ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'AED'];
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 151.2, CAD: 1.36, AUD: 1.52, AED: 3.67
};

// --- HELPER HOOKS & COMPONENTS ---

function usePersist<T>(userId: string, tool: string, field: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const key = `mmp_${userId}_${tool}_${field}`;
    const [val, setVal] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? JSON.parse(stored) : initial;
        } catch { return initial; }
    });

    useEffect(() => {
        const t = setTimeout(() => {
            localStorage.setItem(key, JSON.stringify(val));
            sbSaveToolData(userId, `${tool}_${field}`, val);
        }, 1000);
        return () => clearTimeout(t);
    }, [val, key, userId, tool, field]);

    return [val, setVal];
}

const InputGroup = ({ label, value, onChange, symbol, type = "number", step="any", min, suffix }: any) => (
  <div className="mb-4 group relative">
    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
    <div className="relative">
        {symbol && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none">{symbol}</span>}
        <input 
        type={type} 
        value={value}
        step={step}
        min={min} 
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} 
        className={`w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${symbol ? 'pl-10' : ''}`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs pointer-events-none">{suffix}</span>}
    </div>
  </div>
);

const ResultCard = ({ title, amount, subtitle, color, symbol, privacyMode, fullWidth = false }: any) => {
    const displayAmount = privacyMode && symbol ? '****' : (typeof amount === 'number' ? `${symbol || ''}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : amount);
    
    const colorStyles: any = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        red: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        slate: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    };

    return (
        <div className={`p-5 rounded-2xl flex flex-col items-center justify-center text-center border-2 ${colorStyles[color] || colorStyles.blue} relative overflow-hidden ${fullWidth ? 'col-span-2' : ''}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{title}</span>
            <span className="text-2xl md:text-3xl font-extrabold mb-1 break-all relative z-10">{displayAmount}</span>
            {subtitle && <span className="text-xs font-semibold opacity-80 relative z-10">{subtitle}</span>}
        </div>
    );
};

const DonutChart = ({ data, totalLabel, totalValue }: any) => (
    <div className="h-48 w-full min-w-[200px] relative my-4">
        <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <ReTooltip contentStyle={{ borderRadius: '8px', border: 'none', background: '#1f2937', color: '#fff' }} />
            </RePieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-gray-400 uppercase font-bold">{totalLabel}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{totalValue}</span>
        </div>
    </div>
);

// --- 1. CONVERTER TOOLS ---

const CurrencyConverter = ({ userId, privacyMode }: any) => {
    const [amount, setAmount] = usePersist(userId, 'curr', 'a', 1);
    const [from, setFrom] = usePersist(userId, 'curr', 'f', 'USD');
    const [to, setTo] = usePersist(userId, 'curr', 't', 'INR');
    
    const rate = useMemo(() => (EXCHANGE_RATES[to] / EXCHANGE_RATES[from]), [from, to]);
    const converted = amount * rate;

    return (
        <div className="space-y-6">
            <InputGroup label="Amount" value={amount} onChange={setAmount} />
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                <div className="group">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">From</label>
                    <select value={from} onChange={e => setFrom(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold border border-gray-200 dark:border-gray-700">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <button onClick={() => { setFrom(to); setTo(from); }} className="p-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-xl mb-1 hover:scale-105 transition-transform"><ArrowRightLeft size={18}/></button>
                <div className="group">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">To</label>
                    <select value={to} onChange={e => setTo(e.target.value)} className="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold border border-gray-200 dark:border-gray-700">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl text-center border-2 border-indigo-100 dark:border-indigo-800/50">
                <p className="text-xs text-indigo-500 font-bold uppercase mb-2">1 {from} = {rate.toFixed(4)} {to}</p>
                <p className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300">
                    {privacyMode ? '****' : `${CURRENCY_SYMBOLS[to as CurrencyCode] || ''} ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </p>
            </div>
        </div>
    );
};

const SalaryCalc = ({ symbol, userId }: any) => {
    const [amount, setAmount] = usePersist(userId, 'sal', 'a', 50000);
    const [period, setPeriod] = usePersist(userId, 'sal', 'p', 'year');
    
    let annual = amount;
    if (period === 'month') annual = amount * 12;
    if (period === 'week') annual = amount * 52;
    if (period === 'hour') annual = amount * 40 * 52;

    const breakdown = [
        { label: 'Yearly', val: annual },
        { label: 'Monthly', val: annual / 12 },
        { label: 'Bi-Weekly', val: annual / 26 },
        { label: 'Weekly', val: annual / 52 },
        { label: 'Daily', val: annual / 260 },
        { label: 'Hourly', val: annual / 2080 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="flex-1">
                    <InputGroup label="Amount" value={amount} onChange={setAmount} symbol={symbol} />
                </div>
                <div className="w-1/3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Per</label>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold border border-gray-200 dark:border-gray-700">
                        <option value="year">Year</option>
                        <option value="month">Month</option>
                        <option value="week">Week</option>
                        <option value="hour">Hour</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {breakdown.map((b) => (
                    <div key={b.label} className={`p-3 rounded-xl border ${b.label === 'Yearly' || b.label === 'Monthly' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                        <p className="text-[10px] uppercase font-bold opacity-60">{b.label}</p>
                        <p className="font-bold text-lg">{symbol}{b.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 2. INVESTMENT TOOLS ---

const SIPCalc = ({ symbol, userId }: any) => {
    const [invest, setInvest] = usePersist(userId, 'sip', 'i', 5000);
    const [rate, setRate] = usePersist(userId, 'sip', 'r', 12);
    const [years, setYears] = usePersist(userId, 'sip', 'y', 10);
    
    const i = rate / 1200;
    const n = years * 12;
    const totalValue = invest * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const investedAmount = invest * n;
    const wealthGained = totalValue - investedAmount;

    const chartData = [
        { name: 'Invested', value: investedAmount, color: '#6366f1' },
        { name: 'Gains', value: wealthGained, color: '#10b981' }
    ];

    return (
        <div className="space-y-6">
            <InputGroup label="Monthly Investment" value={invest} onChange={setInvest} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Expected Return %" value={rate} onChange={setRate} suffix="%" />
                <InputGroup label="Time Period" value={years} onChange={setYears} suffix="Yr" />
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <DonutChart data={chartData} totalLabel="Total Value" totalValue={`${symbol}${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <ResultCard title="Invested" amount={investedAmount} color="indigo" symbol={symbol} />
                    <ResultCard title="Wealth Gains" amount={wealthGained} color="green" symbol={symbol} />
                </div>
            </div>
        </div>
    );
};

// --- 3. LOAN TOOLS ---

const EMICalculator = ({ symbol, userId }: any) => {
    const [amount, setAmount] = usePersist(userId, 'emi', 'a', 500000);
    const [rate, setRate] = usePersist(userId, 'emi', 'r', 9.5);
    const [years, setYears] = usePersist(userId, 'emi', 'y', 5);

    const r = rate / 1200;
    const n = years * 12;
    const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPay = emi * n;
    const totalInt = totalPay - amount;

    const chartData = [
        { name: 'Principal', value: amount, color: '#6366f1' },
        { name: 'Interest', value: totalInt, color: '#f59e0b' }
    ];

    return (
        <div className="space-y-6">
            <InputGroup label="Loan Amount" value={amount} onChange={setAmount} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Interest Rate" value={rate} onChange={setRate} suffix="%" />
                <InputGroup label="Tenure" value={years} onChange={setYears} suffix="Yr" />
            </div>
            <ResultCard title="Monthly EMI" amount={emi} color="blue" symbol={symbol} fullWidth />
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <DonutChart data={chartData} totalLabel="Total Payable" totalValue={`${symbol}${totalPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <div className="text-center text-xs text-gray-500 mt-2">
                    Principal: {symbol}{amount.toLocaleString()} • Interest: {symbol}{totalInt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
            </div>
        </div>
    );
};

const LoanElig = ({ symbol, userId }: any) => {
    const [income, setIncome] = usePersist(userId, 'le', 'i', 50000);
    const [rate, setRate] = usePersist(userId, 'le', 'r', 8.5);
    const [tenure, setTenure] = usePersist(userId, 'le', 't', 20);
    const [existingEMI, setExistingEMI] = usePersist(userId, 'le', 'e', 0);

    const maxEMI = (income * 0.50) - existingEMI;
    const r = rate / 1200;
    const n = tenure * 12;
    const maxLoan = maxEMI > 0 ? maxEMI * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))) : 0;

    return (
        <div className="space-y-6">
            <InputGroup label="Net Monthly Income" value={income} onChange={setIncome} symbol={symbol} />
            <InputGroup label="Existing EMIs" value={existingEMI} onChange={setExistingEMI} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Rate %" value={rate} onChange={setRate} />
                <InputGroup label="Tenure (Yrs)" value={tenure} onChange={setTenure} />
            </div>
            <ResultCard title="Max Eligible Loan" amount={maxLoan} subtitle={`Max Affordable EMI: ${symbol}${Math.max(0, maxEMI).toFixed(0)}`} color="green" symbol={symbol} />
        </div>
    );
};

// --- 4. PLANNING TOOLS ---

const BudgetMaker = ({ symbol, userId }: any) => {
    const [income, setIncome] = usePersist(userId, 'bud', 'i', 5000);
    
    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;

    const data = [
        { name: 'Needs (50%)', value: needs, color: '#6366f1' },
        { name: 'Wants (30%)', value: wants, color: '#f59e0b' },
        { name: 'Savings (20%)', value: savings, color: '#10b981' },
    ];

    return (
        <div className="space-y-6">
            <InputGroup label="Monthly Income" value={income} onChange={setIncome} symbol={symbol} />
            <div className="h-48 w-full min-w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                             {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <ReTooltip />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-3">
                {data.map(d => (
                    <div key={d.name} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-l-4" style={{ borderLeftColor: d.color }}>
                        <span className="font-bold text-sm text-gray-600 dark:text-gray-300">{d.name}</span>
                        <span className="font-bold text-gray-900 dark:text-white">{symbol}{d.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ShoppingList = ({ symbol, userId }: any) => {
    const [items, setItems] = usePersist<{id: number, text: string, price: number, qty: number, done: boolean}[]>(userId, 'shop', 'l', []);
    const [text, setText] = useState('');
    const [price, setPrice] = useState('');

    const add = () => {
        if(!text) return;
        setItems([...items, { id: Date.now(), text, price: Number(price) || 0, qty: 1, done: false }]);
        setText(''); setPrice('');
    };

    const toggle = (id: number) => setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
    const del = (id: number) => setItems(items.filter(i => i.id !== id));
    const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex gap-2">
                <input value={text} onChange={e=>setText(e.target.value)} placeholder="Item name" className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold border border-gray-200 dark:border-gray-700 outline-none"/>
                <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" type="number" className="w-20 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold border border-gray-200 dark:border-gray-700 outline-none"/>
                <button onClick={add} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700"><Plus/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[300px]">
                {items.length === 0 && <p className="text-center text-gray-400 text-xs py-4">List is empty.</p>}
                {items.map(i => (
                    <div key={i.id} className={`flex items-center justify-between p-3 rounded-xl border ${i.done ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                        <div className="flex items-center gap-3">
                            <button onClick={() => toggle(i.id)} className={i.done ? 'text-emerald-500' : 'text-gray-300'}>
                                {i.done ? <CheckSquare size={20}/> : <Square size={20}/>}
                            </button>
                            <div className={i.done ? 'line-through text-gray-400' : ''}>
                                <p className="font-bold text-sm">{i.text}</p>
                                {i.price > 0 && <p className="text-[10px] text-gray-500">{symbol}{i.price} x {i.qty}</p>}
                            </div>
                        </div>
                        <button onClick={() => del(i.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-gray-900 text-white rounded-2xl flex justify-between items-center">
                <span className="font-bold uppercase text-xs tracking-wider">Estimated Total</span>
                <span className="font-extrabold text-xl">{symbol}{total.toLocaleString()}</span>
            </div>
        </div>
    );
};

// --- 5. UTILITY & TAX TOOLS ---

const CryptoCalc = ({ symbol, userId }: any) => {
    const [buy, setBuy] = usePersist(userId, 'cry', 'b', 50000);
    const [sell, setSell] = usePersist(userId, 'cry', 's', 55000);
    const [amt, setAmt] = usePersist(userId, 'cry', 'a', 0.5);
    const [fee, setFee] = usePersist(userId, 'cry', 'f', 0.1);

    const cost = buy * amt;
    const revenue = sell * amt;
    const totalFee = (cost * fee/100) + (revenue * fee/100);
    const profit = revenue - cost - totalFee;
    const roi = (profit / cost) * 100;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Buy Price" value={buy} onChange={setBuy} symbol={symbol} />
                <InputGroup label="Sell Price" value={sell} onChange={setSell} symbol={symbol} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Coins/Tokens" value={amt} onChange={setAmt} />
                <InputGroup label="Exchange Fee" value={fee} onChange={setFee} suffix="%" />
            </div>
            <ResultCard title="Net Profit (After Fees)" amount={profit} subtitle={`ROI: ${roi.toFixed(2)}%`} color={profit >= 0 ? 'green' : 'red'} symbol={symbol} />
        </div>
    );
};

const TaxEstimator = ({ symbol, userId }: any) => {
    const [inc, setInc] = usePersist(userId, 'tax', 'i', 60000);
    let tax = 0;
    if (inc > 10000) tax += (Math.min(inc, 40000) - 10000) * 0.10;
    if (inc > 40000) tax += (inc - 40000) * 0.20;
    
    const monthly = (inc - tax) / 12;

    return (
        <div className="space-y-6">
            <InputGroup label="Annual Gross Income" value={inc} onChange={setInc} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                 <ResultCard title="Est. Annual Tax" amount={tax} color="red" symbol={symbol} />
                 <ResultCard title="Effective Rate" amount={(tax/inc)*100} color="orange" subtitle="Average Tax %" suffix="%" />
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-center">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Net Monthly Pay</p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">{symbol}{monthly.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
        </div>
    );
};

// Generic Calc Component
const SimpleCalc = ({ inputs, formula, title, color, symbol, subtitleFn, userId, id }: any) => {
    const [vals, setVals] = usePersist(userId, id, 'v', inputs.map((i: any) => i.def));
    const res = formula(vals);
    
    return (
        <div className="space-y-6">
            <div className={`grid ${inputs.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {inputs.map((inp: any, idx: number) => (
                    <InputGroup 
                        key={inp.label} 
                        label={inp.label} 
                        value={vals[idx]} 
                        onChange={(v: any) => { const n = [...vals]; n[idx]=v; setVals(n); }} 
                        symbol={inp.symbol ? symbol : undefined} 
                        suffix={inp.suffix}
                    />
                ))}
            </div>
            <ResultCard title={title} amount={res} subtitle={subtitleFn ? subtitleFn(res, vals, symbol) : ''} color={color} symbol={symbol} />
        </div>
    );
};

// --- TOOL REGISTRY & MAP ---
// FIX: KEYS MUST MATCH ARRAY IDs EXACTLY TO PREVENT LOADING ERROR

const TOOL_COMPONENTS: any = {
    // Specialized
    sip: SIPCalc,
    emi: EMICalculator,
    currency: CurrencyConverter,
    salary: SalaryCalc,
    budget: BudgetMaker,
    loan_elig: LoanElig,
    shopping: ShoppingList,
    crypto: CryptoCalc,
    tax: TaxEstimator,
    
    // Generic Configs
    fd: (props: any) => <SimpleCalc {...props} id="fd" title="Maturity Value" color="blue" 
        inputs={[{label: 'Deposit', def: 10000, symbol: true}, {label: 'Rate', def: 6.5, suffix: '%'}, {label: 'Years', def: 5, suffix: 'Yr'}]}
        formula={([p, r, t]: any[]) => p * Math.pow(1 + r/100, t)} 
        subtitleFn={(res: number, [deposit]: number[]) => `Interest: ${props.symbol}${Math.round(res-deposit)}`} />,
        
    rd: (props: any) => <SimpleCalc {...props} id="rd" title="Maturity Value" color="pink"
        inputs={[{label: 'Monthly Deposit', def: 5000, symbol: true}, {label: 'Rate', def: 7, suffix: '%'}, {label: 'Years', def: 5, suffix: 'Yr'}]}
        formula={([m, r, t]: any[]) => { const i = r/1200; const n = t*12; return m * ((Math.pow(1+i, n)-1)/i)*(1+i); }} 
        subtitleFn={(res: number, [m, r, t]: number[]) => `Invested: ${props.symbol}${m*t*12}`} />,
        
    ppf: (props: any) => <SimpleCalc {...props} id="ppf" title="Maturity (15Y)" color="indigo"
        inputs={[{label: 'Yearly Investment', def: 100000, symbol: true}]}
        formula={([y]: any[]) => { const r=7.1/100; return y*((Math.pow(1+r, 15)-1)/r)*(1+r); }}
        subtitleFn={(res: number, [y]: number[]) => `Total Invested: ${props.symbol}${y*15}`} />,
        
    cagr: (props: any) => <SimpleCalc {...props} id="cagr" title="CAGR %" color="purple"
        inputs={[{label: 'Start Value', def: 10000, symbol: true}, {label: 'End Value', def: 20000, symbol: true}, {label: 'Years', def: 5}]}
        formula={([s, e, y]: any[]) => (Math.pow(e/s, 1/y) - 1) * 100} 
        subtitleFn={() => 'Annual Growth Rate'} />,
        
    roi: (props: any) => <SimpleCalc {...props} id="roi" title="ROI %" color="green"
        inputs={[{label: 'Invested', def: 50000, symbol: true}, {label: 'Returned', def: 65000, symbol: true}]}
        formula={([i, r]: any[]) => ((r-i)/i)*100}
        subtitleFn={(res: number, [i, r]: number[]) => `Profit: ${props.symbol}${r-i}`} />,
        
    rule72: (props: any) => <SimpleCalc {...props} id="r72" title="Years to Double" color="orange"
        inputs={[{label: 'Interest Rate', def: 12, suffix: '%'}]}
        formula={([r]: any[]) => 72/r} subtitleFn={() => 'At compound interest'} />,
        
    simple: (props: any) => <SimpleCalc {...props} id="si" title="Total Amount" color="teal"
        inputs={[{label: 'Principal', def: 10000, symbol: true}, {label: 'Rate', def: 5, suffix: '%'}, {label: 'Time', def: 2, suffix: 'Yr'}]}
        formula={([p, r, t]: any[]) => p + (p*r*t)/100}
        subtitleFn={(res: number, [principal]: number[]) => `Interest: ${props.symbol}${res-principal}`} />,
        
    fuel: (props: any) => <SimpleCalc {...props} id="fuel" title="Trip Cost" color="rose"
        inputs={[{label: 'Distance (km)', def: 100}, {label: 'Mileage (km/l)', def: 15}, {label: 'Fuel Price', def: 100, symbol: true}]}
        formula={([d, m, p]: any[]) => (d/m)*p}
        subtitleFn={(res: number, [d, m]: number[]) => `Fuel Required: ${(d/m).toFixed(1)}L`} />,
        
    vat: (props: any) => <SimpleCalc {...props} id="vat" title="Final Amount" color="cyan"
        inputs={[{label: 'Price', def: 100, symbol: true}, {label: 'VAT %', def: 20}]}
        formula={([p, v]: any[]) => p * (1 + v/100)}
        subtitleFn={(res: number, [pr]: number[]) => `Tax: ${props.symbol}${res-pr}`} />,
        
    gst: (props: any) => <SimpleCalc {...props} id="gst" title="Final Amount" color="blue"
        inputs={[{label: 'Price', def: 1000, symbol: true}, {label: 'GST %', def: 18}]}
        formula={([p, g]: any[]) => p * (1 + g/100)}
        subtitleFn={(res: number, [pr]: number[]) => `Tax: ${props.symbol}${res-pr}`} />,
        
    discount: (props: any) => <SimpleCalc {...props} id="disc" title="Discounted Price" color="pink"
        inputs={[{label: 'Original Price', def: 500, symbol: true}, {label: 'Discount %', def: 20}]}
        formula={([p, d]: any[]) => p * (1 - d/100)}
        subtitleFn={(res: number, [pr]: number[]) => `You Save: ${props.symbol}${pr-res}`} />,
        
    tip: (props: any) => <SimpleCalc {...props} id="tip" title="Total Bill" color="teal"
        inputs={[{label: 'Bill Amount', def: 50, symbol: true}, {label: 'Tip %', def: 15}]}
        formula={([b, t]: any[]) => b * (1 + t/100)}
        subtitleFn={(res: number, [b]: number[]) => `Tip: ${props.symbol}${res-b}`} />,
        
    inflation: (props: any) => <SimpleCalc {...props} id="inf" title="Future Cost" color="orange"
        inputs={[{label: 'Current Cost', def: 1000, symbol: true}, {label: 'Inflation %', def: 6}, {label: 'Years', def: 10}]}
        formula={([c, r, y]: any[]) => c * Math.pow(1 + r/100, y)}
        subtitleFn={(res: number) => 'Effect of purchasing power loss'} />,
        
    fire: (props: any) => <SimpleCalc {...props} id="fire" title="FIRE Number" color="red"
        inputs={[{label: 'Annual Expense', def: 40000, symbol: true}]}
        formula={([e]: any[]) => e * 25}
        subtitleFn={() => 'Corpus for financial independence'} />,
        
    retirement: (props: any) => <SimpleCalc {...props} id="ret" title="Corpus Needed" color="indigo"
        inputs={[{label: 'Monthly Exp', def: 3000, symbol: true}, {label: 'Current Age', def: 30}, {label: 'Retire Age', def: 60}]}
        formula={([e, ca, ra]: any[]) => { const y = ra-ca; const fv = e * Math.pow(1.06, y); return fv * 12 * 20; }}
        subtitleFn={(res: number, [e, ca, ra]: number[]) => `For 20 years post-retirement`} />,
        
    emergency: (props: any) => <SimpleCalc {...props} id="eme" title="Emergency Fund" color="red"
        inputs={[{label: 'Monthly Exp', def: 3000, symbol: true}, {label: 'Months', def: 6}]}
        formula={([e, m]: any[]) => e * m}
        subtitleFn={() => 'Keep in liquid assets'} />,
        
    goal: (props: any) => <SimpleCalc {...props} id="goal" title="Monthly Saving" color="green"
        inputs={[{label: 'Target Amount', def: 100000, symbol: true}, {label: 'Years', def: 5}, {label: 'Return %', def: 10}]}
        formula={([g, y, r]: any[]) => { const i = r/1200; const n = y*12; return g / (((Math.pow(1+i,n)-1)/i)*(1+i)); }}
        subtitleFn={() => 'To reach goal on time'} />,
        
    networth: (props: any) => <SimpleCalc {...props} id="nw" title="Net Worth" color="indigo"
        inputs={[{label: 'Total Assets', def: 500000, symbol: true}, {label: 'Total Liabilities', def: 200000, symbol: true}]}
        formula={([a, l]: any[]) => a - l}
        subtitleFn={(res: number) => res > 0 ? 'Positive Equity' : 'In Debt'} />,
        
    rental: (props: any) => <SimpleCalc {...props} id="rent" title="Rental Yield" color="orange"
        inputs={[{label: 'Property Cost', def: 200000, symbol: true}, {label: 'Monthly Rent', def: 1500, symbol: true}]}
        formula={([c, r]: any[]) => ((r*12)/c)*100}
        subtitleFn={() => 'Gross Annual Yield %'} />,
        
    dividend: (props: any) => <SimpleCalc {...props} id="div" title="Dividend Yield" color="green"
        inputs={[{label: 'Share Price', def: 100, symbol: true}, {label: 'Annual Div', def: 5, symbol: true}]}
        formula={([p, d]: any[]) => (d/p)*100}
        subtitleFn={() => 'Return on stock price'} />,
        
    caprate: (props: any) => <SimpleCalc {...props} id="cap" title="Cap Rate" color="purple"
        inputs={[{label: 'Net Op Income', def: 30000, symbol: true}, {label: 'Property Value', def: 500000, symbol: true}]}
        formula={([n, v]: any[]) => (n/v)*100}
        subtitleFn={() => 'Capitalization Rate %'} />,
        
    debt_pay: (props: any) => <SimpleCalc {...props} id="debt" title="Months to Payoff" color="rose"
        inputs={[{label: 'Balance', def: 5000, symbol: true}, {label: 'Rate %', def: 18}, {label: 'Monthly Pay', def: 200, symbol: true}]}
        formula={([b, r, m]: any[]) => { const i=r/1200; return m<=b*i ? 0 : (-Math.log(1-(i*b)/m)/Math.log(1+i)); }}
        subtitleFn={(res: number) => res===0 ? 'Increase Payment!' : `${(res/12).toFixed(1)} Years`} />,
        
    breakeven: (props: any) => <SimpleCalc {...props} id="be" title="Break Even Units" color="slate"
        inputs={[{label: 'Fixed Cost', def: 1000, symbol: true}, {label: 'Price/Unit', def: 50, symbol: true}, {label: 'Var Cost/Unit', def: 20, symbol: true}]}
        formula={([f, p, v]: any[]) => f / (p-v)}
        subtitleFn={() => 'Units to sell to cover costs'} />,
        
    margin: (props: any) => <SimpleCalc {...props} id="marg" title="Gross Margin %" color="blue"
        inputs={[{label: 'Cost', def: 50, symbol: true}, {label: 'Revenue', def: 100, symbol: true}]}
        formula={([c, r]: any[]) => ((r-c)/r)*100}
        subtitleFn={() => 'Profitability Ratio'} />,
        
    mortgage: (props: any) => <SimpleCalc {...props} id="mort" title="Monthly Payment" color="amber"
        inputs={[{label: 'Loan', def: 300000, symbol: true}, {label: 'Rate', def: 6.5, suffix: '%'}, {label: 'Years', def: 30}]}
        formula={([l, r, y]: any[]) => { const i=r/1200; const n=y*12; return (l*i*Math.pow(1+i,n))/(Math.pow(1+i,n)-1); }}
        subtitleFn={(res: number, [l, r, y]: number[]) => `Total: ${props.symbol}${Math.round(res*y*12)}`} />,
        
    cd: (props: any) => <SimpleCalc {...props} id="cd" title="Maturity Value" color="cyan"
        inputs={[{label: 'Deposit', def: 10000, symbol: true}, {label: 'APY', def: 5, suffix: '%'}, {label: 'Years', def: 3}]}
        formula={([d, r, y]: any[]) => d * Math.pow(1+r/100, y)}
        subtitleFn={(res: number, [d]: number[]) => `Profit: ${props.symbol}${Math.round(res-d)}`} />,
};

// --- MAIN COMPONENT ---

export const Tools: React.FC<ToolsProps> = ({ currency, userId, privacyMode }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const symbol = CURRENCY_SYMBOLS[currency];

  // IDs here MUST match keys in TOOL_COMPONENTS above
  const tools = [
    // Investments
    { id: 'sip', name: 'SIP Wealth', icon: TrendingUp, color: 'emerald', desc: 'Systematic Investment Plan calculator with visualization' },
    { id: 'fd', name: 'FD Calc', icon: Landmark, color: 'blue', desc: 'Fixed Deposit maturity calculator' },
    { id: 'rd', name: 'RD Calc', icon: PiggyBank, color: 'pink', desc: 'Recurring Deposit planner' },
    { id: 'ppf', name: 'PPF Calc', icon: ShieldCheck, color: 'indigo', desc: 'Public Provident Fund estimator' },
    { id: 'cd', name: 'CD Calc', icon: Building2, color: 'cyan', desc: 'Certificate of Deposit returns' },
    { id: 'crypto', name: 'Crypto Calc', icon: Bitcoin, color: 'yellow', desc: 'Profit/Loss calculator with exchange fees' },
    { id: 'cagr', name: 'CAGR', icon: BarChart3, color: 'purple', desc: 'Compound Annual Growth Rate' },
    { id: 'roi', name: 'ROI', icon: Percent, color: 'green', desc: 'Return on Investment calculator' },
    { id: 'rule72', name: 'Rule of 72', icon: Clock, color: 'orange', desc: 'Years to double your money' },
    { id: 'simple', name: 'Simple Int', icon: Coins, color: 'teal', desc: 'Basic interest calculator' },
    
    // Planning
    { id: 'budget', name: 'Budget 50/30/20', icon: Sliders, color: 'purple', desc: 'Smart budget allocation tool' },
    { id: 'fire', name: 'FIRE Calc', icon: Flame, color: 'red', desc: 'Financial Independence Retire Early' },
    { id: 'retirement', name: 'Retirement', icon: Umbrella, color: 'teal', desc: 'Corpus needed for retirement' },
    { id: 'emergency', name: 'Emergency Fund', icon: HeartPulse, color: 'red', desc: 'Safety net calculator' },
    { id: 'goal', name: 'Goal Planner', icon: Target, color: 'blue', desc: 'Monthly savings for a target' },
    { id: 'networth', name: 'Net Worth', icon: PieChart, color: 'indigo', desc: 'Assets vs Liabilities' },
    { id: 'salary', name: 'Salary Breakdown', icon: Briefcase, color: 'emerald', desc: 'Hourly to Yearly converter' },
    { id: 'rental', name: 'Rental Yield', icon: Key, color: 'orange', desc: 'Property return calculator' },
    { id: 'dividend', name: 'Div. Yield', icon: BarChart3, color: 'green', desc: 'Stock dividend return' },
    { id: 'caprate', name: 'Cap Rate', icon: Building2, color: 'blue', desc: 'Real estate capitalization rate' },
    
    // Loans
    { id: 'emi', name: 'EMI Advanced', icon: Calculator, color: 'blue', desc: 'Loan EMI with Interest breakdown' },
    { id: 'mortgage', name: 'Mortgage', icon: Home, color: 'amber', desc: 'Home loan estimator' },
    { id: 'loan_elig', name: 'Loan Eligibility', icon: CheckCircle, color: 'green', desc: 'Max loan amount estimator' },
    { id: 'debt_pay', name: 'Debt Payoff', icon: TrendingUp, color: 'red', desc: 'Time to become debt free' },
    
    // Business
    { id: 'breakeven', name: 'Break Even', icon: Scale, color: 'slate', desc: 'Units to sell to cover costs' },
    { id: 'margin', name: 'Margin', icon: DollarSign, color: 'indigo', desc: 'Gross profit margin' },
    
    // Daily Utility
    { id: 'currency', name: 'Currency Conv.', icon: RefreshCcw, color: 'cyan', desc: 'Multi-currency converter' },
    { id: 'fuel', name: 'Fuel Trip', icon: Car, color: 'orange', desc: 'Trip cost estimator' },
    { id: 'shopping', name: 'Smart List', icon: ShoppingCart, color: 'pink', desc: 'Shopping list with total' },
    { id: 'discount', name: 'Discount', icon: Tag, color: 'rose', desc: 'Sale price calculator' },
    { id: 'tip', name: 'Tip Calc', icon: HeartPulse, color: 'teal', desc: 'Bill splitter and tip' },
    { id: 'tax', name: 'Tax Est', icon: FileText, color: 'slate', desc: 'Income tax estimator' },
    { id: 'gst', name: 'GST Calc', icon: Receipt, color: 'blue', desc: 'Goods and Services Tax' },
    { id: 'vat', name: 'VAT Calc', icon: Receipt, color: 'cyan', desc: 'Value Added Tax' },
    { id: 'inflation', name: 'Inflation', icon: TrendingUp, color: 'red', desc: 'Future value of money' },
  ];

  const getColor = (c: string) => {
     return `bg-${c}-100 text-${c}-600 dark:bg-${c}-900/40 dark:text-${c}-300`;
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none"><Grid size={22}/></div>
            Power Tools <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full text-gray-600 dark:text-gray-400 font-bold border border-gray-200 dark:border-gray-700">{tools.length}</span>
        </h2>
        {activeTool && (
           <div className="flex gap-2">
             <button onClick={() => setActiveTool(null)} className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-full text-black dark:text-white font-medium transition-colors">Close</button>
           </div>
        )}
      </div>
      
      {activeTool ? (
        <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 animate-slide-up relative flex-1 flex flex-col max-w-2xl mx-auto w-full">
           <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                <button onClick={() => setActiveTool(null)} className="text-sm font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 w-fit transition-colors">← Back</button>
                <h3 className="font-extrabold text-2xl capitalize text-gray-900 dark:text-white">{tools.find(t=>t.id===activeTool)?.name}</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                {/* Safe render check */}
                {TOOL_COMPONENTS[activeTool] 
                    ? React.createElement(TOOL_COMPONENTS[activeTool], { symbol, userId, privacyMode })
                    : <div className="text-center text-gray-500 p-10">Tool component not found. Please contact support.</div>
                }
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 pb-20 overflow-y-auto custom-scrollbar flex-1">
             {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className="flex flex-col items-center justify-center w-full p-4 py-6 bg-white dark:bg-gray-900 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-none hover:border-indigo-100 dark:hover:border-indigo-900 transition-all active:scale-95 group hover:-translate-y-1 relative"
                >
                    <div className={`p-4 rounded-2xl mb-3 transition-transform shadow-sm group-hover:scale-110 duration-300 ${tool.color === 'slate' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : `bg-${tool.color}-50 text-${tool.color}-600 dark:bg-${tool.color}-900/30 dark:text-${tool.color}-300`}`}>
                        <tool.icon className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors w-full px-1 break-words leading-tight">{tool.name}</span>
                    <span className="text-[10px] text-gray-400 mt-1 line-clamp-1 px-2">{tool.desc}</span>
                </button>
            ))}
        </div>
      )}
    </div>
  );
};
