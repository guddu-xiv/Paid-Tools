/**
 * SSC Borderland (borderlandssc.in) Test Paper Converter
 * Converts Borderland SSC / CCT / Mission Merit test questions into clean, standard bilingual .txt format.
 * Sets paid: true, preserves mathematical formulas, equations, comprehension passages, and explanations.
 */

export interface BorderlandOptionItem {
  id?: string | number;
  text?: string;
  textHi?: string;
}

export interface BorderlandQuestionItem {
  id?: string | number;
  questionId?: string;
  text?: string;
  textHi?: string;
  comprehension?: string;
  comprehensionHi?: string;
  options?: BorderlandOptionItem[] | string[];
  optionsHi?: string[];
  correct?: string | number;
  correctIndices?: number[];
  userAnswer?: number | null;
  right?: boolean;
  solution?: string;
  solutionHi?: string;
  explanation?: string;
  explanationHi?: string;
  imageUrl?: string | null;
  sectionName?: string;
  topicName?: string;
  examDate?: string;
  shift?: string;
  [key: string]: unknown;
}

export interface BorderlandTestMeta {
  id?: string;
  title: string;
  seriesTitle?: string;
  folderName?: string;
  folderPath?: string;
  categoryName?: string;
  totalQuestions?: number;
  durationMinutes?: number | string;
  marks?: number | string;
  examDate?: string;
  shift?: string;
  isPaid?: boolean;
}

export interface BorderlandConvertedResult {
  title: string;
  seriesTitle: string;
  folderName: string;
  totalQuestions: number;
  cleanTxt: string;
  questions: Array<{
    qNum: number;
    questionEn: string;
    questionHi: string;
    comprehensionEn?: string;
    comprehensionHi?: string;
    optionsEn: string[];
    optionsHi: string[];
    correctOptionLetter: 'A' | 'B' | 'C' | 'D' | '';
    answerClean: string;
    explanationEn: string;
    explanationHi: string;
    section: string;
    imageUrl?: string | null;
  }>;
  rawJson: string;
  id?: string;
  rawMeta?: Record<string, any>;
  rawQuestions?: any[];
}

/**
 * Clean text from HTML tags and entities while preserving LaTeX & math expressions
 */
export function cleanBorderlandText(raw?: string | null): string {
  if (!raw) return '';
  let str = String(raw);

  // 1. Remove style and script tags
  str = str.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  str = str.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // 2. Linebreaks & paragraphs
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n');

  // 3. Strip only real HTML tags (starting with a letter or /) so math inequalities like "x < y and z > 0" stay intact
  str = str.replace(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s+[^>]*)?\/?>/g, '');

  // 4. Decode HTML entities
  str = str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // 5. Clean extra whitespace
  str = str.replace(/[ \t]+/g, ' ');
  str = str.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return str.trim();
}

/**
 * Determine option letter (A, B, C, D) from 0-based or 1-based index or letter string
 */
export function resolveBorderlandOptionLetter(val: unknown): 'A' | 'B' | 'C' | 'D' | '' {
  if (val === undefined || val === null || val === '') return '';

  if (typeof val === 'number') {
    if (val === 0) return 'A';
    if (val === 1) return 'B';
    if (val === 2) return 'C';
    if (val === 3) return 'D';
  }

  const str = String(val).trim().toUpperCase();
  if (str === 'A' || str === '(A)' || str === 'OPTION A') return 'A';
  if (str === 'B' || str === '(B)' || str === 'OPTION B') return 'B';
  if (str === 'C' || str === '(C)' || str === 'OPTION C') return 'C';
  if (str === 'D' || str === '(D)' || str === 'OPTION D') return 'D';

  // 0-indexed numeric representations
  if (str === '0') return 'A';
  if (str === '1') return 'B';
  if (str === '2') return 'C';
  if (str === '3') return 'D';

  // Named options
  if (str === 'OPTION 1' || str === 'OPTION (1)') return 'A';
  if (str === 'OPTION 2' || str === 'OPTION (2)') return 'B';
  if (str === 'OPTION 3' || str === 'OPTION (3)') return 'C';
  if (str === 'OPTION 4' || str === 'OPTION (4)') return 'D';

  return '';
}

/**
 * Convert raw Borderland SSC test data into standard clean bilingual .txt
 */
