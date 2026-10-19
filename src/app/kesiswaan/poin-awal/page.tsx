'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Save, X, Search } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  nomor_induk: string;
  kelas: string;
  initial_points: number;
}

export default function PoinAwalPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nomor_induk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.kelas.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users?role=siswa');
      if (!res.ok) throw new Error('Gagal mengambil data siswa');
      const data = await res.json();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setEditValue(student.initial_points);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const handleSave = async (studentId: number) => {
    if (editValue < 0) {
      toast.error('Poin awal tidak boleh negatif');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/initial-points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: studentId,
          initial_points: editValue,
        }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui poin awal');

      toast.success('Poin awal berhasil diperbarui');
      
      // Update local state
      setStudents(students.map(s => 
        s.id === studentId ? { ...s, initial_points: editValue } : s
      ));
      
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'NIS',
      accessorKey: 'nomor_induk' as keyof Student,
      cell: (row: Student) => <span className="font-medium">{row.nomor_induk}</span>
    },
    {
      header: 'Nama Siswa',
      accessorKey: 'name' as keyof Student,
      cell: (row: Student) => <span className="font-medium">{row.name}</span>
    },
    {
      header: 'Kelas',
      accessorKey: 'kelas' as keyof Student,
    },
    {
      header: 'Poin Awal',
      accessorKey: 'initial_points' as keyof Student,
      cell: (row: Student) => {
        if (editingId === row.id) {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                className="w-24"
                min="0"
              />
              <Button
                size="sm"
                onClick={() => handleSave(row.id)}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{row.initial_points}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(row)}
              className="h-8 w-8 p-0"
            >
              ✏️
            </Button>
          </div>
        );
      }
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        Memuat data siswa...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Pengaturan Poin Awal Siswa</h1>
        <p className="text-slate-500">Atur poin awal untuk setiap siswa</p>
      </div>

      <Card className="shadow-lg border-t-4 border-t-[#1B2A4A]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Siswa</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredStudents}
            pageSize={20}
            emptyMessage="Tidak ada siswa ditemukan"
          />
        </CardContent>
      </Card>
    </div>
  );
}
