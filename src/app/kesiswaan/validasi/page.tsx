'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function ValidasiPoin() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/point-requests?status=${status}`);
      if (!res.ok) throw new Error('Gagal mengambil data request');
      const data = await res.json();
      setRequests(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch(`/api/point-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success('Request berhasil disetujui');
      fetchRequests(activeTab);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }

    try {
      const res = await fetch(`/api/point-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          rejection_reason: rejectionReason 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success('Request berhasil ditolak');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests(activeTab);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus request ini?')) return;

    try {
      const res = await fetch(`/api/point-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      toast.success('Request berhasil dihapus');
      fetchRequests(activeTab);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="h-3 w-3 mr-1" /> Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="h-3 w-3 mr-1" /> Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    { 
      header: 'Tanggal', 
      cell: (row: any) => formatDate(row.created_at)
    },
    { 
      header: 'Siswa', 
      cell: (row: any) => (
        <div>
          <p className="font-medium">{row.student?.name}</p>
          <p className="text-xs text-slate-500">{row.student?.nomor_induk} | {row.student?.kelas}</p>
        </div>
      )
    },
    { 
      header: 'Kategori', 
      cell: (row: any) => (
        <div>
          <p className="font-medium">{row.category?.name}</p>
          <p className={`text-xs font-bold ${row.points_value > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {row.points_value > 0 ? '+' : ''}{row.points_value} Poin
          </p>
        </div>
      )
    },
    { 
      header: 'Lokasi', 
      cell: (row: any) => (
        <p className="text-sm text-slate-600">📍 {row.location || '-'}</p>
      )
    },
    { 
      header: 'Pencatat', 
      cell: (row: any) => (
        <div>
          <p className="font-medium">{row.recorder?.name}</p>
          <p className="text-xs text-slate-500">{row.recorder?.role}</p>
        </div>
      )
    },
    { 
      header: 'Keterangan', 
      cell: (row: any) => (
        <p className="text-sm text-slate-600 max-w-[200px]" title={row.notes}>{row.notes || '-'}</p>
      )
    },
    { 
      header: 'Status', 
      cell: (row: any) => getStatusBadge(row.status)
    },
    { 
      header: 'Aksi', 
      cell: (row: any) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleApprove(row.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openRejectDialog(row)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {row.status === 'rejected' && row.rejection_reason && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                alert(`Alasan penolakan: ${row.rejection_reason}`);
              }}
              title="Lihat alasan penolakan"
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
          )}
          {row.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleDelete(row.id)}
              className="text-slate-600 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Validasi Poin</h1>
        <p className="text-slate-500">Kelola request poin yang masuk dari Guru dan Kesiswaan</p>
      </div>

      <Card className="shadow-sm">
        <Tabs value={activeTab} onValueChange={(v: any) => { if (v) setActiveTab(v); }}>
          <CardHeader className="pb-0 border-b">
            <TabsList className="bg-transparent space-x-4">
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="approved" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Disetujui
              </TabsTrigger>
              <TabsTrigger 
                value="rejected" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#1B2A4A] data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                Ditolak
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center py-4 text-slate-500">Memuat data...</p>
            ) : (
              <DataTable 
                columns={columns} 
                data={requests} 
                pageSize={15}
                emptyMessage="Tidak ada request poin pada tab ini."
              />
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Request Poin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p><strong>Siswa:</strong> {selectedRequest?.student?.name}</p>
              <p><strong>Kategori:</strong> {selectedRequest?.category?.name}</p>
              <p><strong>Poin:</strong> {selectedRequest?.points_value}</p>
              <p><strong>Lokasi:</strong> 📍 {selectedRequest?.location || '-'}</p>
              <p><strong>Keterangan:</strong> {selectedRequest?.notes || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>Alasan Penolakan *</Label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Tolak Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
