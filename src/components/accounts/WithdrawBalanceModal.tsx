'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Users, ArrowRight } from 'lucide-react';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useTeams } from '@/hooks/useTeams';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
};

export function WithdrawBalanceModal({ isOpen, onClose, account }: Props) {
  const { updateBalance } = useAccounts();
  const { addWithdrawal } = useWithdrawals();
  const { teams } = useTeams();

  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  // Sync initial max balance when opened
  useEffect(() => {
    if (isOpen && account) {
      setWithdrawAmount(Number(account.current_balance) || 0);
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const maxBalance = Number(account.current_balance) || 0;
  const activeTeam = teams.find(t => t.id === account.team_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) return;
    if (withdrawAmount > maxBalance) {
      alert("Cannot withdraw more than current balance.");
      return;
    }

    setLoading(true);
    try {
      // Create detailed notes block for history tracking mapping percentages implicitly
      let splitNotes = `[Withdrawn from: ${account.name}]\n`;
      if (activeTeam && activeTeam.members.length > 0) {
        splitNotes += `[Team: ${activeTeam.name}]\n`;
        activeTeam.members.forEach(m => {
          const cut = (withdrawAmount * (Number(m.split_percentage) / 100));
          splitNotes += `- ${m.name}: ₱${cut.toFixed(2)} (${m.split_percentage}%)\n`;
        });
      }

      // Deduct from TikTok account balance state explicitly
      await updateBalance(account.id, maxBalance - withdrawAmount);

      // Log to central Withdrawal tracker system
      await addWithdrawal({
        amount: withdrawAmount,
        date: new Date().toISOString().split('T')[0],
        notes: splitNotes
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl shadow-emerald-500/10">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <DollarSign className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-400">Withdraw Funds</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{account.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <label>Amount (PHP)</label>
              <span className="text-primary cursor-pointer hover:underline" onClick={() => setWithdrawAmount(maxBalance)}>
                Max: ₱{maxBalance.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <input
                required
                type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                step="0.01"
                max={maxBalance}
                className="w-full pl-10 pr-4 py-3 bg-secondary border border-border/50 rounded-xl font-mono text-xl text-primary font-bold outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                value={withdrawAmount || ''}
                onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
              />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
            </div>
          </div>

          <div className="p-4 bg-secondary/50 border border-white/5 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              Dynamic Payload Split
            </div>

            {(!activeTeam || activeTeam.members.length === 0) ? (
              <p className="text-xs text-muted-foreground italic border border-dashed border-white/10 p-3 rounded-lg text-center">
                This account is currently not assigned to an active team split configuration.
              </p>
            ) : (
              <div className="space-y-2">
                {activeTeam.members.map(member => {
                  const payloadCut = (withdrawAmount * (Number(member.split_percentage) / 100));
                  return (
                    <div key={member.name} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0 relative group">
                      <span className="font-medium flex items-center gap-2">
                        {member.name} 
                        <span className="text-[10px] bg-secondary px-1.5 rounded-full text-muted-foreground font-mono">
                          {member.split_percentage}%
                        </span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5 transition-all group-hover:scale-105">
                        <ArrowRight className="h-3 w-3 text-emerald-400/50" />
                        ₱{payloadCut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || withdrawAmount <= 0 || withdrawAmount > maxBalance}
            className="w-full py-3 bg-emerald-500 text-black rounded-xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 disabled:shadow-none transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Team Payout'}
          </button>
        </form>
      </div>
    </div>
  );
}
