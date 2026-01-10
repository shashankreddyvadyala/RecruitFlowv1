
import React, { useState } from 'react';
import { Building, Plus, MoreHorizontal, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const CRMView: React.FC = () => {
  const { crmClients, deals } = useStore();
  const [activeTab, setActiveTab] = useState<'clients' | 'deals'>('clients');

  const dealStages = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'clients' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Clients & Accounts
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'deals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Deal Pipeline
          </button>
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-600/20">
          <Plus size={18} /> Add {activeTab === 'clients' ? 'Client' : 'Deal'}
        </button>
      </div>

      {activeTab === 'clients' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crmClients.map(client => (
            <div key={client.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex items-center justify-center">
                  <img src={client.logoUrl} alt={client.name} className="w-full h-full object-contain" />
                </div>
                <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={20} /></button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{client.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                <Building size={14} /> {client.industry} • {client.location}
              </p>
              <div className="p-3 bg-slate-50 rounded-xl mb-6">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Active Deal Count</p>
                <p className="font-bold text-slate-900">{client.activeDeals}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 size={14} /></div>
                  <span className="text-xs font-bold text-emerald-600">Active Partnership</span>
                </div>
                <button className="text-brand-600 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">Open Account <ArrowRight size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-6">
          {dealStages.map(stage => (
            <div key={stage} className="min-w-[320px] flex-1">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                {stage} <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{deals.filter(d => d.stage === stage).length}</span>
              </h3>
              <div className="space-y-4">
                {deals.filter(d => d.stage === stage).map(deal => (
                  <div key={deal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-400 transition-all cursor-grab">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-bold text-brand-600 uppercase">{deal.clientName}</p>
                      <span className="text-xs font-bold text-slate-400">{deal.probability}% Prob.</span>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-4">{deal.title}</h4>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-4">
                      <Calendar size={12} /> Expected Close: {deal.expectedCloseDate}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <img src={`https://picsum.photos/32/32?u=${deal.assignedTo}`} className="w-6 h-6 rounded-full border-2 border-white" alt="" />
                      <span className="text-[10px] font-bold text-slate-400">Lead: {deal.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CRMView;
