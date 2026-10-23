import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || (session.role !== ROLES.KESISWAAN && session.role !== ROLES.ADMIN_PEMBINA_ASRAMA)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const semester_id = searchParams.get('semester_id');
    const kelas = searchParams.get('kelas');
    const angkatan = searchParams.get('angkatan');

    // Fetch point logs with location data
    let logsQuery = supabase
      .from('point_logs')
      .select('location, points_changed, student_id')
      .order('created_at', { ascending: false });

    if (semester_id) {
      logsQuery = logsQuery.eq('semester_id', semester_id);
    }

    const { data: logs, error: logsError } = await logsQuery;

    if (logsError) throw logsError;

    // Get student info for filtering
    const { data: students } = await supabase
      .from('users')
      .select('id, kelas, angkatan')
      .eq('role', ROLES.SISWA);

    const studentMap = new Map();
    if (students) {
      students.forEach((s: any) => {
        studentMap.set(s.id, { kelas: s.kelas, angkatan: s.angkatan });
      });
    }

    // Filter logs based on kelas and angkatan
    let filteredLogs = logs;
    if (kelas || angkatan) {
      filteredLogs = logs.filter((log: any) => {
        const student = studentMap.get(log.student_id);
        if (!student) return false;
        if (kelas && student.kelas !== kelas) return false;
        if (angkatan && student.angkatan !== angkatan) return false;
        return true;
      });
    }

    // Calculate location frequency for violations
    const violations = filteredLogs.filter((log: any) => log.points_changed < 0);
    const locationCounts = {
      sekolah: violations.filter((log: any) => log.location === 'sekolah').length,
      asrama: violations.filter((log: any) => log.location === 'asrama').length,
      luar: violations.filter((log: any) => log.location === 'luar').length,
    };

    // Calculate location frequency for rewards
    const rewards = filteredLogs.filter((log: any) => log.points_changed > 0);
    const rewardLocationCounts = {
      sekolah: rewards.filter((log: any) => log.location === 'sekolah').length,
      asrama: rewards.filter((log: any) => log.location === 'asrama').length,
      luar: rewards.filter((log: any) => log.location === 'luar').length,
    };

    const chartData = {
      violations: [
        { name: 'Sekolah', value: locationCounts.sekolah, color: '#3B82F6' },
        { name: 'Asrama', value: locationCounts.asrama, color: '#10B981' },
        { name: 'Luar Sekolah', value: locationCounts.luar, color: '#F59E0B' },
      ],
      rewards: [
        { name: 'Sekolah', value: rewardLocationCounts.sekolah, color: '#3B82F6' },
        { name: 'Asrama', value: rewardLocationCounts.asrama, color: '#10B981' },
        { name: 'Luar Sekolah', value: rewardLocationCounts.luar, color: '#F59E0B' },
      ],
      totalViolations: violations.length,
      totalRewards: rewards.length,
    };

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Export charts error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data chart' }, { status: 500 });
  }
}
