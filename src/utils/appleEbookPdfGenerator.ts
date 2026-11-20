import { jsPDF } from 'jspdf';

export interface EbookMetadata {
  title: string;
  subtitle?: string;
  author?: string;
  edition?: string;
  targetExam?: string;
  brandTag?: string;
  accentColor?: string; // hex
  theme?: 'minimal-light' | 'apple-dark' | 'editorial' | 'graphite';
}

export interface EbookChapter {
  id: string;
  title: string;
  subtitle?: string;
  content: string; // Markdown or formatted text
}

export interface EbookDocument {
  meta: EbookMetadata;
  chapters: EbookChapter[];
}

/**
 * Generates an Apple-style minimalist, high-typography PDF for Theory Ebooks.
 */
export async function generateAppleStyleEbookPdf(
  doc: EbookDocument,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 48; // ~0.66 in
  const contentWidth = pageWidth - margin * 2;

  const accentHex = doc.meta.accentColor || '#111827';
  const isDark = doc.meta.theme === 'apple-dark';

  // Helper colors
  const bgFill = isDark ? [17, 24, 39] : [255, 255, 255];
  const textPrimary = isDark ? [243, 244, 246] : [17, 24, 39];
  const textSecondary = isDark ? [156, 163, 175] : [100, 116, 139];
  const dividerColor = isDark ? [55, 65, 81] : [226, 232, 240];
  const calloutBg = isDark ? [31, 41, 55] : [248, 250, 252];
  const calloutBorder = isDark ? [75, 85, 99] : [203, 213, 225];

  const setPageBackground = () => {
    pdf.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // -------------------------------------------------------------
  // 1. MINIMALIST COVER PAGE (Apple Style)
  // -------------------------------------------------------------
  setPageBackground();

  // Subtle top kicker
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
  pdf.text(
    (doc.meta.targetExam || 'THEORY & SHORTCUTS CAPSULE').toUpperCase(),
    margin,
    margin + 36
  );

  // Minimalist thin rule
  pdf.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  pdf.setLineWidth(0.75);
  pdf.line(margin, margin + 46, margin + 80, margin + 46);

  // Main Book Title (Large, crisp, uncluttered)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  const titleLines = pdf.splitTextToSize(doc.meta.title || 'Theory Ebook', contentWidth);
  pdf.text(titleLines, margin, margin + 110);

  const titleBottomY = margin + 110 + titleLines.length * 36;

  // Subtitle
  if (doc.meta.subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    const subLines = pdf.splitTextToSize(doc.meta.subtitle, contentWidth);
    pdf.text(subLines, margin, titleBottomY + 14);
  }

  // Cover Feature Points / Chapter index preview
  const featuresY = pageHeight * 0.52;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  pdf.text('TABLE OF CONTENTS', margin, featuresY);

  pdf.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, featuresY + 8, pageWidth - margin, featuresY + 8);

  let tocY = featuresY + 28;
  doc.chapters.slice(0, 8).forEach((ch, idx) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    const chNum = String(idx + 1).padStart(2, '0');
    pdf.text(`${chNum}`, margin, tocY);

    pdf.setFont('helvetica', 'normal');
    pdf.text(ch.title, margin + 28, tocY);

    pdf.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
    pdf.setLineDashPattern([2, 4], 0);
    pdf.line(margin + 34 + pdf.getTextWidth(ch.title), tocY - 2, pageWidth - margin - 24, tocY - 2);
    pdf.setLineDashPattern([], 0);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Ch.${idx + 1}`, pageWidth - margin - 20, tocY, { align: 'right' });

    tocY += 22;
  });

  // Footer metadata on cover
  const coverFooterY = pageHeight - margin - 24;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  pdf.text(doc.meta.author || '@DesiCrackOfficial', margin, coverFooterY);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
  pdf.text(doc.meta.edition || '2025-2026 Minimal Edition', margin, coverFooterY + 14);

  if (doc.meta.brandTag) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    pdf.text(doc.meta.brandTag, pageWidth - margin, coverFooterY, { align: 'right' });
  }

  // -------------------------------------------------------------
  // 2. CHAPTER PAGES (Clean, Apple-style reader layout)
  // -------------------------------------------------------------
  let pageNum = 1;

  for (let cIdx = 0; cIdx < doc.chapters.length; cIdx++) {
    const chapter = doc.chapters[cIdx];
    pdf.addPage('a4', 'portrait');
    pageNum++;
    setPageBackground();

    if (onProgress) {
      onProgress(cIdx + 1, doc.chapters.length);
    }

    let currentY = margin + 12;

    // Running Header
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    pdf.text(doc.meta.title.toUpperCase(), margin, currentY);
    pdf.text(chapter.title, pageWidth - margin, currentY, { align: 'right' });

    currentY += 8;
    pdf.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 34;

    // Chapter Number Kicker (e.g. "CHAPTER 01")
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    const chNumLabel = `CHAPTER ${String(cIdx + 1).padStart(2, '0')}`;
    pdf.text(chNumLabel, margin, currentY);

    currentY += 18;

    // Chapter Title (Apple display style)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
    const chTitleLines = pdf.splitTextToSize(chapter.title, contentWidth);
    pdf.text(chTitleLines, margin, currentY);
    currentY += chTitleLines.length * 24 + 4;

    if (chapter.subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
      const chSubLines = pdf.splitTextToSize(chapter.subtitle, contentWidth);
      pdf.text(chSubLines, margin, currentY);
      currentY += chSubLines.length * 15 + 8;
    }

    // Divider under chapter title
    pdf.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, margin + 48, currentY);
    currentY += 22;

    // Render Chapter Content Blocks (Headings, Paragraphs, Callouts, Lists)
    const rawLines = chapter.content.split('\n');
    let inCallout = false;
    let calloutLines: string[] = [];

    const flushCallout = () => {
      if (calloutLines.length === 0) return;
      const boxText = calloutLines.join('\n');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      const splitBox = pdf.splitTextToSize(boxText, contentWidth - 36);
      const boxHeight = splitBox.length * 14 + 20;

      // Check overflow
      if (currentY + boxHeight > pageHeight - margin - 24) {
        addContinuationPage();
      }

      // Draw Apple Note Box
      pdf.setFillColor(calloutBg[0], calloutBg[1], calloutBg[2]);
      pdf.roundedRect(margin, currentY, contentWidth, boxHeight, 6, 6, 'F');

      // Left accent bar
      pdf.setFillColor(textPrimary[0], textPrimary[1], textPrimary[2]);
      pdf.rect(margin, currentY, 3, boxHeight, 'F');

      // Callout header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
      pdf.text('KEY TAKEAWAY / FORMULA RULE', margin + 14, currentY + 14);

      // Callout body
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
      pdf.text(splitBox, margin + 14, currentY + 28);

      currentY += boxHeight + 16;
      calloutLines = [];
      inCallout = false;
    };

    const addContinuationPage = () => {
      pdf.addPage('a4', 'portrait');
      pageNum++;
      setPageBackground();
      currentY = margin + 12;

      // Running header
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
      pdf.text(doc.meta.title.toUpperCase(), margin, currentY);
      pdf.text(`${chapter.title} (Contd.)`, pageWidth - margin, currentY, { align: 'right' });

      currentY += 8;
      pdf.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 28;
    };

    for (let lIdx = 0; lIdx < rawLines.length; lIdx++) {
      const line = rawLines[lIdx].trimEnd();

      // Check for Callout syntax (starts with > or [Note] or [Formula])
      if (line.startsWith('>') || line.startsWith('[Note') || line.startsWith('[Rule')) {
        inCallout = true;
        calloutLines.push(line.replace(/^>\s*/, '').replace(/^\[(Note|Rule|Formula)\]\s*/i, ''));
        continue;
      } else if (inCallout) {
        if (!line.trim()) {
          flushCallout();
        } else {
          calloutLines.push(line);
          continue;
        }
      }

      if (!line.trim()) {
        currentY += 8;
        continue;
      }

      // Check overflow
      if (currentY > pageHeight - margin - 36) {
        addContinuationPage();
      }

      // 1. Heading 1 (## Header)
      if (line.startsWith('## ')) {
        const hText = line.replace(/^##\s*/, '');
        currentY += 12;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        const hLines = pdf.splitTextToSize(hText, contentWidth);
        pdf.text(hLines, margin, currentY);
        currentY += hLines.length * 16 + 8;
        continue;
      }

      // 2. Heading 2 (### Sub-header)
      if (line.startsWith('### ')) {
        const subHText = line.replace(/^###\s*/, '');
        currentY += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        const subHLines = pdf.splitTextToSize(subHText, contentWidth);
        pdf.text(subHLines, margin, currentY);
        currentY += subHLines.length * 14 + 6;
        continue;
      }

      // 3. Bullet Point (- item or * item)
      if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        const bulletMatch = line.match(/^(\-|\*|\d+\.)\s*(.*)/);
        const prefix = bulletMatch ? bulletMatch[1] : '•';
        const body = bulletMatch ? bulletMatch[2] : line;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
        pdf.text(prefix === '-' || prefix === '*' ? '•' : prefix, margin + 4, currentY);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        const bulletLines = pdf.splitTextToSize(body, contentWidth - 20);
        pdf.text(bulletLines, margin + 18, currentY);
        currentY += bulletLines.length * 14 + 4;
        continue;
      }

      // 4. Regular Paragraph Text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
      const pLines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(pLines, margin, currentY);
      currentY += pLines.length * 14 + 4;
    }

    if (inCallout) {
      flushCallout();
    }

    // Running Footer on each page
    const footerY = pageHeight - margin + 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    pdf.text(doc.meta.author || '@DesiCrackOfficial', margin, footerY);
    pdf.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: 'right' });
  }

  const safeFileName = (doc.meta.title || 'Theory_Ebook')
    .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
    .replace(/\s+/g, '_')
    .slice(0, 60);

  pdf.save(`[EBOOK]_${safeFileName}.pdf`);
}
