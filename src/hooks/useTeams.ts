import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '@/lib/supabase';

export type TeamMember = {
  name: string;
  split_percentage: number;
};

export type Team = {
  id: string;
  name: string;
  members: TeamMember[];
  created_at: string;
};

const MOCK_TEAMS: Team[] = [];

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoMode);

  const fetchTeams = async () => {
    try {
      if (isDemo) {
        const local = localStorage.getItem('demo_teams');
        setTeams(local ? JSON.parse(local) : MOCK_TEAMS);
        return;
      }

      const { data, error: sbError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      setTeams(data || []);
    } catch (err: any) {
      console.warn('Teams fetch failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const local = localStorage.getItem('demo_teams');
      setTeams(local ? JSON.parse(local) : MOCK_TEAMS);
    } finally {
      setLoading(false);
    }
  };

  const saveLocal = (data: Team[]) => {
    if (isDemo) {
      localStorage.setItem('demo_teams', JSON.stringify(data));
      window.dispatchEvent(new Event('dashboard_update'));
    }
  };

  const addTeam = async (name: string, members: TeamMember[]) => {
    try {
      if (isDemo) {
        const newTeam: Team = {
          id: `demo-team-${Date.now()}`,
          name,
          members,
          created_at: new Date().toISOString()
        };
        const updated = [newTeam, ...teams];
        setTeams(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase
        .from('teams')
        .insert([{ name, members }]);

      if (sbError) throw sbError;
      fetchTeams();
    } catch (err: any) {
      console.warn('Add team failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const newTeam: Team = {
        id: `demo-team-${Date.now()}`,
        name,
        members,
        created_at: new Date().toISOString()
      };
      const updated = [newTeam, ...teams];
      setTeams(updated);
      saveLocal(updated);
    }
  };

  const updateTeam = async (id: string, name: string, members: TeamMember[]) => {
    try {
      if (isDemo) {
        const updatedTeams = teams.map(t => t.id === id ? { ...t, name, members } : t);
        setTeams(updatedTeams);
        saveLocal(updatedTeams);
        return;
      }

      const { error: sbError } = await supabase
        .from('teams')
        .update({ name, members })
        .eq('id', id);

      if (sbError) throw sbError;
      setTeams((prev) => prev.map(t => t.id === id ? { ...t, name, members } : t));
    } catch (err: any) {
      console.warn('Update team failed, falling back to local storage:', err.message);
      setIsDemo(true);
      const updatedTeams = teams.map(t => t.id === id ? { ...t, name, members } : t);
      setTeams(updatedTeams);
      saveLocal(updatedTeams);
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      if (isDemo) {
        const updated = teams.filter(t => t.id !== id);
        setTeams(updated);
        saveLocal(updated);
        return;
      }

      const { error: sbError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (sbError) throw sbError;
      setTeams((prev) => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.warn('Delete team failed, falling back to local:', err.message);
      setIsDemo(true);
      const updated = teams.filter(t => t.id !== id);
      setTeams(updated);
      saveLocal(updated);
    }
  };

  useEffect(() => {
    fetchTeams();
    const handleUpdate = () => fetchTeams();
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, [isDemo]);

  return { teams, loading, error, isDemo, addTeam, updateTeam, deleteTeam, refresh: fetchTeams };
}
