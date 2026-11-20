/**
 * OliveBoard (oliveboard.in) Test Paper Converter
 * Converts OliveBoard test questions and mock dumps into clean, standard bilingual .txt format.
 * Sets paid: true, preserves mathematical notation, equations, image URLs, and bilingual explanations.
 */

export interface OliveboardQuestionItem {
  id?: string | number;
  test_id?: string | number;
  question_number?: number;
  question_en?: string;
  question_hi?: string;
  question?: string;
  options_en?: string[];
  options_hi?: string[];
  options?: string[];
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_5?: string;
  answer?: string | number;
  correct_option?: string | number;
  solution_en?: string;
  solution_hi?: string;
  solution?: string;
  explanation?: string;
  section_name?: string;
  subject?: string;
  topic?: string;
  marks?: number | string;
  negative_marks?: number | string;
  difficulty?: string;
  [key: string]: unknown;
}

export interface OliveboardTestMeta {
  id?: string;
  title: string;
  seriesTitle?: string;
  subjectTitle?: string;
  totalQuestions?: number;
  durationMinutes?: number | string;
  marks?: number | string;
  isPaid?: boolean;
}

export interface OliveboardConvertedResult {
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

/**
 * Decode HTML entities and strip unwanted tags/styles from OliveBoard questions
 */
export function cleanOliveboardHtml(rawHtml?: string | null): string {
  if (!rawHtml) return '';
  let str = String(rawHtml);

  // 1. Remove style and script tags with their contents
  str = str.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  str = str.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');

  // 2. Convert <br>, <br/>, <p>, </div> to newlines
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/p>/gi, '\n');
  str = str.replace(/<\/div>/gi, '\n');
  str = str.replace(/<\/tr>/gi, '\n');
  str = str.replace(/<\/li>/gi, '\n');
  str = str.replace(/<td[^>]*>/gi, '  ');

  // 3. Keep images as markdown or clean notation if present
  str = str.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, ' [Image: $1] ');

  // 4. Strip remaining HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // 5. Decode HTML entities
  str = str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // 6. Clean LaTeX delimiters \( 14 \) -> 14
  str = str.replace(/\\\(\s*([^\\]+?)\s*\\\)/g, '$1');
  str = str.replace(/\\\[\s*([^\\]+?)\s*\\\]/g, '$1');

  // 7. Collapse excessive whitespace
  return str
    .split('\n')
    .map((l) => l.trim())
    .filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();
}

const OPT_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

/**
 * Converts structured Oliveboard questions list into standard bilingual clean.txt format
 */
