import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withStatuses } from '@/lib/utils/expiry';
import { DocRecord, RenewRecordInput } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body: RenewRecordInput = await request.json();

    if (!body.new_issue_date || !body.new_expiry_date) {
      return NextResponse.json({ error: 'New issue date and expiry date are required' }, { status: 400 });
    }

    if (new Date(body.new_expiry_date) <= new Date(body.new_issue_date)) {
      return NextResponse.json({ error: 'New expiry date must be after new issue date' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from('records')
      .update({
        issue_date: body.new_issue_date,
        expiry_date: body.new_expiry_date,
        notes: body.notes
          ? `[Renewed ${new Date().toISOString().split('T')[0]}] ${body.notes}\n\n${existing.notes ?? ''}`
          : existing.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log renewal in audit trail
    await supabase.from('record_history').insert({
      record_id: id,
      action: 'renewed',
      changed_by: body.renewed_by ?? user?.email ?? 'system',
      metadata: {
        previous_issue_date: existing.issue_date,
        previous_expiry_date: existing.expiry_date,
        new_issue_date: body.new_issue_date,
        new_expiry_date: body.new_expiry_date,
        renewal_notes: body.notes,
      },
    });

    const [enriched] = withStatuses([updated as DocRecord]);
    return NextResponse.json({ record: enriched });
  } catch (error) {
    console.error('POST /api/records/[id]/renew error:', error);
    return NextResponse.json({ error: 'Failed to renew record' }, { status: 500 });
  }
}
