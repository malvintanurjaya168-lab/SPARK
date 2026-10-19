'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AktivitasLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'range' | 'month' | 'year'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, startDate, endDate, logs]);

  const applyFilters = () => {
    if (filterType === 'all') {
      setFilteredLogs(logs);
    } else if (filterType === 'range' && startDate && endDate) {
      const filtered = logs.filter(log => {
        const logDate = new Date(log.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end date
        return logDate >= start && logDate <= end;
      });
      setFilteredLogs(filtered);
    } else if (filterType === 'month') {
      const now = new Date();
      const filtered = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      });
      setFilteredLogs(filtered);
    } else if (filterType === 'year') {
      const now = new Date();
      const filtered = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.getFullYear() === now.getFullYear();
      });
      setFilteredLogs(filtered);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/point-logs');
      if (!res.ok) throw new Error('Gagal mengambil log aktivitas');
      const data = await res.json();
      
      // Sort by created_at descending (newest first)
      data.sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setLogs(data);
      setFilteredLogs(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Create export data from filtered logs
      const exportData = filteredLogs.map((log: any) => ({
        'Tanggal': new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        'Pencatat': log.recorder?.name || 'Unknown',
        'Siswa': log.student?.name || 'Unknown',
        'Kelas': log.student?.kelas || 'Tanpa Kelas',
        'Kategori': log.category?.name || 'Unknown',
        'Poin': log.points_changed,
        'Lokasi': log.location || 'Sekolah',
        'Catatan': log.notes || '-'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas Log');
      
      // Generate file name based on filter type
      let fileName = 'aktivitas-log-semua.xlsx';
      if (filterType === 'range' && startDate && endDate) {
        fileName = `aktivitas-log-${startDate}-sampai-${endDate}.xlsx`;
      } else if (filterType === 'month') {
        const now = new Date();
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        fileName = `aktivitas-log-${monthNames[now.getMonth()]}-${now.getFullYear()}.xlsx`;
      } else if (filterType === 'year') {
        const now = new Date();
        fileName = `aktivitas-log-${now.getFullYear()}.xlsx`;
      }
      
      // Download file
      XLSX.writeFile(wb, fileName);

      toast.success('Berhasil mengunduh file Excel');
    } catch (error) {
      toast.error('Gagal mengekspor data');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { 
      header: 'Pencatat', 
      accessorKey: 'recorder' as any,
      cell: (row: any) => (
        <div className="font-medium text-[#1B2A4A]">
          {row.recorder?.name || 'Unknown'}
        </div>
      )
    },
    { 
      header: 'Siswa', 
      accessorKey: 'student' as any,
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.student?.name}</div>
          <div className="text-xs text-slate-500">{row.student?.kelas || 'Tanpa Kelas'}</div>
        </div>
      )
    },
    { 
      header: 'Kategori', 
      accessorKey: 'category' as any,
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.category?.name}</div>
          {row.category?.severity && (
            <Badge variant="outline" className={`text-xs capitalize ${
              row.category.severity === 'ringan' ? 'bg-yellow-100 text-yellow-800' :
              row.category.severity === 'sedang' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {row.category.severity}
            </Badge>
          )}
        </div>
      )
    },
    { 
      header: 'Poin', 
      accessorKey: 'points_changed' as any,
      cell: (row: any) => {
        const isReward = row.points_changed > 0;
        return (
          <div className={`font-bold flex items-center gap-1 ${
            isReward ? 'text-green-600' : 'text-red-600'
          }`}>
            {isReward ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {isReward ? `+${row.points_changed}` : row.points_changed}
          </div>
        );
      }
    },
    { 
      header: 'Tanggal', 
      accessorKey: 'created_at' as any,
      cell: (row: any) => (
        <div className="text-sm text-slate-600">
          {new Date(row.created_at).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      )
    },
    { 
      header: 'Lokasi', 
      accessorKey: 'location' as any,
      cell: (row: any) => (
        <div className="text-sm text-slate-600 capitalize">
          {row.location === 'sekolah' ? 'Sekolah' : 
           row.location === 'asrama' ? 'Asrama' : 
           row.location === 'luar' ? 'Di luar sekolah' : 
           row.location || 'Sekolah'}
        </div>
      )
    },
    { 
      header: 'Catatan', 
      accessorKey: 'notes' as any,
      cell: (row: any) => (
        <div className="text-sm text-slate-600 max-w-xs truncate">
          {row.notes || '-'}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Log Aktivitas Poin</h1>
          <p className="text-slate-500">Riwayat semua pencatatan poin oleh guru, staff, dan kesiswaan</p>
        </div>
        
        <Button 
          variant="outline" 
          className="border-green-600 text-green-600 hover:bg-green-50"
          onClick={handleExport}
          disabled={exporting || filteredLogs.length === 0}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {exporting ? 'Mengekspor...' : 'Export Excel'}
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Filter Waktu</Label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'range' | 'month' | 'year')}
                className="w-48 bg-white px-3 py-2 rounded border border-slate-300"
              >
                <option value="all">Semua Data</option>
                <option value="range">Rentang Tanggal</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
              </select>
            </div>
            {filterType === 'range' && (
              <>
                <div className="space-y-1.5">
                  <Label>Dari Tanggal</Label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sampai Tanggal</Label>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40 bg-white"
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Info</Label>
              <div className="text-sm text-slate-600 bg-white px-3 py-2 rounded border">
                {filteredLogs.length} aktivitas
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-500">Memuat data...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              {filterType !== 'all' ? 'Tidak ada aktivitas sesuai filter' : 'Belum ada aktivitas tercatat'}
            </p>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                Menampilkan {filteredLogs.length} dari {logs.length} aktivitas
              </div>
              <DataTable 
                columns={columns} 
                data={filteredLogs} 
                pageSize={20} 
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
