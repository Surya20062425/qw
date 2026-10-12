import React, { useState, useEffect } from 'react';
import { BrandBriefOpportunity } from '../types';
import { useAuth } from '../context/AuthContext';
import { Sparkles, DollarSign, Clock, ArrowRight, X, Building2, ShieldCheck, Zap } from 'lucide-react';

interface NewBriefAlertModalProps {
  navigate: (path: string, creatorId?: string) => void;
  onOpenPitchBrief?: (brief: BrandBriefOpportunity) => void;
}

export const NewBriefAlertModal: React.FC<NewBriefAlertModalProps> = ({ navigate, onOpenPitchBrief }) => {
  const { role } = useAuth();
  const [activeAlert, setActiveAlert] = useState<BrandBriefOpportunity | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Listen for in-app custom event
    const handleNewBrief = (event: any) => {
      if (event.detail) {
        setActiveAlert(event.detail);
        setIsDismissed(false);
      }
    };

    // 2. Listen for cross-tab storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cb_latest_brief_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.brief) {
            setActiveAlert(parsed.brief);
            setIsDismissed(false);
          }
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('cb-new-brief-created', handleNewBrief);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('cb-new-brief-created', handleNewBrief);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!activeAlert || isDismissed) {
    return null;
  }

  const handleAction = () => {
    setIsDismissed(true);
    if (onOpenPitchBrief) {
      onOpenPitchBrief(activeAlert);
    }
    navigate('brand-briefs');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-1 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#000E23]/95 backdrop-blur-xl border-2 border-[#6AA0FD]/80 text-white rounded-2xl shadow-2xl p-5 overflow-hidden relative group">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#175CB5]/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#6D28D9]/40 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Ribbon */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            New Brief Uploaded
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Just now</span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-white mb-1.5 line-clamp-1 pr-6">
          {activeAlert.title}
        </h4>

        {/* Brand & Budget Details */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mb-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-[#6AA0FD]" />
            <span>{activeAlert.brandName}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${activeAlert.budget.toLocaleString()} Escrow Funded</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Clock className="w-3 h-3" />
            <span>{activeAlert.turnaroundDays}</span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-[11px] text-slate-300 mb-3 line-clamp-2 leading-relaxed bg-white/5 p-2 rounded-xl border border-white/5">
          "{activeAlert.objective || activeAlert.description}"
        </p>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAction}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#175CB5] to-[#2563EB] hover:from-[#124b96] hover:to-[#1d4ed8] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Review & Pitch on Brief</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Later
          </button>
        </div>

      </div>
    </div>
  );
};
