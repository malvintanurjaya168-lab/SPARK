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
    const type = searchParams.get('type');

    let query = supabase.from('point_categories').select('*');
    if (type) query = query.eq('type', type);

    const { data, error } = await query.order('name');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ message: 'Gagal mengambil kategori' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, severity, points_value } = body;

    if (!name || !type || points_value === undefined) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    // Validation
    if (type === 'pelanggaran' && points_value >= 0) {
      return NextResponse.json({ message: 'Poin pelanggaran harus negatif' }, { status: 400 });
    }
    if (type === 'reward' && points_value <= 0) {
      return NextResponse.json({ message: 'Poin reward harus positif' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('point_categories')
      .insert([{ name, type, severity: type === 'pelanggaran' ? severity : null, points_value }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ message: 'Gagal membuat kategori' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, type, severity, points_value } = body;

    if (!id || !name || !type || points_value === undefined) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    if (type === 'pelanggaran' && points_value >= 0) {
      return NextResponse.json({ message: 'Poin pelanggaran harus negatif' }, { status: 400 });
    }
    if (type === 'reward' && points_value <= 0) {
      return NextResponse.json({ message: 'Poin reward harus positif' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('point_categories')
      .update({ name, type, severity: type === 'pelanggaran' ? severity : null, points_value })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui kategori' }, { status: 500 });
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
      return NextResponse.json({ message: 'ID kategori diperlukan' }, { status: 400 });
    }

    const { error } = await supabase.from('point_categories').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json({ message: 'Kategori ini tidak dapat dihapus karena sudah digunakan pada catatan poin' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ message: 'Gagal menghapus kategori' }, { status: 500 });
  }
}
