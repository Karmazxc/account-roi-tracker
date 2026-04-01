'use client';

import { useState, useEffect } from 'react';
import { supabase, isDemoMode as initialDemoMode } from '@/lib/supabase';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  budget_provider: string;
  status: { name: string; paid: boolean }[];
  date: string;
  created_at: string;
};

const MOCK_EXPENSES: Expense[] = [];

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(initialDemoMode);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      if (!isDemo) {
        const { data, error: sbError } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });

        if (sbError) throw sbError;
        setExpenses(data || []);
      } else {
        const local = localStorage.getItem('demo_expenses');
        setExpenses(local ? JSON.parse(local) : MOCK_EXPENSES);
      }
    } catch (err: any) {
      console.warn('Backend unavailable (Expenses), enabling Resilience Failover:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_expenses');
      setExpenses(local ? JSON.parse(local) : MOCK_EXPENSES);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Expense[]) => {
    if (isDemo) {
      localStorage.setItem('demo_expenses', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    try {
      if (isDemo) {
        const newExp = { ...expense, id: Math.random().toString(), created_at: new Date().toISOString() };
        const updated = [newExp, ...expenses];
        setExpenses(updated);
        saveLocal(updated);
        return newExp;
      }

      const { data, error: sbError } = await supabase
        .from('expenses')
        .insert([expense])
        .select();

      if (sbError) throw sbError;
      setExpenses((prev) => [data[0], ...prev]);
      return data[0];
    } catch (err: any) {
      console.warn('Add failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newExp = { ...expense, id: Math.random().toString(), created_at: new Date().toISOString() };
      const updated = [newExp, ...expenses];
      setExpenses(updated);
      saveLocal(updated);
      return newExp;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id' | 'created_at'>>) => {
    try {
      if (isDemo) {
        const updatedExpenses = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
        setExpenses(updatedExpenses);
        saveLocal(updatedExpenses);
        return;
      }

      const { error: sbError } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id);

      if (sbError) throw sbError;
      setExpenses((prev) => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    } catch (err: any) {
      console.warn('Update failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updatedExpenses = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
      setExpenses(updatedExpenses);
      saveLocal(updatedExpenses);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (isDemo) {
        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase.from('expenses').delete().eq('id', id);
      if (sbError) throw sbError;
      setExpenses((prev) => prev.filter((e) => (e.id !== id)));
    } catch (err: any) {
      console.warn('Delete failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      saveLocal(updated);
    }
  };

  const togglePayment = async (id: string, personName: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    const updatedStatus = expense.status.map((p) =>
      p.name === personName ? { ...p, paid: !p.paid } : p
    );

    try {
      if (isDemo) {
        const updated = expenses.map(e => (e.id === id ? { ...e, status: updatedStatus } : e));
        setExpenses(updated);
        saveLocal(updated);
        return;
      }

      const { data, error: sbError } = await supabase
        .from('expenses')
        .update({ status: updatedStatus })
        .eq('id', id)
        .select();

      if (sbError) throw sbError;
      setExpenses((prev) => prev.map((e) => (e.id === id ? data[0] : e)));
    } catch (err: any) {
      console.warn('Update failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updated = expenses.map(e => (e.id === id ? { ...e, status: updatedStatus } : e));
      setExpenses(updated);
      saveLocal(updated);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const handleUpdate = () => fetchExpenses();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { expenses, loading, error, isDemo, addExpense, updateExpense, deleteExpense, togglePayment, refresh: fetchExpenses };
}
