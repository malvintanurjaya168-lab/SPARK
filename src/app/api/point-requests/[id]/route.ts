import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

// PUT - Approve or reject a point request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, rejection_reason } = body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }

    // Get the request details
    const { data: requestData, error: fetchError } = await supabase
      .from('point_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (requestData.status !== 'pending') {
      return NextResponse.json({ message: 'Request already processed' }, { status: 400 });
    }

    if (action === 'approve') {
      // Update request status to approved
      const { error: updateError } = await supabase
        .from('point_requests')
        .update({
          status: 'approved',
          approved_by: BigInt(session.id),
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create the actual point log
      const { error: logError } = await supabase
        .from('point_logs')
        .insert([
          {
            student_id: requestData.student_id,
            category_id: requestData.category_id,
            semester_id: requestData.semester_id,
            recorded_by: requestData.recorder_id,
            points_changed: requestData.points_value,
            notes: requestData.notes,
            created_at: requestData.created_at || new Date().toISOString(),
            location: requestData.location || 'sekolah'
          }
        ]);

      if (logError) throw logError;

      return NextResponse.json({ message: 'Request approved and point log created' });
    } else {
      // Reject the request
      const { error: updateError } = await supabase
        .from('point_requests')
        .update({
          status: 'rejected',
          approved_by: BigInt(session.id),
          approved_at: new Date().toISOString(),
          rejection_reason: rejection_reason
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({ message: 'Request rejected' });
    }
  } catch (error: any) {
    console.error('Update point request error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE - Delete a request (only if pending)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(req as any);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the request details
    const { data: requestData, error: fetchError } = await supabase
      .from('point_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Only the recorder or Kesiswaan can delete pending requests
    if (requestData.recorder_id !== session.id && session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (requestData.status !== 'pending') {
      return NextResponse.json({ message: 'Cannot delete processed requests' }, { status: 400 });
    }

    const { error } = await supabase
      .from('point_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Request deleted' });
  } catch (error: any) {
    console.error('Delete point request error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
