import React, { useState, useEffect } from 'react';
import { 
  Calculator, Percent, TrendingUp, CreditCard, PieChart, 
  Target, RefreshCcw, FileText, Scale, Smartphone, 
  BarChart3, ShieldCheck, Landmark, Tag, CheckCircle, ArrowDownCircle, Briefcase, X,
  HelpCircle, Car, ShoppingCart, Activity, Bitcoin, Clock, Umbrella, Zap, Briefcase as WorkIcon, 
  Coins, DollarSign, PiggyBank, GraduationCap, Building2, Receipt, Plane, Users, Sliders, Grid, RotateCcw, Box, HeartPulse, List, Home, Wallet, Flame, Key
} from 'lucide-react';
import { CurrencyCode, CURRENCY_SYMBOLS } from '../types';
import { sbSaveToolData, sbLoadToolData } from '../services/supabaseService';

interface ToolsProps {
  currency: CurrencyCode;
  userId: string;
  privacyMode: boolean;
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  budget: "Advanced Budget Planner with 50/30/20 rule customization.",
  emi: "Loan EMI calculator with principal vs interest breakdown.",
  sip: "Systematic Investment Plan calculator with inflation adjustment.",
  crypto: "Crypto profit/loss calculator including exchange fees.",
  fuel: "Trip fuel cost estimator with split cost feature.",
  fd: "Fixed Deposit maturity calculator.",
  rd: "Recurring Deposit calculator for monthly savings.",
  ppf: "Public Provident Fund calculator (15-year lock-in).",
  cagr: "Compound Annual Growth Rate calculator.",
  roi: "Return on Investment percentage calculator.",
  rule72: "Estimate years required to double your money.",
  loan_elig: "Estimate max loan amount based on income.",
  debt_pay: "Debt payoff planner strategy.",
  mortgage: "Home loan mortgage estimator.",
  emergency: "Emergency fund planner (6 months expense).",
  goal: "Monthly savings needed to reach a financial goal.",
  networth: "Calculate your total Net Worth.",
  unit: "Compare prices to find the best value.",
  inflation: "Calculate future value of money.",
  gst: "GST/VAT Tax calculator.",
  simple: "Simple Interest Calculator.",
  salary: "Convert Hourly wage to Yearly Salary.",
  vat: "Value Added Tax Calculator.",
  breakeven: "Business Break-Even Point Calculator.",
  fire: "Financial Independence, Retire Early (FIRE) Calculator.",
  rental: "Rental Yield Calculator for property investments.",
  dividend: "Dividend Yield Calculator for stocks.",
  caprate: "Cap Rate Calculator for real estate.",
  cd: "Certificate of Deposit Calculator.",
  margin: "Gross Margin Calculator for business sales.",
};

function usePersist<T>(userId: string, tool: string, field: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const key = `mmp_${userId}_${tool}_${field}`;
    const [val, setVal] = useState<T>(() => {
        const stored = localStorage.getItem(key);
        if (stored === null) return initial;
        try {
            return JSON.parse(stored);
        } catch {
            return initial;
        }
    });

    useEffect(() => {
        const sync = async () => {
             sbSaveToolData(userId, `${tool}_${field}`, val);
        };
        const t = setTimeout(sync, 2000); 
        return () => clearTimeout(t);
    }, [val, userId, tool, field]);

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(val));
    }, [key, val]);

    return [val, setVal];
}

// --- Reusable Components for Tools ---
const InputGroup = ({ label, value, onChange, symbol, type = "number", step="any", min }: any) => (
  <div className="mb-4 group">
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
    <div className="relative">
        {symbol && <span className="absolute left-4 top-3.5 text-gray-900 dark:text-white font-bold pointer-events-none opacity-50">{symbol}</span>}
        <input 
        type={type} 
        value={value}
        step={step}
        min={min} 
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} 
        className={`w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all shadow-sm ${symbol ? 'pl-9' : ''} placeholder-gray-400`}
        />
    </div>
  </div>
);

