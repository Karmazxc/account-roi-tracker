'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  DollarSign,
  Play,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useEarnings } from '@/hooks/useEarnings';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useScripts } from '@/hooks/useScripts';
import { isDemoMode, supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const { accounts, loading: loadingA } = useAccounts();
  const { earnings, loading: loadingE } = useEarnings();
  const { withdrawals, loading: loadingW } = useWithdrawals();
  const { scripts, loading: loadingS } = useScripts();

  const totalEarned = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const availableBalance = totalEarned - totalWithdrawn;
  const restrictedCount = accounts.filter(a => a.status === 'restricted').length;

  const stats = [
    { name: 'Available Balance', value: `₱${availableBalance.toLocaleString()}`, icon: DollarSign, trend: 'To Withdraw', color: 'text-emerald-400' },
    { name: 'Active Accounts', value: accounts.length.toString(), icon: Users, trend: `${accounts.length} Total`, color: 'text-blue-400' },
    { name: 'Gross Earnings', value: `₱${totalEarned.toLocaleString()}`, icon: TrendingUp, trend: 'Life-time', color: 'text-tiktok-cyan' },
    { name: 'Restricted', value: restrictedCount.toString(), icon: AlertCircle, trend: 'Action Required', color: 'text-tiktok-pink' },
  ];

  const loading = loadingA || loadingE || loadingW || loadingS;

  const expiringScripts = scripts.filter(s => {
    const diff = Math.ceil((new Date(s.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff <= 10 && diff > 0;
  });

  const restrictedAccounts = accounts.filter(a => a.status === 'restricted');

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Syncing management systems...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Your management system is live and synced with Supabase.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (window.confirm("CRITICAL WARNING: This will irreversibly wipe all existing Accounts, Teams, and Financial records from the system's memory. Are you absolutely sure you want to proceed with a Factory Reset?")) {
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
                  } catch (err) {
                    console.error("Cloud Flush Operation Failed:", err);
                  }
                }
                
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-tiktok-pink/10 hover:bg-tiktok-pink/20 text-tiktok-pink rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Factory Reset
          </button>
          <div className="px-4 py-2 bg-secondary/50 rounded-lg text-xs font-bold uppercase tracking-widest border border-white/5">
            System Status: <span className="text-emerald-400 ml-1">Stable</span>
          </div>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Welcome to your Dashboard Demo!</h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                I've enabled **Demo Mode** with mock data so you can explore the ROI tracking, script timers, and team splits immediately. Connect your own Supabase project in `.env.local` to start recording real assets.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-secondary border border-white/5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-secondary/70 transition-all cursor-default">
              Ready to Live?
            </button>
            <Link href="/accounts" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
              Manage Accounts
            </Link>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {(restrictedAccounts.length > 0 || expiringScripts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restrictedAccounts.slice(0, 2).map((acc: any) => (
             <div key={acc.id} className="flex items-center gap-4 p-4 bg-tiktok-pink/10 border border-tiktok-pink/20 rounded-xl animate-pulse">
               <AlertCircle className="h-5 w-5 text-tiktok-pink shrink-0" />
               <div className="flex-1">
                 <p className="text-sm font-bold text-tiktok-pink uppercase tracking-widest text-[10px]">Account Restricted</p>
                 <p className="text-sm font-medium">{acc.name} requires attention.</p>
               </div>
               <button className="text-[10px] font-bold uppercase tracking-widest hover:underline">View</button>
             </div>
          ))}
          {expiringScripts.slice(0, 2).map((scr: any) => (
             <div key={scr.id} className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
               <Clock className="h-5 w-5 text-amber-500 shrink-0" />
               <div className="flex-1">
                 <p className="text-sm font-bold text-amber-500 uppercase tracking-widest text-[10px]">Script Expiring</p>
                 <p className="text-sm font-medium">{scr.name} expires in <span className="font-bold">
                   {Math.ceil((new Date(scr.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                 </span></p>
               </div>
               <button className="text-[10px] font-bold uppercase tracking-widest hover:underline text-amber-500">Renew</button>
             </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any) => (
          <div key={stat.name} className="glass-card p-6 space-y-4 hover:border-primary/50 transition-colors cursor-default">
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg bg-secondary", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <h3 className="text-2xl font-bold mt-1 font-mono">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Recent Live Sessions
          </h2>
          <div className="space-y-4">
            {earnings.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground border border-dashed border-white/5 rounded-xl">
                 No live sessions recorded yet.
               </div>
            ) : earnings.slice(0, 5).map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tiktok-pink/20 flex items-center justify-center">
                    <span className="text-tiktok-pink font-bold">L</span>
                  </div>
                  <div>
                    <p className="font-medium">{session.accounts?.name || 'Account'}</p>
                    <p className="text-xs text-muted-foreground">Streamer: {session.streamer_name} • {session.hours_live}h</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-tiktok-cyan font-mono">+₱{Number(session.amount).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Status Snapshot */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Top Performance
          </h2>
          <div className="space-y-6">
            {accounts.slice(0, 3).map((account) => {
              const accountEarnings = earnings
                .filter((e: any) => e.account_id === account.id)
                .reduce((sum, e) => sum + Number(e.amount), 0);
              const progress = Math.min((accountEarnings / Number(account.purchase_price)) * 100, 100) || 0;
              const isROI = accountEarnings >= Number(account.purchase_price);

              return (
                <div key={account.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="truncate pr-2">{account.name}</span>
                    <span className={cn("font-bold font-mono", isROI ? "text-emerald-400" : "text-muted-foreground")}>
                      {isROI ? 'ROI ✅' : `${progress.toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", isROI ? "bg-emerald-400" : "bg-tiktok-pink")}
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/roi" className="w-full mt-8 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity uppercase tracking-widest text-xs flex justify-center">
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
