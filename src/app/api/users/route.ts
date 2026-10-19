import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hashPassword } from '@/lib/auth';
import { ROLES, POINT_BASE } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    // Only kesiswaan, guru, and admin_pembina_asrama can list users
    const session = await getSession(request as any);
    if (!session || (session.role !== ROLES.KESISWAAN && session.role !== ROLES.GURU && session.role !== ROLES.ADMIN_PEMBINA_ASRAMA)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const kelas = searchParams.get('kelas');
    const angkatan = searchParams.get('angkatan');
    const search = searchParams.get('search');

    let query = supabase.from('users').select(`
      id, created_at, nomor_induk, name, role, kelas, angkatan, initial_points, wali_kelas,
      point_logs!point_logs_student_id_fkey(points_changed)
    `);

    if (role) query = query.eq('role', role);
    if (kelas) query = query.eq('kelas', kelas);
    if (angkatan) query = query.eq('angkatan', angkatan);
    if (search) {
      query = query.or(`name.ilike.%${search}%,nomor_induk.ilike.%${search}%`);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    // Calculate total points for each user
    const usersWithPoints = data.map((user: any) => {
      const totalPointsChanged = user.point_logs?.reduce((sum: number, log: any) => sum + (log.points_changed || 0), 0) || 0;
      const initialPoints = user.initial_points || 100; // Default to 100 if not set
      
      return {
        id: user.id,
        created_at: user.created_at,
        nomor_induk: user.nomor_induk,
        name: user.name,
        role: user.role,
        kelas: user.kelas,
        angkatan: user.angkatan,
        initial_points: user.initial_points,
        wali_kelas: user.wali_kelas,
        total_points: user.role === ROLES.SISWA ? initialPoints + totalPointsChanged : null
      };
    });

    return NextResponse.json(usersWithPoints);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data pengguna' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nomor_induk, name, role, kelas, angkatan, password, initial_points, wali_kelas } = body;

    if (!nomor_induk || !name || !role) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    // Hash password if provided, otherwise null
    const hashedPassword = password ? await hashPassword(password) : null;

    const insertData: any = { 
      nomor_induk, 
      name, 
      role, 
      kelas: kelas || null, 
      angkatan: angkatan || null, 
      password: hashedPassword 
    };

    // Add initial_points if provided and role is siswa
    if (role === ROLES.SISWA && initial_points !== undefined) {
      insertData.initial_points = initial_points;
    }

    // Add wali_kelas if provided and role is guru
    if (role === ROLES.GURU && wali_kelas !== undefined) {
      insertData.wali_kelas = wali_kelas || null;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([insertData])
      .select('id, nomor_induk, name, role, kelas, angkatan, initial_points, wali_kelas')
      .single();

    if (error) {
      console.error('Create user error:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ message: 'Nomor Induk sudah terdaftar' }, { status: 400 });
      }
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json({ message: 'Data referensi tidak valid' }, { status: 400 });
      }
      if (error.code === '22P02') { // Invalid text representation
        return NextResponse.json({ message: 'Format data tidak valid' }, { status: 400 });
      }
      return NextResponse.json({ message: error.message || 'Gagal membuat pengguna' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Gagal membuat pengguna' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, role, kelas, angkatan, password, initial_points, wali_kelas } = body;

    if (!id || !name || !role) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    const updateData: any = { name, role, kelas: kelas || null, angkatan: angkatan || null };
    
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Add initial_points if provided and role is siswa
    if (role === ROLES.SISWA && initial_points !== undefined) {
      updateData.initial_points = initial_points;
    }

    // Add wali_kelas if provided and role is guru
    if (role === ROLES.GURU && wali_kelas !== undefined) {
      updateData.wali_kelas = wali_kelas || null;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, nomor_induk, name, role, kelas, angkatan, initial_points, wali_kelas')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui pengguna' }, { status: 500 });
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
      return NextResponse.json({ message: 'ID pengguna diperlukan' }, { status: 400 });
    }
    
    if (parseInt(id) === session.id) {
      return NextResponse.json({ message: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    console.log('Attempting to delete user with ID:', id);

    // First, delete related data to avoid constraint issues
    console.log('Deleting point_logs recorded by this user...');
    const { error: deleteLogsError } = await supabase
      .from('point_logs')
      .delete()
      .eq('recorded_by', id);

    if (deleteLogsError) {
      console.error('Error deleting point_logs:', deleteLogsError.code, deleteLogsError.message);
    } else {
      console.log('Point_logs deleted successfully');
    }

    console.log('Deleting point_requests created by this user...');
    const { error: deleteRequestsError } = await supabase
      .from('point_requests')
      .delete()
      .eq('recorder_id', id);

    if (deleteRequestsError) {
      console.error('Error deleting point_requests:', deleteRequestsError.code, deleteRequestsError.message);
    } else {
      console.log('Point_requests deleted successfully');
    }

    // Now try to delete the user
    console.log('Deleting user...');
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      console.error('Delete user error:', error.code, error.message, error.details);
      throw error;
    }

    console.log('User deleted successfully');
    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ message: 'Gagal menghapus pengguna (mungkin masih memiliki relasi data)' }, { status: 500 });
  }
}
