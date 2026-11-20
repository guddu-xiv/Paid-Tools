/**
 * DK Agarwal / Agrawal Academy (agrawalacademy.com) Test Paper Converter
 * Converts AppX / ClassX JSON test questions (English url1 + Hindi url2)
 * into clean, standard bilingual (English + Hindi) .txt format compatible with PDF Studio.
 */

export interface DkAgarwalQuestionItem {
  id?: string;
  test_series_id?: string;
  test_id?: string;
  question_type?: string;
  question_ui_type?: string;
  question?: string;
  question_heading?: string;
  directive?: string;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_5?: string;
  option_6?: string;
  option_image_1?: string;
  option_image_2?: string;
  option_image_3?: string;
  option_image_4?: string;
  option_image_5?: string;
  image_link_1?: string;
  image_link_2?: string;
  image_link_3?: string;
  answer?: string | number;
  solution_heading?: string;
  solution_text?: string;
  solution_image_1?: string;
  solution_image_2?: string;
  difficulty_level?: string;
  section_id?: string;
  subject?: string;
  subject_title?: string;
  concept_title?: string;
  topic_title?: string;
  sortingparam?: string | number;
  positive_marks?: string | number;
  negative_marks?: string | number;
  [key: string]: unknown;
}

export interface DkAgarwalTestMeta {
  id?: string;
  title: string;
  seriesTitle?: string;
  subjectTitle?: string;
  totalQuestions?: number;
  durationMinutes?: number | string;
  marks?: number | string;
  isPaid?: boolean;
  date?: string;
}

export interface DkAgarwalConvertedResult {
  title: string;
  seriesTitle: string;
  totalQuestions: number;
  cleanTxt: string;
  questions: Array<{
    qNum: number;
    questionEn: string;
    questionHi: string;
    optionsEn: string[];
    optionsHi: string[];
    correctOptionLetter: 'A' | 'B' | 'C' | 'D' | 'E' | '';
    answerClean: string;
    explanationEn: string;
    explanationHi: string;
    section: string;
  }>;
  rawJson: string;
}

const DEVANAGARI_RE = /[\u0900-\u097F]/;

function hasDevanagari(str: string): boolean {
  return DEVANAGARI_RE.test(str);
}

/**
 * Normalizes a string for duplicate comparison across EN / HI URLs
 */
function normalizeCompareKey(str: string): string {
  const cleaned = str
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return hasDevanagari(cleaned) ? cleaned : cleaned.toLowerCase();
}

/**
 * Strips redundant option prefixes embedded inside option text (e.g. "A) irassible", "(B) Option", "C. Foo")
 */
export function stripLeadingOptionPrefix(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  // Strip repeated leading markers like "(A) A) text" up to 2 passes
  for (let i = 0; i < 2; i++) {
    const next = text.replace(/^(?:\([A-Ea-e1-5]\)|\[[A-Ea-e1-5]\]|[A-Ea-e][.):\-])\s+/, '').trim();
    if (next === text) break;
    text = next;
  }
  return text;
}

/**
 * Decode HTML entities, preserve line breaks & embedded image URLs, and strip styles/tags from AppX HTML
 */
