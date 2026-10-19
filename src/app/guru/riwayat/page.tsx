'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function RiwayatJurnalGuru() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // In a real scenario with proper API endpoints, we would fetch /api/point-logs?me=true
      // Or filter client side based on current user session
      const res = await fetch('/api/point-logs');
      if (!res.ok) throw new Error('Gagal mengambil riwayat');
      
      const data = await res.json();
      
      // Sort by created_at descending (newest first)
      data.sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Filter for logs made by this guru. 
      // Our point-logs endpoint handles role=guru by only returning their own logs (as per auth.ts session role check in API)
      setLogs(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (log: any) => {
    setSelectedLog(log);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedLog) return;
    try {
      const res = await fetch(`/api/point-logs?id=${selectedLog.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      toast.success('Catatan berhasil dihapus');
      setDeleteOpen(false);
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Check if a log is older than 24 hours
  const isDeletable = (dateString: string) => {
    const logDate = new Date(dateString).getTime();
    const now = new Date().getTime();
    const hours24 = 24 * 60 * 60 * 1000;
    return (now - logDate) <= hours24;
  };

  const columns = [
    { 
      header: 'Tanggal', 
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatDate(row.created_at)}</span>
          <span className="text-xs text-slate-500">Semester: {row.semester?.name || '-'}</span>
        </div>
      ) 
    },
    { 
      header: 'Siswa', 
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.student?.name}</span>
          <span className="text-xs text-slate-500">{row.student?.nomor_induk} - {row.student?.kelas}</span>
        </div>
      )
    },
    { 
      header: 'Kategori', 
      cell: (row: any) => (
        <div className="flex flex-col">
          <span>{row.category?.name}</span>
          <div className="mt-1">
            <Badge variant="outline" className={row.category?.points_value > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
              {row.category?.points_value > 0 ? `+${row.category?.points_value}` : row.category?.points_value} Poin
            </Badge>
          </div>
        </div>
      )
    },
    { 
      header: 'Keterangan', 
      accessorKey: 'notes' as any,
      cell: (row: any) => <p className="text-sm text-slate-600 max-w-[200px] truncate" title={row.notes}>{row.notes || '-'}</p>
    },
    { 
      header: 'Lokasi', 
      accessorKey: 'location' as any,
      cell: (row: any) => (
        <p className="text-sm text-slate-600">
          {row.location === 'sekolah' ? 'Sekolah' : 
           row.location === 'asrama' ? 'Asrama' : 
           row.location === 'luar' ? 'Di luar sekolah' : 
           row.location || 'Sekolah'}
        </p>
      )
    },
    {
      header: 'Aksi',
      cell: (row: any) => {
        const canDelete = isDeletable(row.created_at);
        return (
          <div className="flex gap-2">
            {canDelete ? (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleOpenDelete(row)}>
                <Trash2 className="h-4 w-4 mr-1" /> Batal
              </Button>
            ) : (
              <span className="text-xs text-slate-400 italic">Terkunci (&gt;24j)</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Riwayat Catatan Anda</h1>
          <p className="text-slate-500">Log poin kedisiplinan yang Anda catat (Batas pembatalan 24 jam)</p>
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
              pageSize={10} 
              emptyMessage="Belum ada riwayat catatan poin."
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembatalan</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Apakah Anda yakin ingin menghapus catatan poin ini? 
            Poin siswa <strong>{selectedLog?.student?.name}</strong> akan dikembalikan seperti semula.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Kembali</Button>
            <Button variant="destructive" onClick={handleDelete}>Ya, Hapus Catatan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
