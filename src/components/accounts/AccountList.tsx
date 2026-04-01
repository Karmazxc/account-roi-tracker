'use client';

import React, { useState } from 'react';
import { 
  MoreVertical, 
  Plus, 
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Trash2,
  Edit2,
  Users,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useTeams } from '@/hooks/useTeams';
import { AddAccountModal } from './AddAccountModal';
import { ManageTeamsModal } from './ManageTeamsModal';
import { WithdrawBalanceModal } from './WithdrawBalanceModal';
import { ManageGmailsModal } from './ManageGmailsModal';

export function AccountList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [isGmailsModalOpen, setIsGmailsModalOpen] = useState(false);
  const [withdrawAccount, setWithdrawAccount] = useState<Account | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { accounts, loading, deleteAccount, updateBalance, refresh } = useAccounts();
  const { teams } = useTeams();

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  const teamBalances = teams.map(team => {
    const balance = accounts
      .filter(a => a.team_id === team.id)
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);
    return { id: team.id, name: team.name, balance };
  });

  const unassignedBalance = accounts
    .filter(a => !a.team_id)
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.gmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 text-foreground">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search accounts..." 
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 whitespace-nowrap">
             <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Unreleased Pool:</span>
             <span className="font-mono text-base font-bold text-emerald-400 shadow-sm">₱{totalBalance.toLocaleString()}</span>
          </div>
        </div>
          <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <button 
              onClick={() => setIsTeamsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-secondary/50 text-foreground border border-white/5 hover:bg-secondary rounded-lg font-bold shadow-sm transition-all uppercase tracking-widest text-xs"
            >
              <Users className="h-4 w-4 text-tiktok-cyan" />
              Manage Teams
            </button>
            <button 
              onClick={() => setIsGmailsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-secondary/50 text-foreground border border-white/5 hover:bg-secondary rounded-lg font-bold shadow-sm transition-all uppercase tracking-widest text-xs"
            >
              <Users className="h-4 w-4 text-primary" />
              Manage Gmails
            </button>
            <button 
              onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all uppercase tracking-widest text-xs"
            >
              <Plus className="h-4 w-4" />
              Account
            </button>
          </div>
      </div>

      {(teamBalances.some(t => t.balance > 0) || unassignedBalance > 0) && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-secondary/20 border border-white/5 rounded-xl mt-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mr-2 flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" /> Team Pools Breakdown
          </span>
          {teamBalances.filter(t => t.balance > 0).map(t => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-white/5 shadow-inner rounded-lg">
              <span className="text-[10px] text-tiktok-cyan uppercase font-bold tracking-widest">{t.name}</span>
              <span className="text-sm font-mono font-bold text-emerald-400">₱{t.balance.toLocaleString()}</span>
            </div>
          ))}
          {unassignedBalance > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-white/5 shadow-inner rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Unassigned</span>
              <span className="text-sm font-mono font-bold text-emerald-400">₱{unassignedBalance.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <p>No accounts found. Add your first TikTok account!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAccounts.map((account) => {
               const unbanDate = account.unban_date ? new Date(account.unban_date) : null;
               const now = new Date();
               const diffMs = unbanDate ? unbanDate.getTime() - now.getTime() : 0;
               const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
               const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
               const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
               
               const isRestrictedActive = account.status === 'restricted' && diffMs > 0;
               const isReady = account.status === 'restricted' && diffMs <= 0;

               const teamName = account.team_id ? teams.find(t => t.id === account.team_id)?.name : null;

               return (
                 <div key={account.id} className="glass-card group p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/50 flex flex-col h-full">
                   <div className="flex items-start justify-between mb-4">
                     <div className="p-2.5 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors">
                       <CreditCard className="h-5 w-5 text-primary" />
                     </div>
                     <div className="flex flex-col items-end gap-1.5">
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => {
                             setEditingAccount(account);
                             setIsModalOpen(true);
                           }}
                           className="p-1 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 rounded-md transition-colors border border-transparent hover:border-emerald-500/20"
                         >
                           <Edit2 className="h-3.5 w-3.5" />
                         </button>
                         <button 
                           onClick={() => {
                             if (window.confirm("Are you sure you want to delete this TikTok account permanently?")) {
                               deleteAccount(account.id);
                             }
                           }}
                           className="p-1 hover:bg-tiktok-pink/20 text-muted-foreground hover:text-tiktok-pink rounded-md transition-colors border border-transparent hover:border-tiktok-pink/20"
                         >
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                       </div>
                       <div className={cn(
                         "px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest border",
                         account.status === 'active' 
                           ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                           : "bg-tiktok-pink/10 text-tiktok-pink border-tiktok-pink/20"
                       )}>
                         {account.status}
                       </div>
                     </div>
                   </div>

                   <div className="space-y-3 flex-1">
                     <div className="flex flex-col">
                       <h3 className="text-xl font-bold truncate pr-4 text-primary w-[250px]">{account.name}</h3>
                       <p className="text-xs text-muted-foreground font-mono">{account.gmail}</p>
                     </div>
                     
                     <div className="flex flex-col gap-2 pt-1 pb-2">
                       {teamName && (
                         <div className="flex items-center gap-1.5 text-[10px] text-tiktok-cyan uppercase font-bold tracking-widest bg-tiktok-cyan/10 border border-tiktok-cyan/20 px-2.5 py-1 rounded-md w-fit">
                           <Users className="h-3 w-3" />
                           {teamName} Team
                         </div>
                       )}
                       <p className="text-xs text-muted-foreground font-medium">Num: {account.contact_number}</p>
                     </div>

                     {account.status === 'restricted' && (
                       <div className="p-3 bg-secondary/50 border border-tiktok-pink/20 rounded-xl">
                         {isReady ? (
                           <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                             <CheckCircle2 className="h-4 w-4" /> Ready for Live
                           </div>
                         ) : (
                           <div className="flex flex-col gap-1 items-center">
                             <div className="flex items-center gap-1.5 text-tiktok-pink font-mono font-bold text-sm">
                               <Clock className="h-4 w-4" />
                               {diffDays > 0 ? `${diffDays}d ` : ''}{diffHours}h {diffMinutes}m
                             </div>
                             {unbanDate && (
                               <div className="text-[9px] uppercase tracking-widest opacity-70 text-muted-foreground">
                                 Unlocks: {unbanDate.toLocaleDateString()} {unbanDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     )}

                     <div className="pt-2 flex flex-col gap-1.5">
                       <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
                         Gross Revenue Live Base
                         <span className="text-[9px] text-primary/50">₱{Number(account.purchase_price).toLocaleString()} Purchase</span>
                       </label>
                       
                       {/* The intuitive Revenue Input field tied safely to updating the ledger per user spec */}
                       <div className="relative group/input flex items-center">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                           <DollarSign className="h-4 w-4 text-emerald-500 font-bold" />
                         </div>
                         <input 
                           type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }} 
                           step="0.01"
                           placeholder="0.00"
                           className="w-full pl-8 pr-2 py-2 bg-secondary/30 border border-white/5 group-hover/input:border-emerald-500/30 rounded-lg outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm font-mono font-bold text-foreground transition-all shadow-inner"
                           value={account.current_balance || ''}
                           onChange={(e) => updateBalance(account.id, parseFloat(e.target.value) || 0)}
                         />
                       </div>
                     </div>
                   </div>

                   {/* Explicit mathematical withdrawal routing */}
                   <div className="pt-4 mt-auto">
                     <button
                       onClick={() => {
                         setWithdrawAccount(account);
                         setIsWithdrawModalOpen(true);
                       }}
                       disabled={!(account.current_balance && account.current_balance > 0)}
                       className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold shadow-lg shadow-emerald-500/5 hover:bg-emerald-500/20 disabled:opacity-30 disabled:hover:bg-emerald-500/10 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5"
                     >
                       Withdraw Balance <DollarSign className="h-3 w-3" />
                     </button>
                   </div>

                 </div>
               );
            })}
          </div>
        )}
      </div>

      <AddAccountModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingAccount(null); refresh(); }} 
        initialData={editingAccount}
      />
      <ManageTeamsModal 
        isOpen={isTeamsModalOpen} 
        onClose={() => setIsTeamsModalOpen(false)} 
      />
      <ManageGmailsModal
        isOpen={isGmailsModalOpen}
        onClose={() => setIsGmailsModalOpen(false)}
      />
      <WithdrawBalanceModal 
        isOpen={isWithdrawModalOpen}
        onClose={() => { setIsWithdrawModalOpen(false); setWithdrawAccount(null); refresh(); }}
        account={withdrawAccount}
      />
    </div>
  );
}
