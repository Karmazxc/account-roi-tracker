'use client';

import { useState, useEffect } from 'react';
import { supabase, isDemoMode as initialDemoMode } from '@/lib/supabase';

export type Withdrawal = {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
};

const MOCK_WITHDRAWALS: Withdrawal[] = [];

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(initialDemoMode);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);

      if (!isDemo) {
        const { data, error: sbError } = await supabase
          .from('withdrawals')
          .select('*')
          .order('date', { ascending: false });

        if (sbError) throw sbError;
        setWithdrawals(data || []);
      } else {
        const local = localStorage.getItem('demo_withdrawals');
        setWithdrawals(local ? JSON.parse(local) : MOCK_WITHDRAWALS);
      }
    } catch (err: any) {
      console.warn('Backend unavailable (Withdrawals), enabling Resilience Failover:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_withdrawals');
      setWithdrawals(local ? JSON.parse(local) : MOCK_WITHDRAWALS);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Withdrawal[]) => {
    if (isDemo) {
      localStorage.setItem('demo_withdrawals', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const addWithdrawal = async (withdrawal: Omit<Withdrawal, 'id' | 'created_at'>) => {
    try {
      if (isDemo) {
        const newWithdrawal = { ...withdrawal, id: Math.random().toString(), created_at: new Date().toISOString() };
        const updated = [newWithdrawal, ...withdrawals];
        setWithdrawals(updated);
        saveLocal(updated);
        return newWithdrawal;
      }

      const { data, error: sbError } = await supabase
        .from('withdrawals')
        .insert([withdrawal])
        .select();

      if (sbError) throw sbError;
      setWithdrawals((prev) => [data[0], ...prev]);
      return data[0];
    } catch (err: any) {
      console.warn('Add failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newWithdrawal = { ...withdrawal, id: Math.random().toString(), created_at: new Date().toISOString() };
      const updated = [newWithdrawal, ...withdrawals];
      setWithdrawals(updated);
      saveLocal(updated);
      return newWithdrawal;
    }
  };

  const deleteWithdrawal = async (id: string) => {
    try {
      if (isDemo) {
        const updated = withdrawals.filter(w => w.id !== id);
        setWithdrawals(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase
        .from('withdrawals')
        .delete()
        .eq('id', id);

      if (sbError) throw sbError;
      setWithdrawals((prev) => prev.filter(w => w.id !== id));
      window.dispatchEvent(new Event('dashboard_update'));
    } catch (err: any) {
      console.error('Delete failed:', err.message);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    const handleUpdate = () => fetchWithdrawals();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { withdrawals, loading, error, isDemo, addWithdrawal, deleteWithdrawal, refresh: fetchWithdrawals };
}
