'use client';

import React, { useState } from 'react';
import { X, Loader2, Users, Plus, Trash2, PieChart, Edit2 } from 'lucide-react';
import { useTeams, TeamMember } from '@/hooks/useTeams';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ManageTeamsModal({ isOpen, onClose }: Props) {
  const { teams, loading, addTeam, updateTeam, deleteTeam } = useTeams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  
  const [newTeamName, setNewTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([
    { name: '', split_percentage: 100 }
  ]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    setMembers([...members, { name: '', split_percentage: 0 }]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string | number) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const totalSplit = members.reduce((sum, m) => sum + (Number(m.split_percentage) || 0), 0);
  const isSplitValid = totalSplit === 100;

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSplitValid || !newTeamName.trim()) return;
    
    // Ensure no empty names
    if (members.some(m => !m.name.trim())) {
      alert("All members must have a name!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTeamId) {
        await updateTeam(editingTeamId, newTeamName, members);
        setEditingTeamId(null);
      } else {
        await addTeam(newTeamName, members);
      }
      setNewTeamName('');
      setMembers([{ name: '', split_percentage: 100 }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setNewTeamName('');
    setMembers([{ name: '', split_percentage: 100 }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-2xl p-6 relative animate-in fade-in zoom-in duration-200 my-8">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Manage Profit Teams</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create New Team Form */}
          <div className="space-y-4">
            <h3 className="font-bold border-b border-white/10 pb-2 text-sm uppercase tracking-widest text-muted-foreground">
              {editingTeamId ? 'Update Existing Team' : 'Register New Team'}
            </h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Team Identity</label>
                <input
                  required
                  placeholder="e.g. Master Branch, Team Alpha"
                  className="w-full px-4 py-2 bg-secondary/50 border border-border/50 rounded-lg outline-none focus:border-primary/50 transition-all font-medium"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <PieChart className="h-3 w-3" />
                    Member Allocations
                  </label>
                  <span className={`text-xs font-mono font-bold ${isSplitValid ? 'text-emerald-400' : 'text-tiktok-pink'}`}>
                    {totalSplit}% / 100%
                  </span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                  {members.map((member, i) => (
                    <div key={i} className="flex items-center gap-2 w-full">
                      <input
                        required
                        placeholder="Name (e.g. Kram)"
                        className="w-[50%] min-w-0 px-3 py-1.5 bg-secondary border border-border/50 rounded-md outline-none focus:border-primary/50 text-sm transition-all"
                        value={member.name}
                        onChange={(e) => handleMemberChange(i, 'name', e.target.value)}
                      />
                      <div className="relative w-[30%] min-w-0 shrink-0">
                        <input
                          required
                          type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                          step="0.01"
                          placeholder="%"
                          className="w-full pl-3 pr-8 py-1.5 bg-secondary border border-border/50 rounded-md outline-none focus:border-primary/50 text-sm font-mono transition-all"
                          value={member.split_percentage}
                          onChange={(e) => handleMemberChange(i, 'split_percentage', parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold pointer-events-none">%</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveMember(i)}
                        disabled={members.length === 1}
                        className="p-1.5 hover:bg-tiktok-pink/20 text-muted-foreground hover:text-tiktok-pink rounded-md transition-colors disabled:opacity-30 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-2 border border-dashed border-white/20 rounded-md text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5 hover:bg-secondary/50 hover:text-foreground transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Add Person
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !isSplitValid || !newTeamName.trim()}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest text-xs flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTeamId ? 'Update Team' : 'Create Team Group'}
                </button>
                {editingTeamId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-secondary border border-white/10 text-muted-foreground rounded-lg font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Active Teams List */}
          <div className="space-y-4">
            <h3 className="font-bold border-b border-white/10 pb-2 text-sm uppercase tracking-widest text-muted-foreground">Active Teams</h3>
            
            <div className="space-y-3 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
              ) : teams.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-white/5 rounded-xl">
                  No active teams found.
                </div>
              ) : (
                 teams.map(team => (
                  <div key={team.id} className="p-3 bg-secondary/30 border border-white/5 rounded-xl group relative">
                     <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                          onClick={() => {
                            setEditingTeamId(team.id);
                            setNewTeamName(team.name);
                            setMembers(team.members);
                          }}
                          className="p-1 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                       >
                          <Edit2 className="h-3.5 w-3.5" />
                       </button>
                       <button
                          onClick={() => {
                            if (window.confirm("Delete this team? This might un-assign existing accounts from the team.")) {
                              deleteTeam(team.id);
                            }
                          }}
                          className="p-1 text-muted-foreground hover:text-tiktok-pink hover:bg-tiktok-pink/10 rounded transition-colors"
                       >
                          <Trash2 className="h-3.5 w-3.5" />
                       </button>
                     </div>
                     <h4 className="font-bold text-primary mb-2 flex items-center gap-1.5 text-sm">
                       {team.name}
                     </h4>
                     <div className="flex flex-wrap gap-1.5">
                       {team.members.map(m => (
                         <div key={m.name} className="px-2 py-0.5 bg-secondary rounded-md text-[10px] font-mono whitespace-nowrap">
                           <span className="text-muted-foreground">{m.name}: </span>
                           <span className="text-emerald-400 font-bold">{m.split_percentage}%</span>
                         </div>
                       ))}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
