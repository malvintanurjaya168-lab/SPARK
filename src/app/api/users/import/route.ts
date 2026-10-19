import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || session.role !== ROLES.KESISWAAN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Import request received:', body.length, 'items');
    
    if (!Array.isArray(body) || body.length === 0) {
      console.log('Invalid data format or empty array');
      return NextResponse.json({ message: 'Data import kosong atau format tidak valid' }, { status: 400 });
    }

    // Format data for insert
    const usersToInsert = body.map((user: any) => {
      const role = user.role?.toLowerCase() || 'siswa';
      
      const baseData: any = {
        nomor_induk: user.nomor_induk?.toString(),
        name: user.name,
        role: role,
        password: null, // Password null for first-time setup
      };

      // Handle role-specific fields
      if (role === 'guru') {
        baseData.wali_kelas = user.wali_kelas || null;
        baseData.kelas = null;
        baseData.angkatan = null;
      } else {
        // Default to siswa
        baseData.role = ROLES.SISWA;
        baseData.kelas = user.kelas?.toString() || null;
        baseData.angkatan = user.angkatan?.toString() || null;
      }

      return baseData;
    }).filter(u => u.nomor_induk && u.name); // Basic validation

    console.log('Valid users to insert:', usersToInsert.length);

    if (usersToInsert.length === 0) {
      return NextResponse.json({ message: 'Tidak ada data valid untuk diimport' }, { status: 400 });
    }

    const failed: any[] = [];
    let successCount = 0;

    // Insert users one by one to handle duplicates gracefully
    // Alternatively we could use upsert or batch insert, but this gives better error reporting per row
    for (const user of usersToInsert) {
      console.log('Inserting user:', user.nomor_induk, user.name);
      const { error } = await supabase
        .from('users')
        .insert([user]);
        
      if (error) {
        console.error('Insert error for user:', user.nomor_induk, error);
        let reason = error.message;
        if (error.code === '23505') reason = 'Nomor Induk sudah terdaftar';
        failed.push({ nomor_induk: user.nomor_induk, name: user.name, reason });
      } else {
        successCount++;
        console.log('Successfully inserted:', user.nomor_induk);
      }
    }

    console.log('Import completed:', successCount, 'success,', failed.length, 'failed');

    return NextResponse.json({
      success: successCount,
      failed,
      message: `Berhasil mengimport ${successCount} siswa. ${failed.length > 0 ? `${failed.length} data gagal.` : ''}`
    }, { status: 201 });
    
  } catch (error) {
    console.error('Import users error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat memproses import' }, { status: 500 });
  }
}
