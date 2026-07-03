'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Building,
  FileText,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { RecordWithHistory } from '@/types';
import { StatusBadge, CategoryBadge, HighRiskBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { RecordForm } from '@/components/records/RecordForm';
import { formatDate, formatDaysLeft } from '@/lib/utils/expiry';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

interface RenewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recordId: string;
  recordName: string;
}

function RenewModal({ open, onClose, onSuccess, recordId, recordName }: RenewModalProps) {
  const [newIssueDate, setNewIssueDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleRenew = async () => {
    if (!newIssueDate || !newExpiryDate) {
      setError('Both dates are required');
      return;
    }
    if (newExpiryDate <= newIssueDate) {
      setError('Expiry date must be after issue date');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/records/${recordId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_issue_date: newIssueDate, new_expiry_date: newExpiryDate, notes }),
      });
      if (!res.ok) {
        const { error: e } = await res.json();
        throw new Error(e);
      }
      toast.success('Record marked as renewed!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Renewal failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mark as Renewed" description={`Update the dates for "${recordName}"`} size="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-500/20 px-4 py-3 text-sm text-slate-400" style={{ background: 'rgba(99,102,241,0.05)' }}>
          This will update the issue and expiry dates and log a renewal event in the audit trail.
        </div>
        <Input
          label="New Issue Date"
          type="date"
          value={newIssueDate}
          onChange={(e) => { setNewIssueDate(e.target.value); setError(''); }}
          required
          id="renew-issue-date"
        />
        <Input
          label="New Expiry Date"
          type="date"
          value={newExpiryDate}
          onChange={(e) => { setNewExpiryDate(e.target.value); setError(''); }}
          required
          id="renew-expiry-date"
        />
        <Textarea
          label="Renewal Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Renewed by vendor, new contract signed on 2026-07-04"
          id="renew-notes"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRenew} loading={saving} id="confirm-renew-btn">
            <CheckCircle className="h-3.5 w-3.5" />
            Confirm Renewal
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'text-green-400' },
  updated: { label: 'Updated', color: 'text-blue-400' },
  renewed: { label: 'Renewed', color: 'text-brand-400' },
  deleted: { label: 'Deleted', color: 'text-red-400' },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <div className="text-sm text-white">{value}</div>
      </div>
    </div>
  );
}

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [record, setRecord] = useState<RecordWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/records/${id}`);
      if (!res.ok) { router.push('/records'); return; }
      const { record } = await res.json();
      setRecord(record);
    } catch {
      toast.error('Failed to load record');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const handleDelete = async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await fetch(`/api/records/${record.id}`, { method: 'DELETE' });
      toast.success('Record deleted');
      router.push('/records');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  const getReminderEmailHref = () => {
    if (!record) return '#';
    const subject = encodeURIComponent(`Action Required: ${record.name} — Renewal Needed`);
    const body = encodeURIComponent(
      `Hi ${record.owner},\n\nThis is a reminder that the following record requires your attention:\n\n` +
      `Record: ${record.name}\n` +
      `Category: ${record.category}\n` +
      `Expiry Date: ${formatDate(record.expiry_date)}\n` +
      `Status: ${record.status}\n` +
      `Days Until Expiry: ${formatDaysLeft(record.days_until_expiry)}\n\n` +
      `Please initiate the renewal process at your earliest convenience to avoid any operational disruption.\n\n` +
      `This message was generated by NeverExpire — Enterprise Document Expiry Tracker.`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
          <div className="glass-card p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const daysLeft = record.days_until_expiry;
  const statusColor = record.status === 'Active' ? 'text-green-400' : record.status === 'Expiring Soon' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back + Header */}
      <div className="glass-card p-6 border-b-0 rounded-b-none border-x-0 sm:border-x sm:rounded-b-2xl mb-6">
        
        <Link href="/records" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-brand-300 transition-colors mb-4 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{record.name}</h1>
              {record.is_high_risk && <HighRiskBadge />}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={record.status} size="md" animated />
              <div className="h-1 w-1 rounded-full bg-slate-600" />
              <CategoryBadge category={record.category} />
              <div className="h-1 w-1 rounded-full bg-slate-600" />
              <span className={cn('text-sm font-semibold tracking-wide', statusColor)}>
                {formatDaysLeft(daysLeft)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" onClick={() => setShowEdit(true)} id="edit-record-btn" className="bg-white/5 hover:bg-white/10 border-white/10">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDelete(true)} id="delete-record-btn" className="shadow-lg shadow-red-500/20">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Record details */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white mb-2">Record Details</h2>
            <InfoRow icon={User} label="Owner" value={record.owner} />
            {record.department && <InfoRow icon={Building} label="Department" value={record.department} />}
            <InfoRow icon={Calendar} label="Issue Date" value={formatDate(record.issue_date)} />
            <InfoRow icon={Calendar} label="Expiry Date" value={
              <span className={daysLeft < 0 ? 'text-red-400' : daysLeft <= 30 ? 'text-amber-400' : 'text-white'}>
                {formatDate(record.expiry_date)}
              </span>
            } />
            <InfoRow icon={Clock} label="Reminder Threshold" value={`${record.renewal_reminder_days} days before expiry`} />
            <InfoRow icon={Shield} label="Risk Level" value={record.is_high_risk ? <span className="text-red-400">High Risk</span> : <span className="text-slate-400">Standard</span>} />
            {record.notes && <InfoRow icon={FileText} label="Notes" value={<span className="text-slate-300 whitespace-pre-wrap text-xs leading-relaxed">{record.notes}</span>} />}
          </div>

          {/* Audit Trail */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Audit Trail</h2>
            {record.history.length === 0 ? (
              <p className="text-sm text-slate-500">No history yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/8" />
                <div className="space-y-4">
                  {record.history.map((entry) => {
                    const config = ACTION_LABELS[entry.action] ?? { label: entry.action, color: 'text-slate-400' };
                    return (
                      <div key={entry.id} className="relative flex items-start gap-4 pl-8">
                        <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-white/10 flex items-center justify-center" style={{ background: '#1a1a2e' }}>
                          <div className={cn('h-1.5 w-1.5 rounded-full', entry.action === 'created' ? 'bg-green-400' : entry.action === 'renewed' ? 'bg-brand-400' : entry.action === 'deleted' ? 'bg-red-400' : 'bg-blue-400')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
                            {entry.changed_by && <span className="text-xs text-slate-500">by {entry.changed_by}</span>}
                          </div>
                          {entry.action === 'renewed' && entry.metadata && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {(entry.metadata as Record<string, string>).previous_expiry_date} → {(entry.metadata as Record<string, string>).new_expiry_date}
                            </p>
                          )}
                          {entry.action === 'updated' && entry.metadata && Object.keys((entry.metadata as Record<string, unknown>).changes ?? {}).length > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {Object.keys((entry.metadata as Record<string, unknown>).changes as Record<string, unknown>).join(', ')} changed
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-0.5">
                            {new Date(entry.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div className="space-y-5">
          {/* Status summary card */}
          <div className={cn(
            'rounded-2xl border p-6 relative overflow-hidden group',
            record.status === 'Expired' ? 'border-red-500/30' : record.status === 'Expiring Soon' ? 'border-amber-500/30' : 'border-green-500/30'
          )} style={{ background: record.status === 'Expired' ? 'rgba(239,68,68,0.05)' : record.status === 'Expiring Soon' ? 'rgba(245,158,11,0.05)' : 'rgba(34,197,94,0.05)' }}>
            <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">Status Overview</p>
            <p className={cn('text-4xl font-bold mb-1 tabular-nums', statusColor)}>
              {Math.abs(daysLeft)}
            </p>
            <p className="text-sm text-slate-400 font-medium">
              {daysLeft < 0 ? 'days overdue' : daysLeft === 0 ? 'expires today' : 'days remaining'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Actions</p>
            <Button
              className="w-full justify-start"
              onClick={() => setShowRenew(true)}
              id="mark-renewed-btn"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Mark as Renewed
            </Button>
            <a
              href={getReminderEmailHref()}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-all"
              id="send-reminder-btn"
            >
              <Mail className="h-3.5 w-3.5" />
              Send Reminder Email
            </a>
            <Button variant="secondary" className="w-full justify-start" onClick={() => setShowEdit(true)}>
              <Edit className="h-3.5 w-3.5" />
              Edit Record
            </Button>
            <Button variant="danger" className="w-full justify-start" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete Record
            </Button>
          </div>

          {/* Meta */}
          <div className="glass-card p-4 text-xs text-slate-500 space-y-1.5">
            <p>Created: {new Date(record.created_at).toLocaleDateString('en-IN')}</p>
            <p>Updated: {new Date(record.updated_at).toLocaleDateString('en-IN')}</p>
            <p className="font-mono text-slate-600 break-all">ID: {record.id}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Record" size="lg">
        <RecordForm record={record} onSuccess={() => { setShowEdit(false); fetchRecord(); }} onCancel={() => setShowEdit(false)} />
      </Modal>
      <RenewModal open={showRenew} onClose={() => setShowRenew(false)} onSuccess={fetchRecord} recordId={record.id} recordName={record.name} />
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Record" size="sm">
        <p className="text-sm text-slate-300 mb-6">Permanently delete <strong className="text-white">{record.name}</strong> and all its history?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} id="confirm-delete-detail-btn">Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
