'use client';

import React from 'react';
import { PieChart, ArrowDownRight, Info, Users } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useAccounts } from '@/hooks/useAccounts';
import { cn } from '@/lib/utils';

export function PayoutReport() {
  const { teams } = useTeams();
  const { accounts } = useAccounts();

  // Create an array of visually distinct gradient arrays or colors to rotate through
  const colorThemes = [
    'text-tiktok-cyan',
    'text-tiktok-pink',
    'text-primary',
    'text-emerald-400',
    'text-amber-500'
  ];

  if (teams.length === 0) {
     return (
       <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PieChart className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Team Payout Breakdown</h2>
          </div>
          <div className="p-10 text-center text-muted-foreground border border-dashed border-white/5 rounded-2xl">
            <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-bold uppercase tracking-widest text-xs">No Active Teams</p>
            <p className="text-sm mt-1">Register a Team to generate dynamic payout splits.</p>
          </div>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => {
        // Calculate the Total Pooled Balance specifically from Accounts assigned to THIS team
        const teamAccounts = accounts.filter(a => a.team_id === team.id);
        const teamAvailable = teamAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
        
        // Skip rendering teams with absolutely zero balance or zero members to clean up UI, unless you want them visible
        if (team.members.length === 0) return null;

        return (
          <div key={team.id} className="glass-card p-6 border-t-4 border-t-primary/50 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{team.name} Pool</h2>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Gross Balance: <span className="font-mono text-primary group-hover:text-glow transition-all">₱{teamAvailable.toLocaleString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <PieChart className="h-3 w-3" />
                SPLIT RATIO: {team.members.map(m => `${m.split_percentage}%`).join(' / ')}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {team.members.map((person, index) => {
                const computedAmount = (teamAvailable * person.split_percentage) / 100;
                const activeColor = colorThemes[index % colorThemes.length];

                return (
                  <div key={person.name} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-white/5 hover:bg-secondary/80 transition-all transform hover:-translate-y-0.5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center font-bold text-sm shadow-inner overflow-hidden border border-white/5">
                        {person.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{person.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{person.split_percentage}% Stake</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xl font-mono font-bold drop-shadow-sm", activeColor)}>
                        ₱{computedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-400/80 font-bold uppercase mt-1">
                        <ArrowDownRight className="h-3 w-3" />
                        Available Now
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <PieChart size={200} />
            </div>
          </div>
        );
      })}

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3 mt-8">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These pools dynamically calculate and separate earnings based on the specific TikTok Accounts configured for each Team. Admin distributions are precisely routed by the defined percentage matrix configured in the team definitions.
        </p>
      </div>
    </div>
  );
}
