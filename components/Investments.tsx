import React, { useState } from 'react';
import { CurrencyCode, CURRENCY_SYMBOLS } from '../types';
import { TrendingUp, Target } from 'lucide-react';

interface InvestmentProps {
  currency: CurrencyCode;
  privacyMode: boolean;
}

export const Investments: React.FC<InvestmentProps> = ({ currency, privacyMode }) => {
  const symbol = CURRENCY_SYMBOLS[currency];
  const [mode, setMode] = useState<'sip' | 'lumpsum' | 'stepup' | 'target'>('sip');

  // Common State
  const [monthly, setMonthly] = useState(5000);
  const [lumpsum, setLumpsum] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [stepUp, setStepUp] = useState(10); // % increase per year
  const [targetAmount, setTargetAmount] = useState(1000000); // For Target Mode

  const calculateResult = () => {
    let invested = 0;
    let value = 0;
    let requiredMonthly = 0;

    if (mode === 'sip') {
      const i = rate / 100 / 12;
      const n = years * 12;
      value = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      invested = monthly * n;
    } else if (mode === 'lumpsum') {
      value = lumpsum * Math.pow(1 + rate / 100, years);
      invested = lumpsum;
    } else if (mode === 'stepup') {
      let currentMonthly = monthly;
      let currentCorpus = 0;
      invested = 0;
      for (let y = 1; y <= years; y++) {
        // Calculate for this year
        for (let m = 1; m <= 12; m++) {
           currentCorpus += currentMonthly;
           invested += currentMonthly;
           currentCorpus += currentCorpus * (rate / 100 / 12);
        }
        currentMonthly += currentMonthly * (stepUp / 100);
      }
      value = currentCorpus;
    } else if (mode === 'target') {
        // Reverse calculation for Target
        const i = rate / 100 / 12;
        const n = years * 12;
        requiredMonthly = targetAmount / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
        value = targetAmount;
        invested = requiredMonthly * n;
    }

    return { invested, value, profit: value - invested, requiredMonthly };
  };

  const { invested, value, profit, requiredMonthly } = calculateResult();

  const displayValue = (amt: number) => privacyMode ? '****' : `${symbol}${amt.toLocaleString(undefined, {maximumFractionDigits: 0})}`;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <TrendingUp size={24} />
            </div>
            Investment Calculator
         </h2>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl flex shadow-sm border border-gray-100 dark:border-gray-800 max-w-2xl overflow-x-auto no-scrollbar">
         {['sip', 'lumpsum', 'stepup', 'target'].map((m) => (
             <button 
                key={m}
                onClick={() => setMode(m as any)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${mode === m ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
             >
                 {m === 'sip' ? 'SIP' : m === 'lumpsum' ? 'Lumpsum' : m === 'stepup' ? 'Step-Up' : 'Target Goal'}
             </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
         {/* Inputs Section */}
         <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-center">
            <div className="space-y-8">
                {/* Dynamic Inputs based on Mode */}
                {(mode === 'sip' || mode === 'stepup') && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Monthly Investment</label>
                        <div className="flex items-center gap-2 relative group">
                           <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-900 dark:text-white pointer-events-none opacity-50">{symbol}</span>
                           <input 
                             type="number" 
                             value={monthly} 
                             onChange={e => setMonthly(Number(e.target.value))}
                             className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 pl-12 text-3xl font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder-gray-300" 
                           />
                        </div>
                    </div>
                )}

                {mode === 'lumpsum' && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Total Investment</label>
                        <div className="flex items-center gap-2 relative group">
                           <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-900 dark:text-white pointer-events-none opacity-50">{symbol}</span>
                           <input 
                             type="number" 
                             value={lumpsum} 
                             onChange={e => setLumpsum(Number(e.target.value))}
                             className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 pl-12 text-3xl font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder-gray-300" 
                           />
                        </div>
                    </div>
                )}

                {mode === 'target' && (
                    <div>
                        <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 block flex items-center gap-1"><Target size={14}/> Target Goal Amount</label>
                        <div className="flex items-center gap-2 relative group">
                           <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-900 dark:text-white pointer-events-none opacity-50">{symbol}</span>
                           <input 
                             type="number" 
                             value={targetAmount} 
                             onChange={e => setTargetAmount(Number(e.target.value))}
                             className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-2xl p-5 pl-12 text-3xl font-bold text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder-gray-300" 
                           />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Return Rate (%)</label>
                        <input 
                            type="number" 
                            value={rate} 
                            onChange={e => setRate(Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-xl font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Period (Years)</label>
                        <input 
                            type="number" 
                            value={years} 
                            onChange={e => setYears(Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-xl font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                        />
                    </div>
                </div>

                {mode === 'stepup' && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Annual Step Up (%)</label>
                        <input 
                        type="number" 
                        value={stepUp} 
                        onChange={e => setStepUp(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-xl font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all" 
                        />
                    </div>
                )}
            </div>
         </div>

         {/* Result Section */}
         <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 bg-white opacity-10 w-48 h-48 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 bg-indigo-900 opacity-20 w-32 h-32 rounded-full -ml-10 -mb-10 blur-xl pointer-events-none"></div>
                
                {mode === 'target' ? (
                     <>
                        <p className="text-indigo-200 text-sm font-bold uppercase tracking-wide mb-2 relative z-10">Monthly Savings Needed</p>
                        <h3 className="text-4xl md:text-5xl font-extrabold mb-8 relative z-10">{displayValue(requiredMonthly)}</h3>
                     </>
                ) : (
                    <>
                        <p className="text-indigo-200 text-sm font-bold uppercase tracking-wide mb-2 relative z-10">Maturity Value</p>
                        <h3 className="text-4xl md:text-5xl font-extrabold mb-8 relative z-10">{displayValue(value)}</h3>
                    </>
                )}

                <div className="space-y-4 relative z-10">
                    <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Invested Amount</p>
                            <p className="font-bold text-xl mt-0.5">{displayValue(invested)}</p>
                        </div>
                    </div>
                    {mode !== 'target' && (
                        <div className="bg-emerald-500/20 p-5 rounded-2xl backdrop-blur-md border border-emerald-500/20 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Wealth Gained</p>
                                <p className="font-bold text-xl text-emerald-300 mt-0.5">+{displayValue(profit)}</p>
                            </div>
                            <TrendingUp className="text-emerald-300" size={24}/>
                        </div>
                    )}
                </div>
            </div>

            {/* Insight/Ad Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex flex-col gap-4 shadow-sm group cursor-pointer hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-xl text-gray-900 dark:text-white">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-900 dark:text-white font-bold uppercase">Ad</span>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Market News</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Top 5 stocks to watch this week. Get expert analysis and real-time alerts.
                    </p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};