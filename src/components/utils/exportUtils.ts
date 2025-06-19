import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '@/types';
import { format } from 'date-fns';
import { analyzePerformance, recommendDailyProblems } from '@/lib/ai-service';

// Type declaration for jspdf-autotable extension
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

// CSV Export (unchanged)
export const exportToCSV = (students: Student[]) => {
  const headers = ['Name', 'Email', 'Codeforces Handle', 'Submissions', 'Current Rating', 'Max Rating'];
  
  const csvContent = [
    headers.join(','),
    ...students.map(student => [
      `"${student.name.replace(/"/g, '""')}"`,
      `"${student.email}"`,
      `"${student.codeforcesHandle}"`,
      student.submissions?.length || 0,
      student.currentRating || 'N/A',
      student.maxRating || 'N/A'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export for multiple students
export const exportToPDF = (students: Student[]) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Students List', 105, 20, { align: 'center' });

    // Table data
    const headers = [['Name', 'Email', 'Handle', 'Submissions', 'Rating', 'Max Rating']];
    const data = students.map(student => [
      student.name || '-',
      student.email || '-',
      student.codeforcesHandle || '-',
      student.submissions?.length.toString() || '0',
      student.currentRating?.toString() || '-',
      student.maxRating?.toString() || '-'
    ]);

    // AutoTable configuration
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Footer with generation date
    const dateStr = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    // Safely access finalY position
    const finalY = (doc as any).lastAutoTable?.finalY || doc.internal.pageSize.height - 20;
    doc.text(`Generated on: ${dateStr}`, 14, finalY + 10);

    doc.save(`students_${new Date().toISOString().slice(0, 10)}.pdf`);
    
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Helper function to convert rating to color
const getRatingColor = (rating: number): string => {
  if (!rating) return '#a3a3a3';
  if (rating < 1200) return '#a3a3a3';
  if (rating < 1400) return '#22c55e';
  if (rating < 1600) return '#0ea5e9';
  if (rating < 1900) return '#8b5cf6';
  if (rating < 2100) return '#f97316';
  if (rating < 2400) return '#ef4444';
  return '#d946ef';
};

// Helper function to calculate statistics
const calculateStats = (student: Student) => {
  const solvedProblems = new Map<string, { rating: number }>();
  const verdictDistribution: Record<string, number> = {};
  const solvedByRating: Record<number, number> = {};

  student.submissions?.forEach((submission) => {
    verdictDistribution[submission.verdict] = (verdictDistribution[submission.verdict] || 0) + 1;
    
    if (submission.verdict === 'OK') {
      const problemKey = `${submission.contestId}_${submission.problemIndex}`;
      if (!solvedProblems.has(problemKey)) {
        solvedProblems.set(problemKey, {
          rating: submission.problemRating || 0,
        });
        if (submission.problemRating) {
          const ratingBucket = Math.floor(submission.problemRating / 100) * 100;
          solvedByRating[ratingBucket] = (solvedByRating[ratingBucket] || 0) + 1;
        }
      }
    }
  });

  return { solvedProblems, verdictDistribution, solvedByRating };
};

// PDF Export for a student stats
export const exportStudentStatsToPDF = async (student: Student) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const { solvedProblems, verdictDistribution, solvedByRating } = calculateStats(student);
    const solvedCount = solvedProblems.size;
    const submissionCount = student.submissions?.length || 0;
    const contestCount = student.contestHistory?.length || 0;

    // Generate AI content
    const [performanceAnalysis, dailyProblems] = await Promise.all([
      analyzePerformance(student, student.submissions || [], student.contestHistory || []),
      recommendDailyProblems(student)
    ]);

    // Cover page
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text(`${student.name}'s Competitive Programming Report`, 105, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(`Codeforces Handle: ${student.codeforcesHandle}`, 105, 40, { align: 'center' });
    
    doc.addPage();

    // AI Analysis Section
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('AI Performance Analysis', 14, 20);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 22, 60, 22);

    const formattedAnalysis = performanceAnalysis
      .replace(/<[^>]*>?/gm, '')
      .replace(/<!--.*?-->/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    const paragraphs = formattedAnalysis.split('\n\n');
    let currentY = 30;
    
    paragraphs.forEach(paragraph => {
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
      }
      
      const lines = doc.splitTextToSize(paragraph, 180);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, 14, currentY);
      currentY += lines.length * 5 + 5;
    });

    // Daily Problems Section - Improved version
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text("Today's Recommended Problem Set", 14, 20);
    doc.line(14, 22, 80, 22);

    // Parse problems from the content
    const problemRows: string[][] = [];
    const problemLines = dailyProblems.split('\n').filter(line => line.trim().length > 0);

    problemLines.forEach(line => {
      // Match problem format like: "Problem 1328A - Divisibility Problem (Rating: 800) - Focus: Main, Implementation"
      const match = line.match(/Problem\s+([^\s-]+)[^\d]+(\d+)\)\s+-\s+Focus:\s+([^\n]+)/);
      if (match) {
        problemRows.push([
          match[1], // Problem ID
          line.split(' - ')[0].replace(/Problem\s+/i, '').trim(), // Full problem name
          match[2], // Rating
          match[3].trim() // Focus area
        ]);
      }
    });

    // If we found structured problems, display in table
    if (problemRows.length > 0) {
      autoTable(doc, {
        startY: 30,
        head: [['Problem ID', 'Problem Name', 'Rating', 'Focus Area']],
        body: problemRows,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          cellPadding: 4,
          fontSize: 10,
          valign: 'middle',
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const rating = parseInt(data.cell.raw as string);
            if (!isNaN(rating)) {
              const color = getRatingColor(rating);
              doc.setFillColor(color);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
              doc.setTextColor(255, 255, 255);
              doc.text(data.cell.raw as string, data.cell.x + data.cell.width / 2, data.cell.y + 7, {
                align: 'center'
              });
            }
          }
        }
      });
    } else {
      // Fallback to simple text display
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(
        dailyProblems.replace(/<[^>]*>?/gm, '').replace(/\n\s*\n/g, '\n').trim(),
        180
      );
      doc.text(lines, 14, 30);
    }

    // Student Overview Section
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('Student Overview', 14, 20);
    doc.line(14, 22, 60, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Name', student.name],
        ['Email', student.email],
        ['Codeforces Handle', student.codeforcesHandle],
        ['Current Rating', student.currentRating?.toString() || 'N/A'],
        ['Max Rating', student.maxRating?.toString() || 'N/A'],
        ['Problems Solved', solvedCount.toString()],
        ['Total Submissions', submissionCount.toString()],
        ['Contests Participated', contestCount.toString()],
        ['Last Synced', student.lastSynced ? format(new Date(student.lastSynced), 'MMM dd, yyyy HH:mm') : 'Never']
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        cellPadding: 4,
        fontSize: 10
      }
    });

    // Performance Statistics Section
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('Performance Statistics', 14, 20);
    doc.line(14, 22, 70, 22);

    // Verdict Distribution
    doc.setFontSize(14);
    doc.text('Verdict Distribution', 14, 35);
    
    const verdictData = Object.entries(verdictDistribution).map(([verdict, count]) => [
      verdict,
      count.toString(),
      submissionCount > 0 ? ((count / submissionCount) * 100).toFixed(1) + '%' : '0%'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Verdict', 'Count', 'Percentage']],
      body: verdictData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        cellPadding: 4,
        fontSize: 10
      }
    });

    // Solved Problems by Rating
    doc.setFontSize(14);
    doc.text('Solved Problems by Rating', 14, (doc as any).lastAutoTable.finalY + 15);

    const ratingData = Object.entries(solvedByRating)
      .map(([rating, count]) => [
        `${rating}-${Number(rating) + 99}`,
        count.toString(),
        solvedCount > 0 ? ((count / solvedCount) * 100).toFixed(1) + '%' : '0%'
      ])
      .sort((a, b) => Number(a[0].split('-')[0]) - Number(b[0].split('-')[0]));

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Rating Range', 'Solved', 'Percentage']],
      body: ratingData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        cellPadding: 4,
        fontSize: 10
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0 && data.cell.raw) {
          const ratingStr = data.cell.raw.toString();
          const rating = Number(ratingStr.split('-')[0]);
          const color = getRatingColor(rating);
          doc.setFillColor(color);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(ratingStr, data.cell.x + 2, data.cell.y + 7);
        }
      }
    });

    // Recent Activity Section
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('Recent Activity', 14, 20);
    doc.line(14, 22, 50, 22);

    // Recent Submissions
    if (student.submissions?.length) {
      doc.setFontSize(14);
      doc.text('Recent Submissions (Last 10)', 14, 35);

      const recentSubmissions = [...student.submissions]
        .sort((a, b) => (b.creationTimeSeconds || 0) - (a.creationTimeSeconds || 0))
        .slice(0, 10)
        .map(sub => [
          sub.problemName || `Problem ${sub.problemIndex}`,
          sub.problemRating?.toString() || 'N/A',
          sub.verdict || 'UNKNOWN',
          format(new Date((sub.creationTimeSeconds || 0) * 1000), 'MMM dd, HH:mm')
        ]);

      autoTable(doc, {
        startY: 40,
        head: [['Problem', 'Rating', 'Verdict', 'Date']],
        body: recentSubmissions,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          cellPadding: 4,
          fontSize: 8
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2 && data.cell.raw) {
            const verdict = data.cell.raw.toString();
            if (verdict === 'OK') {
              doc.setFillColor(16, 185, 129);
            } else if (verdict === 'WRONG_ANSWER') {
              doc.setFillColor(239, 68, 68);
            } else {
              doc.setFillColor(156, 163, 175);
            }
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(verdict, data.cell.x + 2, data.cell.y + 7);
          }
        }
      });
    }

    // Recent Contests
    if (student.contestHistory?.length) {
      doc.setFontSize(14);
      doc.text('Recent Contests (Last 5)', 14, (doc as any).lastAutoTable.finalY + 15);

      const recentContests = [...student.contestHistory]
        .sort((a, b) => (b.ratingUpdateTimeSeconds || 0) - (a.ratingUpdateTimeSeconds || 0))
        .slice(0, 5)
        .map(contest => {
          const ratingChange = (contest.newRating || 0) - (contest.oldRating || 0);
          return [
            contest.contestName || 'Unknown Contest',
            `#${contest.rank || 'N/A'}`,
            ratingChange >= 0 ? `+${ratingChange}` : ratingChange.toString(),
            format(new Date((contest.ratingUpdateTimeSeconds || 0) * 1000), 'MMM dd, yyyy')
          ];
        });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Contest', 'Rank', 'Rating Change', 'Date']],
        body: recentContests,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          cellPadding: 4,
          fontSize: 8
        }
      });
    }

    // Footer
    const dateStr = format(new Date(), 'MMM dd, yyyy HH:mm');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated by CF Coach on ${dateStr}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });

    // Save PDF
    doc.save(`${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_Codeforces_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF report');
  }
};