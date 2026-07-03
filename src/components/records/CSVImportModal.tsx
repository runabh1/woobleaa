'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { generateCSVTemplate, downloadCSV } from '@/lib/utils/csv';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportError {
  row: number;
  errors: string[];
}

export function CSVImportModal({ open, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setImportErrors([]);
    setImportedCount(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    setFile(f);
    setImportErrors([]);
    setImportedCount(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setImportErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/records/bulk-import', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.status === 422) {
        setImportErrors(data.invalid_rows ?? []);
        toast.error(`${data.invalid_rows?.length} row(s) have validation errors`);
        return;
      }
      if (!res.ok) throw new Error(data.error);

      setImportedCount(data.imported);
      toast.success(`${data.imported} records imported successfully!`);
      setTimeout(() => { handleClose(); onSuccess(); }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Records from CSV" description="Upload a CSV file to bulk-import records." size="lg">
      <div className="space-y-4">
        {/* Template download */}
        <div className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3" style={{ background: 'rgba(99,102,241,0.05)' }}>
          <div>
            <p className="text-sm font-medium text-white">Download CSV Template</p>
            <p className="text-xs text-slate-500">Use this template to format your data correctly</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCSV(generateCSVTemplate(), 'neverexpire-template.csv')}
            id="download-template-btn"
          >
            <Download className="h-3.5 w-3.5" />
            Template
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
            dragging ? 'border-brand-500/60 bg-brand-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/3'
          )}
          id="csv-drop-zone"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            id="csv-file-input"
          />
          <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
          {file ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-brand-400" />
                <span className="text-sm font-medium text-white">{file.name}</span>
              </div>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-white mb-1">Drop your CSV file here</p>
              <p className="text-xs text-slate-500">or click to browse · .csv files only</p>
            </div>
          )}
        </div>

        {/* Required columns */}
        <div className="rounded-xl border border-white/8 p-4 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-400 mb-2">Required columns:</p>
          <div className="grid grid-cols-2 gap-1">
            {['name', 'category', 'owner', 'issue_date (YYYY-MM-DD)', 'expiry_date (YYYY-MM-DD)'].map((col) => (
              <div key={col} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-brand-400" />
                <code className="font-mono">{col}</code>
              </div>
            ))}
          </div>
          <p className="mt-2 text-slate-600">Optional: department, renewal_reminder_days, notes, is_high_risk</p>
        </div>

        {/* Errors */}
        {importErrors.length > 0 && (
          <div className="rounded-xl border border-red-500/20 p-4 max-h-40 overflow-y-auto" style={{ background: 'rgba(239,68,68,0.05)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm font-medium text-red-400">{importErrors.length} row(s) have errors</p>
            </div>
            {importErrors.map((e) => (
              <div key={e.row} className="text-xs text-slate-400 mb-1">
                <span className="text-red-400 font-medium">Row {e.row}:</span> {e.errors.join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* Success */}
        {importedCount !== null && (
          <div className="rounded-xl border border-green-500/20 p-4 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.05)' }}>
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-400 font-medium">{importedCount} records imported successfully!</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file} loading={uploading} id="import-submit-btn">
            <Upload className="h-3.5 w-3.5" />
            Import Records
          </Button>
        </div>
      </div>
    </Modal>
  );
}
