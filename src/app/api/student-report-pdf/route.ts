import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { ROLES, POINT_BASE } from '@/lib/constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: Request) {
  try {
    const session = await getSession(request as any);
    if (!session || (session.role !== ROLES.KESISWAAN && session.role !== ROLES.ADMIN_PEMBINA_ASRAMA)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const semester_id = searchParams.get('semester_id');

    if (!student_id) {
      return NextResponse.json({ message: 'Student ID is required' }, { status: 400 });
    }

    // Fetch student data
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Fetch point logs for the student
    let logsQuery = supabase
      .from('point_logs')
      .select(`
        id, created_at, points_changed, notes, location,
        category:point_categories(id, name, type, severity, points_value),
        semester:semesters(id, name)
      `)
      .eq('student_id', student_id);

    if (semester_id) {
      logsQuery = logsQuery.eq('semester_id', semester_id);
    }

    const { data: logs, error: logsError } = await logsQuery.order('created_at', { ascending: false });

    if (logsError) throw logsError;

    // Fetch semester info
    const { data: semester } = await supabase
      .from('semesters')
      .select('*')
      .eq('id', semester_id)
      .single();

    // Calculate statistics
    const violations = logs.filter((log: any) => log.points_changed < 0);
    const rewards = logs.filter((log: any) => log.points_changed > 0);
    const initialPoints = student.initial_points || POINT_BASE;
    const totalPointsChanged = logs.reduce((sum: number, log: any) => sum + (log.points_changed || 0), 0);
    const finalPoints = initialPoints + totalPointsChanged;

    const violationsSekolah = violations.filter((log: any) => log.location === 'sekolah').length;
    const violationsAsrama = violations.filter((log: any) => log.location === 'asrama').length;
    const violationsLuar = violations.filter((log: any) => log.location === 'luar').length;
    const rewardsSekolah = rewards.filter((log: any) => log.location === 'sekolah').length;
    const rewardsAsrama = rewards.filter((log: any) => log.location === 'asrama').length;
    const rewardsLuar = rewards.filter((log: any) => log.location === 'luar').length;

    // Generate PDF
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(27, 42, 74); // #1B2A4A
    doc.text('LAPORAN POIN SISWA', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('SMA PRESIDEN', 105, 28, { align: 'center' });
    
    // Add line
    doc.setDrawColor(27, 42, 74);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Student Information
    doc.setFontSize(14);
    doc.setTextColor(27, 42, 74);
    doc.text('Informasi Siswa', 20, 45);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nama: ${student.name}`, 20, 55);
    doc.text(`Nomor Induk: ${student.nomor_induk}`, 20, 62);
    doc.text(`Kelas: ${student.kelas || '-'}`, 20, 69);
    doc.text(`Angkatan: ${student.angkatan || '-'}`, 20, 76);
    
    if (semester) {
      doc.text(`Semester: ${semester.name}`, 20, 83);
    }
    
    // Points Summary
    doc.setFontSize(14);
    doc.setTextColor(27, 42, 74);
    doc.text('Ringkasan Poin', 20, 95);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Poin Awal: ${initialPoints}`, 20, 105);
    doc.text(`Total Perubahan: ${totalPointsChanged > 0 ? '+' : ''}${totalPointsChanged}`, 20, 112);
    doc.text(`Poin Akhir: ${finalPoints}`, 20, 119);
    
    // Violations by Location
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // Red for violations
    doc.text('Pelanggaran Berdasarkan Lokasi', 20, 131);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Sekolah: ${violationsSekolah}`, 20, 141);
    doc.text(`Asrama: ${violationsAsrama}`, 20, 148);
    doc.text(`Di Luar Sekolah: ${violationsLuar}`, 20, 155);
    doc.text(`Total Pelanggaran: ${violations.length}`, 20, 162);
    
    // Rewards by Location
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Green for rewards
    doc.text('Reward Berdasarkan Lokasi', 20, 174);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Sekolah: ${rewardsSekolah}`, 20, 184);
    doc.text(`Asrama: ${rewardsAsrama}`, 20, 191);
    doc.text(`Di Luar Sekolah: ${rewardsLuar}`, 20, 198);
    doc.text(`Total Reward: ${rewards.length}`, 20, 205);
    
    // Detailed Logs Table
    if (logs.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(27, 42, 74);
      doc.text('Riwayat Aktivitas Poin', 20, 220);
      
      const tableData = logs.map((log: any) => [
        new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        log.category?.name || '-',
        log.points_changed > 0 ? `+${log.points_changed}` : log.points_changed,
        log.location || '-',
        log.notes || '-'
      ]);
      
      autoTable(doc, {
        startY: 225,
        head: [['Tanggal', 'Kategori', 'Poin', 'Lokasi', 'Catatan']],
        body: tableData,
        headStyles: {
          fillColor: [27, 42, 74],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 15 },
          3: { cellWidth: 25 },
          4: { cellWidth: 'auto' }
        }
      });
    }
    
    // Add footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Halaman ${i} dari ${pageCount} | Generated: ${new Date().toLocaleDateString('id-ID')}`,
        105,
        285,
        { align: 'center' }
      );
    }
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="laporan-poin-${student.nomor_induk}.pdf"`,
        'Content-Type': 'application/pdf',
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ message: 'Gagal membuat PDF' }, { status: 500 });
  }
}
