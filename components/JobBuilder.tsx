
import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, GripVertical, MapPin, Building2, Briefcase, UserCheck, Save, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { generateJobDescription } from '../services/geminiService';
import { MOCK_PIPELINE } from '../constants';
import { PipelineStage, StageType, Job } from '../types';
import { useStore } from '../context/StoreContext';

const JobBuilder: React.FC = () => {
  const { addJob } = useStore();
  
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<Job['status']>('Draft');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineStage[]>(MOCK_PIPELINE);

  const handleGenerateAI = async () => {
    if (!title) return;
    setIsGenerating(true);
    try {
      const desc = await generateJobDescription(title, department, location, keywords);
      setDescription(desc);
    } catch (e) {
      console.error(e);
      alert('Failed to generate. Check API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeStage = (id: string) => {
    setPipeline(pipeline.filter(p => p.id !== id));
  };

  const handleSaveJob = () => {
      if (!title) return alert("Job Title is required");

      const newJob: Job = {
          id: `job_${Date.now()}`,
          title,
          client: client || 'Internal',
          department: department || 'General',
          location: location || 'Remote',
          status,
          candidatesCount: 0,
          pipeline
      };

      addJob(newJob);
      alert('Job Created Successfully!');
      setTitle('');
      setDescription('');
      setClient('');
      setDepartment('');
      setLocation('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left: Job Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg text-brand-600">
                <Briefcase size={20} />
            </div>
            Create Agency Job Order
            </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <CheckCircle2 size={16} className="text-brand-500" /> General Information
            </h3>
            <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client / Company</label>
                    <div className="relative">
                    <UserCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="e.g. Spotify (Confidential)"
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                    />
                    </div>
                </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 size={16} className="text-brand-500" /> Role Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
                </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sparkles size={16} className="text-brand-500" /> AI Description
            </h3>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Key Requirements</label>
                <input 
                type="text" 
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="e.g. React, Three.js, Team Leadership"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Generated Description</label>
                    <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !title}
                    className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-md hover:bg-brand-100 transition-colors"
                    >
                    <Sparkles size={12} className="inline mr-1" />
                    {isGenerating ? 'Generating...' : 'Auto-Generate'}
                    </button>
                </div>
                <textarea 
                className="w-full h-40 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-sm bg-slate-50/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description will appear here..."
                />
            </div>
          </section>
        </div>
      </div>

      {/* Right: Pipeline Builder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <GripVertical size={20} />
                </div>
                Hiring Pipeline
            </h2>
            <button className="text-brand-600 text-sm font-bold flex items-center gap-1 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={16} /> Add Stage
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {pipeline.map((stage, index) => (
            <div key={stage.id} className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all">
              <div className="text-slate-300 group-hover:text-slate-400 cursor-grab"><GripVertical size={20} /></div>
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">{index + 1}</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{stage.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stage.type}</p>
              </div>
              <button onClick={() => removeStage(stage.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50">
             <button onClick={handleSaveJob} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                Save & Publish Job Order
             </button>
        </div>
      </div>
    </div>
  );
};

export default JobBuilder;
