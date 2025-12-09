import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const { data, error: fetchError } = await supabase!
    .from('feedback')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();

    // Only allow updating status and admin_notes
    const updateData: Record<string, any> = {};
    if (body.status) updateData.status = body.status;
    if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;

    const { data, error: updateError } = await supabase!
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
