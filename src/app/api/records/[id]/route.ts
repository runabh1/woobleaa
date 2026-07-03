import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withStatuses } from '@/lib/utils/expiry';
import { DocRecord, UpdateRecordInput } from '@/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: record, error: recordError } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single();

    if (recordError) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { data: history, error: historyError } = await supabase
      .from('record_history')
      .select('*')
      .eq('record_id', id)
      .order('created_at', { ascending: false });

    if (historyError) throw historyError;

    const [enriched] = withStatuses([record as DocRecord]);
    return NextResponse.json({ record: { ...enriched, history: history ?? [] } });
  } catch (error) {
    console.error('GET /api/records/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body: UpdateRecordInput = await request.json();

    // Get existing record for audit diff
    const { data: existing } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (body.expiry_date && body.issue_date && new Date(body.expiry_date) <= new Date(body.issue_date)) {
      return NextResponse.json({ error: 'Expiry date must be after issue date' }, { status: 400 });
    }

    const updateData: Partial<DocRecord> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.owner !== undefined) updateData.owner = body.owner.trim();
    if (body.department !== undefined) updateData.department = body.department?.trim() || null;
    if (body.issue_date !== undefined) updateData.issue_date = body.issue_date;
    if (body.expiry_date !== undefined) updateData.expiry_date = body.expiry_date;
    if (body.renewal_reminder_days !== undefined) updateData.renewal_reminder_days = body.renewal_reminder_days;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.attachment_url !== undefined) updateData.attachment_url = body.attachment_url?.trim() || null;
    if (body.is_high_risk !== undefined) updateData.is_high_risk = body.is_high_risk;

    const { data: updated, error } = await supabase
      .from('records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from('record_history').insert({
      record_id: id,
      action: 'updated',
      changed_by: user?.email ?? 'system',
      metadata: {
        changes: Object.keys(updateData).reduce((acc, key) => {
          const k = key as keyof typeof existing;
          if (existing[k] !== updateData[k as keyof typeof updateData]) {
            acc[key] = { from: existing[k], to: updateData[k as keyof typeof updateData] };
          }
          return acc;
        }, {} as { [key: string]: { from: unknown; to: unknown } }),
      },
    });

    const [enriched] = withStatuses([updated as DocRecord]);
    return NextResponse.json({ record: enriched });
  } catch (error) {
    console.error('PUT /api/records/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from('records')
      .select('name')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Log before delete (history will cascade delete anyway, but for completeness)
    await supabase.from('record_history').insert({
      record_id: id,
      action: 'deleted',
      changed_by: user?.email ?? 'system',
      metadata: { name: existing.name },
    });

    const { error } = await supabase.from('records').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/records/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
