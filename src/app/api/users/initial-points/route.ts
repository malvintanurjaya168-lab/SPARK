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
    const { user_id, initial_points } = body;

    if (!user_id || initial_points === undefined || initial_points === null) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    if (typeof initial_points !== 'number' || initial_points < 0) {
      return NextResponse.json({ message: 'Poin awal harus berupa angka positif' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ initial_points })
      .eq('id', user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update initial points error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui poin awal' }, { status: 500 });
  }
}
