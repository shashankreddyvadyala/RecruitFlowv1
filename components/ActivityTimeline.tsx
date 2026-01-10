
import React from 'react';
import { Mail, Phone, Calendar, FileText, CheckCircle2, User } from 'lucide-react';
import { Activity } from '../types';

interface ActivityTimelineProps {
  activities: Activity[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'Email': return <Mail size={14} />;
      case 'Call': return <Phone size={14} />;
      case 'Meeting': return <Calendar size={14} />;
      case 'Note': return <FileText size={14} />;
      case 'StageChange': return <CheckCircle2 size={14} />;
      default: return <User size={14} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'Email': return 'bg-blue-100 text-blue-600';
      case 'Call': return 'bg-purple-100 text-purple-600';
      case 'Meeting': return 'bg-orange-100 text-orange-600';
      case 'Note': return 'bg-slate-100 text-slate-600';
      case 'StageChange': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {activities.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8 italic">No recent activity logged.</p>
      ) : (
        activities.map((activity, index) => (
          <div key={activity.id} className="relative pl-8 pb-6 last:pb-0">
            {/* Timeline Line */}
            {index !== activities.length - 1 && (
              <div className="absolute left-[15px] top-[30px] bottom-0 w-[2px] bg-slate-100" />
            )}
            
            {/* Icon Node */}
            <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${getColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-900 text-sm">{activity.subject}</h4>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(activity.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{activity.content}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-bold">{activity.author}</span>
                <span>•</span>
                <span>{activity.type}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActivityTimeline;
