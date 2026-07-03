import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withStatuses } from '@/lib/utils/expiry';
import { CreateRecordInput, DocRecord } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('records')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,owner.ilike.%${search}%,department.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    let records = withStatuses(data as DocRecord[]);

    // Filter by status after computing it (can't do this in DB)
    if (status && status !== 'all') {
      records = records.filter((r) => r.status === status);
    }

    return NextResponse.json({ records });
  } catch (error) {
    console.error('GET /api/records error:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body: CreateRecordInput = await request.json();

    // Validate required fields
    if (!body.name || !body.category || !body.owner || !body.issue_date || !body.expiry_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (new Date(body.expiry_date) <= new Date(body.issue_date)) {
      return NextResponse.json(
        { error: 'Expiry date must be after issue date' },
        { status: 400 }
      );
    }

    const { data: record, error } = await supabase
      .from('records')
      .insert({
        name: body.name.trim(),
        category: body.category,
        owner: body.owner.trim(),
        department: body.department?.trim() || null,
        issue_date: body.issue_date,
        expiry_date: body.expiry_date,
        renewal_reminder_days: body.renewal_reminder_days ?? 30,
        notes: body.notes?.trim() || null,
        attachment_url: body.attachment_url?.trim() || null,
        is_high_risk: body.is_high_risk ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit trail
    await supabase.from('record_history').insert({
      record_id: record.id,
      action: 'created',
      changed_by: user?.email ?? 'system',
      metadata: { name: record.name },
    });

    const [enriched] = withStatuses([record as DocRecord]);
    return NextResponse.json({ record: enriched }, { status: 201 });
  } catch (error) {
    console.error('POST /api/records error:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