export function convertBorderlandToCleanTxt(
  questions: BorderlandQuestionItem[],
  meta?: BorderlandTestMeta
): BorderlandConvertedResult {
  const testTitle = meta?.title?.trim() || 'SSC Borderland Test';
  const seriesTitle = meta?.seriesTitle?.trim() || 'SSC Borderland Official (borderlandssc.in)';
  const folderName = meta?.folderName?.trim() || meta?.categoryName?.trim() || 'General';
  const duration = meta?.durationMinutes ? `${meta.durationMinutes} Min` : '60 Min';
  const totalQuestions = questions.length;
  const examDate = meta?.examDate || '';
  const shift = meta?.shift || '';

  const parsedQuestions: BorderlandConvertedResult['questions'] = [];
  const lines: string[] = [];

  // Standard Header Banner
  lines.push('==================================================');
  lines.push(`EXAM: SSC BORDERLAND (borderlandssc.in)`);
  lines.push(`SERIES: ${seriesTitle}`);
  lines.push(`FOLDER: ${folderName}`);
  lines.push(`TEST: ${testTitle}`);
  if (meta?.folderPath) lines.push(`PATH: ${meta.folderPath}`);
  if (examDate || shift) lines.push(`DATE: ${examDate || '-'} | SHIFT: ${shift || '-'}`);
  lines.push(`TOTAL QUESTIONS: ${totalQuestions} | DURATION: ${duration}`);
  lines.push(`PAID STATUS: TRUE (ALL UNLOCKED ✦)`);
  lines.push('==================================================');
  lines.push('');

  let currentSection = '';

  for (let idx = 0; idx < questions.length; idx++) {
    const qItem = (questions[idx] || {}) as any;
    const qNum = idx + 1;

    // Detect section name change
    const secName = String(qItem._secName || qItem.sectionName || qItem.subject || qItem.topicName || '').trim();
    if (secName && secName !== currentSection) {
      currentSection = secName;
      lines.push('');
      lines.push(`=== [ SECTION: ${currentSection.toUpperCase()} ] ===`);
      lines.push('');
    }

    // Direction / Comprehension
    const compEn = cleanBorderlandText(
      qItem.comprehension || qItem.passage || qItem.direction || qItem.content?.comprehension?.en
    );
    const compHi = cleanBorderlandText(
      qItem.comprehensionHi || qItem.passage_hi || qItem.content?.comprehension?.hi
    );

    if (compEn || compHi) {
      if (compEn && compHi && compEn !== compHi) {
        lines.push(`[Direction / निर्देश]: ${compEn}`);
        lines.push(`    ${compHi}`);
      } else {
        lines.push(`[Direction / निर्देश]: ${compEn || compHi}`);
      }
    }

    // Question stem (strip redundant leading "Q1." / "Q.1" so numbering stays clean)
    let qEn = cleanBorderlandText(
      qItem.question || qItem.text || qItem.content?.en || qItem.title
    ).replace(/^Q\.?\s*\d+[\.\):\-]\s*/i, '');
    let qHi = cleanBorderlandText(
      qItem.question_hi || qItem.textHi || qItem.content?.hi
    ).replace(/^Q\.?\s*\d+[\.\):\-]\s*/i, '');

    if (!qEn && qHi) qEn = qHi;

    // Extract image link if present
    let imgUrl: string | null =
      qItem.imageUrl ||
      qItem.image ||
      qItem.img ||
      qItem.content?.imageUrl ||
      qItem.content?.image ||
      null;

    if (!imgUrl) {
      const rawText = String(qItem.question || qItem.text || qItem.content?.en || '');
      const srcMatch = rawText.match(/src=["']([^"']+)["']/i);
      if (srcMatch) imgUrl = srcMatch[1];
    }

    if (imgUrl && !qEn.includes(imgUrl)) {
      qEn += ` [Figure: ${imgUrl}]`;
    }

    // Options extraction
    let enOpts: string[] = [];
    let hiOpts: string[] = [];

    if (Array.isArray(qItem.options)) {
      enOpts = qItem.options.map((o: any) =>
        cleanBorderlandText(typeof o === 'string' ? o : o?.text ?? o?.value ?? o?.label ?? '')
      );
      hiOpts = qItem.options.map((o: any) =>
        cleanBorderlandText(typeof o === 'string' ? '' : o?.textHi ?? '')
      );
    } else if (Array.isArray(qItem.options?.en)) {
      enOpts = qItem.options.en.map((o: string) => cleanBorderlandText(o));
      hiOpts = Array.isArray(qItem.options?.hi)
        ? qItem.options.hi.map((o: string) => cleanBorderlandText(o))
        : [];
    }

    if (Array.isArray(qItem.options_hi) && hiOpts.every((h) => !h)) {
      hiOpts = qItem.options_hi.map((o: any) => cleanBorderlandText(String(o || '')));
    }

    // Pad to 4 options if fewer
    while (enOpts.length < 4) enOpts.push(`Option (${['A', 'B', 'C', 'D'][enOpts.length]})`);

    // Correct Answer determination
    let letter = resolveBorderlandOptionLetter(qItem.correct);
    if (!letter && Array.isArray(qItem.correctIndices) && qItem.correctIndices.length > 0) {
      letter = resolveBorderlandOptionLetter(qItem.correctIndices[0]);
    }
    if (!letter && qItem.answer !== undefined) {
      letter = resolveBorderlandOptionLetter(qItem.answer);
    }
    if (!letter) letter = 'A';

    const letterToIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    const ansIdx = letterToIdx[letter] ?? 0;
    const answerClean = enOpts[ansIdx] || `Option (${letter})`;

    // Explanation / Solution
    const exEn = cleanBorderlandText(
      qItem.explanation || qItem.exp || qItem.solution || qItem.explanation?.en
    );
    const exHi = cleanBorderlandText(
      qItem.explanationHi || qItem.explanation_hi || qItem.exp_hi || qItem.solutionHi || qItem.explanation?.hi
    );

    parsedQuestions.push({
      qNum,
      questionEn: qEn,
      questionHi: qHi,
      comprehensionEn: compEn,
      comprehensionHi: compHi,
      optionsEn: enOpts.slice(0, 4),
      optionsHi: hiOpts.slice(0, 4),
      correctOptionLetter: letter,
      answerClean,
      explanationEn: exEn,
      explanationHi: exHi,
      section: currentSection,
      imageUrl: imgUrl,
    });

    // Write to Clean .txt lines
    lines.push(`${qNum}. ${qEn}`);
    if (qHi && qHi !== qEn) {
      lines.push(`   ${qHi}`);
    }

    const letters = ['(A)', '(B)', '(C)', '(D)'];
    for (let oIdx = 0; oIdx < 4; oIdx++) {
      const optEn = enOpts[oIdx] || '';
      const optHi = hiOpts[oIdx] || '';
      if (optEn && optHi && optEn !== optHi) {
        lines.push(`   ${letters[oIdx]} ${optEn} / ${optHi}`);
      } else {
        lines.push(`   ${letters[oIdx]} ${optEn || optHi || `Option ${letters[oIdx]}`}`);
      }
    }

    // Answer Line
    lines.push(`Ans: (${letter}) ${answerClean}`);

    // Explanation Line
    if (exEn || exHi) {
      if (exEn) lines.push(`Ex: ${exEn}`);
      if (exHi && exHi !== exEn) lines.push(`[Hindi / हिन्दी व्याख्या]: ${exHi}`);
    }

    // Source Line below Ex: (Shift, Date, Year, Exam Name, Topic) as requested
    const sourceParts: string[] = [];
    const qAny = qItem as any;
    if (qItem.examTag || qAny.examTag) {
      sourceParts.push(String(qItem.examTag || qAny.examTag));
    } else {
      const examNameStr = qItem.examName || qAny.examName || meta?.seriesTitle || 'SSC BORDERLAND';
      const examDateStr = qItem.examDate || qAny.examDate || meta?.examDate || '2026';
      const shiftStr = qItem.shift || qAny.shift || meta?.shift || 'Shift 1';
      sourceParts.push(`${examNameStr} | ${examDateStr} | ${shiftStr}`);
    }

    const topicLabel = qItem.topicName || qAny.topicName || qItem.tag || qAny.tag || '';
    if (topicLabel) {
      sourceParts.push(`Topic: ${topicLabel}`);
    }

    if (sourceParts.length > 0) {
      lines.push(`[Source: ${sourceParts.join(' | ')}]`);
    }

    lines.push('--------------------------------------------------');
    lines.push('');
  }

  return {
    title: testTitle,
    seriesTitle,
    folderName,
    totalQuestions,
    cleanTxt: lines.join('\n'),
    questions: parsedQuestions,
    rawJson: JSON.stringify(questions, null, 2),
  };
}
