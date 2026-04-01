'use client';

import React, { useState } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useExpenses, Expense } from '@/hooks/useExpenses';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Expense | null;
};

export function AddExpenseModal({ isOpen, onClose }: Props) {
  const { addExpense } = useExpenses();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    budget_provider: 'Shared',
    status: [
      { name: 'Mark', paid: false },
      { name: 'Kram', paid: false },
      { name: 'Krem', paid: false },
    ],
    date: new Date().toISOString().split('T')[0],
  });
  const [newPerson, setNewPerson] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addExpense(formData);
      onClose();
      setFormData({
        description: '',
        amount: 0,
        budget_provider: 'Shared',
        status: [
          { name: 'Mark', paid: false },
          { name: 'Kram', paid: false },
          { name: 'Krem', paid: false },
        ],
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePerson = (name: string) => {
    const exists = formData.status.some((p) => p.name === name);
    if (exists) {
      setFormData({
        ...formData,
        status: formData.status.filter((p) => p.name !== name),
      });
    } else {
      setFormData({
        ...formData,
        status: [...formData.status, { name, paid: false }],
      });
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

        <h2 className="text-xl font-bold mb-6 text-tiktok-pink">Add Expense Entry</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <input
              required
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-tiktok-pink/50 transition-all"
              placeholder="e.g. Starlink Bill"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Amount (PHP)</label>
              <input
                required
                type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-tiktok-pink/50 transition-all"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-tiktok-pink/50 transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Budget Provider</label>
            <input
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-tiktok-pink/50 transition-all"
              placeholder="e.g. Shared or Name"
              value={formData.budget_provider}
              onChange={(e) => setFormData({ ...formData, budget_provider: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Contributors (Checklist)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.status.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-lg border border-white/5 text-xs font-medium"
                >
                  {p.name}
                  <button type="button" onClick={() => togglePerson(p.name)} className="text-muted-foreground hover:text-tiktok-pink">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1 bg-secondary/30 border border-border/50 rounded-md text-xs outline-none"
                placeholder="Add person..."
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newPerson) {
                      togglePerson(newPerson);
                      setNewPerson('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => { if (newPerson) { togglePerson(newPerson); setNewPerson(''); } }}
                className="p-1 px-2 bg-secondary rounded-md text-xs border border-white/5"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2 bg-tiktok-pink text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-tiktok-pink/20 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Record PHP Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
