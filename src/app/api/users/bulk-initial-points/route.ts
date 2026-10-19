import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

export async function PUT(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { initial_points, user_ids } = body;

    if (initial_points === undefined || initial_points === null) {
      return NextResponse.json({ message: 'Poin awal wajib diisi' }, { status: 400 });
    }

    if (typeof initial_points !== 'number' || initial_points < 0) {
      return NextResponse.json({ message: 'Poin awal harus berupa angka positif' }, { status: 400 });
    }

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ message: 'ID pengguna wajib diisi' }, { status: 400 });
    }

    // Update initial_points for all users
    // The total_points calculation is dynamic: total_points = initial_points + sum(points_changed)
    // So changing initial_points will automatically adjust the total while preserving the difference
    const { data, error } = await supabase
      .from('users')
      .update({ initial_points })
      .in('id', user_ids)
      .select('id, nomor_induk, name, initial_points');

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Berhasil memperbarui poin awal', 
      updated_count: data.length,
      data 
    });
  } catch (error) {
    console.error('Bulk update initial points error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui poin awal' }, { status: 500 });
  }
}
