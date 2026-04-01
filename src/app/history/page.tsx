'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { 
  Download, 
  ArrowUpRight, 
  Wallet, 
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useEarnings } from '@/hooks/useEarnings';
import { AddWithdrawalModal } from '@/components/history/AddWithdrawalModal';
import { PayoutReport } from '@/components/history/PayoutReport';
import { isDemoMode, supabase } from '@/lib/supabase';

export default function HistoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { withdrawals, loading: loadingW, refresh: refreshW, deleteWithdrawal } = useWithdrawals();
  const { earnings, loading: loadingE, refresh: refreshE } = useEarnings();

  const totalEarned = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const availableBalance = totalEarned - totalWithdrawn;

  const loading = loadingW || loadingE;

  return (
    <div className="space-y-8 text-foreground">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-tiktok-cyan">Withdrawal & Balance</h1>
          <p className="text-muted-foreground mt-2">Track your total payouts and current available balance.</p>
        </div>
        <div className="glass-card px-6 py-4 flex items-center gap-6 shadow-xl shadow-tiktok-cyan/10 ring-1 ring-white/10 min-w-[320px]">
          <div className="p-3 bg-tiktok-cyan/10 rounded-full">
            <Wallet className="h-6 w-6 text-tiktok-cyan" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Balance</p>
            <p className="text-3xl font-mono font-bold text-tiktok-cyan leading-none mt-1">
              ₱{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-medium ml-auto"
          >
            WITHDRAW
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-bold">Transaction History</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                if (window.confirm("CRITICAL WARNING: Wipe all history and pools?")) {
                  localStorage.clear();
                  if (!isDemoMode) {
                    try {
                      await Promise.all([
                        supabase.from('withdrawals').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                        supabase.from('earnings').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                        supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
                        supabase.from('scripts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                      ]);
                      await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                      await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    } catch (err) { }
                  }
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 text-xs font-bold text-tiktok-pink hover:text-tiktok-pink/70 transition-colors bg-tiktok-pink/10 px-3 py-1.5 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
              CLEAR ALL
            </button>
            <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors transition-all">
              <Download className="h-4 w-4" />
              EXPORT ALL
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading transactions...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <p>No withdrawals recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {withdrawals.map((txn) => (
                <tr key={txn.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold uppercase">{txn.notes || 'INTERNAL_X'}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Bank/Wallet Transfer</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-lg font-mono font-bold text-tiktok-pink">
                      <ArrowUpRight className="h-4 w-4" />
                      ₱{Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(txn.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      "bg-emerald-500/10 text-emerald-400"
                    )}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to completely erase this transaction? This will instantly credit the balance back to the pool.")) {
                          await deleteWithdrawal(txn.id);
                        }
                      }}
                      className="p-2 hover:bg-tiktok-pink/10 text-muted-foreground hover:text-tiktok-pink rounded-lg transition-colors inline-flex"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <PayoutReport />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 border-l-4 border-l-tiktok-cyan">
            <h4 className="text-sm font-bold text-muted-foreground uppercase mb-4">Total Life-time Withdrawn</h4>
            <div className="text-4xl font-mono font-bold text-tiktok-cyan text-glow">
              PHP {totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic text-right font-medium">Updated just now</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-tiktok-pink">
            <h4 className="text-sm font-bold text-muted-foreground uppercase mb-4">Gross Business Earnings</h4>
            <div className="text-4xl font-mono font-bold text-tiktok-pink text-glow">
              PHP {totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic text-right font-medium">Based on all recorded live sessions</p>
          </div>
        </div>
      </div>

      <AddWithdrawalModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); refreshW(); refreshE(); }} 
        availableBalance={availableBalance}
      />
    </div>
  );
}
