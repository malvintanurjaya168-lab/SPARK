'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { PointBadge } from '@/components/point-badge';
import { Users, Info, TrendingUp, TrendingDown } from 'lucide-react';

export default function WaliKelasPage() {
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentLogs, setStudentLogs] = useState<Record<number, any[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchTeacherAndStudents();
  }, []);

  const fetchTeacherAndStudents = async () => {
    try {
      // Get current teacher's info including wali_kelas
      const resMe = await fetch('/api/auth/me?t=' + Date.now());
      if (resMe.ok) {
        const userData = await resMe.json();
        setTeacherInfo(userData);

        // If teacher is a wali kelas, fetch students in that class
        if (userData.wali_kelas) {
          const resStudents = await fetch(`/api/users?role=siswa&kelas=${encodeURIComponent(userData.wali_kelas)}`);
          if (resStudents.ok) {
            const studentsData = await resStudents.json();
            setStudents(studentsData);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentLogs = async (studentId: number) => {
    if (studentLogs[studentId]) return; // Already loaded
    
    setLoadingLogs(prev => ({ ...prev, [studentId]: true }));
    try {
      const res = await fetch(`/api/point-logs?student_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentLogs(prev => ({ ...prev, [studentId]: data }));
      } else {
        console.error('Failed to fetch student logs, status:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch student logs:', error);
    } finally {
      setLoadingLogs(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const renderExpandedContent = (row: any) => {
    const logs = studentLogs[row.id];
    const isLoading = loadingLogs[row.id];

    if (isLoading) {
      return (
        <div className="text-center py-4 text-slate-500">
          Memuat detail poin...
        </div>
      );
    }

    if (!logs || logs.length === 0) {
      return (
        <div className="text-center py-4 text-slate-500">
          Tidak ada data poin untuk siswa ini.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {logs.map((log: any) => {
          const isReward = log.category?.points_value > 0;
          return (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-white rounded border border-slate-200">
              <div className={`mt-0.5 p-2 rounded-full ${isReward ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isReward ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 leading-tight">{log.category?.name}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {log.notes && <p className="text-xs text-slate-500 mt-1 italic">{log.notes}</p>}
              </div>
              <div className={`font-bold ${isReward ? 'text-green-600' : 'text-red-600'}`}>
                {isReward ? `+${log.category?.points_value}` : log.category?.points_value}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const columns = [
    { header: 'Nomor Induk', accessorKey: 'nomor_induk' as any },
    { header: 'Nama Siswa', accessorKey: 'name' as any, className: 'font-medium' },
    { header: 'Kelas', accessorKey: 'kelas' as any },
    { header: 'Angkatan', accessorKey: 'angkatan' as any },
    { 
      header: 'Total Poin', 
      cell: (row: any) => <PointBadge points={row.total_points} size="sm" />
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Memuat data...</div>
      </div>
    );
  }

  if (!teacherInfo.wali_kelas) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Wali Kelas</h1>
          <p className="text-slate-500">Kelola siswa di kelas yang Anda bina</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Bukan Wali Kelas</h3>
                <p className="text-slate-500 mt-2 max-w-md">
                  Anda saat ini tidak ditugaskan sebagai wali kelas. Hubungi Admin Kesiswaan untuk penugasan wali kelas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Wali Kelas</h1>
        <p className="text-slate-500">Kelola siswa di kelas {teacherInfo.wali_kelas}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Daftar Siswa - {teacherInfo.wali_kelas}</CardTitle>
            <div className="text-sm text-slate-500">
              Total: {students.length} siswa
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-500 flex flex-col items-center">
              <Info className="h-8 w-8 text-slate-300 mb-2" />
              <p>Tidak ada siswa di kelas ini.</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={students} 
              pageSize={15} 
              expandable={true}
              onRowExpand={(row) => fetchStudentLogs(row.id)}
              renderExpandedContent={renderExpandedContent}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
