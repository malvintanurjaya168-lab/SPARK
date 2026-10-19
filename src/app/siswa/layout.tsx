'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Home, History, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { name: 'Beranda', href: '/siswa', icon: Home },
  { name: 'Riwayat', href: '/siswa/riwayat', icon: History },
  { name: 'Profil', href: '/siswa/profil', icon: User },
];

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');

  // Fetch session data strictly for display, auth is handled by middleware
  useEffect(() => {
    // A trick to get the user name if we don't have a /me endpoint
    // Let's just fetch from a cookie or leave it generic since we don't have a /me endpoint currently
    // In a real app we would have an endpoint or pass the session.
    setUserName('Siswa'); 
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Berhasil logout');
      router.push('/login');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-72 md:flex-col bg-[#1B2A4A] text-white">
        <div className="flex h-20 shrink-0 items-center px-6 bg-gradient-to-r from-[#1B2A4A] to-[#2D4A6F]">
          <div className="flex items-center gap-3">
            <img 
              src="/Logo Spark_New.png" 
              alt="SPARK Logo" 
              className="h-12 w-12 object-cover rounded-full border-2 border-white/30"
            />
            <div className="flex flex-col font-sans">
              <span className="font-bold text-xl text-white">SPARK</span>
              <span className="text-xs text-white/60">Student Progress & Reward Keeper</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 pb-6 border-b border-white bg-gradient-to-b from-[#1B2A4A] to-[#152238]">
          <h2 className="text-sm font-semibold text-[#3F5CCF] uppercase tracking-wider">Portal Siswa</h2>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-[#3F5CCF] to-[#5B7FFF] text-white shadow-lg" 
                    : "text-white/80 hover:bg-white hover:text-white hover:translate-x-1"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-white/70 group-hover:text-[#3F5CCF]"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white space-y-2 bg-gradient-to-t from-[#152238] to-[#1B2A4A]">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-[#C0392B] hover:text-white transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Keluar
          </Button>
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 shadow-sm">
        <img 
          src="/Logo Spark_New.png" 
          alt="SPARK Logo" 
          className="h-10 w-10 object-cover rounded-full border-2 border-[#3F5CCF]/30"
        />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#C0392B]">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-32 md:pt-8 md:ml-72 pb-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] flex justify-around items-center h-16 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-[#3F5CCF]" : "text-[#A0AEC0]"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-[#3F5CCF]" : "")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
