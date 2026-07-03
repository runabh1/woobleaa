'use client';

import { useState } from 'react';
import { CATEGORIES, CreateRecordInput, RecordWithStatus } from '@/types';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface RecordFormProps {
  record?: RecordWithStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecordForm({ record, onSuccess, onCancel }: RecordFormProps) {
  const isEdit = !!record;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CreateRecordInput>({
    name: record?.name ?? '',
    category: record?.category ?? 'Vendor Contract',
    owner: record?.owner ?? '',
    department: record?.department ?? '',
    issue_date: record?.issue_date ?? '',
    expiry_date: record?.expiry_date ?? '',
    renewal_reminder_days: record?.renewal_reminder_days ?? 30,
    notes: record?.notes ?? '',
    is_high_risk: record?.is_high_risk ?? false,
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.owner.trim()) e.owner = 'Owner is required';
    if (!form.issue_date) e.issue_date = 'Issue date is required';
    if (!form.expiry_date) e.expiry_date = 'Expiry date is required';
    if (form.issue_date && form.expiry_date && form.expiry_date <= form.issue_date) {
      e.expiry_date = 'Expiry date must be after issue date';
    }
    if (form.renewal_reminder_days !== undefined && (form.renewal_reminder_days < 1 || form.renewal_reminder_days > 365)) {
      e.renewal_reminder_days = 'Must be between 1 and 365 days';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/records/${record.id}` : '/api/records';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, department: form.department || undefined, notes: form.notes || undefined }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      toast.success(isEdit ? 'Record updated!' : 'Record created!');
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof CreateRecordInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="record-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Record Name"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Tata Steel Boiler Inspection Certificate"
            required
            error={errors.name}
            id="record-name"
          />
        </div>
        <Select
          label="Category"
          value={form.category}
          onChange={set('category')}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          required
          id="record-category"
        />
        <Input
          label="Owner / Responsible Person"
          value={form.owner}
          onChange={set('owner')}
          placeholder="e.g. Suresh Mehta"
          required
          error={errors.owner}
          id="record-owner"
        />
        <Input
          label="Department (optional)"
          value={form.department ?? ''}
          onChange={set('department')}
          placeholder="e.g. Plant Operations"
          id="record-department"
        />
        <Input
          label="Reminder Threshold (days)"
          type="number"
          value={form.renewal_reminder_days}
          onChange={(e) => setForm((p) => ({ ...p, renewal_reminder_days: parseInt(e.target.value) || 30 }))}
          min={1}
          max={365}
          error={errors.renewal_reminder_days}
          hint="Records expiring within this window show as 'Expiring Soon'"
          id="record-reminder-days"
        />
        <Input
          label="Issue Date"
          type="date"
          value={form.issue_date}
          onChange={set('issue_date')}
          required
          error={errors.issue_date}
          id="record-issue-date"
        />
        <Input
          label="Expiry Date"
          type="date"
          value={form.expiry_date}
          onChange={set('expiry_date')}
          required
          error={errors.expiry_date}
          id="record-expiry-date"
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Notes (optional)"
            value={form.notes ?? ''}
            onChange={set('notes')}
            placeholder="Add context about this record, renewal process, contacts..."
            id="record-notes"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer group" htmlFor="record-high-risk">
            <div className="relative">
              <input
                id="record-high-risk"
                type="checkbox"
                checked={form.is_high_risk ?? false}
                onChange={(e) => setForm((p) => ({ ...p, is_high_risk: e.target.checked }))}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${form.is_high_risk ? 'bg-red-500 border-red-500' : 'border-white/20 bg-white/5'}`}>
                {form.is_high_risk && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-300">Mark as High Risk</span>
              <p className="text-xs text-slate-500">Flags this record in the Critical Attention panel when expiring</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end pt-2 border-t border-white/8">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} id="record-form-submit">
          {isEdit ? 'Save Changes' : 'Create Record'}
        </Button>
      </div>
    </form>
  );
}
