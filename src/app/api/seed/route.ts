import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SEED_RECORDS = [
  // EXPIRED
  {
    name: 'Vedanta Environmental Compliance License',
    category: 'Government License',
    owner: 'Rajesh Kumar',
    department: 'EHS & Sustainability',
    issue_date: '2025-07-01',
    expiry_date: '2026-06-30',
    renewal_reminder_days: 60,
    notes: 'State Pollution Control Board license. Renewal requires fresh environmental impact assessment.',
    is_high_risk: true,
  },
  {
    name: 'Reliance Industries Fire Safety Certificate',
    category: 'Compliance Certificate',
    owner: 'Priya Sharma',
    department: 'Safety & Compliance',
    issue_date: '2025-01-15',
    expiry_date: '2026-06-25',
    renewal_reminder_days: 30,
    notes: 'Factory-level fire NOC from local fire department. Must be renewed before operations resume.',
    is_high_risk: true,
  },
  {
    name: 'PwC Machine Inspection Report',
    category: 'Inspection Report',
    owner: 'Ankit Verma',
    department: 'Facilities',
    issue_date: '2025-07-02',
    expiry_date: '2026-07-02',
    renewal_reminder_days: 14,
    notes: 'Annual inspection of data center cooling units.',
    is_high_risk: false,
  },
  {
    name: 'Accenture Data Processing Agreement',
    category: 'Vendor Contract',
    owner: 'Sneha Patel',
    department: 'Legal & Procurement',
    issue_date: '2024-07-01',
    expiry_date: '2026-07-03',
    renewal_reminder_days: 30,
    notes: 'GDPR-compliant DPA with Accenture for offshore data processing.',
    is_high_risk: false,
  },
  {
    name: 'JSW Steel Crane Load Test Certificate',
    category: 'Inspection Report',
    owner: 'Vikram Singh',
    department: 'Engineering',
    issue_date: '2025-01-01',
    expiry_date: '2026-06-15',
    renewal_reminder_days: 45,
    notes: 'Statutory load test certification for overhead cranes. Operations halted if expired.',
    is_high_risk: true,
  },
  // EXPIRING SOON
  {
    name: 'Tata Steel Boiler Inspection Certificate',
    category: 'Inspection Report',
    owner: 'Suresh Mehta',
    department: 'Plant Operations',
    issue_date: '2026-01-10',
    expiry_date: '2026-07-16',
    renewal_reminder_days: 30,
    notes: 'IBR compliance inspection for high-pressure boilers. Statutory requirement under the Indian Boilers Act.',
    is_high_risk: true,
  },
  {
    name: 'EY Government Audit License',
    category: 'Government License',
    owner: 'Kavita Nair',
    department: 'Regulatory Affairs',
    issue_date: '2025-07-12',
    expiry_date: '2026-07-12',
    renewal_reminder_days: 30,
    notes: 'License to conduct statutory audits issued by Ministry of Corporate Affairs. Non-renewal = practice suspension.',
    is_high_risk: true,
  },
  {
    name: 'KPMG SOC 2 Compliance Certificate',
    category: 'Compliance Certificate',
    owner: 'Rahul Gupta',
    department: 'IT & Cybersecurity',
    issue_date: '2025-07-20',
    expiry_date: '2026-07-20',
    renewal_reminder_days: 30,
    notes: 'Type II SOC 2 compliance for cloud infrastructure. Required by enterprise clients.',
    is_high_risk: false,
  },
  {
    name: 'Adani Ports Marine Cargo Insurance Policy',
    category: 'Insurance Policy',
    owner: 'Deepak Joshi',
    department: 'Risk Management',
    issue_date: '2026-01-01',
    expiry_date: '2026-07-25',
    renewal_reminder_days: 30,
    notes: 'Marine cargo open policy with HDFC ERGO. Covers all port shipments.',
    is_high_risk: false,
  },
  {
    name: 'Reliance Jio Spectrum License (5G)',
    category: 'Government License',
    owner: 'Ananya Krishnan',
    department: 'Telecom Regulatory',
    issue_date: '2022-08-01',
    expiry_date: '2026-07-30',
    renewal_reminder_days: 90,
    notes: 'DoT spectrum license for 5G operations in metro circles. High penalty for lapse.',
    is_high_risk: true,
  },
  {
    name: 'TCS ISO 27001 Certificate',
    category: 'Compliance Certificate',
    owner: 'Arjun Menon',
    department: 'Information Security',
    issue_date: '2025-08-01',
    expiry_date: '2026-08-01',
    renewal_reminder_days: 30,
    notes: 'Information security management system certification. Required for government contracts.',
    is_high_risk: false,
  },
  // ACTIVE
  {
    name: 'Deloitte AWS Vendor Contract',
    category: 'Vendor Contract',
    owner: 'Meera Iyer',
    department: 'IT Procurement',
    issue_date: '2024-07-01',
    expiry_date: '2027-06-30',
    renewal_reminder_days: 30,
    notes: 'Enterprise AWS agreement for cloud infrastructure. Includes 40% discount tier.',
    is_high_risk: false,
  },
  {
    name: 'JSW Steel Safety Training Records (Batch 2025)',
    category: 'Safety Training',
    owner: 'Rohit Agarwal',
    department: 'HR & Safety',
    issue_date: '2025-04-01',
    expiry_date: '2026-10-01',
    renewal_reminder_days: 45,
    notes: 'Annual mandatory safety training completion records for 1,200 plant workers.',
    is_high_risk: false,
  },
  {
    name: 'Adani Green Energy Wind Farm Inspection',
    category: 'Inspection Report',
    owner: 'Pooja Bansal',
    department: 'Asset Management',
    issue_date: '2026-03-15',
    expiry_date: '2027-03-15',
    renewal_reminder_days: 60,
    notes: 'Annual structural inspection of wind turbine towers by Bureau Veritas.',
    is_high_risk: false,
  },
  {
    name: 'Vedanta Zinc Smelter Environmental Clearance',
    category: 'Government License',
    owner: 'Ravi Shankar',
    department: 'Environmental Affairs',
    issue_date: '2024-01-01',
    expiry_date: '2028-12-31',
    renewal_reminder_days: 90,
    notes: 'MoEFCC clearance for zinc smelting operations at Dariba.',
    is_high_risk: false,
  },
  {
    name: 'EY Professional Indemnity Insurance',
    category: 'Insurance Policy',
    owner: 'Sanjay Kapoor',
    department: 'Finance & Risk',
    issue_date: '2026-04-01',
    expiry_date: '2027-03-31',
    renewal_reminder_days: 30,
    notes: 'Professional indemnity cover for audit and advisory services across India.',
    is_high_risk: false,
  },
  {
    name: 'Accenture NASSCOM Digital Talent Program',
    category: 'Safety Training',
    owner: 'Lakshmi Reddy',
    department: 'L&D',
    issue_date: '2026-02-01',
    expiry_date: '2027-01-31',
    renewal_reminder_days: 30,
    notes: 'Certified digital upskilling program for 500 employees.',
    is_high_risk: false,
  },
  {
    name: 'Tata Steel Cold Rolling Mill Vendor Contract',
    category: 'Vendor Contract',
    owner: 'Arun Kumar',
    department: 'Procurement',
    issue_date: '2025-01-15',
    expiry_date: '2028-01-14',
    renewal_reminder_days: 60,
    notes: 'Long-term supply agreement with SMS Group for cold rolling equipment.',
    is_high_risk: false,
  },
  {
    name: 'HDFC Bank SEBI Registration Certificate',
    category: 'Compliance Certificate',
    owner: 'Neha Sharma',
    department: 'Regulatory Compliance',
    issue_date: '2024-06-01',
    expiry_date: '2029-05-31',
    renewal_reminder_days: 90,
    notes: 'SEBI registration as Investment Advisor. Mandatory for wealth management products.',
    is_high_risk: false,
  },
  {
    name: 'Mahindra Electric Vehicle Type Approval',
    category: 'Government License',
    owner: 'Kiran Patil',
    department: 'Product Compliance',
    issue_date: '2025-07-01',
    expiry_date: '2028-06-30',
    renewal_reminder_days: 90,
    notes: 'AIS-156 phase 2 type approval for BE 6e and XEV 9e models.',
    is_high_risk: false,
  },
];

export async function POST() {
  try {
    const supabase = await createClient();

    // Clear existing data
    await supabase.from('record_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('records').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert seed records
    const { data: records, error } = await supabase
      .from('records')
      .insert(SEED_RECORDS)
      .select();

    if (error) throw error;

    // Log audit trail for seeded records
    const historyEntries = records.map((record) => ({
      record_id: record.id,
      action: 'created' as const,
      changed_by: 'seed',
      metadata: { source: 'seed_data' },
    }));

    await supabase.from('record_history').insert(historyEntries);

    return NextResponse.json({
      success: true,
      seeded: records.length,
    });
  } catch (error) {
    console.error('POST /api/seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
