import { DocRecord, RecordWithStatus, Status } from '@/types';

/**
 * Compute the expiry status for a record.
 * Status is NEVER stored in the database — it is always computed at render time.
 * This ensures the status is always accurate regardless of when the page is loaded.
 *
 * @param record - The record to evaluate
 * @returns The computed status and days until expiry
 */
export function computeStatus(record: DocRecord): { status: Status; days_until_expiry: number } {
  // Use the local date (no timezone offset issues) by parsing as YYYY-MM-DD
  const today = getLocalToday();
  const expiry = parseLocalDate(record.expiry_date);
  const days_until_expiry = differenceInDays(expiry, today);

  let status: Status;
  if (days_until_expiry < 0) {
    status = 'Expired';
  } else if (days_until_expiry <= record.renewal_reminder_days) {
    status = 'Expiring Soon';
  } else {
    status = 'Active';
  }

  return { status, days_until_expiry };
}

/**
 * Enrich a Record with its computed status
 */
export function withStatus(record: DocRecord): RecordWithStatus {
  const { status, days_until_expiry } = computeStatus(record);
  return { ...record, status, days_until_expiry };
}

/**
 * Enrich an array of Records with computed statuses
 */
export function withStatuses(records: DocRecord[]): RecordWithStatus[] {
  return records.map(withStatus);
}

/**
 * Get today's date as a Date object, normalized to midnight local time.
 * This avoids timezone-based "off by one day" bugs.
 */
export function getLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC).
 * Using new Date('2026-07-04') would parse as UTC midnight, which can shift
 * to July 3rd in timezones behind UTC. This function prevents that.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Difference in calendar days between two dates.
 * Positive = future, negative = past.
 */
export function differenceInDays(date: Date, baseDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((date.getTime() - baseDate.getTime()) / msPerDay);
}

/**
 * Format a date string for display (e.g., "04 Jul 2026")
 */
export function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format days until expiry as a human-readable string
 */
export function formatDaysLeft(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days left`;
}

/**
 * Return true if this record should be flagged as critical
 * (high risk + expired or expiring soon)
 */
export function isCritical(record: RecordWithStatus): boolean {
  return record.is_high_risk && (record.status === 'Expired' || record.status === 'Expiring Soon');
}
