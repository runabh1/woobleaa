'use client';

export const dynamic = 'force-dynamic';


import { useRouter } from 'next/navigation';
import { RecordForm } from '@/components/records/RecordForm';

export default function NewRecordPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add New Record</h1>
        <p className="text-sm text-slate-400 mt-1">Create a new expiry-tracked business record</p>
      </div>
      <div className="glass-card p-6">
        <RecordForm
          onSuccess={() => router.push('/records')}
          onCancel={() => router.push('/records')}
        />
      </div>
    </div>
  );
}