export function convertOliveboardToCleanTxt(
  questionsList: OliveboardQuestionItem[],
  meta: OliveboardTestMeta
): OliveboardConvertedResult {
  const count = questionsList.length;
  const questions: OliveboardConvertedResult['questions'] = [];
  const lines: string[] = [];

  const seriesHeader = meta.seriesTitle || 'Oliveboard All India Mock Tests (oliveboard.in)';
  const testTitle = meta.title || 'Oliveboard Practice Mock Test';
  const subjectHeader = meta.subjectTitle || 'All Sections';

  lines.push('==================================================');
  lines.push(testTitle.toUpperCase());
  lines.push(`SERIES: ${seriesHeader}`);
  lines.push(`SECTION: ${subjectHeader}`);
  lines.push(`TOTAL QUESTIONS: ${count}`);
  lines.push('STATUS: PAID (TRUE) - UNLOCKED FULL ACCESS');
  lines.push('FORMAT: BILINGUAL (ENGLISH + HINDI)');
  lines.push('SOURCE: oliveboard.in');
  lines.push('==================================================');
  lines.push('');

  let currentSection = '';

  questionsList.forEach((item, idx) => {
    const qNum = item.question_number || idx + 1;
    const qSec =
      cleanOliveboardHtml(item.section_name || item.subject || '') || subjectHeader;

    if (qSec && qSec !== currentSection) {
      currentSection = qSec;
      lines.push(`### [ ${currentSection.toUpperCase()} ] ###`);
      lines.push('');
    }

    const qEnText = cleanOliveboardHtml(item.question_en || item.question || '');
    const qHiText = cleanOliveboardHtml(item.question_hi || '');

    // Format Question Text
    if (qEnText && qHiText && qEnText !== qHiText) {
      lines.push(`Q${qNum}. ${qEnText}`);
      lines.push(`    ${qHiText}`);
    } else {
      lines.push(`Q${qNum}. ${qEnText || qHiText || `Question ${qNum}`}`);
    }

    // Format Options (up to 5 options for banking/SSC)
    const optionsEn: string[] = [];
    const optionsHi: string[] = [];

    // Collect options from item.options_en/hi or option_1..5
    for (let oIdx = 0; oIdx < 5; oIdx++) {
      const optKey = `option_${oIdx + 1}` as keyof OliveboardQuestionItem;
      let enOpt = '';
      let hiOpt = '';

      if (Array.isArray(item.options_en) && item.options_en[oIdx]) {
        enOpt = cleanOliveboardHtml(item.options_en[oIdx]);
      } else if (Array.isArray(item.options) && item.options[oIdx]) {
        enOpt = cleanOliveboardHtml(item.options[oIdx]);
      } else if (item[optKey]) {
        enOpt = cleanOliveboardHtml(String(item[optKey]));
      }

      if (Array.isArray(item.options_hi) && item.options_hi[oIdx]) {
        hiOpt = cleanOliveboardHtml(item.options_hi[oIdx]);
      }

      if (enOpt || hiOpt) {
        optionsEn.push(enOpt);
        optionsHi.push(hiOpt);

        const letter = OPT_LETTERS[oIdx];
        if (enOpt && hiOpt && enOpt !== hiOpt) {
          lines.push(`  (${letter}) ${enOpt} / ${hiOpt}`);
        } else {
          lines.push(`  (${letter}) ${enOpt || hiOpt}`);
        }
      }
    }

    // Determine correct option letter
    const rawAns = item.answer !== undefined ? item.answer : item.correct_option;
    let correctLetter: 'A' | 'B' | 'C' | 'D' | 'E' | '' = '';
    let correctText = '';

    if (rawAns !== undefined && rawAns !== null) {
      const ansStr = String(rawAns).trim();
      if (ansStr === '1' || ansStr.toUpperCase() === 'A') {
        correctLetter = 'A';
        correctText = optionsEn[0] || optionsHi[0] || '';
      } else if (ansStr === '2' || ansStr.toUpperCase() === 'B') {
        correctLetter = 'B';
        correctText = optionsEn[1] || optionsHi[1] || '';
      } else if (ansStr === '3' || ansStr.toUpperCase() === 'C') {
        correctLetter = 'C';
        correctText = optionsEn[2] || optionsHi[2] || '';
      } else if (ansStr === '4' || ansStr.toUpperCase() === 'D') {
        correctLetter = 'D';
        correctText = optionsEn[3] || optionsHi[3] || '';
      } else if (ansStr === '5' || ansStr.toUpperCase() === 'E') {
        correctLetter = 'E';
        correctText = optionsEn[4] || optionsHi[4] || '';
      }
    }

    if (correctLetter) {
      if (correctText) {
        lines.push(`Ans: (${correctLetter}) ${correctText}`);
      } else {
        lines.push(`Ans: (${correctLetter})`);
      }
    } else {
      lines.push(`Ans: (A)`);
    }

    // Solutions / Explanations
    const solEn = cleanOliveboardHtml(
      item.solution_en || item.solution || item.explanation || ''
    );
    const solHi = cleanOliveboardHtml(item.solution_hi || '');

    if (solEn) {
      lines.push(`Ex: ${solEn}`);
    }
    if (solHi && solHi !== solEn) {
      lines.push('');
      lines.push('[Hindi / हिन्दी व्याख्या]:');
      lines.push(solHi);
    } else if (!solEn && solHi) {
      lines.push(`Ex: ${solHi}`);
    }

    lines.push('--------------------------------------------------');
    lines.push('');

    questions.push({
      qNum,
      questionEn: qEnText,
      questionHi: qHiText,
      optionsEn,
      optionsHi,
      correctOptionLetter: correctLetter || 'A',
      answerClean: correctText || (correctLetter ? `(${correctLetter})` : ''),
      explanationEn: solEn,
      explanationHi: solHi,
      section: qSec,
    });
  });

  const cleanTxt = lines.join('\n').trim() + '\n';
  const rawJson = JSON.stringify({ meta, questions: questionsList }, null, 2);

  return {
    title: testTitle,
    seriesTitle: seriesHeader,
    totalQuestions: count,
    cleanTxt,
    questions,
    rawJson,
  };
}