const ResultCard = ({ title, amount, subtitle, color, symbol, privacyMode }: any) => {
    const getColorClass = (c: string) => {
        const map: any = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            red: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
            indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
            pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
            yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
            cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
            teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
            slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
        return map[color] || map['indigo'];
    };

    const displayAmount = privacyMode && symbol ? '****' : (typeof amount === 'number' ? `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : amount);

    return (
        <div className={`p-5 rounded-2xl mt-4 flex flex-col items-center justify-center text-center border-2 ${getColorClass(color)} animate-slide-up relative overflow-hidden`}>
            <span className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">{title}</span>
            <span className="text-3xl font-extrabold mb-1 break-all relative z-10">{displayAmount}</span>
            <span className="text-xs font-semibold opacity-80 relative z-10">{subtitle}</span>
        </div>
    );
};

// --- NEW TOOLS ---

const FireCalc = ({ symbol, userId, privacyMode }: any) => {
    const [exp, setExp] = usePersist(userId, 'fire', 'e', 40000);
    const fireNumber = exp * 25; // 4% rule
    return (
        <div className="space-y-4">
            <InputGroup label="Annual Expenses" value={exp} onChange={setExp} symbol={symbol} />
            <ResultCard title="FIRE Number" amount={fireNumber} subtitle="Amount needed to retire" color="orange" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const RentalYield = ({ symbol, userId, privacyMode }: any) => {
    const [cost, setCost] = usePersist(userId, 'rent', 'c', 200000);
    const [rent, setRent] = usePersist(userId, 'rent', 'r', 1500);
    const [exp, setExp] = usePersist(userId, 'rent', 'e', 200);
    const netAnnual = (rent - exp) * 12;
    const yieldVal = (netAnnual / cost) * 100;
    return (
        <div className="space-y-4">
            <InputGroup label="Property Cost" value={cost} onChange={setCost} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Monthly Rent" value={rent} onChange={setRent} symbol={symbol} />
                <InputGroup label="Monthly Exp" value={exp} onChange={setExp} symbol={symbol} />
            </div>
            <ResultCard title="Rental Yield" amount={yieldVal} subtitle="Net Annual Return %" color="blue" symbol="" privacyMode={false} />
        </div>
    );
};

const DividendYield = ({ symbol, userId, privacyMode }: any) => {
    const [price, setPrice] = usePersist(userId, 'div', 'p', 150);
    const [div, setDiv] = usePersist(userId, 'div', 'd', 5);
    const yieldVal = (div / price) * 100;
    return (
        <div className="space-y-4">
            <InputGroup label="Stock Price" value={price} onChange={setPrice} symbol={symbol} />
            <InputGroup label="Annual Dividend" value={div} onChange={setDiv} symbol={symbol} />
            <ResultCard title="Dividend Yield" amount={yieldVal} subtitle="Annual Return %" color="green" symbol="" privacyMode={false} />
        </div>
    );
};

const CapRate = ({ symbol, userId, privacyMode }: any) => {
    const [noi, setNoi] = usePersist(userId, 'cap', 'n', 30000);
    const [val, setVal] = usePersist(userId, 'cap', 'v', 500000);
    const cap = (noi / val) * 100;
    return (
        <div className="space-y-4">
            <InputGroup label="Net Operating Income" value={noi} onChange={setNoi} symbol={symbol} />
            <InputGroup label="Property Value" value={val} onChange={setVal} symbol={symbol} />
            <ResultCard title="Cap Rate" amount={cap} subtitle="Capitalization Rate %" color="purple" symbol="" privacyMode={false} />
        </div>
    );
};

const CDCalc = ({ symbol, userId, privacyMode }: any) => {
    const [dep, setDep] = usePersist(userId, 'cd', 'd', 10000);
    const [rate, setRate] = usePersist(userId, 'cd', 'r', 5);
    const [years, setYears] = usePersist(userId, 'cd', 'y', 3);
    const mat = dep * Math.pow(1+rate/100, years);
    return (
        <div className="space-y-4">
            <InputGroup label="Deposit Amount" value={dep} onChange={setDep} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="APY %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
            <ResultCard title="Maturity Value" amount={mat} subtitle={`Interest: ${symbol}${(mat-dep).toFixed(0)}`} color="cyan" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const MarginCalc = ({ symbol, userId, privacyMode }: any) => {
    const [cost, setCost] = usePersist(userId, 'marg', 'c', 50);
    const [rev, setRev] = usePersist(userId, 'marg', 'r', 100);
    const margin = ((rev - cost) / rev) * 100;
    return (
        <div className="space-y-4">
            <InputGroup label="Cost of Goods" value={cost} onChange={setCost} symbol={symbol} />
            <InputGroup label="Revenue" value={rev} onChange={setRev} symbol={symbol} />
            <ResultCard title="Gross Margin" amount={margin} subtitle="Profit Margin %" color="indigo" symbol="" privacyMode={false} />
        </div>
    );
};

const FDCalc = ({ symbol, userId, privacyMode }: any) => {
    const [amt, setAmt] = usePersist(userId, 'fd', 'a', 100000);
    const [rate, setRate] = usePersist(userId, 'fd', 'r', 6.5);
    const [years, setYears] = usePersist(userId, 'fd', 'y', 5);
    const maturity = amt * Math.pow((1 + rate/100), years);
    return (
        <div className="space-y-4">
            <InputGroup label="Principal" value={amt} onChange={setAmt} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
            <ResultCard title="Maturity Value" amount={maturity} subtitle={`Interest: ${symbol}${(maturity-amt).toFixed(0)}`} color="green" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const RDCalc = ({ symbol, userId, privacyMode }: any) => {
    const [monthly, setMonthly] = usePersist(userId, 'rd', 'm', 5000);
    const [rate, setRate] = usePersist(userId, 'rd', 'r', 7);
    const [years, setYears] = usePersist(userId, 'rd', 'y', 5);
    const n = years * 12;
    const r = rate/100/12;
    const maturity = monthly * ((Math.pow(1+r, n) - 1)/r) * (1+r);
    return (
        <div className="space-y-4">
            <InputGroup label="Monthly Deposit" value={monthly} onChange={setMonthly} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
            <ResultCard title="Maturity Value" amount={maturity} subtitle={`Invested: ${symbol}${monthly*n}`} color="blue" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const PPFCalc = ({ symbol, userId, privacyMode }: any) => {
    const [yearly, setYearly] = usePersist(userId, 'ppf', 'y', 100000);
    const rate = 7.1; // Fixed usually
    const years = 15;
    const maturity = yearly * ((Math.pow(1 + rate/100, years) - 1) / (rate/100)) * (1 + rate/100);
    return (
        <div className="space-y-4">
            <InputGroup label="Yearly Investment" value={yearly} onChange={setYearly} symbol={symbol} />
            <div className="text-xs text-gray-500 mb-2 font-bold">Rate: 7.1% (Govt Fixed), Tenure: 15 Years</div>
            <ResultCard title="Maturity (15 Years)" amount={maturity} subtitle={`Invested: ${symbol}${yearly*15}`} color="indigo" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const CAGRCalc = ({ symbol, userId, privacyMode }: any) => {
    const [start, setStart] = usePersist(userId, 'cagr', 's', 10000);
    const [end, setEnd] = usePersist(userId, 'cagr', 'e', 20000);
    const [years, setYears] = usePersist(userId, 'cagr', 'y', 5);
    const cagr = (Math.pow(end/start, 1/years) - 1) * 100;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Start Value" value={start} onChange={setStart} symbol={symbol} /><InputGroup label="End Value" value={end} onChange={setEnd} symbol={symbol} /></div>
            <InputGroup label="Years" value={years} onChange={setYears} />
            <ResultCard title="CAGR" amount={cagr} subtitle="Compound Annual Growth Rate" color="purple" symbol="" privacyMode={false} />
        </div>
    );
};

const ROICalc = ({ symbol, userId, privacyMode }: any) => {
    const [inv, setInv] = usePersist(userId, 'roi', 'i', 50000);
    const [ret, setRet] = usePersist(userId, 'roi', 'r', 65000);
    const roi = ((ret - inv) / inv) * 100;
    return (
        <div className="space-y-4">
            <InputGroup label="Invested Amount" value={inv} onChange={setInv} symbol={symbol} />
            <InputGroup label="Returned Amount" value={ret} onChange={setRet} symbol={symbol} />
            <ResultCard title="ROI" amount={roi} subtitle="Return on Investment" color="green" symbol="" privacyMode={false} />
        </div>
    );
};

const Rule72 = ({ userId }: any) => {
    const [rate, setRate] = usePersist(userId, 'r72', 'r', 12);
    return (
        <div className="space-y-4">
            <InputGroup label="Interest Rate (%)" value={rate} onChange={setRate} />
            <ResultCard title="Years to Double" amount={72/rate} subtitle="Time to double your money" color="blue" symbol="" privacyMode={false} />
        </div>
    );
};

const LoanElig = ({ symbol, userId, privacyMode }: any) => {
    const [income, setIncome] = usePersist(userId, 'le', 'inc', 50000);
    const [otherEmi, setOtherEmi] = usePersist(userId, 'le', 'emi', 5000);
    const maxEmi = (income * 0.5) - otherEmi; // usually 50% FOIR
    // Reverse calc loan for 20 years @ 9%
    const loan = maxEmi / 0.009; // rough approx per lakh
    return (
        <div className="space-y-4">
            <InputGroup label="Monthly Income" value={income} onChange={setIncome} symbol={symbol} />
            <InputGroup label="Existing EMIs" value={otherEmi} onChange={setOtherEmi} symbol={symbol} />
            <ResultCard title="Max Loan Eligibility" amount={loan * 100} subtitle="Approx @ 9% for 20Y" color="indigo" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const EmergencyFund = ({ symbol, userId, privacyMode }: any) => {
    const [exp, setExp] = usePersist(userId, 'ef', 'e', 3000);
    const [months, setMonths] = usePersist(userId, 'ef', 'm', 6);
    return (
        <div className="space-y-4">
            <InputGroup label="Monthly Expenses" value={exp} onChange={setExp} symbol={symbol} />
            <InputGroup label="Months Backup" value={months} onChange={setMonths} />
            <ResultCard title="Emergency Fund Needed" amount={exp*months} subtitle="Keep this in liquid assets" color="red" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const GoalPlanner = ({ symbol, userId, privacyMode }: any) => {
    const [goal, setGoal] = usePersist(userId, 'gp', 'g', 1000000);
    const [years, setYears] = usePersist(userId, 'gp', 'y', 10);
    const [rate, setRate] = usePersist(userId, 'gp', 'r', 10);
    const r = rate/100/12;
    const n = years * 12;
    const monthly = goal / (((Math.pow(1+r, n) - 1)/r) * (1+r));
    return (
        <div className="space-y-4">
            <InputGroup label="Goal Amount" value={goal} onChange={setGoal} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Years" value={years} onChange={setYears} /><InputGroup label="Exp Return %" value={rate} onChange={setRate} /></div>
            <ResultCard title="Monthly Savings Needed" amount={monthly} subtitle="To achieve goal" color="pink" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const NetWorth = ({ symbol, userId, privacyMode }: any) => {
    const [assets, setAssets] = usePersist(userId, 'nw', 'a', 500000);
    const [liab, setLiab] = usePersist(userId, 'nw', 'l', 200000);
    return (
        <div className="space-y-4">
            <InputGroup label="Total Assets (Home, Cash, Inv)" value={assets} onChange={setAssets} symbol={symbol} />
            <InputGroup label="Total Liabilities (Loans)" value={liab} onChange={setLiab} symbol={symbol} />
            <ResultCard title="Net Worth" amount={assets-liab} subtitle={assets > liab ? "Positive Wealth" : "In Debt"} color={assets > liab ? "green" : "red"} symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const Inflation = ({ symbol, userId, privacyMode }: any) => {
    const [curr, setCurr] = usePersist(userId, 'inf', 'c', 1000);
    const [rate, setRate] = usePersist(userId, 'inf', 'r', 6);
    const [years, setYears] = usePersist(userId, 'inf', 'y', 10);
    const future = curr * Math.pow(1+rate/100, years);
    return (
        <div className="space-y-4">
            <InputGroup label="Current Cost" value={curr} onChange={setCurr} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Inflation %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
            <ResultCard title="Future Cost" amount={future} subtitle="Purchasing power erosion" color="orange" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const UnitPrice = ({ symbol, userId, privacyMode }: any) => {
    const [p1, setP1] = useState(10); const [q1, setQ1] = useState(100);
    const [p2, setP2] = useState(18); const [q2, setQ2] = useState(200);
    const u1 = p1/q1; const u2 = p2/q2;
    return (
        <div className="space-y-4">
            <div className="flex gap-2"><input placeholder="Price A" type="number" value={p1} onChange={e=>setP1(Number(e.target.value))} className="w-1/2 p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl"/><input placeholder="Qty A" type="number" value={q1} onChange={e=>setQ1(Number(e.target.value))} className="w-1/2 p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl"/></div>
            <div className="flex gap-2"><input placeholder="Price B" type="number" value={p2} onChange={e=>setP2(Number(e.target.value))} className="w-1/2 p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl"/><input placeholder="Qty B" type="number" value={q2} onChange={e=>setQ2(Number(e.target.value))} className="w-1/2 p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-xl"/></div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
                <p className="font-bold text-black dark:text-white">Option A: {u1.toFixed(3)} / unit</p>
                <p className="font-bold text-black dark:text-white">Option B: {u2.toFixed(3)} / unit</p>
                <p className="text-green-600 font-bold mt-2">{u1 < u2 ? "Option A is Cheaper!" : "Option B is Cheaper!"}</p>
            </div>
        </div>
    );
};

const GSTCalc = ({ symbol, userId, privacyMode }: any) => {
    const [amt, setAmt] = usePersist(userId, 'gst', 'a', 1000);
    const [rate, setRate] = usePersist(userId, 'gst', 'r', 18);
    const gst = amt * (rate/100);
    const total = amt + gst;
    return (
        <div className="space-y-4">
            <InputGroup label="Net Amount" value={amt} onChange={setAmt} symbol={symbol} />
            <InputGroup label="GST %" value={rate} onChange={setRate} />
            <ResultCard title="Total Amount" amount={total} subtitle={`GST Amount: ${symbol}${gst.toFixed(2)}`} color="blue" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const VATCalc = ({ symbol, userId, privacyMode }: any) => {
    const [amt, setAmt] = usePersist(userId, 'vat', 'a', 100);
    const [rate, setRate] = usePersist(userId, 'vat', 'r', 20);
    const vat = amt * (rate/100);
    return (
        <div className="space-y-4">
            <InputGroup label="Amount" value={amt} onChange={setAmt} symbol={symbol} />
            <InputGroup label="VAT %" value={rate} onChange={setRate} />
            <ResultCard title="Total with VAT" amount={amt+vat} subtitle={`VAT: ${symbol}${vat.toFixed(2)}`} color="cyan" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const SimpleInterest = ({ symbol, userId, privacyMode }: any) => {
    const [p, setP] = usePersist(userId, 'si', 'p', 10000);
    const [r, setR] = usePersist(userId, 'si', 'r', 5);
    const [t, setT] = usePersist(userId, 'si', 't', 2);
    const si = (p*r*t)/100;
    return (
        <div className="space-y-4">
            <InputGroup label="Principal" value={p} onChange={setP} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={r} onChange={setR} /><InputGroup label="Time (Yr)" value={t} onChange={setT} /></div>
            <ResultCard title="Interest Amount" amount={si} subtitle={`Total: ${symbol}${p+si}`} color="yellow" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const MortgageCalc = ({ symbol, userId, privacyMode }: any) => {
    // Similar to EMI but contextually for Home
    const [loan, setLoan] = usePersist(userId, 'mort', 'l', 2000000);
    const [rate, setRate] = usePersist(userId, 'mort', 'r', 8.5);
    const [years, setYears] = usePersist(userId, 'mort', 'y', 20);
    const r = rate/1200; const n = years*12;
    const emi = (loan*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    return (
        <div className="space-y-4">
            <InputGroup label="Home Loan" value={loan} onChange={setLoan} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
            <ResultCard title="Monthly Mortgage" amount={emi} subtitle={`Total Pay: ${symbol}${(emi*n).toFixed(0)}`} color="amber" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const SalaryCalc = ({ symbol, userId, privacyMode }: any) => {
    const [hourly, setHourly] = usePersist(userId, 'sal', 'h', 25);
    const [hours, setHours] = usePersist(userId, 'sal', 'w', 40);
    const yearly = hourly * hours * 52;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Hourly Rate" value={hourly} onChange={setHourly} symbol={symbol} /><InputGroup label="Hours/Week" value={hours} onChange={setHours} /></div>
            <ResultCard title="Annual Salary" amount={yearly} subtitle={`Monthly: ${symbol}${(yearly/12).toFixed(0)}`} color="emerald" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const DebtPayoff = ({ symbol, userId, privacyMode }: any) => {
    const [balance, setBalance] = usePersist(userId, 'debt', 'b', 5000);
    const [rate, setRate] = usePersist(userId, 'debt', 'r', 18);
    const [monthly, setMonthly] = usePersist(userId, 'debt', 'm', 200);
    // Rough calc of months
    const i = rate/1200;
    // N = -log(1 - (i*B)/M) / log(1+i)
    let months = 0;
    let error = false;
    
    // Monthly interest check
    if (monthly <= balance * i) {
        error = true;
    } else {
        months = -Math.log(1 - (i*balance)/monthly) / Math.log(1+i);
    }

    return (
        <div className="space-y-4">
            <InputGroup label="Debt Balance" value={balance} onChange={setBalance} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={rate} onChange={setRate} /><InputGroup label="Monthly Pay" value={monthly} onChange={setMonthly} symbol={symbol} /></div>
            <ResultCard title="Months to Free" amount={error ? 0 : months} subtitle={error ? "Increase Payment!" : (months>0 ? `${(months/12).toFixed(1)} Years` : "Paid off")} color={error ? "red" : "green"} symbol="" privacyMode={false} />
            {error && <p className="text-xs text-red-500 font-bold text-center">Monthly pay must cover interest ({symbol}{(balance*i).toFixed(0)})</p>}
        </div>
    );
};

const BreakEven = ({ symbol, userId, privacyMode }: any) => {
    const [fixed, setFixed] = usePersist(userId, 'be', 'f', 1000);
    const [price, setPrice] = usePersist(userId, 'be', 'p', 50);
    const [varCost, setVarCost] = usePersist(userId, 'be', 'v', 20);
    const units = fixed / (price - varCost);
    return (
        <div className="space-y-4">
            <InputGroup label="Fixed Costs" value={fixed} onChange={setFixed} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Price/Unit" value={price} onChange={setPrice} symbol={symbol} /><InputGroup label="Var Cost/Unit" value={varCost} onChange={setVarCost} symbol={symbol} /></div>
            <ResultCard title="Break-Even Units" amount={units} subtitle="Units to sell to cover costs" color="slate" symbol="" privacyMode={false} />
        </div>
    );
};

// ... Existing components
const FuelCalculator = ({ symbol, userId, privacyMode }: any) => {
    const [distance, setDistance] = usePersist(userId, 'fuel', 'distance', 100);
    const [mileage, setMileage] = usePersist(userId, 'fuel', 'mileage', 15);
    const [price, setPrice] = usePersist(userId, 'fuel', 'price', 95);
    const [roundTrip, setRoundTrip] = usePersist(userId, 'fuel', 'round', false);
    const [passengers, setPassengers] = usePersist(userId, 'fuel', 'ppl', 1);
    
    const totalDist = roundTrip ? distance * 2 : distance;
    const fuelNeeded = totalDist / (mileage || 1);
    const totalCost = fuelNeeded * price;
    const perPerson = totalCost / (passengers || 1);

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-black dark:text-white border-b dark:border-gray-700 pb-4">Trip Cost Calculator</h3>
            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={roundTrip} onChange={e => setRoundTrip(e.target.checked)} className="w-5 h-5 accent-indigo-600 rounded" />
                    <span className="font-bold text-sm text-black dark:text-white">Round Trip</span>
                </label>
            </div>
            <InputGroup label="One-Way Distance (km)" value={distance} onChange={setDistance} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Mileage" value={mileage} onChange={setMileage} /><InputGroup label={`Price/${symbol}`} value={price} onChange={setPrice} /></div>
            <InputGroup label="Passengers" value={passengers} onChange={setPassengers} />
            <div className="grid grid-cols-2 gap-4">
                 <ResultCard title="Total Cost" amount={totalCost} subtitle={`${fuelNeeded.toFixed(1)}L fuel`} color="orange" symbol={symbol} privacyMode={privacyMode} />
                 <ResultCard title="Per Person" amount={perPerson} subtitle="Split cost" color="green" symbol={symbol} privacyMode={privacyMode} />
            </div>
        </div>
    );
};

const EMICalculator = ({ symbol, userId, privacyMode }: any) => {
  const [amount, setAmount] = usePersist(userId, 'emi', 'amount', 500000);
  const [rate, setRate] = usePersist(userId, 'emi', 'rate', 9.5);
  const [years, setYears] = usePersist(userId, 'emi', 'years', 5);
  const r = rate / 12 / 100; const n = years * 12;
  const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return (
    <div className="space-y-4">
      <InputGroup label="Loan Amount" value={amount} onChange={setAmount} symbol={symbol} />
      <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
      <ResultCard title="Monthly EMI" amount={emi} subtitle={`Total Interest: ${symbol}${((emi*n)-amount).toFixed(0)}`} color="blue" symbol={symbol} privacyMode={privacyMode} />
    </div>
  );
};

const BudgetMaker = ({ symbol, userId, privacyMode }: any) => {
    const [income, setIncome] = usePersist(userId, 'budget', 'income', 5000);
    const [needsPct, setNeedsPct] = usePersist(userId, 'budget', 'nPct', 50);
    const [wantsPct, setWantsPct] = usePersist(userId, 'budget', 'wPct', 30);
    const savingsPct = Math.max(0, 100 - needsPct - wantsPct);
    return (
        <div className="space-y-4">
            <InputGroup label="Income" value={income} onChange={setIncome} symbol={symbol} />
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <div className="mb-2 flex justify-between text-sm font-bold"><span>Needs {needsPct}%</span><span>{symbol}{(income*needsPct/100).toFixed(0)}</span></div>
                <input type="range" className="w-full mb-4 accent-blue-600" value={needsPct} onChange={e=>setNeedsPct(Number(e.target.value))} />
                <div className="mb-2 flex justify-between text-sm font-bold"><span>Wants {wantsPct}%</span><span>{symbol}{(income*wantsPct/100).toFixed(0)}</span></div>
                <input type="range" className="w-full mb-4 accent-purple-600" value={wantsPct} onChange={e=>setWantsPct(Number(e.target.value))} />
                <div className="flex justify-between text-sm font-bold text-green-600"><span>Savings {savingsPct}%</span><span>{symbol}{(income*savingsPct/100).toFixed(0)}</span></div>
            </div>
        </div>
    );
};

const SIPCalc = ({ symbol, userId, privacyMode }: any) => {
    const [inv, setInv] = usePersist(userId, 'sip', 'amt', 5000);
    const [rate, setRate] = usePersist(userId, 'sip', 'rate', 12);
    const [years, setYears] = usePersist(userId, 'sip', 'yrs', 10);
    const i = rate/1200; const n = years*12;
    const val = inv * ((Math.pow(1+i,n)-1)/i)*(1+i);
    return (
        <div className="space-y-4">
            <InputGroup label="Monthly Inv" value={inv} onChange={setInv} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Rate %" value={rate} onChange={setRate} /><InputGroup label="Years" value={years} onChange={setYears} /></div>
            <ResultCard title="Future Value" amount={val} subtitle={`Invested: ${symbol}${inv*n}`} color="emerald" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const CryptoCalc = ({ symbol, userId, privacyMode }: any) => {
    const [buy, setBuy] = usePersist(userId, 'cry', 'b', 50000); const [sell, setSell] = usePersist(userId, 'cry', 's', 60000);
    const [amt, setAmt] = usePersist(userId, 'cry', 'a', 0.1); const [fee, setFee] = usePersist(userId, 'cry', 'f', 0.1);
    const profit = (sell*amt*(1-fee/100)) - (buy*amt*(1+fee/100));
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Buy Price" value={buy} onChange={setBuy} symbol={symbol} /><InputGroup label="Sell Price" value={sell} onChange={setSell} symbol={symbol} /></div>
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Amount" value={amt} onChange={setAmt} /><InputGroup label="Fee %" value={fee} onChange={setFee} /></div>
            <ResultCard title="Net Profit" amount={profit} subtitle="After fees" color={profit>0?"green":"red"} symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const RetirementCalc = ({ symbol, userId, privacyMode }: any) => {
    const [exp, setExp] = usePersist(userId, 'ret', 'e', 2000);
    const [age, setAge] = usePersist(userId, 'ret', 'a', 30);
    const [rAge, setRAge] = usePersist(userId, 'ret', 'ra', 60);
    const fv = exp * Math.pow(1.06, rAge-age);
    const corpus = fv * 12 * 20; 
    return (
        <div className="space-y-4">
            <InputGroup label="Current Expenses" value={exp} onChange={setExp} symbol={symbol} />
            <div className="grid grid-cols-2 gap-4"><InputGroup label="Age" value={age} onChange={setAge} /><InputGroup label="Retire Age" value={rAge} onChange={setRAge} /></div>
            <ResultCard title="Corpus Needed" amount={corpus} subtitle={`Monthly needed then: ${symbol}${fv.toFixed(0)}`} color="indigo" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const TaxEstimator = ({ symbol, userId, privacyMode }: any) => {
    const [inc, setInc] = usePersist(userId, 'tax', 'i', 50000);
    const tax = inc > 50000 ? (inc-50000)*0.2 : 0; 
    return (
        <div className="space-y-4">
            <InputGroup label="Annual Income" value={inc} onChange={setInc} symbol={symbol} />
            <ResultCard title="Est. Tax" amount={tax} subtitle="Simplified estimation" color="red" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const DiscountCalculator = ({ symbol, userId, privacyMode }: any) => {
    const [p, setP] = usePersist(userId, 'dis', 'p', 100); const [d, setD] = usePersist(userId, 'dis', 'd', 20);
    return (
        <div className="space-y-4">
            <InputGroup label="Price" value={p} onChange={setP} symbol={symbol} /><InputGroup label="Off %" value={d} onChange={setD} />
            <ResultCard title="Final Price" amount={p*(1-d/100)} subtitle={`Save ${symbol}${(p*d/100).toFixed(2)}`} color="pink" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const TipCalculator = ({ symbol, userId, privacyMode }: any) => {
    const [b, setB] = usePersist(userId, 'tip', 'b', 50); const [t, setT] = usePersist(userId, 'tip', 't', 15);
    return (
        <div className="space-y-4">
            <InputGroup label="Bill" value={b} onChange={setB} symbol={symbol} /><InputGroup label="Tip %" value={t} onChange={setT} />
            <ResultCard title="Total" amount={b*(1+t/100)} subtitle={`Tip: ${symbol}${(b*t/100).toFixed(2)}`} color="teal" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

const CurrencyConverter = ({ userId, privacyMode }: any) => {
    const [v, setV] = usePersist(userId, 'cur', 'v', 1); const [r, setR] = usePersist(userId, 'cur', 'r', 0.85);
    return (
        <div className="space-y-4">
            <InputGroup label="Amount (USD)" value={v} onChange={setV} symbol="$" /><InputGroup label="Rate" value={r} onChange={setR} />
            <ResultCard title="Converted" amount={v*r} subtitle="" color="cyan" symbol="" privacyMode={privacyMode} />
        </div>
    );
};

const ShoppingList = ({ symbol, userId, privacyMode }: any) => {
    const [items, setItems] = usePersist<{id: number, name: string, price: number}[]>(userId, 'shop', 'l', []);
    const [name, setName] = useState(''); const [price, setPrice] = useState('');
    const add = () => { if(name && price) { setItems([...items, {id:Date.now(), name, price:Number(price)}]); setName(''); setPrice(''); } };
    const remove = (id: number) => { setItems(items.filter(i => i.id !== id)); };
    const total = items.reduce((a,b)=>a+b.price, 0);
    return (
        <div className="space-y-4">
            <div className="flex gap-2"><input placeholder="Item" value={name} onChange={e=>setName(e.target.value)} className="flex-1 p-3 rounded-xl border font-bold text-black dark:text-white bg-white dark:bg-gray-800"/><input placeholder="0.00" value={price} onChange={e=>setPrice(e.target.value)} className="w-24 p-3 rounded-xl border font-bold text-black dark:text-white bg-white dark:bg-gray-800"/><button onClick={add} className="bg-indigo-600 text-white p-3 rounded-xl font-bold">+</button></div>
            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                {items.map(i=>(
                    <div key={i.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <span className="font-medium text-black dark:text-white">{i.name}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-black dark:text-white">{i.price}</span>
                            <button onClick={() => remove(i.id)} className="text-red-500 hover:text-red-700"><X size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            <ResultCard title="Total" amount={total} subtitle={`${items.length} items`} color="pink" symbol={symbol} privacyMode={privacyMode} />
        </div>
    );
};

// --- MAIN TOOLS COMPONENT ---

export const Tools: React.FC<ToolsProps> = ({ currency, userId, privacyMode }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const symbol = CURRENCY_SYMBOLS[currency];

  const tools = [
    // Investments (10)
    { id: 'sip', name: 'SIP Wealth', icon: TrendingUp, color: 'emerald' },
    { id: 'fd', name: 'FD Calc', icon: Landmark, color: 'blue' },
    { id: 'rd', name: 'RD Calc', icon: PiggyBank, color: 'pink' },
    { id: 'ppf', name: 'PPF Calc', icon: ShieldCheck, color: 'indigo' },
    { id: 'cd', name: 'CD Calc', icon: Building2, color: 'cyan' },
    { id: 'cagr', name: 'CAGR', icon: BarChart3, color: 'purple' },
    { id: 'roi', name: 'ROI', icon: Percent, color: 'green' },
    { id: 'rule72', name: 'Rule of 72', icon: Clock, color: 'orange' },
    { id: 'crypto', name: 'Crypto', icon: Bitcoin, color: 'yellow' },
    { id: 'simple', name: 'Simple Int', icon: Coins, color: 'teal' },
    
    // Planning (10)
    { id: 'budget', name: 'Budget', icon: Sliders, color: 'purple' },
    { id: 'fire', name: 'FIRE Calc', icon: Flame, color: 'red' },
    { id: 'retirement', name: 'Retirement', icon: Umbrella, color: 'teal' },
    { id: 'emergency', name: 'Emergency', icon: HeartPulse, color: 'red' },
    { id: 'goal', name: 'Goal Planner', icon: Target, color: 'blue' },
    { id: 'networth', name: 'Net Worth', icon: PieChart, color: 'indigo' },
    { id: 'salary', name: 'Salary Conv', icon: Briefcase, color: 'emerald' },
    { id: 'rental', name: 'Rental Yield', icon: Key, color: 'orange' },
    { id: 'dividend', name: 'Div. Yield', icon: BarChart3, color: 'green' },
    { id: 'caprate', name: 'Cap Rate', icon: Building2, color: 'blue' },
    
    // Loans & Business (7)
    { id: 'emi', name: 'EMI Calc', icon: Calculator, color: 'blue' },
    { id: 'mortgage', name: 'Mortgage', icon: Home, color: 'amber' },
    { id: 'loan_elig', name: 'Loan Elig', icon: CheckCircle, color: 'green' },
    { id: 'debt_pay', name: 'Debt Free', icon: TrendingUp, color: 'red' },
    { id: 'breakeven', name: 'Break Even', icon: Scale, color: 'slate' },
    { id: 'margin', name: 'Margin', icon: DollarSign, color: 'indigo' },
    
    // Utility (8)
    { id: 'fuel', name: 'Fuel Cost', icon: Car, color: 'orange' },
    { id: 'tax', name: 'Tax Est', icon: FileText, color: 'slate' },
    { id: 'currency', name: 'Converter', icon: RefreshCcw, color: 'cyan' },
    { id: 'inflation', name: 'Inflation', icon: TrendingUp, color: 'red' },
    { id: 'gst', name: 'GST Calc', icon: Receipt, color: 'blue' },
    { id: 'vat', name: 'VAT Calc', icon: Receipt, color: 'cyan' },
    { id: 'shopping', name: 'Shop List', icon: ShoppingCart, color: 'pink' },
    { id: 'discount', name: 'Discount', icon: Tag, color: 'rose' },
    { id: 'tip', name: 'Tip Calc', icon: HeartPulse, color: 'teal' },
  ];

  const getColor = (c: string) => {
      const map: any = {
          emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
          blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
          pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300',
          indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
          purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
          green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
          orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
          yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300',
          teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',
          red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
          slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
          cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300',
          amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
          rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
          gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      };
      return map[c] || map['blue'];
  };

  const handleReset = () => {
      const current = activeTool;
      setActiveTool(null);
      setTimeout(() => setActiveTool(current), 50);
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
             <button 
               onClick={handleReset}
               className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-full text-black dark:text-white font-medium transition-colors"
               title="Reset Tool"
             >
               <RotateCcw size={16}/>
             </button>
             <button 
               onClick={() => setShowHelp(true)}
               className="flex items-center gap-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 px-4 py-2 rounded-full text-black dark:text-white font-bold transition-colors"
             >
               <HelpCircle size={18}/> Help
             </button>
             <button 
               onClick={() => setActiveTool(null)}
               className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded-full text-black dark:text-white font-medium transition-colors"
             >
               Close
             </button>
           </div>
        )}
      </div>
      
      {activeTool ? (
        <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 animate-slide-up relative flex-1 flex flex-col max-w-2xl mx-auto w-full">
           <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                <button 
                    onClick={() => setActiveTool(null)}
                    className="text-sm font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 w-fit transition-colors"
                >
                    ← Back to Toolbox
                </button>
                <h3 className="font-extrabold text-2xl capitalize text-gray-900 dark:text-white">{tools.find(t=>t.id===activeTool)?.name}</h3>
           </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
             {/* Investments */}
             {activeTool === 'sip' && <SIPCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'fd' && <FDCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'rd' && <RDCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'ppf' && <PPFCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'cd' && <CDCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'cagr' && <CAGRCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'roi' && <ROICalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'rule72' && <Rule72 userId={userId} />}
             {activeTool === 'crypto' && <CryptoCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'simple' && <SimpleInterest symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             
             {/* Planning */}
             {activeTool === 'budget' && <BudgetMaker symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'retirement' && <RetirementCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'fire' && <FireCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'emergency' && <EmergencyFund symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'goal' && <GoalPlanner symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'networth' && <NetWorth symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'salary' && <SalaryCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'rental' && <RentalYield symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'dividend' && <DividendYield symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'caprate' && <CapRate symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             
             {/* Loans */}
             {activeTool === 'emi' && <EMICalculator symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'loan_elig' && <LoanElig symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'mortgage' && <MortgageCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />} 
             {activeTool === 'debt_pay' && <DebtPayoff symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'breakeven' && <BreakEven symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'margin' && <MarginCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             
             {/* Utility */}
             {activeTool === 'fuel' && <FuelCalculator symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'tax' && <TaxEstimator symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'currency' && <CurrencyConverter userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'inflation' && <Inflation symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'gst' && <GSTCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'vat' && <VATCalc symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'shopping' && <ShoppingList symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'discount' && <DiscountCalculator symbol={symbol} userId={userId} privacyMode={privacyMode} />}
             {activeTool === 'tip' && <TipCalculator symbol={symbol} userId={userId} privacyMode={privacyMode} />}
          </div>

          {/* Help Modal */}
          {showHelp && (
            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-6 animate-fade-in text-center">
               <div className="bg-indigo-100 dark:bg-indigo-900/50 p-5 rounded-full text-indigo-600 dark:text-indigo-300 mb-6 shadow-xl shadow-indigo-100 dark:shadow-none">
                  <HelpCircle size={48} />
               </div>
               <h3 className="text-2xl font-bold text-black dark:text-white mb-3 capitalize">{activeTool}</h3>
               <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-sm mx-auto text-base font-medium">
                 {TOOL_DESCRIPTIONS[activeTool] || "Use this tool to plan your finances accurately."}
               </p>
               <button 
                 onClick={() => setShowHelp(false)}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none transition-transform hover:scale-105"
               >
                 Got it!
               </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 pb-20 overflow-y-auto custom-scrollbar flex-1">
             {tools.map((tool) => (
                <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="flex flex-col items-center justify-center w-full p-4 py-6 md:p-5 md:py-8 bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-none hover:border-indigo-100 dark:hover:border-indigo-900 transition-all active:scale-95 group hover:-translate-y-1 relative"
                >
                <div className={`p-3 md:p-4 rounded-2xl mb-2 md:mb-4 transition-transform shadow-sm ${getColor(tool.color)} group-hover:scale-110 duration-300`}>
                    <tool.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-[10px] md:text-sm text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors w-full px-1 break-words">{tool.name}</span>
                </button>
            ))}
            
            {/* Promo Card mixed in */}
            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl md:rounded-[2rem] p-6 text-white flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <TrendingUp size={36} className="mb-3" />
                <h4 className="font-bold text-lg leading-tight">Pro Features</h4>
                <p className="text-xs opacity-80 mt-1">Unlock advanced charts & unlimited history.</p>
                <span className="mt-4 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white hover:text-indigo-600 transition-colors">Upgrade</span>
            </div>
        </div>
      )}
    </div>
  );
};