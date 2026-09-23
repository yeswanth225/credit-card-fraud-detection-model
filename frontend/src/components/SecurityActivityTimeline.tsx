import React from 'react';
import { SecurityActivityEvent } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  Unlock,
  Globe,
  Tag,
  Laptop,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface SecurityActivityTimelineProps {
  activities: SecurityActivityEvent[];
  maxItems?: number;
  className?: string;
}

export const SecurityActivityTimeline: React.FC<SecurityActivityTimelineProps> = ({
  activities,
  maxItems,
  className = '',
}) => {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getEventIcon = (type: SecurityActivityEvent['type'], severity: SecurityActivityEvent['severity']) => {
    switch (type) {
      case 'card_freeze':
        return <Lock className="w-4 h-4 text-white" />;
      case 'card_unfreeze':
        return <Unlock className="w-4 h-4 text-white" />;
      case 'fraud_blocked':
        return <ShieldX className="w-4 h-4 text-white" />;
      case 'alert_resolved':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'geo_locked':
      case 'geo_unlocked':
        return <Globe className="w-4 h-4 text-white" />;
      case 'category_blocked':
      case 'category_unblocked':
        return <Tag className="w-4 h-4 text-white" />;
      case 'device_revoked':
        return <ShieldAlert className="w-4 h-4 text-white" />;
      case 'device_trusted':
        return <Laptop className="w-4 h-4 text-white" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-white" />;
    }
  };

  const getSeverityBadgeClass = (severity: SecurityActivityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-white/5 text-[#909099] border-white/5';
    }
  };

  if (displayedActivities.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center text-[#5E5E68] text-xs ${className}`}>
        No recent security activity recorded.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {displayedActivities.map((act) => (
        <div
          key={act.id}
          className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
        >
          {/* Icon Container with solid white icon */}
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
            {getEventIcon(act.type, act.severity)}
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                {act.title}
              </span>
              <span className="text-[11px] font-mono text-[#5E5E68] shrink-0">
                {act.formattedTime}
              </span>
            </div>
            <p className="text-xs text-[#909099] leading-relaxed">
              {act.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
