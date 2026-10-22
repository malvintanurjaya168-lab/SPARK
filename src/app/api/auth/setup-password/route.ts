import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, createToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    console.log('Setup password request:', { userId, password: password ? '***' : 'empty' });

    if (!userId || !password) {
      console.log('Missing data:', { userId: !!userId, password: !!password });
      return NextResponse.json(
        { message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('Password too short:', password.length);
      return NextResponse.json(
        { message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    // Update user in database
    const { data: user, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { message: 'Gagal mengatur password: ' + error.message },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('User not found with id:', userId);
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('User updated successfully:', user.id);

    // Create session token (auto-login)
    const token = await createToken({
      id: user.id,
      nomor_induk: user.nomor_induk,
      name: user.name,
      role: user.role,
      kelas: user.kelas,
      angkatan: user.angkatan,
    });

    // Set cookie
    const response = NextResponse.json({
      id: user.id,
      nomor_induk: user.nomor_induk,
      name: user.name,
      role: user.role,
      kelas: user.kelas,
      angkatan: user.angkatan,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    console.log('Password setup completed successfully');
    return response;
  } catch (error) {
    console.error('Setup password error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
