import { CATEGORIES, Category, CSVRow, CreateRecordInput } from '@/types';
import { RecordWithStatus } from '@/types';

/**
 * Parse a CSV string into structured rows.
 * Handles quoted fields, different line endings, and empty rows.
 */
export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? '';
    });

    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

/**
 * Parse a single CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Validate a CSV row and return errors
 */
export interface CSVValidationResult {
  row: number;
  data: CSVRow;
  errors: string[];
  isValid: boolean;
}

export function validateCSVRows(rows: CSVRow[]): CSVValidationResult[] {
  return rows.map((row, idx) => {
    const errors: string[] = [];

    if (!row.name?.trim()) errors.push('Name is required');
    if (!row.owner?.trim()) errors.push('Owner is required');

    const normalizedCategory = normalizeCategory(row.category);
    if (!normalizedCategory) {
      errors.push(`Invalid category "${row.category}". Must be one of: ${CATEGORIES.join(', ')}`);
    }

    if (!row.issue_date?.trim()) {
      errors.push('Issue date is required');
    } else if (!isValidDate(row.issue_date)) {
      errors.push('Issue date must be in YYYY-MM-DD format');
    }

    if (!row.expiry_date?.trim()) {
      errors.push('Expiry date is required');
    } else if (!isValidDate(row.expiry_date)) {
      errors.push('Expiry date must be in YYYY-MM-DD format');
    }

    if (row.issue_date && row.expiry_date && isValidDate(row.issue_date) && isValidDate(row.expiry_date)) {
      if (new Date(row.expiry_date) <= new Date(row.issue_date)) {
        errors.push('Expiry date must be after issue date');
      }
    }

    return {
      row: idx + 2, // 1-indexed, +1 for header row
      data: row,
      errors,
      isValid: errors.length === 0,
    };
  });
}

/**
 * Convert validated CSV rows to CreateRecordInput objects
 */
export function csvRowsToRecords(rows: CSVRow[]): CreateRecordInput[] {
  return rows.map((row) => ({
    name: row.name.trim(),
    category: (normalizeCategory(row.category) as Category) ?? 'Other',
    owner: row.owner.trim(),
    department: row.department?.trim() || undefined,
    issue_date: row.issue_date.trim(),
    expiry_date: row.expiry_date.trim(),
    renewal_reminder_days: row.renewal_reminder_days ? parseInt(row.renewal_reminder_days, 10) : 30,
    notes: row.notes?.trim() || undefined,
    is_high_risk: row.is_high_risk?.toLowerCase() === 'true' || row.is_high_risk === '1',
  }));
}

/**
 * Export records to CSV string
 */
export function exportToCSV(records: RecordWithStatus[]): string {
  const headers = [
    'Name',
    'Category',
    'Owner',
    'Department',
    'Issue Date',
    'Expiry Date',
    'Status',
    'Days Until Expiry',
    'Renewal Reminder Days',
    'High Risk',
    'Notes',
  ];

  const rows = records.map((r) => [
    escapeCsv(r.name),
    escapeCsv(r.category),
    escapeCsv(r.owner),
    escapeCsv(r.department ?? ''),
    r.issue_date,
    r.expiry_date,
    r.status,
    r.days_until_expiry.toString(),
    r.renewal_reminder_days.toString(),
    r.is_high_risk ? 'true' : 'false',
    escapeCsv(r.notes ?? ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Download a CSV string as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a sample CSV template for users to download
 */
export function generateCSVTemplate(): string {
  const headers = 'name,category,owner,department,issue_date,expiry_date,renewal_reminder_days,notes,is_high_risk';
  const example =
    'Vendor Contract with Infosys,Vendor Contract,Ravi Sharma,Procurement,2025-01-01,2026-12-31,30,Annual IT services contract,false';
  return `${headers}\n${example}`;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function normalizeCategory(input: string): string | null {
  if (!input) return null;
  const normalized = input.trim();
  const match = CATEGORIES.find((c) => c.toLowerCase() === normalized.toLowerCase());
  return match ?? null;
}
