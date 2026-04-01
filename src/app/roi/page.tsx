'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  ArrowUpRight,
  MoreVertical,
  Loader2,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useScripts } from '@/hooks/useScripts';
import { useTeams } from '@/hooks/useTeams';
import { calculateROI } from '@/lib/calculations';

export default function ROIPage() {
  const { accounts, loading: loadingA } = useAccounts();
  const { scripts, loading: loadingS } = useScripts();
  const { teams, loading: loadingT } = useTeams();

  const loading = loadingA || loadingS || loadingT;

  // Global Portfolio
  const totalAccountCost = accounts.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0);
  const totalScriptCost = scripts.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const totalCost = totalAccountCost + totalScriptCost;
  
  const totalEarned = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
  const portfolioROI = totalCost > 0 ? ((totalEarned - totalCost) / totalCost) * 100 : 0;

  if (loading) {
     return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-20">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Calculating portfolio ROI via Team Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-400">ROI Tracker & Performance</h1>
        <p className="text-muted-foreground mt-2">Monitor the return on investment strictly isolated by Profit Teams and Account live balances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Portfolio ROI */}
        <div className="glass-card p-6 bg-emerald-500/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Net Portfolio ROI</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className={cn("text-3xl font-bold font-mono", portfolioROI >= 0 ? "text-emerald-400" : "text-tiktok-pink")}>
            {portfolioROI > 0 ? '+' : ''}{portfolioROI.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">Overall profit margin against all sunk costs</p>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
        </div>

        {/* Total Cost */}
        <div className="glass-card p-6 bg-tiktok-pink/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Sunk Costs</h3>
            <div className="p-2 bg-tiktok-pink/10 rounded-lg group-hover:bg-tiktok-pink/20 transition-colors">
              <DollarSign className="h-5 w-5 text-tiktok-pink" />
            </div>
          </div>
          <div className="text-3xl font-bold text-tiktok-pink font-mono">₱{totalCost.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground mt-2">Accounts + Scripts investment</p>
        </div>

        {/* Total Earnings */}
        <div className="glass-card p-6 bg-tiktok-cyan/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Gross Current Value</h3>
            <div className="p-2 bg-tiktok-cyan/10 rounded-lg group-hover:bg-tiktok-cyan/20 transition-colors">
              <ArrowUpRight className="h-5 w-5 text-tiktok-cyan" />
            </div>
          </div>
          <div className="text-3xl font-bold text-tiktok-cyan font-mono">₱{totalEarned.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground mt-2">Total combined live pool balances</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-border/50 bg-secondary/10">
           <h3 className="font-bold flex items-center gap-2">
             <Users className="h-4 w-4 text-primary" />
             Team Isolation Matrices
           </h3>
        </div>
        {teams.length === 0 ? (
           <div className="p-20 text-center text-muted-foreground font-medium border border-dashed border-white/5 rounded-2xl m-4">
             No registered Teams available to break down ROI.
           </div>
        ) : (
          <div className="divide-y divide-border/50">
            {teams.map((team) => {
              // Mathematical Team Isolation
              const teamAccounts = accounts.filter(a => a.team_id === team.id);
              const teamScripts = scripts.filter(s => s.team_id === team.id);
              
              const teamAccountCost = teamAccounts.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0);
              const teamScriptCost = teamScripts.reduce((sum, s) => sum + Number(s.price || 0), 0);
              const totalTeamCost = teamAccountCost + teamScriptCost;
              
              const teamRevenue = teamAccounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
              const { progress, isReached, remaining } = calculateROI(totalTeamCost, teamRevenue);

              return (
                <div key={team.id} className="p-6 hover:bg-secondary/10 transition-colors flex flex-col md:flex-row items-center gap-8">
                  {/* Team Profile */}
                  <div className="w-full md:w-1/4">
                    <h4 className="text-xl font-bold text-primary mb-1">{team.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{team.members.length} Active Contributors</p>
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Account Assets:</span>
                        <span className="font-mono">{teamAccounts.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Active Scripts:</span>
                        <span className="font-mono">{teamScripts.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="w-full md:w-1/4 space-y-3">
                     <div>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sunk Costs (Accts + Scripts)</p>
                       <p className="text-lg font-mono font-bold text-tiktok-pink">₱{totalTeamCost.toLocaleString()}</p>
                     </div>
                     <div>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Gross Team Live Rev</p>
                       <p className="text-lg font-mono font-bold text-tiktok-cyan">₱{teamRevenue.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* ROI Progress Block */}
                  <div className="w-full md:w-2/4">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Recovery Progress</span>
                       <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                          isReached ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                       )}>
                         {isReached ? (
                          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> ROI CLEARED</span>
                         ) : (
                          `-₱${remaining.toLocaleString()} TO EVEN`
                         )}
                       </span>
                    </div>
                    
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          isReached ? "bg-emerald-500" : "bg-tiktok-pink"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-2 font-mono text-muted-foreground">
                      <span>{progress.toFixed(1)}% Margin</span>
                      {isReached && <span className="text-emerald-400 font-bold uppercase italic shadow-sm">NET PROFIT ZONE</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
