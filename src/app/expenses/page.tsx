import React from 'react';
export const dynamic = 'force-dynamic';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';

export const metadata = {
  title: 'Expenses - Live Manager',
};

export default function ExpensesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-tiktok-pink">Premium Expenses Tracking</h1>
        <p className="text-muted-foreground mt-2">Manage all the costs for the weekly/monthly budget and track each person's contribution.</p>
      </div>

      <ExpenseTable />
    </div>
  );
}
