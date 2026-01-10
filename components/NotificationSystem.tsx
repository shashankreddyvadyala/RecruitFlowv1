
import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          className="pointer-events-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-4 flex items-start gap-4 animate-in slide-in-from-right duration-300 overflow-hidden relative group"
        >
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
            notif.type === 'error' ? 'bg-red-50 text-red-600' :
            notif.type === 'warning' ? 'bg-orange-50 text-orange-600' :
            'bg-brand-50 text-brand-600'
          }`}>
            {notif.type === 'success' ? <CheckCircle2 size={20} /> :
             notif.type === 'error' ? <AlertCircle size={20} /> :
             notif.type === 'warning' ? <AlertCircle size={20} /> :
             <Bell size={20} />}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{notif.title}</h4>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{notif.message}</p>
          </div>

          <button 
            onClick={() => removeNotification(notif.id)}
            className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="absolute bottom-0 left-0 h-1 bg-slate-100 w-full">
            <div className={`h-full animate-[shrink_5s_linear] ${
              notif.type === 'success' ? 'bg-emerald-500' :
              notif.type === 'error' ? 'bg-red-500' :
              notif.type === 'warning' ? 'bg-orange-500' :
              'bg-brand-500'
            }`} />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem;
