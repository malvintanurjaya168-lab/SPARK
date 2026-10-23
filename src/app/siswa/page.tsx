'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PointBadge } from '@/components/point-badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { POINT_BASE, STATUS_THRESHOLDS } from '@/lib/constants';
import { AlertTriangle, TrendingDown, TrendingUp, History, Gift, Info } from 'lucide-react';
import Link from 'next/link';
import { getPointStatus } from '@/lib/utils';
import { toast } from 'sonner';

export default function SiswaDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get profile & points - add timestamp to prevent caching
      const resMe = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: 'no-store' });
      if (!resMe.ok) throw new Error('Gagal memuat profil');
      const userData = await resMe.json();
      setProfile(userData);

      // Get recent logs for this student
      const resLogs = await fetch(`/api/point-logs?student_id=${userData.id}`);
      if (resLogs.ok) {
        const logs = await resLogs.json();
        // Sort by created_at descending (newest first) and take top 5
        logs.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setRecentLogs(logs.slice(0, 5));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">Memuat data...</div>;
  }

  if (!profile) return null;

  const points = profile.total_points || profile.initial_points || 100;
  const initialPoints = profile.initial_points || 100;
  const statusInfo = getPointStatus(points);
  
  // Calculate progress percentage relative to initial_points
  const progressPercent = Math.min(100, Math.max(0, (points / initialPoints) * 100));

  return (
    <div className="space-y-6">
      <div className="bg-[#1B2A4A] ml-4 -mt-6 sm:ml-6 lg:ml-8 px-4 sm:px-6 lg:px-8 pt-10 pb-8 text-white rounded-b-3xl shadow-md">
        <h1 className="text-3xl font-bold tracking-tight">SELAMAT DATANG, {profile.name.toUpperCase()}</h1>
        <p className="text-white/70 mt-1">{profile.nomor_induk} | Kelas {profile.kelas}</p>
      </div>

      <div className="space-y-6 relative z-10">
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className={`h-2 w-full ${statusInfo.bgColor}`}></div>
          <CardContent className="pt-6 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Poin Kedisiplinan</h2>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className={`text-6xl font-extrabold ${statusInfo.textColor}`}>{points}</span>
                  <span className="text-slate-400 font-medium text-lg">/ {initialPoints}</span>
                </div>
                <div className="mt-2">
                  <PointBadge points={points} size="lg" />
                </div>
              </div>
              
              <div className="w-full md:w-1/2 space-y-3">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Kategori Poin</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-medium">85+</span>
                      <span className="text-slate-600">Excellent</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-600 font-medium">75 - 84</span>
                      <span className="text-slate-600">Good</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-medium">60 - 74</span>
                      <span className="text-slate-600">Warning</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600 font-medium">&lt; 60</span>
                      <span className="text-slate-600">Critical</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center md:text-right">
                  {points < STATUS_THRESHOLDS.WARNING 
                    ? '⚠️ Perhatian: Poin Anda berada di tingkat kritis!' 
                    : points < STATUS_THRESHOLDS.GOOD 
                    ? 'Poin Anda dalam status peringatan. Hindari pelanggaran.' 
                    : points < STATUS_THRESHOLDS.EXCELLENT
                    ? 'Poin Anda dalam status baik. Pertahankan kedisiplinan!'
                    : '🌟 Excellent! Pertahankan kedisiplinan Anda!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
                <Link href="/siswa/riwayat" className="text-sm text-[#1B2A4A] hover:underline font-medium">
                  Lihat Semua
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                  <Info className="h-8 w-8 text-slate-300 mb-2" />
                  <p>Belum ada catatan kedisiplinan.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  {recentLogs.map((log: any) => {
                    const isReward = log.category?.points_value > 0;
                    return (
                      <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className={`mt-0.5 p-2 rounded-full ${isReward ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {isReward ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 leading-tight">{log.category?.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="text-xs text-slate-500 mt-1">📍 {log.location || '-'}</p>
                        </div>
                        <div className={`font-bold ${isReward ? 'text-green-600' : 'text-red-600'}`}>
                          {isReward ? `+${log.category?.points_value}` : log.category?.points_value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-orange-50 border-orange-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" /> Informasi Penting
                </h3>
                <ul className="text-sm text-orange-700 space-y-1 list-disc pl-5">
                  <li>Poin kumulatif berlaku selama bersekolah.</li>
                  <li>Jika poin mencapai 0, siswa dapat dikembalikan ke orang tua.</li>
                  <li>Pertahankan poin minimal {STATUS_THRESHOLDS.EXCELLENT} untuk status Excellent.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
