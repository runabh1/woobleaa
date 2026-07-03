'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Clock, CheckCircle, FileText,
  RefreshCw, Download, ChevronRight, Zap,
  TrendingUp, Activity,
} from 'lucide-react';
import { RecordWithStatus, DashboardStats, CategoryStat, CATEGORIES } from '@/types';
import { formatDate, formatDaysLeft, isCritical } from '@/lib/utils/expiry';
import { StatusBadge, HighRiskBadge } from '@/components/ui/Badge';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { exportToCSV, downloadCSV } from '@/lib/utils/csv';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  href: string;
  description: string;
}

function StatCard({ label, value, icon: Icon, colorClass, href, description }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn('glass-card hover-lift block group', colorClass)}
      id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ borderRadius: '6px' }}
    >
      <div style={{ padding: '24px 24px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div style={{ height: '32px', width: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.07)' }}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-4xl font-bold text-white tabular-nums" style={{ lineHeight: 1, marginBottom: '12px' }}>{value}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

/** Compact row for "Action Needed" — single-column vertical list */
function ActionRow({ r }: { r: RecordWithStatus }) {
  return (
    <Link
      href={`/records/${r.id}`}
      className="flex items-center gap-5 px-6 py-5 hover:bg-white/[0.03] transition-colors group border-b border-white/5 last:border-0"
    >
      {/* Status dot */}
      <div className={cn(
        'h-2.5 w-2.5 rounded-full shrink-0 mt-0.5',
        r.status === 'Expired' ? 'bg-red-400' : 'bg-amber-400'
      )} />

      {/* Name + category */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors leading-snug">
          {r.name}
        </p>
        <p className="text-xs text-slate-500 truncate">{r.category} · {r.owner}</p>
      </div>

      {/* Risk + status + days — always right-aligned */}
      <div className="flex items-center gap-4 shrink-0">
        {isCritical(r) && <HighRiskBadge />}
        <StatusBadge status={r.status} size="sm" />
        <p className={cn(
          'text-xs font-bold tabular-nums w-28 text-right',
          r.days_until_expiry < 0 ? 'text-red-400' : 'text-amber-400'
        )}>
          {formatDaysLeft(r.days_until_expiry)}
        </p>
        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [records, setRecords] = useState<RecordWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<30 | 60 | 90>(30);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      const { records } = await res.json();
      setRecords(records ?? []);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      toast.success('Demo data loaded! 20 enterprise records added.');
      await fetchRecords();
    } catch {
      toast.error('Failed to load demo data');
    } finally {
      setSeeding(false);
    }
  };

  const handleExport = () => {
    downloadCSV(exportToCSV(filtered), `neverexpire-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Exported to CSV');
  };

  const filtered = categoryFilter === 'all' ? records : records.filter(r => r.category === categoryFilter);

  const stats: DashboardStats = {
    total: filtered.length,
    active: filtered.filter(r => r.status === 'Active').length,
    expiring_soon: filtered.filter(r => r.status === 'Expiring Soon').length,
    expired: filtered.filter(r => r.status === 'Expired').length,
  };

  const categoryStats: CategoryStat[] = CATEGORIES.map(cat => {
    const cr = records.filter(r => r.category === cat);
    return {
      category: cat,
      count: cr.length,
      active: cr.filter(r => r.status === 'Active').length,
      expiring_soon: cr.filter(r => r.status === 'Expiring Soon').length,
      expired: cr.filter(r => r.status === 'Expired').length,
    };
  }).filter(s => s.count > 0);

  const actionNeeded = filtered
    .filter(r => r.status === 'Expired' || r.status === 'Expiring Soon')
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry);

  const upcomingRenewals = filtered
    .filter(r => r.status === 'Active' && r.days_until_expiry <= timelineFilter)
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry);

  const TOP_N = 4;
  const topActionNeeded = actionNeeded.slice(0, TOP_N);
  const remainingCount = actionNeeded.length - TOP_N;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-screen-xl mx-auto animate-fade-in">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {records.length === 0 ? 'Welcome to NeverExpire' : 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleExport} id="dashboard-export-btn">
              <Download className="h-3.5 w-3.5" />Export
            </Button>
          )}
          {records.length === 0 && (
            <Button size="sm" onClick={handleSeed} loading={seeding} id="seed-demo-btn">
              <Zap className="h-3.5 w-3.5" />Load Demo Data
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={fetchRecords} id="dashboard-refresh-btn" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Empty State ─── */}
      {records.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto bg-brand-500/10 border border-brand-500/20">
              <ShieldCheck className="h-10 w-10 text-brand-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your compliance dashboard is ready</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Load demo data to see how enterprise document tracking works — with records from Tata Steel, KPMG, Adani, and 5 other companies.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleSeed} loading={seeding} id="empty-seed-btn">
              <Zap className="h-4 w-4" />
              Load Demo Data (20 records)
            </Button>
            <Link href="/records/new">
              <Button variant="secondary">Add First Record</Button>
            </Link>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* ─── 4 Stat Cards ─── */}
          <section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <StatCard
                label="Total Records" value={stats.total} icon={FileText}
                colorClass="stat-brand text-brand-400"
                href="/records" description="All tracked documents"
              />
              <StatCard
                label="Active" value={stats.active} icon={CheckCircle}
                colorClass="stat-active text-green-400"
                href="/records?status=Active" description="Valid & up to date"
              />
              <StatCard
                label="Expiring Soon" value={stats.expiring_soon} icon={Clock}
                colorClass="stat-warning text-amber-400"
                href="/records?status=Expiring+Soon" description="Needs renewal action"
              />
              <StatCard
                label="Expired" value={stats.expired} icon={AlertTriangle}
                colorClass="stat-danger text-red-400"
                href="/records?status=Expired" description="Overdue — act now"
              />
            </div>
          </section>

          {/* ─── Action Needed: Top 4 only ─── */}
          {actionNeeded.length > 0 && (
            <section>
              <div className="glass-card overflow-hidden border-l-[3px] border-l-red-500/70">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-red-400 shrink-0" />
                    <div>
                      <h2 className="text-sm font-bold text-white">Action Needed</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {actionNeeded.length} record{actionNeeded.length !== 1 ? 's' : ''} need attention · sorted by urgency
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/records?status=Expired"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Top 4 rows */}
                <div className="divide-y divide-white/5">
                  {topActionNeeded.map(r => <ActionRow key={r.id} r={r} />)}
                </div>

                {/* "View remaining" footer */}
                {remainingCount > 0 && (
                  <Link
                    href="/records?status=Expired"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.03] transition-colors border-t border-white/5"
                    id="action-needed-view-all"
                  >
                    <span>View {remainingCount} more record{remainingCount !== 1 ? 's' : ''}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* ═══ SCAN ZONE (2-10 sec) ═══ */}

          {/* ─── Category Filter ─── */}
          <section>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Filter by category</p>
            <div className="flex items-center flex-wrap gap-2">
              {['all', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'text-xs px-4 py-2 rounded-md font-semibold transition-all border whitespace-nowrap',
                    categoryFilter === cat
                      ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                      : 'text-slate-400 border-white/10 bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.07]'
                  )}
                  id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </section>

          {/* ─── Charts Row ─── */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 glass-card p-6">
                <h2 className="text-sm font-bold text-white mb-1">Status Distribution</h2>
                <p className="text-xs text-slate-500 mb-5">Overall document health</p>
                <StatusDonutChart stats={stats} />
              </div>
              <div className="lg:col-span-3 glass-card p-6">
                <h2 className="text-sm font-bold text-white mb-1">Records by Category</h2>
                <p className="text-xs text-slate-500 mb-5">Breakdown across document types</p>
                <CategoryBarChart data={categoryStats} />
              </div>
            </div>
          </section>

          {/* ═══ DIG ZONE (on demand) ═══ */}

          {/* ─── Renewal Runway ─── */}
          <section>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-400" />
                    Renewal Runway
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Active records expiring within this window</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-surface-elevated p-1">
                  {([30, 60, 90] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setTimelineFilter(d)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-md font-semibold transition-all',
                        timelineFilter === d
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {upcomingRenewals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">Clear Runway</p>
                  <p className="text-xs text-slate-500 mt-1">No renewals required in the next {timelineFilter} days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingRenewals.map((r) => (
                    <Link
                      key={r.id}
                      href={`/records/${r.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-white/5 hover:border-brand-500/30 transition-colors group"
                    >
                      {/* Days pill */}
                      <div className="shrink-0 w-16 text-center py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
                        <p className="text-lg font-bold text-brand-300 tabular-nums leading-none">{r.days_until_expiry}</p>
                        <p className="text-[10px] text-brand-400/70 font-semibold mt-0.5">days</p>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-brand-300 transition-colors">{r.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{r.owner} · {r.category}</p>
                      </div>
                      {/* Date */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-slate-300">{formatDate(r.expiry_date)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">expiry date</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

// Local import for empty state icon
function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
