'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle,
  TrendingDown,
  Calendar,
  User,
  MoreVertical,
  Loader2,
  Trash2,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { AddExpenseModal } from './AddExpenseModal';

export function ExpenseTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { expenses, loading, togglePayment, deleteExpense, refresh } = useExpenses();

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-tiktok-pink/10 rounded-xl">
            <TrendingDown className="h-6 w-6 text-tiktok-pink" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Monthly Expenses</h2>
            <p className="text-sm text-muted-foreground">Track bills and budget contributions.</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground border border-white/5 rounded-lg hover:bg-secondary/70 transition-all font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
           <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <p>No expenses recorded yet. Start tracking your bills!</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget Provider</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Checklist</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{expense.description}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {expense.date}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-tiktok-pink">
                    ₱{Number(expense.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {expense.budget_provider}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {expense.status.map((person) => (
                        <div 
                          key={person.name} 
                          onClick={() => togglePayment(expense.id, person.name)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border",
                            person.paid 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-secondary/50 text-muted-foreground border-white/5 hover:border-white/20"
                          )}
                        >
                          {person.paid ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          {person.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                       <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this expense permanently?")) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 hover:bg-tiktok-pink/20 text-muted-foreground hover:text-tiktok-pink rounded-lg transition-colors border border-transparent hover:border-tiktok-pink/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingExpense(null); refresh(); }} 
        initialData={editingExpense}
      />
    </div>
  );
}
