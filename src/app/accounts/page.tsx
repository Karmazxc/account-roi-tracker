import React from 'react';
export const dynamic = 'force-dynamic';
import { AccountList } from '@/components/accounts/AccountList';

export const metadata = {
  title: 'TikTok Accounts - Live Manager',
};

export default function AccountsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">TikTok Accounts</h1>
        <p className="text-muted-foreground mt-2">Manage your TikTok accounts, track restrictions, and monitor costs.</p>
      </div>

      <AccountList />
    </div>
  );
}
