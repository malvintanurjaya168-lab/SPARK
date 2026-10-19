'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ROLES } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const name = searchParams.get('name');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting password setup for userId:', userId);
      
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId || '0'),
          password: formData.password,
        }),
      });

      const data = await res.json();
      console.log('Password setup response:', data);

      if (!res.ok) {
        console.error('Password setup failed:', data);
        throw new Error(data.message || 'Gagal menyimpan password');
      }

      toast.success('Password berhasil dibuat. Mengalihkan...');
      
      // Redirect based on role (should be siswa for imported users)
      if (data.role === ROLES.KESISWAAN) {
        router.push('/kesiswaan');
      } else if (data.role === ROLES.GURU) {
        router.push('/guru');
      } else {
        router.push('/siswa');
      }
      
    } catch (error: any) {
      console.error('Password setup error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan password');
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center p-6">
        <p>Akses tidak valid. Silakan login kembali.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Ke Halaman Login</Button>
      </div>
    );
  }

  return (
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
        <CardTitle className="text-2xl font-bold text-[#1B2A4A]">Buat Password Baru</CardTitle>
        <CardDescription>
          Halo {name || 'Siswa'}, ini adalah login pertama Anda. Silakan buat password baru untuk mengamankan akun Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password Baru</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ketik ulang password baru"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#1B2A4A] hover:bg-[#2A3F6E] text-white" 
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan & Masuk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<p>Memuat form...</p>}>
        <SetupPasswordForm />
      </Suspense>
    </div>
  );
}
