'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { PointBadge } from '@/components/point-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, UserX, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { POINT_BASE, STATUS_THRESHOLDS } from '@/lib/constants';

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Handle case when value is 0
    if (value === 0) {
      setCount(0);
      return;
    }
    
    let start = 0;
    const end = value;
    const incrementTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

export default function KesiswaanDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [monthlyStats, setMonthlyStats] = useState({ rewards: 0, violations: 0 });
  const [currentMonth, setCurrentMonth] = useState('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 20;
  const [topRewardPage, setTopRewardPage] = useState(1);
  const topRewardPerPage = 20;
  const [topRewardStudents, setTopRewardStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchUserName();
    fetchMonthlyStats();
    fetchRecentLogs();
    fetchTopRewardStudents();

    // Check for month change every minute
    const checkMonthChange = setInterval(() => {
      const now = new Date();
      const currentMonthName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][now.getMonth()];
      const currentYear = now.getFullYear();
      const newMonthLabel = `${currentMonthName} ${currentYear}`;
      
      // If month changed, refetch stats
      if (newMonthLabel !== currentMonth) {
        fetchMonthlyStats();
      }
    }, 60000); // Check every minute

    // Keep-alive interval to prevent database from sleeping
    const keepAliveInterval = setInterval(async () => {
      try {
        await fetch('/api/keep-alive');
      } catch (error) {
        console.error('Keep-alive failed:', error);
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(checkMonthChange);
      clearInterval(keepAliveInterval);
    };
  }, [currentMonth]);

  const fetchUserName = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUserName(userData.name || 'Admin');
      }
    } catch (error) {
      console.error('Failed to fetch user name');
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const currentMonthName = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();
      setCurrentMonth(`${currentMonthName} ${currentYear}`);

      const res = await fetch('/api/point-logs');
      if (!res.ok) throw new Error('Gagal mengambil data aktivitas');
      
      const logs = await res.json();
      
      // Filter logs for current month
      const currentMonthLogs = logs.filter((log: any) => {
        const logDate = new Date(log.created_at);
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      });

      // Count rewards (positive points) and violations (negative points)
      const rewards = currentMonthLogs.filter((log: any) => log.category?.points_value > 0).length;
      const violations = currentMonthLogs.filter((log: any) => log.category?.points_value < 0).length;

      setMonthlyStats({ rewards, violations });
    } catch (error) {
      console.error('Failed to fetch monthly stats:', error);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const res = await fetch('/api/point-logs');
      if (!res.ok) throw new Error('Gagal mengambil log aktivitas');
      const data = await res.json();
      
      // Filter logs for current month
      const now = new Date();
      const currentMonthLogs = data.filter((log: any) => {
        const logDate = new Date(log.created_at);
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      });
      
      // Sort by created_at descending (newest first)
      currentMonthLogs.sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setRecentLogs(currentMonthLogs);
    } catch (error) {
      console.error('Failed to fetch recent logs:', error);
    }
  };

  const fetchTopRewardStudents = async () => {
    try {
      // Fetch both logs and students data
      const [logsRes, studentsRes] = await Promise.all([
        fetch('/api/point-logs'),
        fetch('/api/users?role=siswa')
      ]);
      
      if (!logsRes.ok) throw new Error('Gagal mengambil log aktivitas');
      if (!studentsRes.ok) throw new Error('Gagal mengambil data siswa');
      
      const logs = await logsRes.json();
      const studentsData = await studentsRes.json();
      
      // Calculate reward points for each student (only positive points_changed)
      const studentRewards: { [key: string]: number } = {};
      logs.forEach((log: any) => {
        // Student ID is in nested student object
        const studentId = log.student?.id;
        
        if (log.points_changed > 0 && studentId) {
          studentRewards[studentId] = (studentRewards[studentId] || 0) + log.points_changed;
        }
      });
      
      // Map back to student data and sort by reward points
      const studentsWithRewards = studentsData.map((student: any) => ({
        ...student,
        totalRewardPoints: studentRewards[student.id] || 0
      })).sort((a: any, b: any) => b.totalRewardPoints - a.totalRewardPoints);
      
      // Get all students with rewards (not just top 5)
      setTopRewardStudents(studentsWithRewards);
    } catch (error) {
      console.error('Failed to fetch top reward students:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/users?role=siswa');
      if (!res.ok) throw new Error('Gagal mengambil data siswa');
      const data = await res.json();
      setStudents(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const criticalStudents = students.filter(s => {
    const points = s.total_points || s.initial_points || 100;
    return points < STATUS_THRESHOLDS.WARNING;
  });
  const warningStudents = students.filter(s => {
    const points = s.total_points || s.initial_points || 100;
    return points >= STATUS_THRESHOLDS.WARNING && points < STATUS_THRESHOLDS.GOOD;
  });
  const goodStudents = students.filter(s => {
    const points = s.total_points || s.initial_points || 100;
    return points >= STATUS_THRESHOLDS.GOOD && points < STATUS_THRESHOLDS.EXCELLENT;
  });
  const excellentStudents = students.filter(s => {
    const points = s.total_points || s.initial_points || 100;
    return points >= STATUS_THRESHOLDS.EXCELLENT;
  });

  const columns = [
    { header: 'Nama Siswa', accessorKey: 'name' as any },
    { header: 'Nomor Induk', accessorKey: 'nomor_induk' as any },
    { header: 'Kelas', accessorKey: 'kelas' as any },
    { 
      header: 'Poin Saat Ini', 
      cell: (row: any) => <PointBadge points={row.total_points || row.initial_points || 100} size="sm" />
    }
  ];

  const activityColumns = [
    { 
      header: 'Pencatat', 
      accessorKey: 'recorder' as any,
      cell: (row: any) => (
        <div className="font-medium text-[#1B2A4A]">
          {row.recorder?.name || 'Unknown'}
        </div>
      )
    },
    { 
      header: 'Siswa', 
      accessorKey: 'student' as any,
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.student?.name}</div>
          <div className="text-xs text-slate-500">{row.student?.kelas || 'Tanpa Kelas'}</div>
        </div>
      )
    },
    { 
      header: 'Kategori', 
      accessorKey: 'category' as any,
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.category?.name}</div>
          {row.category?.severity && (
            <Badge variant="outline" className={`text-xs capitalize ${
              row.category.severity === 'ringan' ? 'bg-yellow-100 text-yellow-800' :
              row.category.severity === 'sedang' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {row.category.severity}
            </Badge>
          )}
        </div>
      )
    },
    { 
      header: 'Poin', 
      accessorKey: 'points_changed' as any,
      cell: (row: any) => {
        const isReward = row.points_changed > 0;
        return (
          <div className={`font-bold flex items-center gap-1 ${
            isReward ? 'text-green-600' : 'text-red-600'
          }`}>
            {isReward ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {isReward ? `+${row.points_changed}` : row.points_changed}
          </div>
        );
      }
    },
    { 
      header: 'Tanggal', 
      accessorKey: 'created_at' as any,
      cell: (row: any) => (
        <div className="text-sm text-slate-600">
          {new Date(row.created_at).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      )
    },
    { 
      header: 'Lokasi', 
      accessorKey: 'location' as any,
      cell: (row: any) => (
        <div className="text-sm text-slate-600 capitalize">
          {row.location === 'sekolah' ? 'Sekolah' : 
           row.location === 'asrama' ? 'Asrama' : 
           row.location === 'luar' ? 'Di luar sekolah' : 
           row.location || 'Sekolah'}
        </div>
      )
    },
  ];

  // Sort students by points ascending (lowest first)
  const sortedStudents = [...students].sort((a, b) => (a.total_points || POINT_BASE) - (b.total_points || POINT_BASE));

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);

  const indexOfLastTopReward = topRewardPage * topRewardPerPage;
  const indexOfFirstTopReward = indexOfLastTopReward - topRewardPerPage;
  const currentTopRewardStudents = topRewardStudents.slice(indexOfFirstTopReward, indexOfLastTopReward);
  const totalTopRewardPages = Math.ceil(topRewardStudents.length / topRewardPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTopRewardPageChange = (page: number) => {
    setTopRewardPage(page);
  };

  const topRewardColumns = [
    { header: 'Nama Siswa', accessorKey: 'name' as any },
    { header: 'Kelas', accessorKey: 'kelas' as any },
    { 
      header: 'Total Reward Poin', 
      cell: (row: any) => (
        <span className="font-semibold text-[#10B981]">+{row.totalRewardPoints}</span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#1B2A4A] tracking-tight">SELAMAT DATANG, {userName.toUpperCase()}</h1>
        <p className="text-[#A0AEC0]">Ringkasan kedisiplinan siswa SMA Presiden</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-lg border-0 bg-white hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-[#2D3748] group-hover:text-[#3F5CCF] transition-colors">Total Siswa</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[#3F5CCF] flex items-center justify-center group-hover:bg-[#3F5CCF] group-hover:scale-110 transition-all duration-300">
              <Users className="h-5 w-5 text-white group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#1B2A4A] group-hover:text-[#3F5CCF] transition-colors">
              {loading ? '...' : <AnimatedCounter value={students.length} />}
            </div>
            <p className="text-xs text-[#A0AEC0] mt-1">Siswa terdaftar</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-white hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-[#C0392B] group-hover:text-[#C0392B] transition-colors">Status Critical</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[#C0392B]/10 flex items-center justify-center group-hover:bg-[#C0392B] group-hover:scale-110 transition-all duration-300">
              <UserX className="h-5 w-5 text-[#C0392B] group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#C0392B] group-hover:text-[#C0392B] transition-colors">
              {loading ? '...' : <AnimatedCounter value={criticalStudents.length} />}
            </div>
            <p className="text-xs text-[#A0AEC0] mt-1">&lt; {STATUS_THRESHOLDS.WARNING} Poin</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-[#F59E0B] group-hover:text-[#F59E0B] transition-colors">Status Warning</CardTitle>
            <div className="h-10 w-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center group-hover:bg-[#F59E0B] group-hover:scale-110 transition-all duration-300">
              <AlertTriangle className="h-5 w-5 text-[#F59E0B] group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#F59E0B] group-hover:text-[#F59E0B] transition-colors">
              {loading ? '...' : <AnimatedCounter value={warningStudents.length} />}
            </div>
            <p className="text-xs text-[#A0AEC0] mt-1">{STATUS_THRESHOLDS.WARNING} - {STATUS_THRESHOLDS.GOOD - 1} Poin</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-[#10B981] to-[#34D399] hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-white group-hover:text-white transition-colors">Statistik Bulan Ini</CardTitle>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
              <TrendingUp className="h-5 w-5 text-[#10B981] group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-medium">Penghargaan</span>
                <span className="text-2xl font-bold text-white">{monthlyStats.rewards}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-medium">Pelanggaran</span>
                <span className="text-2xl font-bold text-white">{monthlyStats.violations}</span>
              </div>
              <p className="text-xs text-white/70 mt-1">{currentMonth}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-[#3F5CCF] to-[#5B7FFF] hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-white group-hover:text-white transition-colors">Sistem Database</CardTitle>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
              <Activity className="h-5 w-5 text-[#3F5CCF] group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white group-hover:text-white transition-colors">Aktif</div>
            <p className="text-xs text-white/70 mt-1">Keep-alive berjalan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="border-b border-[#E2E8F0]">
            <CardTitle className="text-[#1B2A4A] text-xl font-semibold">Peringkat Terendah (Need Attention)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4 py-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-[#E2E8F0]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#E2E8F0] rounded w-3/4" />
                      <div className="h-4 bg-[#E2E8F0] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <DataTable 
                  columns={columns} 
                  data={currentStudents} 
                  pageSize={20} 
                />
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-500">
                      Halaman {currentPage} dari {totalPages} ({sortedStudents.length} siswa)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        &gt;
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="border-b border-[#E2E8F0]">
            <CardTitle className="text-[#1B2A4A] text-xl font-semibold">Aktivitas Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4 py-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-[#E2E8F0]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#E2E8F0] rounded w-3/4" />
                      <div className="h-4 bg-[#E2E8F0] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Belum ada aktivitas di bulan ini</p>
            ) : (
              <DataTable 
                columns={activityColumns} 
                data={recentLogs} 
                pageSize={10} 
              />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="border-b border-[#E2E8F0]">
            <CardTitle className="text-[#1B2A4A] text-xl font-semibold">Top Reward Poin</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4 py-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-[#E2E8F0]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#E2E8F0] rounded w-3/4" />
                      <div className="h-4 bg-[#E2E8F0] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topRewardStudents.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Belum ada data reward</p>
            ) : (
              <>
                <DataTable 
                  columns={topRewardColumns} 
                  data={currentTopRewardStudents} 
                  pageSize={20} 
                />
                {totalTopRewardPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-500">
                      Halaman {topRewardPage} dari {totalTopRewardPages} ({topRewardStudents.length} siswa)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTopRewardPageChange(topRewardPage - 1)}
                        disabled={topRewardPage === 1}
                      >
                        &lt;
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTopRewardPageChange(topRewardPage + 1)}
                        disabled={topRewardPage === totalTopRewardPages}
                      >
                        &gt;
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
