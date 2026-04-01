'use client';

import { useState, useEffect } from 'react';
import { supabase, isDemoMode as initialDemoMode } from '@/lib/supabase';

export type Earning = {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
};

const MOCK_EARNINGS: Earning[] = [];

export function useEarnings() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(initialDemoMode);

  const fetchEarnings = async () => {
    try {
      setLoading(true);

      if (!isDemo) {
        const { data, error: sbError } = await supabase
          .from('earnings')
          .select('*')
          .order('date', { ascending: false });

        if (sbError) throw sbError;
        setEarnings(data || []);
      } else {
        const local = localStorage.getItem('demo_earnings');
        setEarnings(local ? JSON.parse(local) : MOCK_EARNINGS);
      }
    } catch (err: any) {
      console.warn('Backend unavailable (Earnings), enabling Resilience Failover:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_earnings');
      setEarnings(local ? JSON.parse(local) : MOCK_EARNINGS);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Earning[]) => {
    if (isDemo) {
      localStorage.setItem('demo_earnings', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const addEarning = async (earning: Omit<Earning, 'id' | 'created_at'>) => {
    try {
      if (isDemo) {
        const newEarning = { ...earning, id: Math.random().toString(), created_at: new Date().toISOString() };
        const updated = [newEarning, ...earnings];
        setEarnings(updated);
        saveLocal(updated);
        return newEarning;
      }

      const { data, error: sbError } = await supabase
        .from('earnings')
        .insert([earning])
        .select();

      if (sbError) throw sbError;
      setEarnings((prev) => [data[0], ...prev]);
      return data[0];
    } catch (err: any) {
      console.warn('Add failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newEarning = { ...earning, id: Math.random().toString(), created_at: new Date().toISOString() };
      const updated = [newEarning, ...earnings];
      setEarnings(updated);
      saveLocal(updated);
      return newEarning;
    }
  };

  useEffect(() => {
    fetchEarnings();
    const handleUpdate = () => fetchEarnings();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { earnings, loading, error, isDemo, addEarning, refresh: fetchEarnings };
}
