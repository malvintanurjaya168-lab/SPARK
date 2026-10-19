'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { StudentSearch } from '@/components/student-search';
import { toast } from 'sonner';

export default function AdminPembinaAsramaInput() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null);
  const [type, setType] = useState('pelanggaran');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('asrama');

  useEffect(() => {
    fetchData();
  }, []);

  // When type changes, reset category selection
  useEffect(() => {
    setSelectedCategoryId('');
  }, [type]);

  const fetchData = async () => {
    try {
      const [resUsers, resCategories] = await Promise.all([
        fetch('/api/users?role=siswa'),
        fetch('/api/categories')
      ]);

      if (resUsers.ok && resCategories.ok) {
        setStudents(await resUsers.json());
        setCategories(await resCategories.json());
      }
    } catch (error) {
      toast.error('Gagal memuat data master');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);
  
  const selectedCategoryData = categories.find(c => c.id.toString() === selectedCategoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId) {
      toast.error('Silakan pilih siswa terlebih dahulu');
      return;
    }
    
    if (!selectedCategoryId) {
      toast.error('Silakan pilih kategori poin');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/point-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          category_id: selectedCategoryId,
          notes: notes,
          created_at: new Date(inputDate).toISOString(),
          location: location,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan catatan poin');
      }

      toast.success('Pemberian poin/reward berhasil diajukan', {
        description: `Request untuk ${selectedStudentData?.name} menunggu validasi Kesiswaan.`,
      });
      
      // Reset form
      setSelectedStudentId('');
      setSelectedStudentData(null);
      setSelectedCategoryId('');
      setNotes('');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">Memuat formulir...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Input Poin Siswa</h1>
        <p className="text-slate-500">Catat pelanggaran atau penghargaan siswa</p>
      </div>

      <Card className="shadow-lg border-t-4 border-t-[#1B2A4A]">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Form Catatan Kedisiplinan</CardTitle>
            <CardDescription>Pastikan Anda memilih siswa dan kategori yang tepat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label>Cari Siswa</Label>
              <StudentSearch 
                students={students}
                value={selectedStudentId}
                onChange={(val, student) => {
                  setSelectedStudentId(val);
                  setSelectedStudentData(student);
                }}
              />
              {selectedStudentData && (
                <div className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Terpilih: <strong>{selectedStudentData.name}</strong> ({selectedStudentData.kelas || 'Tanpa Kelas'})
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Jenis Catatan</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  type="button"
                  variant={type === 'pelanggaran' ? 'default' : 'outline'}
                  className={type === 'pelanggaran' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-600 text-red-600 hover:bg-red-50'}
                  onClick={() => setType('pelanggaran')}
                >
                  Pelanggaran (-)
                </Button>
                <Button 
                  type="button"
                  variant={type === 'reward' ? 'default' : 'outline'}
                  className={type === 'reward' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-600 hover:bg-green-50'}
                  onClick={() => setType('reward')}
                >
                  Penghargaan (+)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategori {type === 'pelanggaran' ? 'Pelanggaran' : 'Penghargaan'}</Label>
              <Select value={selectedCategoryId} onValueChange={(val) => setSelectedCategoryId(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kategori">
                    {selectedCategoryData && (
                      <span>{selectedCategoryData.name} ({selectedCategoryData.points_value > 0 ? `+${selectedCategoryData.points_value}` : selectedCategoryData.points_value} poin)</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {filteredCategories.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">Tidak ada kategori tersedia</div>
                  ) : (
                    filteredCategories.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} ({c.points_value > 0 ? `+${c.points_value}` : c.points_value} poin)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Kejadian</Label>
              <Input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                max={new Date().toLocaleDateString('en-CA')}
              />
            </div>

            <div className="space-y-2">
              <Label>Lokasi Kejadian</Label>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white px-3 py-2 rounded border border-slate-300"
              >
                <option value="sekolah">Sekolah</option>
                <option value="asrama">Asrama</option>
                <option value="luar">Di luar sekolah</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Catatan / Kronologi Kejadian (Opsional)</Label>
              <Textarea 
                placeholder="Jelaskan detail kejadian..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
          </CardContent>
          <div className="flex justify-end p-6 pt-0 gap-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/admin-pembina-asrama')}>Batal</Button>
            <Button 
              type="submit" 
              className="bg-[#1B2A4A] text-white hover:bg-[#2A3F6E]"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
