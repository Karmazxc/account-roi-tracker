'use client';

import React, { useState } from 'react';
import { X, Loader2, Trash2, Plus, AlertCircle } from 'lucide-react';
import { useGmails } from '@/hooks/useGmails';
import { useAccounts } from '@/hooks/useAccounts';
import { cn } from '@/lib/utils';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ManageGmailsModal({ isOpen, onClose }: Props) {
  const { gmails, loading, addGmail, deleteGmail } = useGmails();
  const { accounts } = useAccounts();
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addGmail({ email: newEmail.trim() });
      setNewEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add Gmail');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Manage Available Gmails</h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-tiktok-pink/10 border border-tiktok-pink/20 rounded-lg flex items-center gap-2 text-tiktok-pink text-xs animate-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="email"
            required
            className="flex-1 px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            placeholder="new.email@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newEmail.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : gmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No gmails available.</p>
              <p className="text-sm">Add one above to get started.</p>
            </div>
          ) : (
            gmails.map((g) => {
              const isLinked = accounts.some(a => a.gmail?.toLowerCase() === g.email?.toLowerCase());

              return (
                <div key={g.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50 group/item">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm">{g.email}</span>
                    <span className={cn(
                      "text-[9px] uppercase font-bold tracking-widest",
                      isLinked ? "text-tiktok-cyan" : "text-emerald-500"
                    )}>
                      {isLinked ? 'Linked to Account' : 'Available'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (isLinked) {
                        alert("This Gmail is currently linked to an active TikTok account. Change the account's Gmail before deleting it from the pool.");
                        return;
                      }
                      deleteGmail(g.id);
                    }}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      isLinked 
                        ? "text-muted-foreground/30 cursor-not-allowed" 
                        : "text-muted-foreground hover:text-tiktok-pink hover:bg-tiktok-pink/10"
                    )}
                    title={isLinked ? "Cannot delete linked Gmail" : "Delete Gmail"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
