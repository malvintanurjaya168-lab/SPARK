'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Placeholder data since we don't have a rewards table yet
const REWARDS_CATALOG = [
  { id: 1, title: 'Pin Prestasi Sekolah', pointsRequired: 120, description: 'Pin eksklusif untuk disematkan di seragam', available: true },
  { id: 2, title: 'Sertifikat Kedisiplinan', pointsRequired: 150, description: 'Sertifikat resmi dari Kepala Sekolah', available: true },
  { id: 3, title: 'Bebas Tugas Piket 1x', pointsRequired: 110, description: 'Voucher bebas tugas kebersihan kelas', available: true },
  { id: 4, title: 'Makan Siang Spesial', pointsRequired: 130, description: 'Menu makan siang spesial di kantin', available: false },
  { id: 5, title: 'Merchandise SPARK', pointsRequired: 200, description: 'Totebag dan alat tulis berlogo SPARK', available: true },
];

export default function KatalogRewardSiswa() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resMe = await fetch('/api/auth/me');
      if (resMe.ok) setProfile(await resMe.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = (reward: any) => {
    toast.success('Permintaan Penukaran Terkirim!', {
      description: `Guru atau bidang kesiswaan akan memproses permintaan penukaran ${reward.title} Anda.`
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500">Memuat katalog...</div>;
  }

  const currentPoints = profile?.total_points || 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#C5A55A] to-[#d6b976] -mx-4 -mt-6 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 text-[#1B2A4A] rounded-b-3xl shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">Katalog Reward</h1>
        </div>
        <p className="text-[#1B2A4A]/80 mt-2 max-w-xl">
          Tukarkan poin kedisiplinan Anda (di atas 100) dengan berbagai penghargaan eksklusif. 
          Poin Anda saat ini: <strong className="text-2xl ml-1">{currentPoints}</strong>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative z-10 -mt-10">
        {REWARDS_CATALOG.map((reward) => {
          const canAfford = currentPoints >= reward.pointsRequired;
          return (
            <Card key={reward.id} className={`flex flex-col overflow-hidden transition-all hover:shadow-md ${canAfford && reward.available ? 'border-[#C5A55A] shadow-[#C5A55A]' : 'opacity-50'}`}>
              <div className="h-32 bg-slate-100 flex items-center justify-center border-b border-slate-100">
                <Sparkles className={`h-12 w-12 ${canAfford ? 'text-[#C5A55A]' : 'text-slate-300'}`} />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight text-[#1B2A4A]">{reward.title}</CardTitle>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${canAfford ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {reward.pointsRequired} Poin
                  </div>
                </div>
                <CardDescription className="pt-2">{reward.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Spacer */}
              </CardContent>
              <CardFooter className="pt-0">
                {reward.available ? (
                  <Button 
                    className="w-full" 
                    variant={canAfford ? 'default' : 'secondary'}
                    disabled={!canAfford}
                    onClick={() => handleClaim(reward)}
                  >
                    {canAfford ? 'Tukarkan Poin' : 'Poin Tidak Cukup'}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>Stok Habis</Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-blue-50 text-blue-800 rounded-xl flex gap-4 items-start">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-blue-600" />
        <div>
          <h3 className="font-semibold mb-1">Syarat & Ketentuan Penukaran</h3>
          <p className="text-sm text-blue-700/80">
            Penukaran reward tidak akan mengurangi total poin Anda di rapor, namun hanya akan mengurangi kuota poin yang dapat ditukarkan. Proses penukaran membutuhkan verifikasi dari bidang kesiswaan (1-3 hari kerja).
          </p>
        </div>
      </div>
    </div>
  );
}
