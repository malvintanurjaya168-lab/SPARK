'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Upload, FileSpreadsheet, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { ImportDialog } from '@/components/import-dialog';
import * as XLSX from 'xlsx';

export default function ManajemenPengguna() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('siswa');
  
  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  
  // Bulk update state
  const [bulkInitialPoints, setBulkInitialPoints] = useState(100);
  
  // Form state
  const [formData, setFormData] = useState({
    nomor_induk: '',
    name: '',
    role: 'siswa',
    kelas: '',
    angkatan: '',
    initial_points: 100,
    wali_kelas: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchUsers(activeTab);
  }, [filterName, filterKelas, filterAngkatan]);

  const fetchUsers = async (role: string) => {
    setLoading(true);
    try {
      let url = `/api/users?role=${role}`;
      
      // Apply filters
      if (filterName) {
        url += `&search=${encodeURIComponent(filterName)}`;
      }
      if (filterKelas && role === 'siswa') {
        url += `&kelas=${encodeURIComponent(filterKelas)}`;
      }
      if (filterAngkatan && role === 'siswa') {
        url += `&angkatan=${encodeURIComponent(filterAngkatan)}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data pengguna');
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nomor_induk: '', name: '', role: activeTab, kelas: '', angkatan: '', initial_points: 100, wali_kelas: '', password: '' });
    setIsEdit(false);
    setSelectedUser(null);
  };

  const handleOpenEdit = (user: any) => {
    setFormData({
      nomor_induk: user.nomor_induk,
      name: user.name,
      role: user.role,
      kelas: user.kelas || '',
      angkatan: user.angkatan || '',
      initial_points: user.initial_points || 100,
      wali_kelas: user.wali_kelas || '',
      password: '', // Blank password implies no change
    });
    setIsEdit(true);
    setSelectedUser(user);
    setOpen(true);
  };

  const handleOpenDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password if provided
    if (formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.message);
        return;
      }
    }
    
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { id: selectedUser.id, ...formData } : formData;
      
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success(`Pengguna berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`);
      setOpen(false);
      resetForm();
      fetchUsers(activeTab);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users?id=${selectedUser.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      toast.success('Pengguna berhasil dihapus');
      setDeleteOpen(false);
      fetchUsers(activeTab);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkUpdate = async () => {
    if (bulkInitialPoints < 0) {
      toast.error('Poin awal tidak boleh negatif');
      return;
    }

    if (users.length === 0) {
      toast.error('Tidak ada siswa untuk diupdate');
      return;
    }

    const user_ids = users.map((u: any) => u.id);
    
    try {
      const res = await fetch('/api/users/bulk-initial-points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_points: bulkInitialPoints,
          user_ids,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const result = await res.json();
      toast.success(`Berhasil memperbarui poin awal ${result.updated_count} siswa`);
      setBulkUpdateOpen(false);
      fetchUsers(activeTab);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExportStudentLogs = async (student: any) => {
    try {
      const res = await fetch(`/api/point-logs?student_id=${student.id}`);
      if (!res.ok) throw new Error('Gagal mengambil data pelanggaran');
      
      const logs = await res.json();
      
      if (logs.length === 0) {
        toast.info(`Tidak ada data pelanggaran untuk ${student.name}`);
        return;
      }

      const exportData = logs.map((log: any) => ({
        'Tanggal': new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        'Semester': log.semester?.name || '-',
        'Kategori': log.category?.name || '-',
        'Poin': log.category?.points_value || 0,
        'Pencatat': log.recorder?.name || '-',
        'Catatan': log.notes || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Pelanggaran');
      
      const fileName = `riwayat-pelanggaran-${student.name.replace(/\s+/g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Berhasil mengekspor riwayat pelanggaran ${student.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengekspor data');
    }
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (!password) return { valid: true, message: '' }; // Password optional for create, blank for edit means no change
    
    if (password.length < 8) {
      return { valid: false, message: 'Password minimal 8 karakter' };
    }
    
    return { valid: true, message: '' };
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) return { strength, label: 'Lemah', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: 'Sedang', color: 'bg-yellow-500' };
    return { strength, label: 'Kuat', color: 'bg-green-500' };
  };

  const getColumns = (role: string) => {
    const baseColumns: any[] = [
      { header: 'Nomor Induk', accessorKey: 'nomor_induk' },
      { header: 'Nama', accessorKey: 'name' },
    ];

    if (role === 'siswa') {
      baseColumns.push(
        { header: 'Kelas', accessorKey: 'kelas' as any },
        { header: 'Angkatan', accessorKey: 'angkatan' as any },
        { header: 'Poin Awal', accessorKey: 'initial_points' as any }
      );
    }

    if (role === 'guru') {
      baseColumns.push(
        { 
          header: 'Wali Kelas', 
          accessorKey: 'wali_kelas' as any,
          cell: (row: any) => row.wali_kelas || '-'
        }
      );
    }

    baseColumns.push({
      header: 'Aksi',
      accessorKey: 'id' as any,
      cell: (row: any) => (
        <div className="flex gap-2">
          {role === 'siswa' && (
            <Button variant="outline" size="sm" onClick={() => handleExportStudentLogs(row)} title="Export Riwayat Pelanggaran">
              <FileSpreadsheet className="h-4 w-4" />
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
    });

    return baseColumns;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500">Kelola data siswa, guru, dan admin kesiswaan</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="border-[#1B2A4A] text-[#1B2A4A]">
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          
          <Button className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(v: any) => { if (v) setFormData({...formData, role: v}); }}
                      disabled={isEdit} // Don't allow changing role during edit to simplify logic
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Role">
                          {formData.role === 'siswa' ? 'Siswa' : formData.role === 'guru' ? 'Guru/Pembina' : formData.role === 'admin_pembina_asrama' ? 'Admin Pembina Asrama' : formData.role === 'kesiswaan' ? 'Bidang Kesiswaan' : 'Pilih Role'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siswa">Siswa</SelectItem>
                        <SelectItem value="guru">Guru/Pembina</SelectItem>
                        <SelectItem value="admin_pembina_asrama">Admin Pembina Asrama</SelectItem>
                        <SelectItem value="kesiswaan">Bidang Kesiswaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nomor Induk</Label>
                    <Input 
                      value={formData.nomor_induk} 
                      onChange={(e) => setFormData({...formData, nomor_induk: e.target.value})} 
                      required 
                      disabled={isEdit}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                    />
                  </div>

                  {formData.role === 'siswa' && (
                    <>
                      <div className="space-y-2">
                        <Label>Kelas</Label>
                        <Input 
                          value={formData.kelas} 
                          onChange={(e) => setFormData({...formData, kelas: e.target.value})} 
                          placeholder="Contoh: X IPA 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Angkatan</Label>
                        <Input 
                          value={formData.angkatan} 
                          onChange={(e) => setFormData({...formData, angkatan: e.target.value})} 
                          placeholder="Contoh: 2025"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Poin Awal</Label>
                        <Input 
                          type="number"
                          value={formData.initial_points} 
                          onChange={(e) => setFormData({...formData, initial_points: parseInt(e.target.value) || 0})} 
                          placeholder="Contoh: 100"
                          min="0"
                        />
                      </div>
                    </>
                  )}

                  {formData.role === 'guru' && (
                    <div className="space-y-2">
                      <Label>Wali Kelas</Label>
                      <Input 
                        value={formData.wali_kelas} 
                        onChange={(e) => setFormData({...formData, wali_kelas: e.target.value})} 
                        placeholder="Contoh: X IPA 1 (kosongkan jika bukan wali kelas)"
                      />
                      <p className="text-xs text-slate-500">Kelas yang dibina oleh guru ini. Kosongkan guru bukan wali kelas.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Password {isEdit ? '(Isi jika ingin diubah)' : '(Opsional)'}</Label>
                    <Input 
                      type="password"
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      placeholder={isEdit ? 'Kosongkan jika tidak ingin mengubah password' : 'Bila kosong, pengguna harus setup password saat login'}
                      minLength={8}
                    />
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded ${
                                i <= getPasswordStrength(formData.password).strength
                                  ? getPasswordStrength(formData.password).color
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Kekuatan password: <span className={getPasswordStrength(formData.password).color.replace('bg-', 'text-')}>
                            {getPasswordStrength(formData.password).label}
                          </span>
                        </p>
                      </div>
                    )}
                    {!formData.password && (
                      <p className="text-xs text-slate-500">
                        Password minimal 8 karakter
                      </p>
                    )}
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
      </div>

      <Card className="shadow-sm">
        <Tabs value={activeTab} onValueChange={(v: any) => { if (v) setActiveTab(v); }}>
          <CardHeader className="pb-0 border-b">
            <TabsList className="bg-transparent space-x-4">
              <TabsTrigger 
                value="siswa" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Siswa
              </TabsTrigger>
              <TabsTrigger 
                value="guru" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Guru / Pembina
              </TabsTrigger>
              <TabsTrigger 
                value="admin_pembina_asrama" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Admin Pembina Asrama
              </TabsTrigger>
              <TabsTrigger 
                value="kesiswaan" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Kesiswaan
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Filter Section */}
            <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  placeholder="Cari nama..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="max-w-xs"
                />
                {activeTab === 'siswa' && (
                  <>
                    <Input
                      placeholder="Filter kelas..."
                      value={filterKelas}
                      onChange={(e) => setFilterKelas(e.target.value)}
                      className="max-w-xs"
                    />
                    <Input
                      placeholder="Filter angkatan..."
                      value={filterAngkatan}
                      onChange={(e) => setFilterAngkatan(e.target.value)}
                      className="max-w-xs"
                    />
                  </>
                )}
                {(filterName || filterKelas || filterAngkatan) && (
                  <Button variant="outline" onClick={() => { setFilterName(''); setFilterKelas(''); setFilterAngkatan(''); }}>
                    Reset Filter
                  </Button>
                )}
              </div>
              {activeTab === 'siswa' && users.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setBulkUpdateOpen(true)}
                  className="border-[#1B2A4A] text-[#1B2A4A]"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Update Poin Awal ({users.length} Siswa)
                </Button>
              )}
            </div>
            
            {loading ? (
              <p className="text-center py-4 text-slate-500">Memuat data...</p>
            ) : (
              <DataTable 
                columns={getColumns(activeTab)} 
                data={users} 
                pageSize={10} 
              />
            )}
          </CardContent>
        </Tabs>
      </Card>

      <ImportDialog 
        open={importOpen} 
        onOpenChange={setImportOpen} 
        onSuccess={() => {
          setActiveTab('siswa');
          fetchUsers('siswa');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="py-4">Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Ya, Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Initial Points Dialog */}
      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Poin Awal Siswa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-600">
              Anda akan mengupdate poin awal untuk <strong>{users.length} siswa</strong> yang saat ini ditampilkan.
            </p>
            <div className="space-y-2">
              <Label>Poin Awal Baru</Label>
              <Input
                type="number"
                value={bulkInitialPoints}
                onChange={(e) => setBulkInitialPoints(parseInt(e.target.value) || 0)}
                placeholder="Contoh: 100"
                min="0"
              />
              <p className="text-xs text-slate-500">
                Masukkan nilai poin awal yang akan diterapkan ke semua siswa yang ditampilkan.
              </p>
            </div>
            {filterName || filterKelas || filterAngkatan ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Filter aktif: Update hanya akan diterapkan pada siswa yang sesuai dengan filter saat ini.
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateOpen(false)}>Batal</Button>
            <Button onClick={handleBulkUpdate} className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]">
              Update {users.length} Siswa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
