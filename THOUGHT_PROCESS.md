# Thought Process — NeverExpire

## Who is the user?

**Primary Persona: Compliance Manager at a mid-to-large Indian enterprise**

Think of Priya Sharma — Head of Compliance at a steel plant with 5,000 employees.

Priya's day involves dozens of regulatory obligations: government licenses, safety certifications, vendor contracts, inspection clearances. Each has a different expiry date, managed by a different department, with different consequences if missed.

Today, Priya's process looks like this:
1. Open a shared Excel file on Google Drive
2. Scroll through 200 rows of records
3. Manually check today's date against expiry columns
4. Send a WhatsApp message to the relevant department head
5. Repeat this every Monday

**The problem is not data — it's decision latency.**

By the time Priya discovers an expiry, it's often already happened. NeverExpire fixes this by turning the compliance view into a real-time decision surface.

---

## Core Design Decisions

### 1. Status is computed, never stored

**Why:** Status is time-dependent. A record that's "Active" today becomes "Expiring Soon" in 25 days without any edit. If we stored status, it would become stale the moment the day changes.

By computing status at page load from `expiry_date` and `renewal_reminder_days`, the dashboard is always correct — no cron jobs, no stale data, no "it says Active but it expired last week."

**Implementation:** `computeStatus()` in `lib/utils/expiry.ts` runs on every record fetch. It uses local date parsing (not UTC) to avoid timezone-based off-by-one errors.

### 2. Per-record custom reminder threshold

**Why:** Not all documents have the same urgency window.

- A Government License (Pollution Control Board) needs 90 days: the renewal process involves site inspections, government processing, and potential appeals.
- A machine inspection report might only need 7 days: it's a quick local inspection.

A flat "30-day threshold" would create alert fatigue (too many warnings too early) or dangerous gaps (too late for complex renewals).

**Implementation:** Each record has a `renewal_reminder_days` field (default: 30). The status computation uses this field per-record.

### 3. Smart Risk Flagging (High Risk + Expiring)

**Why:** Not all expiring documents have the same consequence. An expired safety training record is a problem. An expired Government License can halt operations, trigger regulatory penalties, or result in criminal liability for executives.

The dashboard separates "critical" records (high-risk AND expiring/expired) from routine attention items. This gives Priya a visual hierarchy: red-pulsing Critical section first, then standard Action Needed below.

**Implementation:** `is_high_risk` boolean per record. `isCritical()` utility combines `is_high_risk && (status === 'Expired' || status === 'Expiring Soon')`.

### 4. Audit Trail

**Why:** In regulated industries, "who changed what and when" is itself a compliance requirement. When an auditor asks "when did you renew this license?", you need a timestamped record.

Every create, update, renewal, and delete is logged in `record_history` with the actor's email, action type, and a metadata diff.

### 5. "Mark as Renewed" as a first-class action

**Why:** The brief says "build the system that makes decisions actually happen." A decision to renew a document must produce a concrete outcome: updated dates, logged history. Not just a status change — a real workflow step.

The renewal flow updates `issue_date` and `expiry_date`, prepends renewal notes, and logs the previous dates in history. So you always know when it was renewed, by whom, and what the previous expiry was.

### 6. Bulk CSV Import

**Why:** Real companies have existing Excel spreadsheets with hundreds of records. If onboarding requires manual entry of every record, adoption dies.

CSV import allows a company to format their existing spreadsheet to the template, upload once, and be fully operational in minutes. This is the adoption accelerator.

---

## Edge Cases Handled

### Timezone handling
`new Date('2026-07-04')` parses as UTC midnight, which can resolve to July 3rd in IST (UTC+5:30). We use `parseLocalDate()` which constructs `new Date(year, month-1, day)` — always local time, never UTC-shifted.

### Leap years
`differenceInDays()` uses millisecond arithmetic (`date.getTime()`), which handles leap year day counts correctly without manual calendar logic.

### Backdated entries
If `expiry_date < today`, the record is immediately flagged as Expired — no special handling needed. The system is honest about what has already lapsed.

### Duplicate names
No unique constraint on `name`. Real companies legitimately have multiple versions of the same document (e.g., annual renewals of the same certificate). The `id` (UUID) uniquely identifies records.

### Records with very long-lived expiry
A 10-year Government License with `renewal_reminder_days = 90` will show as Active for ~9.75 years. No edge case here — the system handles any future date correctly.

### Empty / partial CSV rows
The CSV validator checks each row individually and returns per-row errors with row numbers. It refuses to import anything if any row fails validation (all-or-nothing). Users see exactly which rows need fixing.

---

## What Was Deliberately Left Out

### Document storage / file uploads
The brief explicitly says: "The goal is not to build a document storage platform."

Storing PDFs adds complexity (S3/R2 storage, upload flows, preview rendering) without adding decision-making value. The URL field exists as an optional link to an existing DMS, but we do not host files.

### Email / SMS notifications
Real notification systems require SMTP servers, SMS gateways, scheduling infrastructure, and user preference management. This is significant scope.

Instead, the "Send Reminder Email" feature generates a `mailto:` link with a pre-filled template. This demonstrates the notification workflow concept without requiring infrastructure setup, and is actually practical: managers use their existing email client.

### Complex role-based access control
We simulated role awareness (Admin vs. Manager views) but did not implement full row-level department filtering per user. This would require a user-department mapping table and more complex RLS policies. For a 3-day hackathon submission, simulated role UI is sufficient to demonstrate the concept.

### Recurring schedule / cron
Status is computed at render time, so there is no cron job. This is actually an advantage: no scheduler drift, no stale status, no infrastructure to maintain.

---

## Why This Approach Wins

The brief's title is: **"Build the system that makes sure decisions actually happen."**

Every feature maps to a decision:
- **Dashboard** → "What needs my attention right now?"
- **Critical Panel** → "What must I act on today, not tomorrow?"
- **Mark as Renewed** → "This decision has been executed, log it."
- **Send Reminder Email** → "This decision must now involve another person."
- **Audit Trail** → "This decision was made, here's the proof."
- **CSV Import** → "We have 200 existing records — let's make all their decisions visible."

NeverExpire does not just show expiry data. It creates a decision workflow.

---

## Technical Choices Justified

| Choice | Reason |
|--------|--------|
| Next.js 14 App Router | Server Components for fast initial load, Client Components for interactivity |
| Supabase | Free tier, Postgres, Auth, Row Level Security — everything needed for a production prototype |
| Recharts | React-native, no extra bundle overhead, good TypeScript support |
| Tailwind CSS | Dark mode utilities, consistent design tokens, fast iteration |
| No document storage | Scope discipline — as per the brief |
| No real-time subscriptions | Overkill for this use case; page refresh is sufficient |
| LocalStorage-free | All data in Supabase — no sync issues between devices |

---

*Built for Wooble Expiry Alert '26 Challenge — July 2026*
