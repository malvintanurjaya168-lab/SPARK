'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function ManajemenSemester() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const res = await fetch('/api/semesters');
      if (!res.ok) throw new Error('Gagal mengambil data semester');
      const data = await res.json();
      setSemesters(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', start_date: '', end_date: '', is_active: false });
    setIsEdit(false);
    setSelectedSemester(null);
  };

  const handleOpenEdit = (semester: any) => {
    setFormData({
      name: semester.name,
      start_date: semester.start_date,
      end_date: semester.end_date,
      is_active: semester.is_active,
    });
    setIsEdit(true);
    setSelectedSemester(semester);
    setOpen(true);
  };

  const handleOpenDelete = (semester: any) => {
    setSelectedSemester(semester);
    setDeleteOpen(true);
  };

  const handleActivate = async (semester: any) => {
    try {
      const res = await fetch('/api/semesters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...semester, is_active: true }),
      });

      if (!res.ok) throw new Error('Gagal mengaktifkan semester');
      
      toast.success('Semester berhasil diaktifkan');
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { id: selectedSemester.id, ...formData } : formData;
      
      const res = await fetch('/api/semesters', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success(`Semester berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`);
      setOpen(false);
      resetForm();
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedSemester) return;
    try {
      const res = await fetch(`/api/semesters?id=${selectedSemester.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      toast.success('Semester berhasil dihapus');
      setDeleteOpen(false);
      fetchSemesters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const columns = [
    { header: 'Nama Semester', accessorKey: 'name' as any, className: 'font-medium' },
    { 
      header: 'Tanggal Mulai', 
      cell: (row: any) => formatDate(row.start_date)
    },
    { 
      header: 'Tanggal Selesai', 
      cell: (row: any) => formatDate(row.end_date)
    },
    { 
      header: 'Status', 
      cell: (row: any) => (
        row.is_active 
          ? <Badge className="bg-green-100 text-green-800 border-green-200">Aktif</Badge>
          : <Badge variant="outline" className="text-slate-500">Nonaktif</Badge>
      )
    },
    {
      header: 'Aksi',
      cell: (row: any) => (
        <div className="flex gap-2 items-center">
          {!row.is_active && (
            <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleActivate(row)}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aktifkan
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleOpenDelete(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Manajemen Semester</h1>
          <p className="text-slate-500">Kelola periode akademik sekolah</p>
        </div>
        
        <Button className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Semester
        </Button>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEdit ? 'Edit Semester' : 'Tambah Semester Baru'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Semester</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Contoh: Ganjil 2025/2026" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input 
                      type="date"
                      value={formData.start_date} 
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Input 
                      type="date"
                      value={formData.end_date} 
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                {!isEdit && (
                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="is_active" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded border-gray-300 text-[#1B2A4A] shadow-sm focus:border-[#1B2A4A] focus:ring focus:ring-[#1B2A4A] focus:ring-opacity-50"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">Jadikan sebagai semester aktif saat ini</Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-4 text-slate-500">Memuat data...</p>
          ) : (
            <DataTable 
              columns={columns} 
              data={semesters} 
              pageSize={10} 
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="py-4">Apakah Anda yakin ingin menghapus semester <strong>{selectedSemester?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
