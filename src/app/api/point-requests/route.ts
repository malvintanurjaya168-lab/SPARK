import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

// GET - List point requests (for Kesiswaan)
export async function GET(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Only Kesiswaan can view all requests
    if (session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('point_requests')
      .select(`
        id,
        created_at,
        status,
        points_value,
        notes,
        rejection_reason,
        approved_at,
        location,
        student:student_id(id, name, nomor_induk, kelas, angkatan),
        category:category_id(id, name, points_value),
        semester:semester_id(id, name),
        recorder:recorder_id(id, name, role),
        approved_by:approved_by(id, name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Get point requests error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST - Create a new point request
export async function POST(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only Guru and Kesiswaan can create requests
    if (session.role !== ROLES.GURU && session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, category_id, semester_id, notes } = body;

    if (!student_id || !category_id) {
      return NextResponse.json({ message: 'Student ID and Category ID are required' }, { status: 400 });
    }

    // Get category to get points_value
    const { data: category, error: categoryError } = await supabase
      .from('point_categories')
      .select('points_value')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ message: 'Invalid category' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('point_requests')
      .insert([
        {
          student_id: BigInt(student_id),
          category_id: BigInt(category_id),
          semester_id: semester_id ? BigInt(semester_id) : null,
          recorder_id: BigInt(session.id),
          points_value: category.points_value,
          notes: notes || null,
          status: 'pending'
        }
      ])
      .select(`
        id,
        created_at,
        status,
        points_value,
        notes,
        student:student_id(id, name, nomor_induk, kelas),
        category:category_id(id, name, points_value),
        recorder:recorder_id(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Create point request error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
