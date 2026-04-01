'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileCode, 
  Wallet, 
  History, 
  Settings,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDemoMode } from '@/lib/supabase';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'TikTok Accounts', href: '/accounts', icon: Users },
  { name: 'Scripts', href: '/scripts', icon: FileCode },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'ROI Tracker', href: '/roi', icon: TrendingUp },
  { name: 'History', href: '/history', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border/50">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <span className="text-xl font-bold bg-gradient-to-r from-tiktok-pink to-tiktok-cyan bg-clip-text text-transparent">
          TT Live Manager
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,45,85,0.1)]' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              {item.name}
            </Link>
          );
        })}
      </div>
      {isDemoMode && (
        <div className="mx-3 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-[10px] tracking-widest mb-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Demo Mode Active
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Using experimental mock data. Connect Supabase to persist your business records.
          </p>
        </div>
      )}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Settings className="h-5 w-5" />
          Settings
        </div>
      </div>
    </div>
  );
}
