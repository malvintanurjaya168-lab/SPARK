'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenLine, History, TrendingUp, TrendingDown, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function GuruDashboard() {
  const [userName, setUserName] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user name and recent logs
    const fetchSessionAndLogs = async () => {
      try {
        const resMe = await fetch('/api/auth/me');
        if (resMe.ok) {
          const userData = await resMe.json();
          setUserName(userData.name || 'Guru');
        }

        // Get recent logs for this guru (API filters by current guru)
        const resLogs = await fetch('/api/point-logs');
        const logs = resLogs.ok ? await resLogs.json() : [];

        // Get recent requests for this guru (pending requests)
        const resRequests = await fetch('/api/point-requests?status=pending');
        const requests = resRequests.ok ? await resRequests.json() : [];

        // Combine logs and requests, format them consistently
        const combinedActivities = [
          ...logs.map((log: any) => ({
            ...log,
            type: 'log',
            category: log.category,
            student: log.student,
            points_value: log.category?.points_value || log.points_changed,
            created_at: log.created_at,
            location: log.location || 'sekolah'
          })),
          ...requests.map((req: any) => ({
            ...req,
            type: 'request',
            category: req.category,
            student: req.student,
            points_value: req.points_value,
            created_at: req.created_at,
            location: 'sekolah',
            status: req.status
          }))
        ];

        // Sort by created_at descending (newest first) and take top 5
        combinedActivities.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setRecentLogs(combinedActivities.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">SELAMAT DATANG, {userName.toUpperCase()}</h1>
        <p className="text-slate-500">Anda dapat mencatat poin kedisiplinan siswa di sini.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => window.location.href = '/guru/input'}>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenLine className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Input Jurnal Poin</h3>
              <p className="text-slate-500 mt-2">Catat pelanggaran atau reward siswa secara langsung</p>
            </div>
            <Button className="mt-4 bg-[#1B2A4A] text-white">Mulai Mencatat</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => window.location.href = '/guru/riwayat'}>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <History className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Riwayat Catatan</h3>
              <p className="text-slate-500 mt-2">Lihat dan kelola log yang pernah Anda masukkan (Batas edit 24 jam)</p>
            </div>
            <Button variant="outline" className="mt-4">Lihat Riwayat</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
            <Link href="/guru/riwayat" className="text-sm text-[#1B2A4A] hover:underline font-medium">
              Lihat Semua
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Memuat data...</div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 flex flex-col items-center">
              <Info className="h-8 w-8 text-slate-300 mb-2" />
              <p>Belum ada catatan kedisiplinan.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {recentLogs.map((log: any) => {
                const isReward = log.points_value > 0;
                const isPending = log.type === 'request' && log.status === 'pending';
                return (
                  <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`mt-0.5 p-2 rounded-full ${isReward ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isReward ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 leading-tight">{log.category?.name}</p>
                        {isPending && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                            Menunggu Validasi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{log.student?.name} - {log.student?.kelas}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-xs text-slate-500 mt-1">📍 {log.location || '-'}</p>
                    </div>
                    <div className={`font-bold ${isReward ? 'text-green-600' : 'text-red-600'}`}>
                      {isReward ? `+${log.points_value}` : log.points_value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
