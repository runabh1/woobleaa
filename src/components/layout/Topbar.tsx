'use client';

import { useState, useEffect } from 'react';
import { Search, Sun, Moon, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function Topbar() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/records?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-surface/90 backdrop-blur-md">
      <div className="flex items-center px-6 lg:px-8 h-16" style={{ gap: '16px' }}>
        {/* Spacer for mobile menu button */}
        <div className="lg:hidden w-10" />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records by name, owner, category…"
              className="w-full pr-4 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 transition-all shadow-sm"
              style={{ paddingLeft: '40px' }}
              aria-label="Search records"
              id="global-search"
            />
          </div>
        </form>

        <div className="flex items-center ml-auto" style={{ gap: '12px' }}>
          {/* Notification bell */}
          <div className="flex items-center justify-center">
            <NotificationBell />
          </div>

          {/* Quick add */}
          <Link
            href="/records/new"
            className="hidden sm:flex items-center px-5 py-3 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium leading-none transition-all shadow-sm"
            style={{ gap: '8px' }}
            id="topbar-add-record"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </Link>
        </div>
      </div>
    </header>
  );
}
