'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDateTime, formatDate } from '@/lib/utils';
import { SemesterFilter } from '@/components/semester-filter';

export default function RiwayatSiswa() {
  const [logs, setLogs] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const res = await fetch('/api/semesters');
      if (res.ok) setSemesters(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // First get our profile to know our student_id
      const resMe = await fetch('/api/auth/me');
      if (!resMe.ok) throw new Error('Unauthorized');
      const profile = await resMe.json();
      
      let url = `/api/point-logs?student_id=${profile.id}`;
      if (selectedSemester !== 'all') url += `&semester_id=${selectedSemester}`;
      
      const resLogs = await fetch(url);
      if (!resLogs.ok) throw new Error('Gagal mengambil riwayat');
      
      const logs = await resLogs.json();
      
      // Sort by created_at descending (newest first)
      logs.sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setLogs(logs);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      header: 'Tanggal & Semester', 
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium whitespace-nowrap">{formatDate(row.created_at)}</span>
          <span className="text-xs text-slate-500">{row.semester?.name || '-'}</span>
        </div>
      ) 
    },
    { 
      header: 'Kategori Kejadian', 
      cell: (row: any) => (
        <div className="flex flex-col min-w-[150px]">
          <span className="font-medium text-slate-800">{row.category?.name}</span>
          <span className="text-xs text-slate-500">Oleh: {row.recorder?.name}</span>
        </div>
      )
    },
    { 
      header: 'Poin', 
      cell: (row: any) => (
        <Badge variant="outline" className={row.category?.points_value > 0 ? 'bg-green-50 text-green-700 border-green-200 whitespace-nowrap' : 'bg-red-50 text-red-700 border-red-200 whitespace-nowrap'}>
          {row.category?.points_value > 0 ? `+${row.category?.points_value}` : row.category?.points_value} Poin
        </Badge>
      )
    },
    { 
      header: 'Keterangan', 
      accessorKey: 'notes' as any,
      cell: (row: any) => <p className="text-sm text-slate-600 max-w-[200px]" title={row.notes}>{row.notes || '-'}</p>
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Riwayat Kedisiplinan</h1>
          <p className="text-slate-500">Semua catatan pelanggaran dan penghargaan Anda</p>
        </div>
        
        <div className="w-full sm:w-auto">
          <SemesterFilter 
            semesters={semesters} 
            value={selectedSemester} 
            onChange={setSelectedSemester} 
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-4 text-slate-500">Memuat data...</p>
          ) : (
            <DataTable 
              columns={columns} 
              data={logs} 
              pageSize={15} 
              emptyMessage="Anda belum memiliki catatan kedisiplinan pada periode ini."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
