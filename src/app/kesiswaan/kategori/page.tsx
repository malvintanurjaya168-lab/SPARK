'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManajemenKategori() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'pelanggaran',
    severity: 'sedang',
    points_value: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Gagal mengambil kategori');
      const data = await res.json();
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'pelanggaran', severity: 'sedang', points_value: '' });
    setIsEdit(false);
    setSelectedCat(null);
  };

  const handleOpenEdit = (cat: any) => {
    setFormData({
      name: cat.name,
      type: cat.type,
      severity: cat.severity || 'sedang',
      points_value: cat.points_value.toString(),
    });
    setIsEdit(true);
    setSelectedCat(cat);
    setOpen(true);
  };

  const handleOpenDelete = (cat: any) => {
    setSelectedCat(cat);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const points = parseInt(formData.points_value);
      if (formData.type === 'pelanggaran' && points >= 0) {
        toast.error('Poin pelanggaran harus negatif (contoh: -5)');
        return;
      }
      if (formData.type === 'reward' && points <= 0) {
        toast.error('Poin reward harus positif (contoh: 5)');
        return;
      }

      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { id: selectedCat.id, ...formData, points_value: points } : { ...formData, points_value: points };
      
      const res = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success(`Kategori berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`);
      setOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedCat) return;
    try {
      const res = await fetch(`/api/categories?id=${selectedCat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      toast.success('Kategori berhasil dihapus');
      setDeleteOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const columns = [
    { header: 'Nama Kategori', accessorKey: 'name' as any, className: 'font-medium' },
    { 
      header: 'Tingkat Keparahan', 
      cell: (row: any) => {
        if (row.type !== 'pelanggaran') return '-';
        const colors = { ringan: 'bg-yellow-100 text-yellow-800', sedang: 'bg-orange-100 text-orange-800', berat: 'bg-red-100 text-red-800' };
        return <Badge variant="outline" className={`capitalize ${colors[row.severity as keyof typeof colors]}`}>{row.severity}</Badge>;
      }
    },
    { 
      header: 'Nilai Poin', 
      cell: (row: any) => (
        <span className={row.points_value > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
          {row.points_value > 0 ? `+${row.points_value}` : row.points_value}
        </span>
      )
    },
    {
      header: 'Aksi',
      cell: (row: any) => (
        <div className="flex gap-2">
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
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Manajemen Kategori Poin</h1>
          <p className="text-slate-500">Kelola daftar pelanggaran dan reward</p>
        </div>
        
        <Button className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={formData.type} onValueChange={(v: any) => { if (v) setFormData({...formData, type: v}); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe">
                        {formData.type === 'pelanggaran' ? 'Pelanggaran (Mengurangi Poin)' : formData.type === 'reward' ? 'Reward (Menambah Poin)' : 'Pilih Tipe'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pelanggaran">Pelanggaran (Mengurangi Poin)</SelectItem>
                      <SelectItem value="reward">Reward (Menambah Poin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Nama Kategori</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="Contoh: Terlambat masuk sekolah" 
                    required 
                  />
                </div>

                {formData.type === 'pelanggaran' && (
                  <div className="space-y-2">
                    <Label>Tingkat Keparahan</Label>
                    <Select value={formData.severity} onValueChange={(v: any) => { if (v) setFormData({...formData, severity: v}); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tingkat Keparahan">
                          {formData.severity === 'ringan' ? 'Ringan' : formData.severity === 'sedang' ? 'Sedang' : formData.severity === 'berat' ? 'Berat' : 'Pilih Tingkat Keparahan'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ringan">Ringan</SelectItem>
                        <SelectItem value="sedang">Sedang</SelectItem>
                        <SelectItem value="berat">Berat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Nilai Poin (gunakan tanda minus untuk pelanggaran)</Label>
                  <Input 
                    type="number" 
                    value={formData.points_value} 
                    onChange={(e) => setFormData({...formData, points_value: e.target.value})} 
                    placeholder={formData.type === 'pelanggaran' ? '-10' : '10'} 
                    required 
                  />
                </div>
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
        <Tabs defaultValue="pelanggaran">
          <CardHeader className="pb-0 border-b">
            <TabsList className="bg-transparent space-x-4">
              <TabsTrigger 
                value="pelanggaran" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Pelanggaran
              </TabsTrigger>
              <TabsTrigger 
                value="reward" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#C5A55A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Reward / Penghargaan
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="pelanggaran">
              <DataTable 
                columns={columns} 
                data={categories.filter(c => c.type === 'pelanggaran')} 
                pageSize={10} 
              />
            </TabsContent>
            <TabsContent value="reward">
              <DataTable 
                columns={columns.filter(c => c.header !== 'Tingkat Keparahan')} 
                data={categories.filter(c => c.type === 'reward')} 
                pageSize={10} 
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="py-4">Apakah Anda yakin ingin menghapus kategori <strong>{selectedCat?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
