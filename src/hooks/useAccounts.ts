'use client';

import { useState, useEffect } from 'react';
import { supabase, isDemoMode as initialDemoMode } from '@/lib/supabase';

export type Account = {
  id: string;
  name: string;
  gmail: string;
  contact_number: string;
  purchase_price: number;
  current_balance?: number;
  team_id?: string;
  status: 'active' | 'restricted';
  unban_date?: string | null;
  created_at: string;
};

const MOCK_ACCOUNTS: Account[] = [];

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(initialDemoMode);

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      if (!isDemo) {
        const { data, error: sbError } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (sbError) throw sbError;
        setAccounts(data || []);
      } else {
        const local = localStorage.getItem('demo_accounts');
        setAccounts(local ? JSON.parse(local) : MOCK_ACCOUNTS);
      }
    } catch (err: any) {
      console.warn('Backend unavailable (Accounts), enabling Resilience Failover:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_accounts');
      setAccounts(local ? JSON.parse(local) : MOCK_ACCOUNTS);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Account[]) => {
    if (isDemo) {
      localStorage.setItem('demo_accounts', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const updateBalance = async (id: string, newBalance: number) => {
    try {
      if (isDemo) {
        const updated = accounts.map(a => a.id === id ? { ...a, current_balance: newBalance } : a);
        setAccounts(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase
        .from('accounts')
        .update({ current_balance: newBalance })
        .eq('id', id);

      if (sbError) throw sbError;
      setAccounts((prev) => prev.map(a => a.id === id ? { ...a, current_balance: newBalance } : a));
    } catch (err: any) {
      console.warn('Update balance failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updated = accounts.map(a => a.id === id ? { ...a, current_balance: newBalance } : a);
      setAccounts(updated);
      saveLocal(updated);
    }
  };

  const addAccount = async (account: Omit<Account, 'id' | 'created_at'>) => {
    try {
      if (isDemo) {
        const newAcc = { ...account, id: Math.random().toString(), created_at: new Date().toISOString() } as Account;
        const updated = [newAcc, ...accounts];
        setAccounts(updated);
        saveLocal(updated);
        return newAcc;
      }

      const { data, error: sbError } = await supabase
        .from('accounts')
        .insert([account])
        .select();

      if (sbError) throw sbError;
      setAccounts((prev) => [data[0], ...prev]);
      return data[0];
    } catch (err: any) {
      console.warn('Add failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newAcc = { ...account, id: Math.random().toString(), created_at: new Date().toISOString() } as Account;
      const updated = [newAcc, ...accounts];
      setAccounts(updated);
      saveLocal(updated);
      return newAcc;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Omit<Account, 'id' | 'created_at'>>) => {
    try {
      if (isDemo) {
        const updatedAccounts = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
        setAccounts(updatedAccounts);
        saveLocal(updatedAccounts);
        return;
      }

      const { error: sbError } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id);

      if (sbError) throw sbError;
      setAccounts((prev) => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (err: any) {
      console.warn('Update failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updatedAccounts = accounts.map(a => a.id === id ? { ...a, ...updates } : a);
      setAccounts(updatedAccounts);
      saveLocal(updatedAccounts);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      if (isDemo) {
        const updated = accounts.filter(a => a.id !== id);
        setAccounts(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase.from('accounts').delete().eq('id', id);
      if (sbError) throw sbError;
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.warn('Delete failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updated = accounts.filter(a => a.id !== id);
      setAccounts(updated);
      saveLocal(updated);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const handleUpdate = () => fetchAccounts();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { accounts, loading, error, isDemo, addAccount, updateAccount, deleteAccount, updateBalance, refresh: fetchAccounts };
}
