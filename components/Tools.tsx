
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Percent, TrendingUp, PieChart, Target, RefreshCcw, FileText, Scale, 
  BarChart3, ShieldCheck, Landmark, Tag, CheckCircle, Car, ShoppingCart, Bitcoin, 
  Clock, Umbrella, HeartPulse, Briefcase, Coins, DollarSign, PiggyBank, Building2, 
  Receipt, Sliders, Grid, RotateCcw, Flame, Key, ArrowRightLeft, Plus, Trash2, CheckSquare, Square, Home, Wallet, Activity, BriefcaseIcon, Lightbulb, UserCheck, Smartphone, Construction, History, ArrowLeft
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'AED'];
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 151.2, CAD: 1.36, AUD: 1.52, AED: 3.67
};

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
  <div className="mb-4 group">
    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">{label}</label>
    <div className="relative">
        {symbol && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black pointer-events-none">{symbol}</span>}
        <input 
        type={type} 
        value={value}
        step={step}
        min={min} 
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} 
        className={`w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-2xl p-4 text-base font-black text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition-all ${symbol ? 'pl-10' : ''}`}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs pointer-events-none uppercase">{suffix}</span>}
    </div>
  </div>
);

const ResultCard = ({ title, amount, subtitle, color, symbol, privacyMode, fullWidth = false, suffix = "" }: any) => {
    const displayAmount = privacyMode && symbol ? '••••' : (typeof amount === 'number' ? `${symbol || ''}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}` : amount);
    
    const colors: any = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        red: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
        pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800',
        teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800',
        slate: 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800',
    };

    return (
        <div className={`p-6 rounded-[2rem] border-2 ${colors[color] || colors.indigo} flex flex-col justify-center items-center text-center ${fullWidth ? 'col-span-2' : ''}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{title}</span>
            <span className="text-3xl font-black tracking-tighter">{displayAmount}</span>
            {subtitle && <span className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">{subtitle}</span>}
        </div>
    );
};

const DonutChart = ({ data, totalLabel, totalValue }: any) => (
    <div className="h-56 w-full relative my-6">
        <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                    {data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <ReTooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
            </RePieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{totalLabel}</span>
            <span className="text-base font-black text-gray-950 dark:text-white tracking-tighter">{totalValue}</span>
        </div>
    </div>
);

// --- TOOLS IMPLEMENTATION ---

const CurrencyConverter = ({ userId, privacyMode }: any) => {
    const [amount, setAmount] = usePersist(userId, 'curr', 'a', 100);
    const [from, setFrom] = usePersist(userId, 'curr', 'f', 'USD');
    const [to, setTo] = usePersist(userId, 'curr', 't', 'INR');
    const rate = useMemo(() => EXCHANGE_RATES[to] / EXCHANGE_RATES[from], [from, to]);
    const converted = amount * rate;
    return (
        <div className="space-y-6 animate-fade-in">
            <InputGroup label="Amount" value={amount} onChange={setAmount} />
            <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
                <select value={from} onChange={e=>setFrom(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black outline-none border-none text-sm">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>
                <button onClick={()=>{setFrom(to); setTo(from)}} className="p-4 bg-brand-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"><ArrowRightLeft size={20}/></button>
                <select value={to} onChange={e=>setTo(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black outline-none border-none text-sm">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <ResultCard title={`Converted to ${to}`} amount={converted} symbol={CURRENCY_SYMBOLS[to as CurrencyCode]} color="green" fullWidth />
        </div>
    );
};

const SIPCalc = ({ symbol, userId }: any) => {
    const [monthly, setMonthly] = usePersist(userId, 'sip', 'm', 5000);
    const [rate, setRate] = usePersist(userId, 'sip', 'r', 12);
    const [years, setYears] = usePersist(userId, 'sip', 'y', 10);
    const i = rate / 1200;
    const n = years * 12;
    const maturityValue = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const totalInvested = monthly * n;
    const chartData = [{ name: 'Invested', value: totalInvested, color: '#6366f1' }, { name: 'Gains', value: maturityValue - totalInvested, color: '#10b981' }];
    return (
        <div className="space-y-6">
            <InputGroup label="Monthly Investment" value={monthly} onChange={setMonthly} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Expected Rate %" value={rate} onChange={setRate} suffix="%" />
                <InputGroup label="Period (Years)" value={years} onChange={setYears} suffix="Y" />
            </div>
            <DonutChart data={chartData} totalLabel="Estimated Value" totalValue={`${symbol}${maturityValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <div className="grid grid-cols-2 gap-4">
                <ResultCard title="Total Invested" amount={totalInvested} symbol={symbol} color="indigo" />
                <ResultCard title="Wealth Gains" amount={maturityValue - totalInvested} symbol={symbol} color="green" />
            </div>
        </div>
    );
};

const EMICalc = ({ symbol, userId }: any) => {
    const [loan, setLoan] = usePersist(userId, 'emi', 'l', 500000);
    const [rate, setRate] = usePersist(userId, 'emi', 'r', 9);
    const [years, setYears] = usePersist(userId, 'emi', 'y', 5);
    const r = rate / 1200;
    const n = years * 12;
    const emi = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - loan;
    const chartData = [{ name: 'Principal', value: loan, color: '#6366f1' }, { name: 'Interest', value: totalInterest, color: '#f59e0b' }];
    return (
        <div className="space-y-6">
            <InputGroup label="Loan Principal" value={loan} onChange={setLoan} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Interest Rate %" value={rate} onChange={setRate} suffix="%" />
                <InputGroup label="Tenure (Years)" value={years} onChange={setYears} suffix="Y" />
            </div>
            <ResultCard title="Monthly EMI" amount={emi} symbol={symbol} color="blue" fullWidth />
            <DonutChart data={chartData} totalLabel="Total Payable" totalValue={`${symbol}${totalPayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        </div>
    );
};

const SimpleTool = ({ userId, id, title, inputs, formula, color, symbol, subtitleFn, privacyMode }: any) => {
    const [vals, setVals] = usePersist(userId, id, 'v', inputs.map((i: any) => i.def));
    const result = formula(vals);
    return (
        <div className="space-y-6">
            <div className={`grid ${inputs.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {inputs.map((inp: any, idx: number) => (
                    <InputGroup key={inp.label} label={inp.label} value={vals[idx]} onChange={(v:any)=>{const n=[...vals]; n[idx]=v; setVals(n)}} symbol={inp.sym ? symbol : ""} suffix={inp.suf || ""} />
                ))}
            </div>
            <ResultCard title={title} amount={result} color={color} symbol={symbol} subtitle={subtitleFn ? subtitleFn(result, vals) : ""} privacyMode={privacyMode} fullWidth />
        </div>
    );
};

const ShoppingListTool = ({ userId, symbol }: any) => {
    const [items, setItems] = usePersist<{id:number, t:string, p:number, d:boolean}[]>(userId, 'shop', 'l', []);
    const [newText, setNewText] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const add = () => { if(!newText) return; setItems([...items, {id:Date.now(), t:newText, p:Number(newPrice)||0, d:false}]); setNewText(''); setNewPrice(''); };
    const total = items.reduce((s, i) => s + (i.d ? 0 : i.p), 0);
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex gap-2">
                <input value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Item..." className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-xs" />
                <input value={newPrice} onChange={e=>setNewPrice(e.target.value)} placeholder="Price" type="number" className="w-20 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl outline-none font-black text-xs" />
                <button onClick={add} className="bg-brand-600 text-white p-4 rounded-2xl active:scale-90 transition-all shadow-md"><Plus size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] custom-scrollbar">
                {items.length === 0 ? (
                    <div className="py-20 text-center opacity-40"><ShoppingCart className="mx-auto mb-2"/><p className="text-[10px] uppercase font-black tracking-widest">List is empty</p></div>
                ) : (
                    items.map(i => (
                        <div key={i.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group border border-transparent hover:border-brand-500/10 transition-all">
                            <div className="flex items-center gap-3">
                                <button onClick={()=>setItems(items.map(x=>x.id===i.id?{...x,d:!x.d}:x))} className={i.d ? 'text-emerald-500' : 'text-gray-400'}>{i.d ? <CheckSquare size={18}/> : <Square size={18}/>}</button>
                                <span className={`font-bold text-xs ${i.d ? 'line-through opacity-40' : ''}`}>{i.t} {i.p > 0 && `(${symbol}${i.p})`}</span>
                            </div>
                            <button onClick={()=>setItems(items.filter(x=>x.id!==i.id))} className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                        </div>
                    ))
                )}
            </div>
            <div className="p-6 bg-brand-600 text-white rounded-[2rem] flex justify-between items-center shadow-xl shadow-brand-500/20">
                <span className="text-[10px] font-black uppercase tracking-widest">Est. Total</span>
                <span className="text-2xl font-black tracking-tighter">{symbol}{total.toLocaleString()}</span>
            </div>
        </div>
    );
};

// --- TOOL REGISTRY ---

const TOOL_COMPONENTS: any = {
    sip: SIPCalc,
    emi: EMICalc,
    currency: CurrencyConverter,
    shopping: ShoppingListTool,
    
    // Generic Wealth
    fd: (p:any) => <SimpleTool {...p} id="fd" title="Maturity Value" color="indigo" inputs={[{label:'Deposit',def:10000,sym:1},{label:'Rate %',def:7,suf:'%'},{label:'Years',def:5,suf:'Y'}]} formula={([p,r,y]:any)=>p*Math.pow(1+r/100,y)} />,
    rd: (p:any) => <SimpleTool {...p} id="rd" title="Maturity Value" color="pink" inputs={[{label:'Monthly',def:1000,sym:1},{label:'Rate %',def:6.5,suf:'%'},{label:'Years',def:5,suf:'Y'}]} formula={([m,r,y]:any)=>{const i=r/1200; const n=y*12; return m*((Math.pow(1+i,n)-1)/i)*(1+i)}} />,
    ppf: (p:any) => <SimpleTool {...p} id="ppf" title="Maturity (15Y)" color="teal" inputs={[{label:'Yearly Deposit',def:50000,sym:1}]} formula={([y]:any)=>{const r=0.071; return y*((Math.pow(1+r,15)-1)/r)*(1+r)}} />,
    crypto: (p:any) => <SimpleTool {...p} id="cry" title="Net Profit" color="orange" inputs={[{label:'Buy Price',def:40000,sym:1},{label:'Sell Price',def:45000,sym:1},{label:'Amount',def:1},{label:'Fee %',def:0.1,suf:'%'}]} formula={([b,s,a,f]:any)=>(s-b)*a - ((s+b)*a*f/100)} />,
    roi: (p:any) => <SimpleTool {...p} id="roi" title="ROI %" color="green" inputs={[{label:'Invested',def:10000,sym:1},{label:'Returned',def:12000,sym:1}]} formula={([i,r]:any)=>((r-i)/i)*100} subtitleFn={(res:any)=>"Net Yield"} />,
    cagr: (p:any) => <SimpleTool {...p} id="cagr" title="CAGR %" color="purple" inputs={[{label:'Initial',def:10000,sym:1},{label:'Final',def:25000,sym:1},{label:'Years',def:5,suf:'Y'}]} formula={([i,f,y]:any)=>(Math.pow(f/i,1/y)-1)*100} />,
    comp: (p:any) => <SimpleTool {...p} id="comp" title="Future Wealth" color="indigo" inputs={[{label:'Lumpsum',def:10000,sym:1},{label:'Rate %',def:10,suf:'%'},{label:'Years',def:20,suf:'Y'}]} formula={([p,r,y]:any)=>p*Math.pow(1+r/100,y)} />,
    
    // Planning
    budget: (p:any) => <SimpleTool {...p} id="bud" title="Needs (50%)" color="indigo" inputs={[{label:'Monthly Income',def:5000,sym:1}]} formula={([i]:any)=>i*0.5} subtitleFn={(res:any, [i]:any)=>`Wants: ${p.symbol}${i*0.3} | Savings: ${p.symbol}${i*0.2}`} />,
    fire: (p:any) => <SimpleTool {...p} id="fire" title="FIRE Number" color="red" inputs={[{label:'Annual Exp',def:30000,sym:1}]} formula={([e]:any)=>e*25} subtitleFn={() => "Based on 4% rule"} />,
    emergency: (p:any) => <SimpleTool {...p} id="eme" title="Reserve Fund" color="rose" inputs={[{label:'Monthly Exp',def:3000,sym:1},{label:'Months',def:6}]} formula={([e,m]:any)=>e*m} />,
    networth: (p:any) => <SimpleTool {...p} id="nw" title="Net Worth" color="indigo" inputs={[{label:'Total Assets',def:200000,sym:1},{label:'Liabilities',def:50000,sym:1}]} formula={([a,l]:any)=>a-l} />,
    salary: (p:any) => <SimpleTool {...p} id="sal" title="Monthly Net" color="emerald" inputs={[{label:'Annual Gross',def:60000,sym:1},{label:'Tax %',def:20,suf:'%'}]} formula={([g,t]:any)=>g*(1-t/100)/12} />,
    rental: (p:any) => <SimpleTool {...p} id="rent" title="Rental Yield %" color="orange" inputs={[{label:'Property Cost',def:200000,sym:1},{label:'Monthly Rent',def:1200,sym:1}]} formula={([c,r]:any)=>(r*12/c)*100} />,
    retire: (p:any) => <SimpleTool {...p} id="retire" title="Retirement Corpus" color="indigo" inputs={[{label:'Monthly Exp',def:5000,sym:1},{label:'Years to Live',def:30}]} formula={([e,y]:any)=>e*12*y} subtitleFn={()=>"Estimated funds needed"} />,
    home_aff: (p:any) => <SimpleTool {...p} id="ha" title="Max House Price" color="green" inputs={[{label:'Annual Income',def:80000,sym:1},{label:'Monthly Debt',def:500,sym:1}]} formula={([i,d]:any)=>(i*0.35 - d)*12*15} subtitleFn={()=>"Based on 15X net monthly"} />,
    
    // Loans
    mortgage: (p:any) => <SimpleTool {...p} id="mort" title="Monthly Pay" color="blue" inputs={[{label:'Loan Amt',def:300000,sym:1},{label:'Rate %',def:6.5,suf:'%'},{label:'Years',def:30,suf:'Y'}]} formula={([l,r,y]:any)=>{const i=r/1200; const n=y*12; return (l*i*Math.pow(1+i,n))/(Math.pow(1+i,n)-1)}} />,
    debt: (p:any) => <SimpleTool {...p} id="debt" title="Months to Payoff" color="rose" inputs={[{label:'Balance',def:5000,sym:1},{label:'Rate %',def:15},{label:'Monthly Pay',def:300,sym:1}]} formula={([b,r,m]:any)=>{const i=r/1200; return Math.ceil(-Math.log(1-(i*b)/m)/Math.log(1+i))}} />,
    loan_elig: (p:any) => <SimpleTool {...p} id="le" title="Max Loan" color="green" inputs={[{label:'Monthly Income',def:5000,sym:1},{label:'Existing EMI',def:0,sym:1},{label:'Tenure (Y)',def:20}]} formula={([i,e,t]:any)=>{const r=0.085/12; const n=t*12; const emi=i*0.5-e; return emi*((Math.pow(1+r,n)-1)/(r*Math.pow(1+r,n)))}} />,
    credit: (p:any) => <SimpleTool {...p} id="cre" title="Credit Health %" color="blue" inputs={[{label:'On-Time Pay %',def:100},{label:'Utilization %',def:30},{label:'Age (Y)',def:5}]} formula={([p,u,a]:any)=>Math.min(100, (p*0.6) + (35*(1-u/100)) + (a*2))} />,
    
    // Daily
    fuel: (p:any) => <SimpleTool {...p} id="fuel" title="Trip Cost" color="orange" inputs={[{label:'Dist (km)',def:100},{label:'Mileage',def:15},{label:'Fuel Price',def:1.5,sym:1}]} formula={([d,m,pr]:any)=>(d/m)*pr} />,
    discount: (p:any) => <SimpleTool {...p} id="disc" title="Final Price" color="pink" inputs={[{label:'Price',def:100,sym:1},{label:'Discount %',def:20,suf:'%'}]} formula={([p,d]:any)=>p*(1-d/100)} />,
    gst: (p:any) => <SimpleTool {...p} id="gst" title="Final Price" color="blue" inputs={[{label:'Base Price',def:1000,sym:1},{label:'GST %',def:18,suf:'%'}]} formula={([p,g]:any)=>p*(1+g/100)} />,
    inflation: (p:any) => <SimpleTool {...p} id="inf" title="Future Value" color="red" inputs={[{label:'Current Cost',def:1000,sym:1},{label:'Inflation %',def:6,suf:'%'},{label:'Years',def:10,suf:'Y'}]} formula={([c,r,y]:any)=>c*Math.pow(1+r/100,y)} />,
    tip: (p:any) => <SimpleTool {...p} id="tip" title="Total Bill" color="teal" inputs={[{label:'Bill',def:50,sym:1},{label:'Tip %',def:15,suf:'%'}]} formula={([b,t]:any)=>b*(1+t/100)} />,
    tax: (p:any) => <SimpleTool {...p} id="tax" title="Est. Tax" color="slate" inputs={[{label:'Annual Income',def:50000,sym:1},{label:'Rate %',def:20,suf:'%'}]} formula={([i,r]:any)=>i*r/100} />,
    breakeven: (p:any) => <SimpleTool {...p} id="be" title="Units Needed" color="slate" inputs={[{label:'Fixed Costs',def:2000,sym:1},{label:'Price/Unit',def:50,sym:1},{label:'Cost/Unit',def:30,sym:1}]} formula={([f,p,c]:any)=>Math.ceil(f/(p-c))} />,
    margin: (p:any) => <SimpleTool {...p} id="mar" title="Gross Margin %" color="blue" inputs={[{label:'Cost',def:40,sym:1},{label:'Revenue',def:100,sym:1}]} formula={([c,r]:any)=>(r-c)/r*100} />,
    subs: (p:any) => <SimpleTool {...p} id="sub" title="Annual Sub Cost" color="rose" inputs={[{label:'Monthly Total',def:50,sym:1}]} formula={([m]:any)=>m*12} subtitleFn={()=>"Total of all streaming, software, etc."} />,
};

export const Tools: React.FC<ToolsProps> = ({ currency, userId, privacyMode }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const symbol = CURRENCY_SYMBOLS[currency];
  
  const toolsList = [
    { id: 'sip', name: 'SIP Wealth', icon: TrendingUp, color: 'emerald', cat: 'Wealth' },
    { id: 'fd', name: 'Fixed Deposit', icon: Landmark, color: 'indigo', cat: 'Wealth' },
    { id: 'rd', name: 'Recurring Dep.', icon: PiggyBank, color: 'pink', cat: 'Wealth' },
    { id: 'ppf', name: 'PPF Returns', icon: ShieldCheck, color: 'teal', cat: 'Wealth' },
    { id: 'crypto', name: 'Crypto P/L', icon: Bitcoin, color: 'orange', cat: 'Wealth' },
    { id: 'roi', name: 'ROI %', icon: Activity, color: 'green', cat: 'Wealth' },
    { id: 'cagr', name: 'CAGR %', icon: BarChart3, color: 'purple', cat: 'Wealth' },
    { id: 'comp', name: 'Compound Growth', icon: Coins, color: 'indigo', cat: 'Wealth' },
    { id: 'budget', name: 'Budget 50/30/20', icon: Sliders, color: 'indigo', cat: 'Plan' },
    { id: 'fire', name: 'FIRE Calc', icon: Flame, color: 'red', cat: 'Plan' },
    { id: 'emergency', name: 'Emergency Fund', icon: HeartPulse, color: 'rose', cat: 'Plan' },
    { id: 'networth', name: 'Net Worth', icon: Wallet, color: 'indigo', cat: 'Plan' },
    { id: 'salary', name: 'Net Salary', icon: BriefcaseIcon, color: 'emerald', cat: 'Plan' },
    { id: 'rental', name: 'Rental Yield', icon: Key, color: 'orange', cat: 'Plan' },
    { id: 'retire', name: 'Retirement fund', icon: Landmark, color: 'indigo', cat: 'Plan' },
    { id: 'home_aff', name: 'Home Afford.', icon: Home, color: 'emerald', cat: 'Plan' },
    { id: 'emi', name: 'EMI Adv.', icon: Calculator, color: 'blue', cat: 'Loan' },
    { id: 'mortgage', name: 'Mortgage', icon: Home, color: 'blue', cat: 'Loan' },
    { id: 'loan_elig', name: 'Eligibility', icon: CheckCircle, color: 'green', cat: 'Loan' },
    { id: 'debt', name: 'Debt Payoff', icon: TrendingUp, color: 'rose', cat: 'Loan' },
    { id: 'credit', name: 'Credit Health', icon: UserCheck, color: 'blue', cat: 'Loan' },
    { id: 'breakeven', name: 'Break Even', icon: Scale, color: 'slate', cat: 'Business' },
    { id: 'margin', name: 'Gross Margin', icon: DollarSign, color: 'blue', cat: 'Business' },
    { id: 'currency', name: 'Currency Conv.', icon: RefreshCcw, color: 'indigo', cat: 'Daily' },
    { id: 'shopping', name: 'Smart List', icon: ShoppingCart, color: 'pink', cat: 'Daily' },
    { id: 'fuel', name: 'Fuel Trip', icon: Car, color: 'orange', cat: 'Daily' },
    { id: 'discount', name: 'Discount', icon: Tag, color: 'pink', cat: 'Daily' },
    { id: 'gst', name: 'GST Calc', icon: Receipt, color: 'blue', cat: 'Daily' },
    { id: 'inflation', name: 'Inflation', icon: Lightbulb, color: 'red', cat: 'Daily' },
    { id: 'tip', name: 'Tip Splitter', icon: HeartPulse, color: 'teal', cat: 'Daily' },
    { id: 'tax', name: 'Tax Est.', icon: FileText, color: 'slate', cat: 'Daily' },
    { id: 'subs', name: 'Sub Tracker', icon: Smartphone, color: 'rose', cat: 'Daily' },
  ];

  return (
    <div className="p-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h2 className="text-3xl font-black text-gray-950 dark:text-white tracking-tighter flex items-center gap-3">
          <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-xl shadow-brand-500/20"><Grid size={24}/></div>
          Power Tools
        </h2>
        {activeTool && <button onClick={() => setActiveTool(null)} className="text-xs font-black uppercase tracking-widest text-brand-600 hover:opacity-70 transition-all flex items-center gap-2"><ArrowLeft size={16}/> Back to Grid</button>}
      </div>
      
      {activeTool ? (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 animate-slide-up flex-1 flex flex-col max-w-xl mx-auto w-full overflow-hidden">
           <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 px-2">
                {TOOL_COMPONENTS[activeTool] ? React.createElement(TOOL_COMPONENTS[activeTool], { symbol, userId, privacyMode }) : <div className="text-center py-20 opacity-40"><Construction className="mx-auto mb-4"/><p className="font-black uppercase tracking-widest text-xs">Tool Under Construction</p></div>}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 pb-32 overflow-y-auto custom-scrollbar flex-1 px-1">
             {toolsList.map((tool) => (
                <button key={tool.id} onClick={() => setActiveTool(tool.id)} className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:border-brand-500/20 transition-all active:scale-95 group relative min-h-[200px]">
                    <div className={`p-5 rounded-3xl mb-4 transition-all group-hover:scale-110 duration-500 flex items-center justify-center shrink-0 shadow-sm
                        ${tool.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 
                          tool.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' :
                          tool.color === 'pink' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' :
                          tool.color === 'teal' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' :
                          tool.color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                          tool.color === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                          tool.color === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                          tool.color === 'red' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                          tool.color === 'rose' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                          tool.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                          tool.color === 'slate' ? 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400' :
                          'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                        }`}
                    >
                        <tool.icon size={32} />
                    </div>
                    <span className="font-black text-gray-950 dark:text-white text-sm text-center leading-tight mb-1">{tool.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60">{tool.cat}</span>
                </button>
            ))}
        </div>
      )}
    </div>
  );
};
