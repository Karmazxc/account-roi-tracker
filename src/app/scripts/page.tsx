'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { 
  Plus, 
  Key, 
  Calendar, 
  User, 
  Users,
  AlertTriangle,
  Loader2,
  Trash2,
  Edit2,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScripts, Script } from '@/hooks/useScripts';
import { useTeams } from '@/hooks/useTeams';
import { useAccounts } from '@/hooks/useAccounts';
import { AddScriptModal } from '@/components/scripts/AddScriptModal';

export default function ScriptsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const { scripts, loading: sLoading, deleteScript, refresh } = useScripts();
  const { teams, loading: tLoading } = useTeams();
  const { accounts, loading: aLoading } = useAccounts();

  const loading = sLoading || tLoading || aLoading;

  const totalScriptCost = scripts.reduce((sum, s) => sum + Number(s.price), 0);
  // Gross Revenue is now powered entirely by Team TikTok Account balances
  const totalEarnings = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
  const roiPercentage = totalScriptCost > 0 ? ((totalEarnings - totalScriptCost) / totalScriptCost) * 100 : 0;

  return (
    <div className="space-y-8 text-foreground animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Script Management</h1>
          <p className="text-muted-foreground mt-2">Track license durations and Team ROI scaling.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-4 py-2 bg-secondary/30 border border-white/5 rounded-xl shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Script Costs</span>
              <span className="font-mono font-bold text-tiktok-pink shadow-sm">₱{totalScriptCost.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Team Revenues</span>
              <span className="font-mono font-bold text-emerald-400 shadow-sm">₱{totalEarnings.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Net ROI Margin</span>
              <span className={cn("font-mono font-bold shadow-sm", roiPercentage >= 0 ? "text-emerald-400" : "text-tiktok-pink")}>
                {roiPercentage > 0 ? '+' : ''}{roiPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          <button 
            onClick={() => { setEditingScript(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all uppercase tracking-widest text-xs h-full"
          >
            <Plus className="h-4 w-4" />
            Add Script
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Syncing team licenses...</p>
          </div>
        ) : scripts.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed border-white/5 rounded-2xl">
            <p>No scripts found. Register your first automation script!</p>
          </div>
        ) : scripts.map((script) => {
          const expiryDate = new Date(script.expiry_date);
          const now = new Date();
          const diffMs = expiryDate.getTime() - now.getTime();
          
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          const isExpiring = diffMs <= 7 * 24 * 60 * 60 * 1000 && diffMs > 0;
          const isExpired = diffMs <= 0;

          // Team ROI Calculation
          const team = teams.find(t => t.id === script.team_id);
          const teamAccounts = accounts.filter(a => a.team_id === script.team_id);
          const teamRevenue = teamAccounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
          const isRoiReached = teamRevenue >= Number(script.price);

          return (
            <div key={script.id} className="glass-card group p-6 relative overflow-hidden transition-all duration-300 hover:border-primary/50 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                          setEditingScript(script);
                          setIsModalOpen(true);
                      }}
                      className="p-1 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                          if (window.confirm("Are you sure you want to delete this script permanently?")) {
                              deleteScript(script.id);
                          }
                      }}
                      className="p-1 hover:bg-tiktok-pink/20 text-muted-foreground hover:text-tiktok-pink rounded-lg transition-colors border border-transparent hover:border-tiktok-pink/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    isExpired ? "bg-tiktok-pink/10 text-tiktok-pink border-tiktok-pink/20" :
                    isExpiring ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active'}
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <h3 className="text-xl font-bold truncate pr-4">{script.name}</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-primary font-bold">
                    <Users className="h-4 w-4" />
                    Team: <span className="text-foreground ml-auto">{script.buyer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Calendar className="h-4 w-4" />
                    Expiry: <span className="text-foreground ml-auto font-mono">{new Date(script.expiry_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="py-2">
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Cost Split Allocations</p>
                   {script.cost_splits && script.cost_splits.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {script.cost_splits.map(cs => (
                         <div key={cs.name} className="px-2 py-1 bg-secondary border border-white/5 rounded-md text-xs flex items-center gap-1.5 font-mono">
                           <span className="text-muted-foreground">{cs.name}:</span>
                           <span className="text-primary font-bold">₱{Number(cs.amount).toLocaleString()}</span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-xs text-muted-foreground italic">No manual splits configured</p>
                   )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Purchase Price</p>
                    <p className="text-2xl font-bold font-mono text-primary leading-none">₱{Number(script.price).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className={cn("flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider", isRoiReached ? "text-emerald-400" : "text-amber-500")}>
                      <TrendingUp className="h-3 w-3" />
                      {isRoiReached ? "ROI RECOVERED" : "RECOVERING"}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">Team Rev: ₱{teamRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AddScriptModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingScript(null); refresh(); }} 
        initialData={editingScript}
      />
    </div>
  );
}
