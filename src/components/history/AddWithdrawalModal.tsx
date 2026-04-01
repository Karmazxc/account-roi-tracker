'use client';

import React, { useState } from 'react';
import { X, Loader2, DollarSign } from 'lucide-react';
import { useWithdrawals } from '@/hooks/useWithdrawals';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
};

export function AddWithdrawalModal({ isOpen, onClose, availableBalance }: Props) {
  const { addWithdrawal } = useWithdrawals();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount > availableBalance) {
      alert("Invalid withdrawal amount or insufficient balance.");
      return;
    }

    setLoading(true);
    try {
      await addWithdrawal({
        amount: numericAmount,
        notes: referenceId,
        date: new Date().toISOString()
      });
      onClose();
      setAmount('');
      setReferenceId('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-tiktok-cyan/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-tiktok-cyan" />
          </div>
          <h2 className="text-xl font-bold">New Withdrawal</h2>
        </div>

        <div className="mb-6 p-4 bg-secondary/30 rounded-xl border border-white/5">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Available to Withdraw</p>
          <p className="text-2xl font-mono font-bold text-tiktok-cyan">${availableBalance.toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Amount (USD)</label>
            <input
              required
              type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
              step="0.01"
              max={availableBalance}
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-tiktok-cyan/50 transition-all text-lg font-mono"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Reference ID (Optional)</label>
            <input
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-tiktok-cyan/50 transition-all"
              placeholder="TXN_XXXXXX"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full mt-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
}