export function cleanDkHtml(rawHtml?: string | null): string {
  if (!rawHtml) return '';
  let str = String(rawHtml);

  // 1. Remove style and script tags with their contents
  str = str.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  str = str.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // 2. Preserve image tags cleanly before stripping tags
  str = str.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, ' [Image: $1] ');

  // 3. Preserve superscripts & subscripts lightly if present
  str = str.replace(/<sup>(.*?)<\/sup>/gi, '^($1)');
  str = str.replace(/<sub>(.*?)<\/sub>/gi, '_($1)');

  // 4. Add bullet prefix for list items if not already starting with a bullet
  str = str.replace(/<li[^>]*>\s*(?![•\-\*])/gi, '• ');

  // 5. Convert block/break closings to newlines
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/(p|div|tr|li|ul|ol|h[1-6])>/gi, '\n');
  str = str.replace(/<(p|div|tr|h[1-6])[^>]*>/gi, '\n');
  str = str.replace(/<t[dh][^>]*>/gi, '  ');

  // 6. Strip all other HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // 7. Decode HTML entities
  str = str
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&minus;/g, '−')
    .replace(/&plusmn;/g, '±')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&deg;/g, '°')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠')
    .replace(/&approx;/g, '≈')
    .replace(/&radic;/g, '√')
    .replace(/&infin;/g, '∞')
    .replace(/&rarr;/g, '→')
    .replace(/&larr;/g, '←')
    .replace(/&harr;/g, '↔')
    .replace(/&pi;/g, 'π')
    .replace(/&alpha;/g, 'α')
    .replace(/&beta;/g, 'β')
    .replace(/&theta;/g, 'θ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // 8. Clean LaTeX wrappers if present
  str = str.replace(/\\\(\s*([^\\]+?)\s*\\\)/g, '$1');
  str = str.replace(/\\\[\s*([^\\]+?)\s*\\\]/g, '$1');

  // 9. Remove invisible zero-width characters & normalize line whitespace cleanly
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, (m) => (m === '\u00A0' ? ' ' : ''));
  str = str.replace(/\r\n?/g, '\n');

  const rawLines = str.split('\n').map((l) => l.replace(/[\t ]+/g, ' ').trim());
  const cleanedLines: string[] = [];
  let prevBlank = false;
  for (const line of rawLines) {
    if (!line) {
      if (cleanedLines.length > 0 && !prevBlank) {
        cleanedLines.push('');
        prevBlank = true;
      }
    } else {
      cleanedLines.push(line);
      prevBlank = false;
    }
  }

  return cleanedLines.join('\n').trim();
}

/**
 * Maps 1-based answer index or letter to option letter 'A' | 'B' | 'C' | 'D' | 'E'
 */
export function mapAnswerToLetter(
  ans: string | number | undefined | null
): 'A' | 'B' | 'C' | 'D' | 'E' | '' {
  if (ans === undefined || ans === null) return '';
  const clean = String(ans).trim().toUpperCase();
  if (clean === '1' || clean === 'A' || clean === '(A)' || clean === 'OPT1' || clean === 'OPTION 1' || clean === 'OPTION A') return 'A';
  if (clean === '2' || clean === 'B' || clean === '(B)' || clean === 'OPT2' || clean === 'OPTION 2' || clean === 'OPTION B') return 'B';
  if (clean === '3' || clean === 'C' || clean === '(C)' || clean === 'OPT3' || clean === 'OPTION 3' || clean === 'OPTION C') return 'C';
  if (clean === '4' || clean === 'D' || clean === '(D)' || clean === 'OPT4' || clean === 'OPTION 4' || clean === 'OPTION D') return 'D';
  if (clean === '5' || clean === 'E' || clean === '(E)' || clean === 'OPT5' || clean === 'OPTION 5' || clean === 'OPTION E') return 'E';
  return '';
}

function formatBilingualPair(en: string, hi: string): string {
  const cleanEn = (en || '').trim();
  const cleanHi = (hi || '').trim();
  if (cleanEn && cleanHi && normalizeCompareKey(cleanEn) !== normalizeCompareKey(cleanHi)) {
    return `${cleanEn} / ${cleanHi}`;
  }
  return cleanEn || cleanHi;
}

/**
 * Resolves paired question from secondary language array reliably
 */
function findPairedQuestion(
  primaryItem: DkAgarwalQuestionItem,
  idx: number,
  primaryLen: number,
  secondaryList?: DkAgarwalQuestionItem[]
): DkAgarwalQuestionItem | null {
  if (!secondaryList || secondaryList.length === 0) return null;
  if (secondaryList.length === primaryLen && secondaryList[idx]) {
    return secondaryList[idx];
  }
  const sortKey = primaryItem.sortingparam !== undefined ? String(primaryItem.sortingparam) : '';
  if (sortKey && sortKey !== '0.00' && sortKey !== '0') {
    const bySort = secondaryList.find((x) => String(x?.sortingparam || '') === sortKey);
    if (bySort) return bySort;
  }
  return secondaryList[idx] || null;
}

/**
 * Converts DK Agarwal questions payload (English url1 + optional Hindi url2)
 * into clean, standard bilingual (English + Hindi) .txt question paper.
 */
