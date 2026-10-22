'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PointBadge } from '@/components/point-badge';
import { POINT_BASE } from '@/lib/constants';
import { User, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function SiswaProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Gagal memuat profil');
      const userData = await res.json();
      setProfile(userData);

      // Get recent logs
      const resLogs = await fetch(`/api/point-logs?student_id=${userData.id}`);
      if (resLogs.ok) {
        const logs = await resLogs.json();
        setRecentLogs(logs.slice(0, 10));
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

  const points = profile.total_points || POINT_BASE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">Profil Saya</h1>
        <p className="text-slate-500">Informasi akademik dan kedisiplinan Anda</p>
      </div>

      {/* Profile Header Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-[#1B2A4A] to-[#2D4A6F] text-white">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white">
              <User className="h-12 w-12 text-white" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold">{profile.name}</h2>
              <p className="text-white/80 mt-1">{profile.nomor_induk} | Kelas {profile.kelas}</p>
              <p className="text-white/60 mt-2">Angkatan {profile.angkatan || '-'}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#C5A55A]">{points}</div>
              <p className="text-white/80 text-sm mt-1">Total Poin</p>
              <div className="mt-2">
                <PointBadge points={points} size="lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Belum ada catatan kedisiplinan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log: any) => {
                const isReward = log.category?.points_value > 0;
                return (
                  <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`mt-0.5 p-2 rounded-full ${isReward ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isReward ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 leading-tight">{log.category?.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
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
    </div>
  );
}