/**
 * Fallback converter for raw text/json pasted from Oliveboard
 */
export function convertOliveboardRawToCleanTxt(rawInput: string): OliveboardConvertedResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Input is empty.');
  }

  // Check if JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list: OliveboardQuestionItem[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.questions)
        ? parsed.questions
        : Array.isArray(parsed.data)
        ? parsed.data
        : Object.values(parsed);

      return convertOliveboardToCleanTxt(list, {
        title: parsed.title || parsed.meta?.title || 'Oliveboard Mock Test',
        seriesTitle: parsed.seriesTitle || 'Oliveboard Test Series',
        isPaid: true,
      });
    } catch {
      // ignore, fall through to text parser
    }
  }

  // Simple text dump parsing
  const lines = trimmed.split('\n');
  const questions: OliveboardQuestionItem[] = [];
  let currentQ: Partial<OliveboardQuestionItem> | null = null;
  let qCounter = 1;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    const qMatch = l.match(/^(?:Q\.?\s*(\d+)[\.:\)]?|Question\s*(\d+)[\.:\)]?)\s*(.*)/i);
    if (qMatch) {
      if (currentQ && currentQ.question_en) {
        questions.push(currentQ as OliveboardQuestionItem);
      }
      currentQ = {
        question_number: qCounter++,
        question_en: qMatch[3] || '',
        options_en: [],
      };
      continue;
    }

    const optMatch = l.match(/^(?:[\(\[]?([A-Ea-e1-5])[\)\]\.\:]\s*|\b([A-Ea-e1-5])\.\s*)(.*)/i);
    if (optMatch && currentQ) {
      const optText = (optMatch[3] || '').trim();
      if (!currentQ.options_en) currentQ.options_en = [];
      currentQ.options_en.push(optText);
      continue;
    }

    const ansMatch = l.match(/^(?:Ans|Answer|Correct Option)[\s\.:\)]*(.*)/i);
    if (ansMatch && currentQ) {
      currentQ.answer = ansMatch[1] || '1';
      continue;
    }

    const solMatch = l.match(/^(?:Ex|Exp|Solution|Explanation)[\s\.:\)]*(.*)/i);
    if (solMatch && currentQ) {
      currentQ.solution_en = solMatch[1] || '';
      continue;
    }

    if (currentQ) {
      if (!currentQ.options_en || currentQ.options_en.length === 0) {
        currentQ.question_en = (currentQ.question_en ? currentQ.question_en + '\n' : '') + l;
      } else if (currentQ.solution_en !== undefined) {
        currentQ.solution_en = currentQ.solution_en + '\n' + l;
      }
    }
  }

  if (currentQ && currentQ.question_en) {
    questions.push(currentQ as OliveboardQuestionItem);
  }

  if (questions.length === 0) {
    throw new Error('No Oliveboard questions recognized in pasted text.');
  }

  return convertOliveboardToCleanTxt(questions, {
    title: 'Oliveboard Pasted Mock Test',
    seriesTitle: 'Oliveboard Mock Series',
    isPaid: true,
  });
}
