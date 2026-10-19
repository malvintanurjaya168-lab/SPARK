import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { violations, rewards, totalViolations, totalRewards } = body;

    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = 297;
    const pageHeight = 210;

    // Title
    pdf.setFontSize(18);
    pdf.setTextColor(27, 42, 74); // #1B2A4A
    pdf.text('Laporan Distribusi Lokasi', pageWidth / 2, 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Total Pelanggaran: ${totalViolations} | Total Reward: ${totalRewards}`, pageWidth / 2, 22, { align: 'center' });

    // Violations Pie Chart Section
    pdf.setFontSize(14);
    pdf.setTextColor(27, 42, 74);
    pdf.text('Distribusi Pelanggaran', 20, 35);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    let yPos = 42;
    violations.forEach((item: any) => {
      const percentage = totalViolations > 0 ? ((item.value / totalViolations) * 100).toFixed(1) : 0;
      pdf.text(`${item.name}: ${item.value} (${percentage}%)`, 25, yPos);
      yPos += 7;
    });

    // Rewards Pie Chart Section
    pdf.setFontSize(14);
    pdf.setTextColor(27, 42, 74);
    pdf.text('Distribusi Reward', 160, 35);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    yPos = 42;
    rewards.forEach((item: any) => {
      const percentage = totalRewards > 0 ? ((item.value / totalRewards) * 100).toFixed(1) : 0;
      pdf.text(`${item.name}: ${item.value} (${percentage}%)`, 165, yPos);
      yPos += 7;
    });

    // Violations Bar Chart Section
    pdf.setFontSize(14);
    pdf.setTextColor(27, 42, 74);
    pdf.text('Jumlah Pelanggaran per Lokasi', 20, 80);

    yPos = 90;
    const maxViolations = Math.max(...violations.map((v: any) => v.value), 1);
    violations.forEach((item: any) => {
      const barWidth = (item.value / maxViolations) * 100;
      pdf.setFillColor(239, 68, 68); // Red color
      pdf.rect(25, yPos, barWidth, 8, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${item.name}: ${item.value}`, 25 + barWidth + 5, yPos + 6);
      yPos += 15;
    });

    // Rewards Bar Chart Section
    pdf.setFontSize(14);
    pdf.setTextColor(27, 42, 74);
    pdf.text('Jumlah Reward per Lokasi', 160, 80);

    yPos = 90;
    const maxRewards = Math.max(...rewards.map((r: any) => r.value), 1);
    rewards.forEach((item: any) => {
      const barWidth = (item.value / maxRewards) * 100;
      pdf.setFillColor(16, 185, 129); // Green color
      pdf.rect(165, yPos, barWidth, 8, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${item.name}: ${item.value}`, 165 + barWidth + 5, yPos + 6);
      yPos += 15;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    const buffer = Buffer.from(pdf.output('arraybuffer'));
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="laporan-distribusi-lokasi.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ message: 'Gagal membuat PDF' }, { status: 500 });
  }
}
