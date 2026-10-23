'use client';

import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, PenLine, History, Users } from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard Guru', href: '/guru', icon: LayoutDashboard },
  { name: 'Input Jurnal', href: '/guru/input', icon: PenLine },
  { name: 'Riwayat Catatan', href: '/guru/riwayat', icon: History },
  { name: 'Wali Kelas', href: '/guru/wali-kelas', icon: Users },
];

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-screen transition-all duration-300">
      <Sidebar items={sidebarItems} title="Portal Guru" />
      <main className="pt-32 md:pt-8 md:ml-72 pb-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  );
}
