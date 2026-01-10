
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, RefreshCw, HelpCircle } from 'lucide-react';

const ROICalculator: React.FC = () => {
  const [fee, setFee] = useState(25000);
  const [hours, setHours] = useState(15);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [toolCost, setToolCost] = useState(200); // e.g. job board ads, etc
  
  const [costBasis, setCostBasis] = useState(0);
  const [profit, setProfit] = useState(0);
  const [roi, setRoi] = useState(0);

  useEffect(() => {
    const timeCost = hours * hourlyRate;
    const totalCost = timeCost + toolCost;
    const netProfit = fee - totalCost;
    const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    setCostBasis(totalCost);
    setProfit(netProfit);
    setRoi(roiPercent);
  }, [fee, hours, hourlyRate, toolCost]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calculator size={20} className="text-brand-600" />
                Placement ROI Calculator
            </h3>
            <p className="text-xs text-slate-500 mt-1">Calculate net profit per job order.</p>
        </div>
        <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
            <DollarSign size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Placement Fee</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input 
                    type="number" 
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
            </div>
        </div>
        <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Recruiter Hours</label>
            <input 
                type="number" 
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
            />
        </div>
        <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Hourly Cost</label>
             <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input 
                    type="number" 
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
            </div>
        </div>
        <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Tool/Ad Spend</label>
             <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input 
                    type="number" 
                    value={toolCost}
                    onChange={(e) => setToolCost(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                />
            </div>
        </div>
      </div>

      <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
         <div className="flex justify-between items-center text-sm">
             <span className="text-slate-500">Total Cost Basis:</span>
             <span className="font-semibold text-slate-700">${costBasis.toLocaleString()}</span>
         </div>
         <div className="flex justify-between items-center">
             <span className="text-slate-900 font-bold">Net Profit:</span>
             <span className="font-bold text-emerald-600 text-lg">${profit.toLocaleString()}</span>
         </div>
         <div className="pt-2 border-t border-slate-200">
             <div className="flex justify-between items-center">
                 <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1">
                    <TrendingUp size={14} /> ROI
                 </span>
                 <span className={`font-black text-xl ${roi > 500 ? 'text-brand-600' : 'text-slate-900'}`}>
                    {roi.toFixed(0)}%
                 </span>
             </div>
         </div>
      </div>
    </div>
  );
};

export default ROICalculator;
