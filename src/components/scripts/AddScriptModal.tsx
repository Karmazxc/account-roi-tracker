'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Users } from 'lucide-react';
import { useScripts, Script } from '@/hooks/useScripts';
import { useTeams } from '@/hooks/useTeams';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Script | null;
};

export function AddScriptModal({ isOpen, onClose, initialData }: Props) {
  const { addScript, updateScript } = useScripts();
  const { teams } = useTeams();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    team_id: '',
    days_duration: 30,
    hours_duration: 0,
    minutes_duration: 0,
  });

  const [costSplits, setCostSplits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData && isOpen) {
      let days = 0, hours = 0, minutes = 0;
      if (initialData.expiry_date) {
        const diff = new Date(initialData.expiry_date).getTime() - new Date().getTime();
        if (diff > 0) {
          days = Math.floor(diff / (1000 * 60 * 60 * 24));
          hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          minutes = Math.floor((diff / 1000 / 60) % 60);
        }
      }
      
      setFormData({
        name: initialData.name,
        price: initialData.price,
        team_id: initialData.team_id || '',
        days_duration: days,
        hours_duration: hours,
        minutes_duration: minutes,
      });

      const parsedSplits: Record<string, number> = {};
      if (initialData.cost_splits) {
        initialData.cost_splits.forEach(cs => {
          parsedSplits[cs.name] = Number(cs.amount);
        });
      }
      setCostSplits(parsedSplits);
    } else if (!initialData && isOpen) {
      setFormData({
        name: '',
        price: 0,
        team_id: '',
        days_duration: 30,
        hours_duration: 0,
        minutes_duration: 0,
      });
      setCostSplits({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const team_id = e.target.value;
    setFormData({ ...formData, team_id });
    
    const team = teams.find(t => t.id === team_id);
    if (team) {
      const newSplits: Record<string, number> = {};
      team.members.forEach(m => {
        newSplits[m.name] = 0;
      });
      setCostSplits(newSplits);
    } else {
      setCostSplits({});
    }
  };

  const handleSplitChange = (name: string, amount: number) => {
    setCostSplits(prev => ({ ...prev, [name]: amount }));
  };

  const currentSplitTotal = Object.values(costSplits).reduce((sum, val) => sum + (val || 0), 0);
  const selectedTeamDetails = teams.find(t => t.id === formData.team_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      const expiry = new Date(now.getTime() + (formData.days_duration * 24 * 60 * 60 * 1000) + (formData.hours_duration * 60 * 60 * 1000) + (formData.minutes_duration * 60 * 1000));
      
      const mappedSplits = Object.keys(costSplits).map(name => ({
        name,
        amount: costSplits[name]
      }));

      const scriptData = {
        name: formData.name,
        buyer: selectedTeamDetails ? selectedTeamDetails.name : 'Unknown System Team',
        price: formData.price,
        team_id: formData.team_id,
        cost_splits: mappedSplits,
        expiry_date: expiry.toISOString(),
      };

      if (initialData) {
        await updateScript(initialData.id, scriptData);
      } else {
        await addScript(scriptData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 my-8">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">{initialData ? 'Edit Script Configuration' : 'Register New Script'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Script Name</label>
            <input
              required
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              placeholder="e.g. TikTok Automation V4"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Assign Team / Pool</label>
            <select
              required
              className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={formData.team_id}
              onChange={handleTeamChange}
            >
              <option value="" disabled>Select a Team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Total Script Price (PHP)</label>
              <input
                required
                type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                step="0.01"
                className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-primary font-bold"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {formData.team_id && selectedTeamDetails && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Team Contributor Split</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Total: {currentSplitTotal} / {formData.price}</span>
                </div>
                
                <div className="space-y-2">
                  {selectedTeamDetails.members.map(member => (
                    <div key={member.name} className="flex flex-col gap-1">
                       <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{member.name}</label>
                       <div className="flex items-center gap-2 group">
                         <span className="text-sm font-mono text-primary font-bold group-focus-within:text-glow">₱</span>
                         <input
                           type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                           step="0.01"
                           className="w-full px-3 py-1 bg-transparent border-b border-white/10 focus:border-primary/50 outline-none text-sm font-mono transition-all"
                           placeholder="0.00"
                           value={costSplits[member.name] || ''}
                           onChange={(e) => handleSplitChange(member.name, parseFloat(e.target.value) || 0)}
                         />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">License Duration</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Days</label>
                  <input
                    required
                    type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    className="w-full px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary/50 font-mono text-sm"
                    placeholder="30"
                    value={formData.days_duration}
                    onChange={(e) => setFormData({ ...formData, days_duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Hours</label>
                  <input
                    required
                    type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    className="w-full px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary/50 font-mono text-sm"
                    placeholder="0"
                    value={formData.hours_duration}
                    onChange={(e) => setFormData({ ...formData, hours_duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Mins</label>
                  <input
                    required
                    type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                    max="59"
                    className="w-full px-3 py-1.5 bg-secondary/50 border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary/50 font-mono text-sm"
                    placeholder="0"
                    value={formData.minutes_duration}
                    onChange={(e) => setFormData({ ...formData, minutes_duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.team_id}
            className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : initialData ? 'Save Changes' : 'Register Script'}
          </button>
        </form>
      </div>
    </div>
  );
}
