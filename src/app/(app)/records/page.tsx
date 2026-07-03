'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit,
  Eye,
} from 'lucide-react';
import { RecordWithStatus, CATEGORIES, Status } from '@/types';
import { StatusBadge, CategoryBadge, HighRiskBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDaysLeft, isCritical } from '@/lib/utils/expiry';
import { exportToCSV, downloadCSV, generateCSVTemplate } from '@/lib/utils/csv';
import { RecordForm } from '@/components/records/RecordForm';
import { CSVImportModal } from '@/components/records/CSVImportModal';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

type SortKey = 'name' | 'category' | 'owner' | 'expiry_date' | 'days_until_expiry' | 'status';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'Active' },
  { label: 'Expiring Soon', value: 'Expiring Soon' },
  { label: 'Expired', value: 'Expired' },
];

function RecordsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [records, setRecords] = useState<RecordWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('days_until_expiry');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRecord, setEditRecord] = useState<RecordWithStatus | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await fetch(`/api/records?${params}`);
      const { records: data } = await res.json();
      setRecords(data ?? []);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = statusFilter === 'all'
    ? records
    : records.filter((r) => r.status === statusFilter);

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
    else if (sortKey === 'owner') cmp = a.owner.localeCompare(b.owner);
    else if (sortKey === 'expiry_date') cmp = a.expiry_date.localeCompare(b.expiry_date);
    else if (sortKey === 'days_until_expiry') cmp = a.days_until_expiry - b.days_until_expiry;
    else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : null;

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Record deleted');
      setDeleteId(null);
      fetchRecords();
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    setDeleting(true);
    try {
      await Promise.all(ids.map((id) => fetch(`/api/records/${id}`, { method: 'DELETE' })));
      toast.success(`${ids.length} records deleted`);
      setSelected(new Set());
      fetchRecords();
    } catch {
      toast.error('Some deletions failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const csv = exportToCSV(sorted);
    downloadCSV(csv, `records-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Exported successfully');
  };

  return (
    <div className="animate-fade-in max-w-screen-xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div className="glass-card p-6 border-b-0 rounded-b-none border-x-0 sm:border-x sm:rounded-b-2xl mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Records Directory</h1>
            <p className="text-sm text-slate-400 mt-1">{sorted.length} records found {statusFilter !== 'all' ? `in ${statusFilter}` : 'total'}</p>
          </div>
          <div className="flex items-center flex-wrap" style={{ gap: '10px' }}>
            {selected.size > 0 && (
              <Button variant="danger" onClick={handleBulkDelete} loading={deleting} id="bulk-delete-btn" className="shadow-lg shadow-red-500/20">
                <Trash2 className="h-4 w-4" />
                Delete {selected.size}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowImport(true)} id="import-csv-btn">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="secondary" onClick={handleExport} id="export-csv-btn">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddModal(true)} id="add-record-btn" className="glow-brand">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-col lg:flex-row px-1" style={{ gap: '16px' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, owner, or department…"
            className="w-full pr-4 py-2.5 text-sm rounded-md bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all shadow-sm"
            style={{ paddingLeft: '40px' }}
            id="records-search"
          />
        </div>
        <div className="flex items-center flex-wrap overflow-x-auto pb-2 lg:pb-0 hide-scrollbar" style={{ gap: '12px' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'text-xs px-4 py-2 rounded-md font-semibold transition-all border whitespace-nowrap shadow-sm',
                statusFilter === f.value
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                  : 'text-slate-400 border-white/10 bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.07]'
              )}
              id={`status-filter-${f.value.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {f.label}
            </button>
          ))}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-4 py-2 rounded-md bg-white/[0.03] border border-white/10 font-semibold text-slate-300 focus:outline-none focus:border-brand-500/50 cursor-pointer shadow-sm"
            style={{ marginLeft: '8px' }}
            id="category-filter-select"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden" style={{ marginTop: '24px' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }} id="records-table">
            <thead>
              <tr>
                <th className="w-12 px-6 py-4 border-b border-white/10 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === sorted.length && sorted.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? new Set(sorted.map((r) => r.id)) : new Set())}
                    className="rounded border-white/20 bg-white/5 accent-brand-500"
                    aria-label="Select all records"
                  />
                </th>
                {(['name', 'category', 'owner', 'expiry_date', 'days_until_expiry', 'status'] as SortKey[]).map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 border-b border-white/10 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.replace(/_/g, ' ')}
                      <SortIcon col={col} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 border-b border-white/10 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
                : sorted.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                      No records found. Try adjusting your filters.
                    </td>
                  </tr>
                )
                : sorted.map((r) => {
                  const tdClass = cn("px-6 py-5 border-y border-white/10 transition-colors shadow-sm", selected.has(r.id) ? "bg-brand-500/10" : "bg-white/[0.03] group-hover:bg-white/[0.06]");
                  return (
                  <tr
                    key={r.id}
                    className="group"
                    id={`record-row-${r.id}`}
                  >
                    <td className={cn(tdClass, "rounded-l-md border-l", isCritical(r) ? "border-l-4 border-l-red-500/50" : "border-l-white/10")}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-white/20 bg-white/5 accent-brand-500"
                        aria-label={`Select ${r.name}`}
                      />
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-semibold text-white truncate max-w-52 group-hover:text-brand-300 transition-colors leading-snug">{r.name}</span>
                        {r.is_high_risk && <HighRiskBadge />}
                      </div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">{r.department || '—'}</p>
                    </td>
                    <td className={tdClass}><CategoryBadge category={r.category} /></td>
                    <td className={cn(tdClass, "text-sm text-slate-300 whitespace-nowrap")}>{r.owner}</td>
                    <td className={cn(tdClass, "text-sm text-slate-300 whitespace-nowrap")}>{formatDate(r.expiry_date)}</td>
                    <td className={tdClass}>
                      <span className={cn('text-sm font-semibold tabular-nums', r.days_until_expiry < 0 ? 'text-red-400' : r.days_until_expiry <= 30 ? 'text-amber-400' : 'text-slate-300')}>
                        {formatDaysLeft(r.days_until_expiry)}
                      </span>
                    </td>
                    <td className={tdClass}><StatusBadge status={r.status} animated /></td>
                    <td className={cn(tdClass, "rounded-r-md border-r border-r-white/10")}>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/records/${r.id}`} className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label={`View ${r.name}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setEditRecord(r)} className="p-2 rounded-md text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all" aria-label={`Edit ${r.name}`}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(r.id)} className="p-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" aria-label={`Delete ${r.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modals */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Record" size="lg">
        <RecordForm onSuccess={() => { setShowAddModal(false); fetchRecords(); }} onCancel={() => setShowAddModal(false)} />
      </Modal>
      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title="Edit Record" size="lg">
        {editRecord && (
          <RecordForm record={editRecord} onSuccess={() => { setEditRecord(null); fetchRecords(); }} onCancel={() => setEditRecord(null)} />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Record" size="sm">
        <p className="text-slate-300 text-sm mb-6">This will permanently delete this record and its audit history. This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)} loading={deleting} id="confirm-delete-btn">Delete</Button>
        </div>
      </Modal>

      {/* CSV Import */}
      <CSVImportModal open={showImport} onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); fetchRecords(); }} />
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <RecordsPageContent />
    </Suspense>
  );
}
