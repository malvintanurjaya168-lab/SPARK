import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, createToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { nomor_induk, password } = await request.json();

    if (!nomor_induk || !password) {
      return NextResponse.json(
        { message: 'Nomor Induk dan Password wajib diisi' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('nomor_induk', nomor_induk)
      .single();

    // LOG DITAMBAHKAN DI SINI UNTUK DEBUGGING
    console.log(">>> SUPABASE ERROR:", error);
    console.log(">>> USER DATA:", user);

    if (error || !user) {
      return NextResponse.json(
        { message: 'Nomor Induk tidak ditemukan' },
        { status: 401 }
      );
    }

    // Check if password is null (first time login for imported users)
    if (user.password === null) {
      return NextResponse.json({
        requiresSetup: true,
        userId: user.id,
        name: user.name,
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { message: 'Password salah' },
        { status: 401 }
      );
    }

    // Create session token
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

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
