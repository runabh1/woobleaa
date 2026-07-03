-- NeverExpire Seed Data
-- Realistic records referencing companies from the challenge brief
-- Run AFTER 001_initial.sql

-- Clear existing data
truncate table record_history cascade;
truncate table records cascade;

-- Insert seed records
-- Today is computed relative to 2026-07-04 for realistic demo
insert into records (name, category, owner, department, issue_date, expiry_date, renewal_reminder_days, notes, is_high_risk) values

-- EXPIRED (red) -- judges need to see these immediately
('Vedanta Environmental Compliance License', 'Government License', 'Rajesh Kumar', 'EHS & Sustainability', '2025-07-01', '2026-06-30', 60, 'State Pollution Control Board license. Renewal requires fresh environmental impact assessment.', true),
('Reliance Industries Fire Safety Certificate', 'Compliance Certificate', 'Priya Sharma', 'Safety & Compliance', '2025-01-15', '2026-06-25', 30, 'Factory-level fire NOC from local fire department. Must be renewed before operations resume.', true),
('PwC Machine Inspection Report', 'Inspection Report', 'Ankit Verma', 'Facilities', '2025-07-02', '2026-07-02', 14, 'Annual inspection of data center cooling units.', false),
('Accenture Data Processing Agreement', 'Vendor Contract', 'Sneha Patel', 'Legal & Procurement', '2024-07-01', '2026-07-03', 30, 'GDPR-compliant DPA with Accenture for offshore data processing.', false),
('JSW Steel Crane Load Test Certificate', 'Inspection Report', 'Vikram Singh', 'Engineering', '2025-01-01', '2026-06-15', 45, 'Statutory load test certification for overhead cranes. Operations halted if expired.', true),

-- EXPIRING SOON (amber) -- create urgency
('Tata Steel Boiler Inspection Certificate', 'Inspection Report', 'Suresh Mehta', 'Plant Operations', '2026-01-10', '2026-07-16', 30, 'IBR compliance inspection for high-pressure boilers. Statutory requirement under the Indian Boilers Act.', true),
('EY Government Audit License', 'Government License', 'Kavita Nair', 'Regulatory Affairs', '2025-07-12', '2026-07-12', 30, 'License to conduct statutory audits issued by Ministry of Corporate Affairs. Non-renewal = practice suspension.', true),
('KPMG SOC 2 Compliance Certificate', 'Compliance Certificate', 'Rahul Gupta', 'IT & Cybersecurity', '2025-07-20', '2026-07-20', 30, 'Type II SOC 2 compliance for cloud infrastructure. Required by enterprise clients.', false),
('Adani Ports Marine Cargo Insurance Policy', 'Insurance Policy', 'Deepak Joshi', 'Risk Management', '2026-01-01', '2026-07-25', 30, 'Marine cargo open policy with HDFC ERGO. Covers all port shipments.', false),
('Reliance Jio Spectrum License (5G)', 'Government License', 'Ananya Krishnan', 'Telecom Regulatory', '2022-08-01', '2026-07-30', 90, 'DoT spectrum license for 5G operations in metro circles. High penalty for lapse.', true),
('Tata Consultancy Services ISO 27001 Certificate', 'Compliance Certificate', 'Arjun Menon', 'Information Security', '2025-08-01', '2026-08-01', 30, 'Information security management system certification. Required for government contracts.', false),

-- ACTIVE (green) -- healthy state
('Deloitte AWS Vendor Contract', 'Vendor Contract', 'Meera Iyer', 'IT Procurement', '2024-07-01', '2027-06-30', 30, 'Enterprise AWS agreement for cloud infrastructure. Includes 40% discount tier.', false),
('JSW Steel Safety Training Records — Batch 2025', 'Safety Training', 'Rohit Agarwal', 'HR & Safety', '2025-04-01', '2026-10-01', 45, 'Annual mandatory safety training completion records for 1,200 plant workers.', false),
('Adani Green Energy Wind Farm Inspection', 'Inspection Report', 'Pooja Bansal', 'Asset Management', '2026-03-15', '2027-03-15', 60, 'Annual structural inspection of wind turbine towers by Bureau Veritas.', false),
('Vedanta Zinc Smelter Environmental Clearance', 'Government License', 'Ravi Shankar', 'Environmental Affairs', '2024-01-01', '2028-12-31', 90, 'MoEFCC clearance for zinc smelting operations at Dariba.', false),
('EY Professional Indemnity Insurance', 'Insurance Policy', 'Sanjay Kapoor', 'Finance & Risk', '2026-04-01', '2027-03-31', 30, 'Professional indemnity cover for audit and advisory services across India.', false),
('Accenture NASSCOM Digital Talent Program', 'Safety Training', 'Lakshmi Reddy', 'L&D', '2026-02-01', '2027-01-31', 30, 'Certified digital upskilling program for 500 employees.', false),
('Tata Steel Cold Rolling Mill Vendor Contract', 'Vendor Contract', 'Arun Kumar', 'Procurement', '2025-01-15', '2028-01-14', 60, 'Long-term supply agreement with SMS Group for cold rolling equipment.', false),
('HDFC Bank SEBI Registration Certificate', 'Compliance Certificate', 'Neha Sharma', 'Regulatory Compliance', '2024-06-01', '2029-05-31', 90, 'SEBI registration as Investment Advisor. Mandatory for wealth management products.', false),
('Mahindra Electric Vehicle Type Approval', 'Government License', 'Kiran Patil', 'Product Compliance', '2025-07-01', '2028-06-30', 90, 'AIS-156 phase 2 type approval for BE 6e and XEV 9e models.', false);
