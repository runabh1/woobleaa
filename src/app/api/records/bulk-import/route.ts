import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV, validateCSVRows, csvRowsToRecords } from '@/lib/utils/csv';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const validationResults = validateCSVRows(rows);
    const invalidRows = validationResults.filter((r) => !r.isValid);

    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          invalid_rows: invalidRows.map((r) => ({ row: r.row, errors: r.errors })),
        },
        { status: 422 }
      );
    }

    const recordsToInsert = csvRowsToRecords(rows).map((r) => ({
      ...r,
      department: r.department || null,
      notes: r.notes || null,
      attachment_url: null,
    }));

    const { data: inserted, error } = await supabase
      .from('records')
      .insert(recordsToInsert)
      .select();

    if (error) throw error;

    // Log audit trail for all imported records
    const historyEntries = inserted.map((record) => ({
      record_id: record.id,
      action: 'created' as const,
      changed_by: user?.email ?? 'system',
      metadata: { source: 'csv_import', filename: file.name },
    }));

    await supabase.from('record_history').insert(historyEntries);

    return NextResponse.json({
      success: true,
      imported: inserted.length,
      records: inserted,
    });
  } catch (error) {
    console.error('POST /api/records/bulk-import error:', error);
    return NextResponse.json({ error: 'Failed to import records' }, { status: 500 });
  }
}
