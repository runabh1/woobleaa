# NeverExpire

> **Build the system that makes sure decisions actually happen.**
> A decision-forcing dashboard for enterprise document expiry management.

---

## What It Does

Organizations like Tata Steel, Deloitte, KPMG, and Adani manage hundreds of documents — vendor contracts, compliance certificates, government licenses, inspection reports — each with an expiry date.

**The problem:** Most companies still track these in Excel. Nobody checks them. Documents expire unnoticed.

**The solution:** Open one screen and instantly see:
- ✅ What is **Active**
- ⚠️ What is **Expiring Soon**
- 🔴 What is **Expired** — and needs action **today**

---

## Features

| Feature | Description |
|---------|-------------|
| 📊 Live Dashboard | Summary cards, donut chart, bar chart, action-needed panel |
| ⚠️ Critical Risk Panel | High-risk + expiring records, pulsing alert, sorted by urgency |
| 📁 Full CRUD | Add, edit, delete records with validation |
| ✅ Mark as Renewed | Updates dates, logs renewal in audit trail |
| 📋 Audit Trail | Full history of every create, update, renewal per record |
| 🔔 Notification Bell | Live count of urgent records expiring within 7 days |
| 📥 CSV Import | Bulk-import from Excel/CSV with drag-and-drop and validation |
| 📤 Export CSV | Export current filtered view to CSV for reporting |
| 🔍 Search and Filter | Global search, status/category filters, sortable columns |
| 📱 Responsive | Works on mobile and desktop |
| 🌙 Dark/Light Mode | Toggle in topbar |
| 📧 Reminder Email | One-click mailto draft with pre-filled renewal template |
| 🛡️ Auth | Supabase email/password auth with middleware route protection |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Auth)
- **Charts:** Recharts
- **Deployment:** Vercel

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/neverexpire.git
cd neverexpire
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** in the Supabase dashboard
3. Copy the contents of `supabase/migrations/001_initial.sql` and run it
4. (Optional) Copy `supabase/seed.sql` and run it for sample data

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these at: Supabase Dashboard → Project Settings → API

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Load demo data

After signing in, click **"Load Demo Data"** on the dashboard. 20 realistic records (Tata Steel, Vedanta, EY, KPMG, Adani, Reliance, Deloitte, JSW) load instantly.

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── dashboard/page.tsx       # Main dashboard
│   │   ├── records/page.tsx         # Records table with filters
│   │   ├── records/new/page.tsx     # Add record form
│   │   └── records/[id]/page.tsx    # Detail + audit trail + renew
│   ├── api/
│   │   ├── records/route.ts         # GET list, POST create
│   │   ├── records/[id]/route.ts    # GET, PUT, DELETE
│   │   ├── records/[id]/renew/      # POST renewal action
│   │   ├── records/bulk-import/     # POST CSV import
│   │   └── seed/route.ts            # POST demo data
│   └── login/page.tsx
├── components/
│   ├── charts/                      # StatusDonutChart, CategoryBarChart
│   ├── layout/                      # Sidebar, Topbar, NotificationBell
│   ├── records/                     # RecordForm, CSVImportModal
│   └── ui/                          # Badge, Button, Modal, Skeleton, Input
├── lib/
│   ├── supabase/                    # server.ts, client.ts
│   └── utils/                       # expiry.ts, csv.ts, cn.ts
└── types/index.ts
```

---

## CSV Import Format

```csv
name,category,owner,department,issue_date,expiry_date,renewal_reminder_days,notes,is_high_risk
Vendor Contract with Infosys,Vendor Contract,Ravi Sharma,Procurement,2025-01-01,2026-12-31,30,Annual IT services,false
```

**Required columns:** name, category, owner, issue_date, expiry_date

**Valid categories:** Vendor Contract, Compliance Certificate, Safety Training, Insurance Policy, Inspection Report, Government License, Other

---

## Thought Process

See [THOUGHT_PROCESS.md](./THOUGHT_PROCESS.md) for design decisions, edge cases, and scope rationale.

---

Built for the **Wooble Expiry Alert '26 Challenge** — July 2026
