'use client';

import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, Tags, Users, CalendarDays, FileText, CheckCircle } from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/kesiswaan', icon: LayoutDashboard },
  { name: 'Input Poin', href: '/kesiswaan/input', icon: FileText },
  { name: 'Validasi Poin', href: '/kesiswaan/validasi', icon: CheckCircle },
  { name: 'Kategori Poin', href: '/kesiswaan/kategori', icon: Tags },
  { name: 'Pengguna', href: '/kesiswaan/pengguna', icon: Users },
  { name: 'Aktivitas', href: '/kesiswaan/aktivitas', icon: FileText },
  { name: 'Semester', href: '/kesiswaan/semester', icon: CalendarDays },
  { name: 'Laporan', href: '/kesiswaan/laporan', icon: FileText },
];

export default function KesiswaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cookies().getAll() to construct a request-like object for getSession
  // In a real app we might pass headers or cookie store differently to auth helper
  // But middleware already guarantees role='kesiswaan' to reach here
  
  return (
    <div className="h-full min-h-screen transition-all duration-300">
      <Sidebar items={sidebarItems} title="Portal Kesiswaan" />
      <main className="pt-32 md:pt-8 md:ml-72 pb-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  );
}
