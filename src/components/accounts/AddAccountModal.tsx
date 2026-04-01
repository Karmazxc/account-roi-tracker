'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useTeams } from '@/hooks/useTeams';
import { useGmails } from '@/hooks/useGmails';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Account | null;
};

export function AddAccountModal({ isOpen, onClose, initialData }: Props) {
  const { accounts, addAccount, updateAccount } = useAccounts();
  const { teams } = useTeams();
  const { gmails } = useGmails();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gmail: '',
    contact_number: '',
    purchase_price: 0,
    team_id: '',
    status: 'active' as 'active' | 'restricted',
    unban_days: 0,
    unban_hours: 0,
    unban_minutes: 0,
  });

  useEffect(() => {
    if (initialData && isOpen) {
      let days = 0, hours = 0, minutes = 0;
      if (initialData.unban_date) {
        const diff = new Date(initialData.unban_date).getTime() - new Date().getTime();
        if (diff > 0) {
          days = Math.floor(diff / (1000 * 60 * 60 * 24));
          hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          minutes = Math.floor((diff / 1000 / 60) % 60);
        }
      }
      setFormData({
        name: initialData.name || '',
        gmail: initialData.gmail || '',
        contact_number: initialData.contact_number || '',
        purchase_price: Number(initialData.purchase_price) || 0,
        team_id: initialData.team_id || '',
        status: initialData.status,
        unban_days: days,
        unban_hours: hours,
        unban_minutes: minutes,
      });
    } else if (!initialData && isOpen) {
      setFormData({
        name: '',
        gmail: '',
        contact_number: '',
        purchase_price: 0,
        team_id: '',
        status: 'active',
        unban_days: 0,
        unban_hours: 0,
        unban_minutes: 0,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let unban_date = null;
      if (formData.status === 'restricted') {
        const now = new Date();
        unban_date = new Date(now.getTime() + (formData.unban_days * 24 * 60 * 60 * 1000) + (formData.unban_hours * 60 * 60 * 1000) + (formData.unban_minutes * 60 * 1000)).toISOString();
      }

      const payload = {
        name: formData.name,
        gmail: formData.gmail,
        contact_number: formData.contact_number,
        purchase_price: formData.purchase_price,
        team_id: formData.team_id || undefined,
        status: formData.status,
        unban_date,
      };

      if (initialData) {
        await updateAccount(initialData.id, payload);
      } else {
        await addAccount(payload);
      }
      
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">{initialData ? 'Edit TikTok Account' : 'Add New TikTok Account'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Account Name</label>
            <input
              required
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              placeholder="e.g. TikTok_Main_01"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Gmail Address</label>
            <select
              required
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              value={formData.gmail}
              onChange={(e) => setFormData({ ...formData, gmail: e.target.value })}
            >
              <option value="" disabled>Select a Gmail Address</option>
              {gmails
                .filter(g => {
                  const isLinkedToOther = accounts.some(a => 
                    a.id !== initialData?.id && 
                    a.gmail?.toLowerCase() === g.email?.toLowerCase()
                  );
                  return !isLinkedToOther;
                })
                .map(g => (
                <option key={g.id} value={g.email}>{g.email}</option>
              ))}
              {initialData && initialData.gmail && !gmails.find(g => g.email?.toLowerCase() === initialData.gmail?.toLowerCase()) && (
                 <option value={initialData.gmail}>{initialData.gmail} (Not in pool)</option>
              )}
            </select>
            {gmails.length === 0 && (
              <div className="flex items-center gap-2 mt-1.5 p-2 bg-tiktok-cyan/5 border border-tiktok-cyan/20 rounded-md text-[10px] text-tiktok-cyan font-bold uppercase tracking-wider animate-pulse">
                <AlertCircle className="h-3.5 w-3.5" />
                No Gmails available! Add them via "Manage Gmails" first.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Contact Number</label>
            <input
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              placeholder="+63 9XX XXX XXXX"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Assigned Team / Group</label>
            <select
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
            >
              <option value="">No Team (Global)</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.members.map(m => m.name).join(', ')})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Purchase Price (PHP)</label>
              <input
                type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                step="0.01"
                className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Account Status</label>
              <select
                className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'restricted' })}
              >
                <option value="active">Active</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          {formData.status === 'restricted' && (
            <div className="p-4 bg-tiktok-pink/5 border border-tiktok-pink/20 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-bold text-tiktok-pink uppercase tracking-widest">Unban Duration</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Days</label>
                  <input
                    type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    className="w-full px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-tiktok-pink/50 font-mono text-sm"
                    placeholder="0"
                    value={formData.unban_days}
                    onChange={(e) => setFormData({ ...formData, unban_days: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Hours</label>
                  <input
                    type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    className="w-full px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-tiktok-pink/50 font-mono text-sm"
                    placeholder="0"
                    value={formData.unban_hours}
                    onChange={(e) => setFormData({ ...formData, unban_hours: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Mins</label>
                  <input
                    type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    max="59"
                    className="w-full px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-tiktok-pink/50 font-mono text-sm"
                    placeholder="0"
                    value={formData.unban_minutes}
                    onChange={(e) => setFormData({ ...formData, unban_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : initialData ? 'Save Changes' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
