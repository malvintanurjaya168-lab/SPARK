'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  FileText, 
  Tags,
  Menu,
  X,
  History
} from 'lucide-react';
import { useState } from 'react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Berhasil logout');
      router.push('/login');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  const NavContent = () => (
    <div className="flex h-full flex-col bg-[#1B2A4A] text-white">
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
      <div className="px-6 py-3 pb-6 border-b border-white/10 bg-gradient-to-b from-[#1B2A4A] to-[#152238]">
        <h2 className="text-sm font-semibold text-[#3F5CCF] uppercase tracking-wider">{title}</h2>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 ease-out",
                isActive 
                  ? "bg-gradient-to-r from-[#3F5CCF] to-[#5B7FFF] text-white shadow-lg scale-105" 
                  : "text-white/80 hover:bg-white/5 hover:text-white hover:translate-x-2 hover:scale-105"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <Icon
                className={cn(
                  "mr-3 h-5 w-5 shrink-0 transition-all duration-300 ease-out",
                  isActive ? "text-white scale-110" : "text-white/70 group-hover:text-[#3F5CCF] group-hover:scale-110"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-[#152238] to-[#1B2A4A]">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:bg-[#C0392B]/20 hover:text-[#C0392B] hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5 transition-transform group-hover:rotate-180" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-[#E2E8F0] bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="-m-2.5 p-2.5 text-[#3F5CCF] hover:scale-110 active:scale-95 transition-all duration-200" onClick={() => setMobileOpen(true)}>
          <span className="sr-only">Buka sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
          <img 
            src="/Logo Spark_New.png" 
            alt="SPARK Logo" 
            className="h-10 w-10 object-cover rounded-full border-2 border-[#3F5CCF]/30"
          />
        </div>
      </div>

      {/* Mobile sidebar (drawer) */}
      {mobileOpen && (
        <div className="relative z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/80" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setMobileOpen(false)}>
                  <span className="sr-only">Tutup sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <NavContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-72 md:flex-col">
        <NavContent />
      </div>
    </>
  );
}
