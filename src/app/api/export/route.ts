import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES, POINT_BASE, STATUS_THRESHOLDS } from '@/lib/constants';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || (session.role !== ROLES.KESISWAAN && session.role !== ROLES.ADMIN_PEMBINA_ASRAMA)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const angkatan = searchParams.get('angkatan');
    const student_name = searchParams.get('student_name');
    const semester_id = searchParams.get('semester_id'); // Optional, if provided filters logs to that semester
    const status = searchParams.get('status'); // Filter by status: critical, warning, good, excellent
    const location = searchParams.get('location'); // Filter by location: sekolah, asrama, luar
    const most_common_case = searchParams.get('most_common_case'); // Filter by most common case
    const recent_case = searchParams.get('recent_case'); // Filter by recent case (days)
    const format = searchParams.get('format') || 'excel';

    let query = supabase.from('users').select(`
      id, nomor_induk, name, kelas, angkatan, initial_points,
      point_logs!point_logs_student_id_fkey(id, points_changed, semester_id, location, created_at, notes, category_id)
    `).eq('role', ROLES.SISWA);

    if (kelas) query = query.eq('kelas', kelas);
    if (angkatan) query = query.eq('angkatan', angkatan);
    if (student_name) query = query.ilike('name', `%${student_name}%`);

    const { data: users, error } = await query.order('name');

    if (error) throw error;

    // Fetch all guru users to get wali kelas information
    const { data: guruUsers, error: guruError } = await supabase
      .from('users')
      .select('name, wali_kelas')
      .eq('role', ROLES.GURU);

    if (guruError) console.error('Error fetching guru users:', guruError);

    // Create a map of kelas to wali kelas name
    const waliKelasMap: Record<string, string> = {};
    if (guruUsers) {
      guruUsers.forEach((guru: any) => {
        if (guru.wali_kelas) {
          waliKelasMap[guru.wali_kelas] = guru.name;
        }
      });
    }

    // Fetch all point categories to get category names
    // Note: This is no longer needed since we removed the violation history column
    // Keeping the code in case it's needed for future features

    const reportData = users.map(user => {
      let logs = user.point_logs || [];
      
      // If semester_id is provided, only calculate points for that semester
      // Note: Use initial_points from user instead of hardcoded POINT_BASE
      if (semester_id) {
        logs = logs.filter((log: any) => log.semester_id?.toString() === semester_id);
      }
      
      // If recent_case is provided, only include logs from recent days
      if (recent_case && recent_case !== 'all') {
        const daysAgo = parseInt(recent_case);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        logs = logs.filter((log: any) => {
          const logDate = new Date(log.created_at);
          return logDate >= cutoffDate;
        });
      }
      
      // Calculate total points from ALL logs (not filtered by location)
      const initialPoints = user.initial_points || POINT_BASE;
      const totalPointsChanged = logs.reduce((sum: number, log: any) => sum + (log.points_changed || 0), 0);
      const finalPoints = initialPoints + totalPointsChanged;
      
      // Count violations and rewards by location from ALL logs
      const violationsSekolah = logs.filter((log: any) => log.points_changed < 0 && log.location === 'sekolah').length;
      const violationsAsrama = logs.filter((log: any) => log.points_changed < 0 && log.location === 'asrama').length;
      const violationsLuar = logs.filter((log: any) => log.points_changed < 0 && log.location === 'luar').length;
      const rewardsSekolah = logs.filter((log: any) => log.points_changed > 0 && log.location === 'sekolah').length;
      const rewardsAsrama = logs.filter((log: any) => log.points_changed > 0 && log.location === 'asrama').length;
      const rewardsLuar = logs.filter((log: any) => log.points_changed > 0 && log.location === 'luar').length;
      
      // If location filter is provided, only include students who have logs in that location
      if (location && location !== 'all') {
        const hasLogsInLocation = logs.some((log: any) => {
          const logLocation = log.location?.toLowerCase();
          const filterLocation = location.toLowerCase();
          return logLocation === filterLocation;
        });
        if (!hasLogsInLocation) {
          return null; // Skip this student
        }
      }
      
      // If most_common_case is true, only include students with violations
      if (most_common_case === 'true') {
        const hasViolations = logs.some((log: any) => log.points_changed < 0);
        if (!hasViolations) {
          return null; // Skip this student
        }
      }
      
      return {
        'Student ID': user.id,
        'Nomor Induk': user.nomor_induk,
        'Nama Siswa': user.name,
        'Kelas': user.kelas || '-',
        'Angkatan': user.angkatan || '-',
        'Wali Kelas': user.kelas ? (waliKelasMap[user.kelas] || '-') : '-',
        'Total Poin': finalPoints,
        'Pelanggaran Sekolah': violationsSekolah,
        'Pelanggaran Asrama': violationsAsrama,
        'Pelanggaran Luar Sekolah': violationsLuar,
        'Reward Sekolah': rewardsSekolah,
        'Reward Asrama': rewardsAsrama,
        'Reward Luar Sekolah': rewardsLuar
      };
    }).filter((item: any) => item !== null); // Remove null entries

    // Apply status filter if provided
    let filteredData = reportData;
    if (status && status !== 'all') {
      filteredData = reportData.filter((item: any) => {
        const points = item['Total Poin'] || POINT_BASE;
        switch (status) {
          case 'critical':
            return points < STATUS_THRESHOLDS.WARNING;
          case 'warning':
            return points >= STATUS_THRESHOLDS.WARNING && points <= STATUS_THRESHOLDS.GOOD;
          case 'good':
            return points > STATUS_THRESHOLDS.GOOD && points < STATUS_THRESHOLDS.EXCELLENT;
          case 'excellent':
            return points >= STATUS_THRESHOLDS.EXCELLENT;
          default:
            return true;
        }
      });
    }

    // Sort by most common case (total violations) if filter is active
    if (most_common_case === 'true') {
      filteredData.sort((a: any, b: any) => {
        const totalViolationsA = (a['Pelanggaran Sekolah'] || 0) + (a['Pelanggaran Asrama'] || 0) + (a['Pelanggaran Luar Sekolah'] || 0);
        const totalViolationsB = (b['Pelanggaran Sekolah'] || 0) + (b['Pelanggaran Asrama'] || 0) + (b['Pelanggaran Luar Sekolah'] || 0);
        return totalViolationsB - totalViolationsA; // Descending order
      });
    }

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Poin");
      
      const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(buf, {
        headers: {
          'Content-Disposition': `attachment; filename="laporan-poin-spark.xlsx"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      });
    }

    if (format === 'csv') {
      // Custom CSV formatting for better readability
      const headers = Object.keys(filteredData[0] || {});
      const csvRows = [];
      
      // Add header row
      csvRows.push(headers.join(','));
      
      // Add data rows
      for (const row of filteredData) {
        if (!row) continue;
        
        const values = headers.map(header => {
          const value = (row as any)[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle numbers
          if (typeof value === 'number') return value;
          // Handle strings - escape quotes and wrap in quotes
          const stringValue = String(value);
          const escaped = stringValue.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const csvContent = csvRows.join('\n');
      const buf = Buffer.from(csvContent, 'utf-8');
      
      return new NextResponse(buf, {
        headers: {
          'Content-Disposition': 'attachment; filename="laporan-poin-spark.csv"',
          'Content-Type': 'text/csv; charset=utf-8',
        }
      });
    }

    // For PDF or other formats we can just return JSON for now
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ message: 'Gagal mengekspor data' }, { status: 500 });
  }
}
