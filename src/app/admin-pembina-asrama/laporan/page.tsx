'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { PointBadge } from '@/components/point-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown } from 'lucide-react';
import { SemesterFilter } from '@/components/semester-filter';
import { POINT_BASE, STATUS_THRESHOLDS } from '@/lib/constants';
import { toast } from 'sonner';
import { LocationCharts } from '@/components/location-charts';

export default function AdminPembinaAsramaLaporan() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [studentLogs, setStudentLogs] = useState<Record<number, any[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<number, boolean>>({});
  
  // Filter state
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  
  // Debounced filter values
  const [debouncedFilterKelas, setDebouncedFilterKelas] = useState('');
  const [debouncedFilterAngkatan, setDebouncedFilterAngkatan] = useState('');
  const [debouncedSearchName, setDebouncedSearchName] = useState('');
  const [debouncedFilterLocation, setDebouncedFilterLocation] = useState('all');

  // Debounce filter inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterKelas(filterKelas);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterKelas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterAngkatan(filterAngkatan);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterAngkatan]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchName(searchName);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterLocation(filterLocation);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterLocation]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedSemester, debouncedFilterKelas, debouncedFilterAngkatan, debouncedSearchName, filterStatus, debouncedFilterLocation]);

  // Clear cached student logs when location filter changes
  useEffect(() => {
    setStudentLogs({});
  }, [debouncedFilterLocation]);

  const fetchSemesters = async () => {
    try {
      const res = await fetch('/api/semesters');
      if (res.ok) {
        const data = await res.json();
        setSemesters(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = '/api/export?format=json';
      
      if (debouncedFilterKelas) url += `&kelas=${encodeURIComponent(debouncedFilterKelas)}`;
      if (debouncedFilterAngkatan) url += `&angkatan=${encodeURIComponent(debouncedFilterAngkatan)}`;
      if (debouncedSearchName) url += `&student_name=${encodeURIComponent(debouncedSearchName)}`;
      if (filterStatus && filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (selectedSemester !== 'all') url += `&semester_id=${selectedSemester}`;
      if (debouncedFilterLocation && debouncedFilterLocation !== 'all') url += `&location=${encodeURIComponent(debouncedFilterLocation)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data laporan');
      
      const data = await res.json();
      const formatted = data.map((item: any) => ({
        id: item['Student ID'],
        nomor_induk: item['Nomor Induk'],
        name: item['Nama Siswa'],
        kelas: item['Kelas'],
        angkatan: item['Angkatan'],
        wali_kelas: item['Wali Kelas'] || '-',
        total_points: item['Total Poin'],
      }));
      
      // Apply status filter
      let finalData = formatted;
      if (filterStatus !== 'all') {
        finalData = formatted.filter((item: any) => {
          const points = item.total_points || POINT_BASE;
          switch (filterStatus) {
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

      // Sort by points lowest to highest
      finalData.sort((a: any, b: any) => a.total_points - b.total_points);
      
      setReportData(finalData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    setExporting(true);
    try {
      let url = `/api/export?format=${format}`;
      
      if (filterKelas) url += `&kelas=${encodeURIComponent(filterKelas)}`;
      if (filterAngkatan) url += `&angkatan=${encodeURIComponent(filterAngkatan)}`;
      if (searchName) url += `&student_name=${encodeURIComponent(searchName)}`;
      if (filterStatus && filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (selectedSemester !== 'all') url += `&semester_id=${selectedSemester}`;
      if (filterLocation && filterLocation !== 'all') url += `&location=${encodeURIComponent(filterLocation)}`;
      if (mostCommonCase && mostCommonCase !== 'all') url += `&most_common_case=${encodeURIComponent(mostCommonCase)}`;
      if (recentCase && recentCase !== 'all') url += `&recent_case=${encodeURIComponent(recentCase)}`;
      
      window.open(url, '_blank');
      toast.success(`Berhasil mengunduh file ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Gagal mengekspor data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async (studentId: number) => {
    try {
      let url = `/api/student-report-pdf?student_id=${studentId}`;
      if (selectedSemester !== 'all') url += `&semester_id=${selectedSemester}`;
      
      window.open(url, '_blank');
      toast.success('Berhasil mengunduh PDF');
    } catch (error) {
      toast.error('Gagal mengekspor PDF');
    }
  };

  const fetchStudentLogs = async (studentId: number) => {
    if (studentLogs[studentId]) return;
    
    setLoadingLogs(prev => ({ ...prev, [studentId]: true }));
    try {
      let url = `/api/point-logs?student_id=${studentId}`;
      if (selectedSemester !== 'all') url += `&semester_id=${selectedSemester}`;
      if (debouncedFilterLocation && debouncedFilterLocation !== 'all') url += `&location=${encodeURIComponent(debouncedFilterLocation)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudentLogs(prev => ({ ...prev, [studentId]: data }));
      } else {
        console.error('Failed to fetch student logs, status:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch student logs:', error);
      toast.error('Gagal mengambil detail poin siswa');
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
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportPDF(row.id)}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Download PDF Report
        </Button>
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
                  <p className="text-xs text-slate-500 mt-1">📍 {log.location || '-'}</p>
                  {log.notes && <p className="text-xs text-slate-500 mt-1 italic">{log.notes}</p>}
                </div>
                <div className={`font-bold ${isReward ? 'text-green-600' : 'text-red-600'}`}>
                  {isReward ? `+${log.category?.points_value}` : log.category?.points_value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const columns = [
    { header: 'Nomor Induk', accessorKey: 'nomor_induk' as any },
    { header: 'Nama Siswa', accessorKey: 'name' as any, className: 'font-medium' },
    { header: 'Kelas', accessorKey: 'kelas' as any },
    { header: 'Angkatan', accessorKey: 'angkatan' as any },
    { header: 'Wali Kelas', accessorKey: 'wali_kelas' as any },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Laporan & Export</h1>
          <p className="text-slate-500">Unduh laporan akumulasi poin siswa</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() => handleExport('excel')}
            disabled={exporting || loading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]"
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Filter Semester</Label>
              <SemesterFilter 
                semesters={semesters} 
                value={selectedSemester} 
                onChange={setSelectedSemester} 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Filter Nama Siswa</Label>
              <Input 
                placeholder="Cari nama siswa..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-48 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Filter Kelas</Label>
              <Input 
                placeholder="Contoh: X IPA 1" 
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="w-48 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Filter Angkatan</Label>
              <Input 
                placeholder="Contoh: 2025" 
                value={filterAngkatan}
                onChange={(e) => setFilterAngkatan(e.target.value)}
                className="w-40 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Filter Status Poin</Label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-48 bg-white px-3 py-2 rounded border border-slate-300"
              >
                <option value="all">Semua Status</option>
                <option value="critical">Critical (&lt; {STATUS_THRESHOLDS.WARNING})</option>
                <option value="warning">Warning ({STATUS_THRESHOLDS.WARNING} - {STATUS_THRESHOLDS.GOOD})</option>
                <option value="good">Good ({STATUS_THRESHOLDS.GOOD + 1} - {STATUS_THRESHOLDS.EXCELLENT - 1})</option>
                <option value="excellent">Excellent (&ge; {STATUS_THRESHOLDS.EXCELLENT})</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Filter Lokasi</Label>
              <select 
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-48 bg-white px-3 py-2 rounded border border-slate-300"
              >
                <option value="all">Semua Lokasi</option>
                <option value="sekolah">Sekolah</option>
                <option value="asrama">Asrama</option>
                <option value="luar">Di luar sekolah</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-4 text-slate-500">Memuat data...</p>
          ) : (
            <DataTable 
              columns={columns} 
              data={reportData} 
              pageSize={15} 
              expandable={true}
              onRowExpand={(row) => fetchStudentLogs(row.id)}
              renderExpandedContent={renderExpandedContent}
            />
          )}
        </CardContent>
      </Card>
      
      <LocationCharts 
        semesterId={selectedSemester}
        kelas={filterKelas}
        angkatan={filterAngkatan}
      />
    </div>
  );
}
