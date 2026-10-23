'use client';

import { Sidebar } from '@/components/sidebar';
import { LayoutDashboard, PenLine, FileText } from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/admin-pembina-asrama', icon: LayoutDashboard },
  { name: 'Input Poin', href: '/admin-pembina-asrama/input', icon: PenLine },
  { name: 'Laporan', href: '/admin-pembina-asrama/laporan', icon: FileText },
];

export default function AdminPembinaAsramaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-screen transition-all duration-300">
      <Sidebar items={sidebarItems} title="Portal Admin Pembina Asrama" />
      <main className="pt-32 md:pt-8 md:ml-72 pb-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
    </div>
  );
}
