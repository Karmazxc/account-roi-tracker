'use client';

import { useState, useEffect } from 'react';
import { supabase, isDemoMode as initialDemoMode } from '@/lib/supabase';

export type Gmail = {
  id: string;
  email: string;
  created_at: string;
};

const MOCK_GMAILS: Gmail[] = [];

export function useGmails() {
  const [gmails, setGmails] = useState<Gmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(initialDemoMode);

  const fetchGmails = async () => {
    try {
      setLoading(true);

      if (!isDemo) {
        const { data, error: sbError } = await supabase
          .from('gmails')
          .select('*')
          .order('created_at', { ascending: false });

        if (sbError) throw sbError;
        setGmails(data || []);
      } else {
        const local = localStorage.getItem('demo_gmails');
        setGmails(local ? JSON.parse(local) : MOCK_GMAILS);
      }
    } catch (err: any) {
      console.warn('Backend unavailable (Gmails), enabling Resilience Failover:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_gmails');
      setGmails(local ? JSON.parse(local) : MOCK_GMAILS);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Gmail[]) => {
    if (isDemo) {
      localStorage.setItem('demo_gmails', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const addGmail = async (item: Omit<Gmail, 'id' | 'created_at'>) => {
    try {
      if (gmails.some(g => g.email.toLowerCase() === item.email.toLowerCase())) {
        throw new Error('This email is already in the pool.');
      }

      if (isDemo) {
        const newGmail = { ...item, id: Math.random().toString(), created_at: new Date().toISOString() } as Gmail;
        const updated = [newGmail, ...gmails];
        setGmails(updated);
        saveLocal(updated);
        return newGmail;
      }

      const { data, error: sbError } = await supabase
        .from('gmails')
        .insert([item])
        .select();

      if (sbError) throw sbError;
      setGmails((prev) => [data[0], ...prev]);
      return data[0];
    } catch (err: any) {
      console.warn('Add failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newGmail = { ...item, id: Math.random().toString(), created_at: new Date().toISOString() } as Gmail;
      const updated = [newGmail, ...gmails];
      setGmails(updated);
      saveLocal(updated);
      return newGmail;
    }
  };

  const deleteGmail = async (id: string) => {
    try {
      if (isDemo) {
        const updated = gmails.filter(g => g.id !== id);
        setGmails(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase.from('gmails').delete().eq('id', id);
      if (sbError) throw sbError;
      setGmails((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      console.warn('Delete failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updated = gmails.filter(g => g.id !== id);
      setGmails(updated);
      saveLocal(updated);
    }
  };

  useEffect(() => {
    fetchGmails();
    const handleUpdate = () => fetchGmails();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { gmails, loading, error, isDemo, addGmail, deleteGmail, refresh: fetchGmails };
}
