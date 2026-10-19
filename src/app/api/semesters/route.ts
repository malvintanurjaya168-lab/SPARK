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

    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch semesters error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data semester' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, start_date, end_date, is_active } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    // If this semester is active, deactivate all others first
    if (is_active) {
      await supabase.from('semesters').update({ is_active: false }).neq('id', 0); // neq 0 is a hack to update all
    }

    const { data, error } = await supabase
      .from('semesters')
      .insert([{ name, start_date, end_date, is_active: is_active || false }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create semester error:', error);
    return NextResponse.json({ message: 'Gagal membuat semester' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, start_date, end_date, is_active } = body;

    if (!id || !name || !start_date || !end_date) {
      return NextResponse.json({ message: 'Data wajib belum lengkap' }, { status: 400 });
    }

    // If making this active, deactivate others
    if (is_active) {
      await supabase.from('semesters').update({ is_active: false }).neq('id', id);
    }

    const { data, error } = await supabase
      .from('semesters')
      .update({ name, start_date, end_date, is_active: is_active || false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update semester error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui semester' }, { status: 500 });
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
      return NextResponse.json({ message: 'ID semester diperlukan' }, { status: 400 });
    }

    const { error } = await supabase.from('semesters').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json({ message: 'Semester tidak dapat dihapus karena sudah memiliki data catatan poin' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Semester berhasil dihapus' });
  } catch (error) {
    console.error('Delete semester error:', error);
    return NextResponse.json({ message: 'Gagal menghapus semester' }, { status: 500 });
  }
}
