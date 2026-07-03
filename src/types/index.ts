export type Category =
  | 'Vendor Contract'
  | 'Compliance Certificate'
  | 'Safety Training'
  | 'Insurance Policy'
  | 'Inspection Report'
  | 'Government License'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Vendor Contract',
  'Compliance Certificate',
  'Safety Training',
  'Insurance Policy',
  'Inspection Report',
  'Government License',
  'Other',
];

export type Status = 'Active' | 'Expiring Soon' | 'Expired';

export type AuditAction = 'created' | 'updated' | 'renewed' | 'deleted';

export interface AuditEntry {
  id: string;
  record_id: string;
  action: AuditAction;
  changed_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** A business record in the database (no computed fields) */
export interface DocRecord {
  id: string;
  name: string;
  category: Category;
  owner: string;
  department: string | null;
  issue_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  renewal_reminder_days: number;
  notes: string | null;
  attachment_url: string | null;
  is_high_risk: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecordWithStatus extends DocRecord {
  status: Status;
  days_until_expiry: number; // negative = already expired
}

export interface RecordWithHistory extends RecordWithStatus {
  history: AuditEntry[];
}

export interface CreateRecordInput {
  name: string;
  category: Category;
  owner: string;
  department?: string;
  issue_date: string;
  expiry_date: string;
  renewal_reminder_days?: number;
  notes?: string;
  attachment_url?: string;
  is_high_risk?: boolean;
}

export interface UpdateRecordInput extends Partial<CreateRecordInput> {}

export interface RenewRecordInput {
  new_issue_date: string;
  new_expiry_date: string;
  notes?: string;
  renewed_by?: string;
}

export interface DashboardStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
}

export interface CategoryStat {
  category: Category;
  count: number;
  active: number;
  expiring_soon: number;
  expired: number;
}

export interface CSVRow {
  name: string;
  category: string;
  owner: string;
  department?: string;
  issue_date: string;
  expiry_date: string;
  renewal_reminder_days?: string;
  notes?: string;
  is_high_risk?: string;
}
