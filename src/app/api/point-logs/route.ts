import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const semester_id = searchParams.get('semester_id');
    const recorded_by = searchParams.get('recorded_by');
    const location = searchParams.get('location');

    // Only siswas can see their own logs. Guru can only see their own logs. Kesiswaan can see all.
    if (session.role === ROLES.SISWA && student_id !== session.id.toString()) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('point_logs')
      .select(`
        id, created_at, points_changed, notes, location,
        student:users!point_logs_student_id_fkey(id, name, nomor_induk, kelas, angkatan),
        category:point_categories(id, name, type, severity, points_value),
        recorder:users!point_logs_recorded_by_fkey(id, name),
        semester:semesters(id, name)
      `)
      .order('created_at', { ascending: false });

    if (student_id) query = query.eq('student_id', student_id);
    if (semester_id) query = query.eq('semester_id', semester_id);
    if (location && location !== 'all') {
      // Case-insensitive location filter
      query = query.ilike('location', location);
    }
    
    // Guru can only see logs they recorded themselves
    // Kesiswaan can see all logs
    if (session.role === ROLES.GURU) {
      query = query.eq('recorded_by', session.id);
    } else if (recorded_by && session.role === ROLES.KESISWAAN) {
      // Kesiswaan can filter by recorded_by if explicitly requested
      query = query.eq('recorded_by', recorded_by);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch point logs error:', error);
    return NextResponse.json({ message: 'Gagal mengambil riwayat poin' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || (session.role !== ROLES.KESISWAAN && session.role !== ROLES.GURU && session.role !== ROLES.ADMIN_PEMBINA_ASRAMA)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify that the recorder (current user) exists in the database
    const { data: recorderUser, error: recorderError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.id)
      .single();

    if (recorderError || !recorderUser) {
      return NextResponse.json({ message: 'User tidak ditemukan di database. Silakan login ulang.' }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, category_id, notes, created_at, location, skip_validation } = body;

    if (!student_id || !category_id) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single();

    if (!activeSemester) {
      return NextResponse.json({ message: 'Tidak ada semester aktif. Harap hubungi Kesiswaan.' }, { status: 400 });
    }

    // Get category points
    const { data: category } = await supabase
      .from('point_categories')
      .select('points_value')
      .eq('id', category_id)
      .single();
      
    if (!category) {
      return NextResponse.json({ message: 'Kategori tidak ditemukan' }, { status: 400 });
    }

    // If skip_validation is true (for Kesiswaan direct input), create point log directly
    if (skip_validation && session.role === ROLES.KESISWAAN) {
      const { data, error } = await supabase
        .from('point_logs')
        .insert([{ 
          student_id, 
          category_id, 
          recorded_by: session.id,
          semester_id: activeSemester.id,
          points_changed: category.points_value,
          notes: notes || null,
          created_at: created_at || new Date().toISOString(),
          location: location || 'sekolah',
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      return NextResponse.json(data, { status: 201 });
    }

    // Otherwise, create a point request for validation
    const requestPayload = {
      student_id: BigInt(student_id),
      category_id: BigInt(category_id),
      semester_id: activeSemester.id ? BigInt(activeSemester.id) : null,
      recorder_id: BigInt(session.id),
      points_value: category.points_value,
      notes: notes || null,
      location: location || 'sekolah',
      created_at: created_at || new Date().toISOString(),
      status: 'pending'
    };

    const { data: requestData, error: requestError } = await supabase
      .from('point_requests')
      .insert([requestPayload])
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

    if (requestError) {
      console.error('Supabase insert request error:', requestError);
      throw requestError;
    }

    return NextResponse.json({ 
      ...requestData, 
      message: 'Request poin berhasil dibuat dan menunggu validasi Kesiswaan' 
    }, { status: 201 });
  } catch (error) {
    console.error('Create point log error:', error);
    return NextResponse.json({ message: 'Gagal mencatat poin', error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, notes } = body;

    if (!id) {
      return NextResponse.json({ message: 'ID log diperlukan' }, { status: 400 });
    }

    // Check ownership
    const { data: log } = await supabase
      .from('point_logs')
      .select('created_at, recorded_by')
      .eq('id', id)
      .single();

    if (!log) return NextResponse.json({ message: 'Log tidak ditemukan' }, { status: 404 });

    // Only Kesiswaan can edit logs
    if (session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Hanya Kesiswaan yang dapat mengubah log ini' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('point_logs')
      .update({ notes: notes || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update point log error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui catatan poin' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID log diperlukan' }, { status: 400 });
    }

    // Only Kesiswaan can delete logs
    if (session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Hanya Kesiswaan yang dapat menghapus log ini' }, { status: 403 });
    }

    const { error } = await supabase.from('point_logs').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Catatan poin berhasil dihapus' });
  } catch (error) {
    console.error('Delete point log error:', error);
    return NextResponse.json({ message: 'Gagal menghapus catatan poin' }, { status: 500 });
  }
}
