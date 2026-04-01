'use client';

import { useState, useEffect } from 'react';
import { supabase, isDemoMode as initialDemoMode } from '@/lib/supabase';

export type Script = {
  id: string;
  name: string;
  buyer: string;
  price: number;
  team_id?: string;
  cost_splits?: { name: string; amount: number }[];
  expiry_date: string;
  created_at: string;
};

const MOCK_SCRIPTS: Script[] = [];

export function useScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(initialDemoMode);

  const fetchScripts = async () => {
    try {
      setLoading(true);

      if (!isDemo) {
        const { data, error: sbError } = await supabase
          .from('scripts')
          .select('*')
          .order('expiry_date', { ascending: true });

        if (sbError) throw sbError;
        setScripts(data || []);
      } else {
        const local = localStorage.getItem('demo_scripts');
        setScripts(local ? JSON.parse(local) : MOCK_SCRIPTS);
      }
    } catch (err: any) {
      console.warn('Backend unavailable (Scripts), enabling Resilience Failover:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_scripts');
      setScripts(local ? JSON.parse(local) : MOCK_SCRIPTS);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Script[]) => {
    if (isDemo) {
      localStorage.setItem('demo_scripts', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const addScript = async (script: Omit<Script, 'id' | 'created_at'>) => {
    try {
      if (isDemo) {
        const newScript = { ...script, id: Math.random().toString(), created_at: new Date().toISOString() };
        const updated = [...scripts, newScript];
        setScripts(updated);
        saveLocal(updated);
        return newScript;
      }

      const { data, error: sbError } = await supabase
        .from('scripts')
        .insert([script])
        .select();

      if (sbError) throw sbError;
      setScripts((prev) => [...prev, data[0]]);
      return data[0];
    } catch (err: any) {
      console.warn('Add failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newScript = { ...script, id: Math.random().toString(), created_at: new Date().toISOString() };
      const updated = [...scripts, newScript];
      setScripts(updated);
      saveLocal(updated);
      return newScript;
    }
  };

  const updateScript = async (id: string, updates: Partial<Omit<Script, 'id' | 'created_at'>>) => {
    try {
      if (isDemo) {
        const updatedScripts = scripts.map(s => s.id === id ? { ...s, ...updates } : s);
        setScripts(updatedScripts);
        saveLocal(updatedScripts);
        return;
      }

      const { error: sbError } = await supabase
        .from('scripts')
        .update(updates)
        .eq('id', id);

      if (sbError) throw sbError;
      setScripts((prev) => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err: any) {
      console.warn('Update failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updatedScripts = scripts.map(s => s.id === id ? { ...s, ...updates } : s);
      setScripts(updatedScripts);
      saveLocal(updatedScripts);
    }
  };

  const deleteScript = async (id: string) => {
    try {
      if (isDemo) {
        const updated = scripts.filter(s => s.id !== id);
        setScripts(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase.from('scripts').delete().eq('id', id);
      if (sbError) throw sbError;
      setScripts((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      console.warn('Delete failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updated = scripts.filter(s => s.id !== id);
      setScripts(updated);
      saveLocal(updated);
    }
  };

  useEffect(() => {
    fetchScripts();
    const handleUpdate = () => fetchScripts();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { scripts, loading, error, isDemo, addScript, updateScript, deleteScript, refresh: fetchScripts };
}
