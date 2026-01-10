
import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Globe, 
  Users, 
  Bot, 
  Check, 
  X,
  Play,
  Zap,
  Cpu,
  Database,
  PhoneCall,
  ShieldCheck,
  Search,
  Layout,
  MessageSquare,
  BarChart3,
  Globe2,
  Sparkles,
  Server,
  CloudLightning
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LOGOS = [
    { name: 'Spotify', url: 'https://logo.clearbit.com/spotify.com' },
    { name: 'Airbnb', url: 'https://logo.clearbit.com/airbnb.com' },
    { name: 'Notion', url: 'https://logo.clearbit.com/notion.so' },
    { name: 'Linear', url: 'https://logo.clearbit.com/linear.app' },
    { name: 'Shopify', url: 'https://logo.clearbit.com/shopify.com' },
    { name: 'Stripe', url: 'https://logo.clearbit.com/stripe.com' },
    { name: 'Netflix', url: 'https://logo.clearbit.com/netflix.com' },
    { name: 'Uber', url: 'https://logo.clearbit.com/uber.com' },
    { name: 'Zoom', url: 'https://logo.clearbit.com/zoom.us' },
    { name: 'Slack', url: 'https://logo.clearbit.com/slack.com' },
    { name: 'Figma', url: 'https://logo.clearbit.com/figma.com' },
    { name: 'Dropbox', url: 'https://logo.clearbit.com/dropbox.com' },
    { name: 'Intercom', url: 'https://logo.clearbit.com/intercom.com' },
    { name: 'Loom', url: 'https://logo.clearbit.com/loom.com' },
    { name: 'Vercel', url: 'https://logo.clearbit.com/vercel.com' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  const [showDemo, setShowDemo] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-900">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
            animation-play-state: paused;
        }
        .circuit-bg {
          background-image: radial-gradient(rgba(255,255,255,0.05) 2px, transparent 2px);
          background-size: 30px 30px;
        }
      `}</style>
      
      {/* Navbar */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-600/20">R</div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">RecruitFlow<span className="text-brand-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <button onClick={() => scrollToSection('features')} className="hover:text-brand-600 transition-colors">Features</button>
            <button onClick={() => scrollToSection('why-switch')} className="hover:text-brand-600 transition-colors">Why Switch?</button>
            <button onClick={() => scrollToSection('architecture')} className="hover:text-brand-600 transition-colors">Architecture</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-brand-600 transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-slate-600 font-bold hover:text-slate-900 transition-colors text-sm uppercase tracking-wider">Log In</button>
            <button onClick={onSignup} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-multiply border-b border-slate-100"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={14} className="text-brand-500" />
            v2.0 Powered by Gemini 3 Pro
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[0.9] uppercase">
            Recruit <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">
              Without Limits
            </span>
          </h1>
          
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            The world's first autonomous agency operating system. Stop manually sourcing and screening. Let AI handle the heavy lifting while you close deals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <button onClick={onSignup} className="w-full sm:w-auto px-10 py-5 bg-brand-600 text-white rounded-2xl font-black text-xl hover:bg-brand-700 transition-all shadow-2xl shadow-brand-600/30 flex items-center justify-center gap-3 group">
              Join the Waitlist 
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <button 
                onClick={() => setShowDemo(true)}
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm group"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={16} className="fill-brand-600 text-brand-600 ml-1" />
              </div>
              Watch Demo
            </button>
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div 
              className="relative rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden cursor-pointer group"
              onClick={() => setShowDemo(true)}
            >
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-500">
                  <div className="w-24 h-24 bg-white/90 backdrop-blur rounded-full shadow-2xl flex items-center justify-center text-brand-600 scale-90 group-hover:scale-100 transition-transform duration-500">
                      <Play size={40} className="fill-brand-600 ml-2" />
                  </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                className="w-full h-[500px] object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" 
                alt="Dashboard Preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Marks */}
      <div className="py-20 bg-white border-b border-slate-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 text-center mb-10">
             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Backing the World's Best Talent Teams</p>
          </div>
          <div className="relative w-full">
            <div className="flex w-[200%] animate-scroll">
                <div className="flex items-center justify-around w-1/2 gap-16 px-8">
                    {LOGOS.map((logo, idx) => (
                        <img key={`l1-${idx}`} src={logo.url} alt={logo.name} className="h-7 w-auto opacity-30 grayscale brightness-0" />
                    ))}
                </div>
                <div className="flex items-center justify-around w-1/2 gap-16 px-8">
                    {LOGOS.map((logo, idx) => (
                        <img key={`l2-${idx}`} src={logo.url} alt={logo.name} className="h-7 w-auto opacity-30 grayscale brightness-0" />
                    ))}
                </div>
            </div>
          </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
            <div className="max-w-2xl text-left">
              <h2 className="text-brand-600 font-black tracking-[0.2em] uppercase text-xs mb-4">Core Platform</h2>
              <h3 className="text-5xl font-black text-slate-900 leading-none uppercase">Everything you <br/> need to scale.</h3>
            </div>
            <p className="text-slate-500 text-lg font-medium max-w-md text-left">
              We've replaced the fragmented recruiter tech stack with a unified platform designed for the AI-first era.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            <FeatureItem 
              icon={<Search size={32} />} 
              title="Live Job Aggregator" 
              desc="Scan 50+ job boards in real-time. Identify every open role in your niche instantly with AI-powered keyword filtering." 
              color="bg-brand-50 text-brand-600"
            />
            <FeatureItem 
              icon={<Bot size={32} />} 
              title="Autonomous Screening" 
              desc="Voice AI agents that call, interview, and score candidates the second they apply. Move only the top 3% to your desk." 
              color="bg-purple-50 text-purple-600"
            />
            <FeatureItem 
              icon={<Layout size={32} />} 
              title="White-label Portals" 
              desc="Give candidates a premium experience with branded self-service portals to track progress and update skills." 
              color="bg-emerald-50 text-emerald-600"
            />
            <FeatureItem 
              icon={<MessageSquare size={32} />} 
              title="Hyper-Personalization" 
              desc="Gemini-powered outreach that references specific projects and career milestones. 4x higher reply rates guaranteed." 
              color="bg-blue-50 text-blue-600"
            />
            <FeatureItem 
              icon={<BarChart3 size={32} />} 
              title="Agency Operations" 
              desc="Comprehensive dashboard for owners. Track placement speed, recruiter productivity, and pipeline health live." 
              color="bg-orange-50 text-orange-600"
            />
            <FeatureItem 
              icon={<Globe2 size={32} />} 
              title="Global Talent Bench" 
              desc="Build a private talent cloud. Automatically match your silver-medalist candidates to new jobs as they appear." 
              color="bg-indigo-50 text-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* Comparison Section (Why Switch?) */}
      <section id="why-switch" className="py-32 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
             <div className="mb-20">
                 <h2 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase leading-none">Built for Speed, <br/>Not Administration.</h2>
                 <p className="text-slate-500 mt-6 text-xl font-medium">Stop paying for a database that slows you down. Upgrade to an engine that drives growth.</p>
             </div>
             
             <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-2xl bg-white">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="bg-slate-50">
                             <th className="p-8 text-xs font-black text-slate-400 uppercase tracking-widest w-1/3">Feature Category</th>
                             <th className="p-8 text-2xl font-black text-brand-600 w-1/3 bg-brand-50/50 border-b-4 border-brand-500">RecruitFlow AI</th>
                             <th className="p-8 text-2xl font-black text-slate-400 w-1/3 border-b-4 border-slate-200">Legacy ATS</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         <ComparisonRow 
                            category="Sourcing" 
                            label="Live Board Integration" 
                            recruitFlow="Native scraping of 50+ boards" 
                            legacy="Manual import or expensive ads" 
                            rfIcon={<CheckCircle className="text-brand-600" size={24} />}
                            legIcon={<X className="text-red-400" size={24} />}
                         />
                         <ComparisonRow 
                            category="Candidate Match" 
                            label="Gemini 3 Pro Scoring" 
                            recruitFlow="Contextual 0-100 match rating" 
                            legacy="Simple keyword string matching" 
                            rfIcon={<Zap className="text-yellow-500 fill-yellow-500" size={24} />}
                            legIcon={<div className="w-6 h-6 rounded-full border-2 border-slate-200" />}
                         />
                         <ComparisonRow 
                            category="Interviews" 
                            label="Autonomous Voice Agents" 
                            recruitFlow="Instant 24/7 phone screening" 
                            legacy="Requires days of manual booking" 
                            rfIcon={<Bot className="text-brand-600" size={24} />}
                            legIcon={<X className="text-red-400" size={24} />}
                         />
                         <ComparisonRow 
                            category="User Exp" 
                            label="Unified Platform" 
                            recruitFlow="Sourcing, Automation, Pipeline" 
                            legacy="Fragmented tools & browser tabs" 
                            rfIcon={<CheckCircle className="text-brand-600" size={24} />}
                            legIcon={<X className="text-red-400" size={24} />}
                         />
                     </tbody>
                 </table>
             </div>
          </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 circuit-bg opacity-10 pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600 rounded-full blur-[160px] opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600 rounded-full blur-[160px] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          <div className="max-w-3xl mb-24">
            <h2 className="text-brand-400 font-black tracking-[0.2em] uppercase text-xs mb-4">The OS Architecture</h2>
            <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[0.9] uppercase tracking-tighter">System <br/>Blueprint.</h1>
            <p className="text-slate-400 text-xl font-medium leading-relaxed">
              We've built a high-performance orchestration layer that connects the world's most advanced AI models to real-time talent data streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ArchCard 
                icon={<Cpu className="text-brand-400" size={28} />}
                title="Intelligence Layer"
                desc="Native Gemini 3 Pro integration for autonomous reasoning and candidate persona matching."
                tech="Google Vertex AI"
            />
            <ArchCard 
                icon={<Server className="text-purple-400" size={28} />}
                title="Edge Compute"
                desc="Global low-latency deployment on Vercel Edge Runtime for millisecond-speed job scraping."
                tech="Vercel Runtime"
            />
            <ArchCard 
                icon={<CloudLightning className="text-emerald-400" size={28} />}
                title="Data Streams"
                desc="Real-time ingestion from 50+ global sources with automated person-enrichment agents."
                tech="BrightData / ProxyCurl"
            />
            <ArchCard 
                icon={<ShieldCheck className="text-orange-400" size={28} />}
                title="Security"
                desc="SOC2 Type II & GDPR compliant storage with end-to-end encryption for candidate privacy."
                tech="Encrypted PGSQL"
            />
          </div>

          <div className="mt-24 p-12 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-12 group">
              <div className="text-left flex-1">
                 <h4 className="text-3xl font-black mb-4 uppercase tracking-tighter">Ready to Deploy?</h4>
                 <p className="text-slate-400 text-lg font-medium">Our implementation team can migrate your legacy data in under 48 hours.</p>
              </div>
              <button onClick={onSignup} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:bg-slate-100 transition-all flex items-center gap-4 shadow-2xl shadow-white/10 shrink-0">
                 Scale Your Agency <ArrowRight size={24} />
              </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-brand-600 font-black tracking-[0.2em] uppercase text-xs mb-4">Pricing Plans</h2>
                <h3 className="text-5xl font-black text-slate-900 uppercase leading-none">Built for any scale.</h3>
                <p className="text-slate-500 mt-6 text-xl font-medium">From solo recruiters to global enterprises.</p>
            </div>

            <div className="flex justify-center items-center gap-6 mb-20">
                <span className={`text-sm font-black uppercase tracking-widest ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
                <button
                    onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                    className={`relative w-16 h-9 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-brand-600' : 'bg-slate-200'}`}
                >
                    <div className={`absolute top-1 left-1 bg-white w-7 h-7 rounded-full shadow-lg transition-transform duration-300 transform ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
                </button>
                <span className={`text-sm font-black uppercase tracking-widest ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                    Yearly <span className="text-brand-600 text-[10px] ml-2 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">20% Discount</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                <PricingCard 
                    title="Freelancer"
                    price={billingCycle === 'monthly' ? '49' : '39'}
                    desc="For the solo recruiter seeking an unfair advantage."
                    features={['1 Active Job Order', '50 AI Sourcing Credits', '1,000 Outreach Emails', 'Community Support']}
                    onAction={onSignup}
                />
                <PricingCard 
                    title="Agency Growth"
                    price={billingCycle === 'monthly' ? '149' : '99'}
                    desc="Everything you need to automate your entire funnel."
                    features={['Unlimited Active Jobs', 'AI Voice Screening Agents', 'White-label Portals', 'Priority Analytics', 'Direct Automation Hub']}
                    featured={true}
                    onAction={onSignup}
                />
                <PricingCard 
                    title="Enterprise"
                    price={billingCycle === 'monthly' ? '499' : '399'}
                    desc="Advanced features for global firms scaling hard."
                    features={['Custom AI Model Training', 'Unlimited Sourcing Credits', 'Dedicated Success Manager', 'SSO & Multi-Org Access', '24/7 Phone Support']}
                    onAction={onSignup}
                />
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-500 py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">R</div>
                        <span className="text-slate-900 font-black text-2xl tracking-tighter uppercase">RecruitFlow</span>
                    </div>
                    <p className="max-w-sm text-lg font-medium leading-relaxed">Modernizing the recruitment industry with autonomous intelligence. Built in San Francisco.</p>
                </div>
                <div>
                    <h5 className="text-slate-900 font-black uppercase tracking-widest text-xs mb-6">Product</h5>
                    <ul className="space-y-4 font-bold text-sm">
                        <li><button onClick={() => scrollToSection('features')} className="hover:text-brand-600">Features</button></li>
                        <li><button onClick={() => scrollToSection('architecture')} className="hover:text-brand-600">Architecture</button></li>
                        <li><button onClick={() => scrollToSection('pricing')} className="hover:text-brand-600">Pricing</button></li>
                    </ul>
                </div>
                <div>
                    <h5 className="text-slate-900 font-black uppercase tracking-widest text-xs mb-6">Company</h5>
                    <ul className="space-y-4 font-bold text-sm">
                        <li><a href="#" className="hover:text-brand-600">Waitlist</a></li>
                        <li><a href="#" className="hover:text-brand-600">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-brand-600">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-widest">© 2025 RecruitFlow Inc. All Rights Reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"><Users size={20} /></a>
                    <a href="#" className="p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"><Globe size={20} /></a>
                </div>
            </div>
        </div>
      </footer>

      {/* Video Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setShowDemo(false)}></div>
            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.3)] animate-in zoom-in-95 duration-300">
                <button onClick={() => setShowDemo(false)} className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all">
                    <X size={24} />
                </button>
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <video className="w-full h-full object-cover" controls autoPlay>
                        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                    </video>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const FeatureItem = ({ icon, title, desc, color }: any) => (
  <div className="text-left group cursor-default">
    <div className={`w-16 h-16 ${color} rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
      {icon}
    </div>
    <h4 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">{title}</h4>
    <p className="text-slate-500 text-lg leading-relaxed font-medium">{desc}</p>
  </div>
);

const ComparisonRow = ({ category, label, recruitFlow, legacy, rfIcon, legIcon }: any) => (
  <tr className="hover:bg-slate-50/50 transition-colors group">
    <td className="p-8">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{category}</div>
        <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{label}</div>
    </td>
    <td className="p-8 bg-brand-50/10">
        <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">{rfIcon}</div>
            <div className="font-bold text-slate-900 text-lg leading-snug">{recruitFlow}</div>
        </div>
    </td>
    <td className="p-8 opacity-40">
        <div className="flex items-start gap-4">
            <div className="shrink-0 mt-1">{legIcon}</div>
            <div className="font-bold text-slate-600 text-lg leading-snug">{legacy}</div>
        </div>
    </td>
  </tr>
);

const ArchCard = ({ icon, title, desc, tech }: any) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all group flex flex-col">
    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-white/10">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">{title}</h3>
    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8 flex-1">{desc}</p>
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 bg-brand-400/10 self-start px-3 py-1 rounded-full border border-brand-400/20">
      {tech}
    </div>
  </div>
);

const PricingCard = ({ title, price, desc, features, featured, onAction }: any) => (
  <div className={`relative p-10 rounded-[2.5rem] border ${featured ? 'bg-slate-900 border-slate-800 shadow-2xl scale-105 z-10' : 'bg-white border-slate-200 shadow-sm'} flex flex-col`}>
    {featured && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-6 py-1.5 rounded-b-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
        Most Popular
      </div>
    )}
    <h3 className={`text-2xl font-black uppercase tracking-tight ${featured ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    <div className="mt-6 mb-8">
        <span className={`text-6xl font-black tracking-tighter ${featured ? 'text-white' : 'text-slate-900'}`}>${price}</span>
        <span className={featured ? 'text-slate-400' : 'text-slate-500'}>/mo</span>
    </div>
    <p className={`text-lg font-medium leading-relaxed mb-10 text-left ${featured ? 'text-slate-300' : 'text-slate-500'}`}>{desc}</p>
    <button 
        onClick={onAction}
        className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl hover:shadow-2xl mb-10 ${
            featured ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/20' : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
    >
      Select Plan
    </button>
    <ul className="space-y-5 text-left flex-1">
        {features.map((f: string) => (
            <li key={f} className="flex gap-4 items-start">
                <CheckCircle size={20} className={`shrink-0 mt-1 ${featured ? 'text-brand-400' : 'text-brand-600'}`} />
                <span className={`text-base font-bold ${featured ? 'text-slate-200' : 'text-slate-700'}`}>{f}</span>
            </li>
        ))}
    </ul>
  </div>
);

export default LandingPage;