export function convertDkAgarwalToCleanTxt(
  questionsPrimary: DkAgarwalQuestionItem[],
  questionsSecondary?: DkAgarwalQuestionItem[],
  meta?: DkAgarwalTestMeta
): DkAgarwalConvertedResult {
  const basePrimary = Array.isArray(questionsPrimary) ? questionsPrimary : [];
  const baseSecondary = Array.isArray(questionsSecondary) ? questionsSecondary : [];

  const primaryList = basePrimary.length > 0 ? basePrimary : baseSecondary;
  const secondaryList = basePrimary.length > 0 ? baseSecondary : [];

  const testTitle = meta?.title?.trim() || 'DK Agarwal Practice Test';
  const seriesTitle = meta?.seriesTitle?.trim() || 'Agrawal Academy Test Series';
  const subjectTitle = meta?.subjectTitle?.trim() || 'General';
  const duration = meta?.durationMinutes ? `${meta.durationMinutes} Mins` : '45 Mins';
  const totalQuestions = primaryList.length;

  // Detect whether any question has Hindi text to describe language mode cleanly
  const hasAnyHindi =
    secondaryList.some((q) => hasDevanagari(String(q?.question || '') + String(q?.option_1 || '') + String(q?.solution_text || ''))) ||
    primaryList.some((q) => hasDevanagari(String(q?.question || '') + String(q?.option_1 || '') + String(q?.solution_text || '')));

  const languageModeLabel = hasAnyHindi
    ? 'Bilingual (English + Hindi)'
    : 'English (with Bilingual Explanations where provided)';

  const parsedQuestions: DkAgarwalConvertedResult['questions'] = [];
  const lines: string[] = [];

  // Header Banner (compatible with PDF Studio / txtParser)
  lines.push('==================================================');
  lines.push(testTitle);
  lines.push(`ID: ${meta?.id ? `DK-${meta.id}` : testTitle}`);
  lines.push(`Series: ${seriesTitle}`);
  lines.push(`Section: ${subjectTitle}`);
  lines.push(`Total Questions: ${totalQuestions} | Duration: ${duration}`);
  lines.push(`Language Mode: ${languageModeLabel}`);
  lines.push('Paid Status: TRUE (UNLOCKED ✦)');
  lines.push('==================================================');
  lines.push('');

  // Track section changes cleanly
  const uniqueSectionIds = new Set(
    primaryList
      .map((q) => (q?.subject_title || q?.subject || q?.topic_title || q?.section_id || '').toString().trim())
      .filter(Boolean)
  );
  let lastSectionKey = '';
  let partCounter = 0;

  // If no distinct per-question sections exist, emit one clean top-level section header
  if (uniqueSectionIds.size <= 1) {
    lines.push(`### [ ${subjectTitle.toUpperCase()} ] ###`);
    lines.push('');
  }

  for (let idx = 0; idx < primaryList.length; idx++) {
    let itemA = primaryList[idx] || {};
    let itemB = findPairedQuestion(itemA, idx, primaryList.length, secondaryList);
    const qNum = idx + 1;

    // Auto-orient: if itemA contains Hindi and itemB is English, swap so EN comes first & HI second
    const aIsHi = hasDevanagari(String(itemA.question || ''));
    const bIsHi = itemB ? hasDevanagari(String(itemB.question || '')) : false;
    if (aIsHi && itemB && !bIsHi) {
      const tmp = itemA;
      itemA = itemB;
      itemB = tmp;
    }

    // Section detection
    const explicitSecName = (itemA.subject_title || itemA.subject || itemA.topic_title || '').trim();
    const rawSecId = (itemA.section_id || '').toString().trim();
    const secKey = explicitSecName || rawSecId || subjectTitle;
    let displaySecName = explicitSecName || subjectTitle;

    if (uniqueSectionIds.size > 1 && secKey && secKey !== lastSectionKey) {
      lastSectionKey = secKey;
      partCounter += 1;
      displaySecName = explicitSecName || `${subjectTitle} - PART ${partCounter}`;
      if (idx > 0) lines.push('');
      lines.push(`### [ ${displaySecName.toUpperCase()} ] ###`);
      lines.push('');
    }

    // Build full question text (heading/directive + stem + figures)
    const buildQuestionText = (item: DkAgarwalQuestionItem | null): string => {
      if (!item) return '';
      const directive = cleanDkHtml(item.directive);
      const heading = cleanDkHtml(item.question_heading);
      const stem = cleanDkHtml(item.question);
      const parts: string[] = [];
      if (heading && !stem.includes(heading)) parts.push(heading);
      if (directive && !stem.includes(directive)) parts.push(directive);
      if (stem) parts.push(stem);
      let combined = parts.join('\n').trim();
      for (const img of [item.image_link_1, item.image_link_2, item.image_link_3]) {
        if (img && !combined.includes(img)) {
          combined += ` [Figure: ${img}]`;
        }
      }
      return combined.trim();
    };

    const qEn = buildQuestionText(itemA);
    const qHi = buildQuestionText(itemB);

    // Clean & strip redundant leading prefixes on options
    const optCount = itemA.option_5 || itemB?.option_5 ? 5 : 4;
    const enOpts: string[] = [];
    const hiOpts: string[] = [];

    for (let oIdx = 1; oIdx <= optCount; oIdx++) {
      const key = `option_${oIdx}` as keyof DkAgarwalQuestionItem;
      const imgKey = `option_image_${oIdx}` as keyof DkAgarwalQuestionItem;

      let enVal = stripLeadingOptionPrefix(cleanDkHtml(itemA[key] as string));
      let hiVal = itemB ? stripLeadingOptionPrefix(cleanDkHtml(itemB[key] as string)) : '';

      const enImg = itemA[imgKey] as string | undefined;
      const hiImg = itemB?.[imgKey] as string | undefined;
      if (enImg && !enVal.includes(enImg)) enVal = `${enVal} [Image: ${enImg}]`.trim();
      if (hiImg && !hiVal.includes(hiImg)) hiVal = `${hiVal} [Image: ${hiImg}]`.trim();

      enOpts.push(enVal);
      hiOpts.push(hiVal);
    }

    // Map correct answer
    const letter = mapAnswerToLetter(itemA.answer ?? itemB?.answer);
    const letterIdx = letter ? ['A', 'B', 'C', 'D', 'E'].indexOf(letter) : -1;
    const answerClean =
      letterIdx >= 0 ? formatBilingualPair(enOpts[letterIdx] || '', hiOpts[letterIdx] || '') : '';

    // Build explanations
    const buildExplanation = (item: DkAgarwalQuestionItem | null): string => {
      if (!item) return '';
      let ex = cleanDkHtml(item.solution_text || (item as any).solution);
      for (const simg of [item.solution_image_1, item.solution_image_2]) {
        if (simg && !ex.includes(simg)) {
          ex = `${ex} [Solution Image: ${simg}]`.trim();
        }
      }
      return ex;
    };

    const exEn = buildExplanation(itemA);
    const exHi = buildExplanation(itemB);

    parsedQuestions.push({
      qNum,
      questionEn: qEn,
      questionHi: qHi,
      optionsEn: enOpts,
      optionsHi: hiOpts,
      correctOptionLetter: letter,
      answerClean,
      explanationEn: exEn,
      explanationHi: exHi,
      section: displaySecName,
    });

    // Write Clean Bilingual .txt Lines (PDF Studio / txtParser compatible)
    if (qEn && qHi && normalizeCompareKey(qEn) !== normalizeCompareKey(qHi)) {
      lines.push(`Q${qNum}. ${qEn}`);
      lines.push(`    ${qHi}`);
    } else {
      lines.push(`Q${qNum}. ${qEn || qHi || `Question ${qNum}`}`);
    }

    const letters = ['(A)', '(B)', '(C)', '(D)', '(E)'];
    for (let oIdx = 0; oIdx < optCount; oIdx++) {
      const optBilingual = formatBilingualPair(enOpts[oIdx] || '', hiOpts[oIdx] || '');
      lines.push(`  ${letters[oIdx]} ${optBilingual || `Option ${letters[oIdx]}`}`);
    }

    if (letter) {
      lines.push(answerClean ? `Ans: (${letter}) ${answerClean}` : `Ans: (${letter})`);
    }

    if (exEn || exHi) {
      if (exEn && exHi && normalizeCompareKey(exEn) !== normalizeCompareKey(exHi)) {
        lines.push(`Ex: ${exEn}`);
        lines.push('');
        lines.push('[Hindi / हिन्दी व्याख्या]:');
        lines.push(exHi);
      } else {
        lines.push(`Ex: ${exEn || exHi}`);
      }
    }

    lines.push('--------------------------------------------------');
    lines.push('');
  }

  const cleanTxt = lines.join('\n').trim() + '\n';

  return {
    title: testTitle,
    seriesTitle,
    totalQuestions,
    cleanTxt,
    questions: parsedQuestions,
    rawJson: JSON.stringify(primaryList, null, 2),
  };
}
