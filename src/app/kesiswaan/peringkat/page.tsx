'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { PointBadge } from '@/components/point-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { POINT_BASE, STATUS_THRESHOLDS } from '@/lib/constants';

export default function PeringkatPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'critical' | 'warning' | 'good' | 'excellent'>('all');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
    fetchSemesters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedClass, selectedSemester, selectedStatus, students]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users?role=siswa');
      if (!res.ok) throw new Error('Gagal mengambil data siswa');
      const data = await res.json();
      setStudents(data);
      
      // Extract unique classes
      const uniqueClasses = [...new Set(data.map((s: any) => s.kelas).filter(Boolean))] as string[];
      setClasses(uniqueClasses);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await fetch('/api/semesters');
      if (!res.ok) throw new Error('Gagal mengambil data semester');
      const data = await res.json();
      setSemesters(data);
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nomor_induk.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Class filter
    if (selectedClass) {
      filtered = filtered.filter(s => s.kelas === selectedClass);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => {
        const points = s.total_points || POINT_BASE;
        switch (selectedStatus) {
          case 'critical':
            return points < STATUS_THRESHOLDS.WARNING;
          case 'warning':
            return points >= STATUS_THRESHOLDS.WARNING && points < STATUS_THRESHOLDS.GOOD;
          case 'good':
            return points >= STATUS_THRESHOLDS.GOOD && points < STATUS_THRESHOLDS.EXCELLENT;
          case 'excellent':
            return points >= STATUS_THRESHOLDS.EXCELLENT;
          default:
            return true;
        }
      });
    }

    // Sort by points ascending (lowest first)
    filtered.sort((a, b) => (a.total_points || POINT_BASE) - (b.total_points || POINT_BASE));

    setFilteredStudents(filtered);
  };

  const columns = [
    { header: 'Nama Siswa', accessorKey: 'name' as any },
    { header: 'Nomor Induk', accessorKey: 'nomor_induk' as any },
    { header: 'Kelas', accessorKey: 'kelas' as any },
    { 
      header: 'Poin Saat Ini', 
      cell: (row: any) => <PointBadge points={row.total_points || POINT_BASE} size="sm" />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Peringkat Siswa</h1>
        <p className="text-slate-500">Daftar peringkat siswa berdasarkan poin kedisiplinan</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Cari Siswa</Label>
              <Input 
                type="text"
                placeholder="Nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Filter Kelas</Label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-48 bg-white px-3 py-2 rounded border border-slate-300"
              >
                <option value="">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Filter Status Poin</Label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-48 bg-white px-3 py-2 rounded border border-slate-300"
              >
                <option value="all">Semua Status</option>
                <option value="critical">Critical (&lt; {STATUS_THRESHOLDS.WARNING})</option>
                <option value="warning">Warning ({STATUS_THRESHOLDS.WARNING} - {STATUS_THRESHOLDS.GOOD - 1})</option>
                <option value="good">Good ({STATUS_THRESHOLDS.GOOD} - {STATUS_THRESHOLDS.EXCELLENT - 1})</option>
                <option value="excellent">Excellent (&ge; {STATUS_THRESHOLDS.EXCELLENT})</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Info</Label>
              <div className="text-sm text-slate-600 bg-white px-3 py-2 rounded border">
                {filteredStudents.length} siswa
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-500">Memuat data...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              {searchTerm || selectedClass || selectedStatus !== 'all' ? 'Tidak ada siswa sesuai filter' : 'Belum ada data siswa'}
            </p>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredStudents} 
              pageSize={20} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
