'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ROLES } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nomor_induk: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal login');
      }

      if (data.requiresSetup) {
        // Redirect to setup password page with userId
        router.push(`/setup-password?userId=${data.userId}&name=${encodeURIComponent(data.name)}`);
        return;
      }

      toast.success('Login berhasil');
      
      // Redirect based on role
      if (data.role === ROLES.KESISWAAN) {
        router.push('/kesiswaan');
      } else if (data.role === ROLES.GURU) {
        router.push('/guru');
      } else {
        router.push('/siswa');
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-[#1B2A4A]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#1B2A4A] flex items-center justify-center overflow-hidden bg-white">
              <img 
                src="/Logo Spark_New.png" 
                alt="SPARK Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1B2A4A]">SPARK</CardTitle>
          <CardDescription>
            Student Progress & Reward Keeper
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomor_induk">Nomor Induk</Label>
              <Input
                id="nomor_induk"
                name="nomor_induk"
                type="text"
                placeholder="Masukkan Nomor Induk"
                required
                value={formData.nomor_induk}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#1B2A4A] hover:bg-[#2A3F6E] text-white" 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SMA Presiden. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
