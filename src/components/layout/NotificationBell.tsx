'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertTriangle, Clock } from 'lucide-react';
import { RecordWithStatus } from '@/types';
import { formatDaysLeft } from '@/lib/utils/expiry';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [urgentRecords, setUrgentRecords] = useState<RecordWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/records')
      .then((r) => r.json())
      .then(({ records }) => {
        const urgent = (records as RecordWithStatus[]).filter(
          (r) => r.status === 'Expired' || (r.status === 'Expiring Soon' && r.days_until_expiry <= 7)
        );
        setUrgentRecords(urgent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const count = urgentRecords.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative h-9 w-9 rounded-md border flex items-center justify-center transition-all',
          open
            ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
        )}
        aria-label={`Notifications — ${count} urgent items`}
        id="notification-bell"
      >
        <Bell className="h-4.5 w-4.5" style={{ height: '18px', width: '18px' }} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center critical-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-md border border-white/10 shadow-2xl z-50 animate-slide-up overflow-hidden" style={{ background: '#1a1a2e' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div>
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="text-xs text-slate-500">{count} items need attention</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
            ) : urgentRecords.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">All clear! No urgent items.</p>
              </div>
            ) : (
              urgentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/records/${record.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  {record.status === 'Expired' ? (
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{record.name}</p>
                    <p className="text-xs text-slate-400">{record.category}</p>
                    <p className={cn('text-xs font-medium mt-0.5', record.status === 'Expired' ? 'text-red-400' : 'text-amber-400')}>
                      {formatDaysLeft(record.days_until_expiry)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {urgentRecords.length > 0 && (
            <div className="px-4 py-3 border-t border-white/8">
              <Link
                href="/records?status=Expiring+Soon"
                onClick={() => setOpen(false)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                View all urgent records →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
