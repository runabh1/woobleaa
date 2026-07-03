'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/records', label: 'Directory', icon: FileText },
];

const quickFilters = [
  { href: '/records?status=Expired', label: 'Expired', icon: AlertTriangle, color: 'text-red-400' },
  { href: '/records?status=Expiring+Soon', label: 'Expiring Soon', icon: Clock, color: 'text-amber-400' },
  { href: '/records?status=Active', label: 'Active', icon: CheckCircle, color: 'text-green-400' },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-white/5 bg-surface-card" id="sidebar" style={{ height: '100vh' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-500/10 border border-brand-500/20">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">NeverExpire</p>
              <p className="text-[9px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">Enterprise</p>
            </div>
          </div>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto py-8 px-4 min-h-0" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Main Menu */}
          <div>
            <p className="px-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest" style={{ marginBottom: '16px' }}>Main Menu</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all group',
                      active
                        ? 'bg-brand-500/15 text-brand-300'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                    id={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400')} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="h-3 w-3 opacity-40" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Filters */}
          <div>
            <p className="px-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest" style={{ marginBottom: '16px' }}>Quick Filters</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickFilters.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <item.icon className={cn('h-4 w-4 flex-shrink-0', item.color)} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer — always pinned to bottom, never overlaps */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-white/5 flex flex-col gap-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left"
            id="sidebar-signout"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
          <div className="rounded-md px-3 py-2.5 bg-white/[0.03] border border-white/5">
            <p className="text-[10px] font-semibold text-slate-400">Wooble Challenge '26</p>
            <p className="text-[9px] text-slate-600 mt-0.5">Expiry Alert Dashboard</p>
          </div>
        </div>
      </aside>
    </>
  );
}
