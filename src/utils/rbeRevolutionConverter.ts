/**
 * RBE Revolution Parser & Converter
 * Converts RBE (Revolution by Education) exam data—whether pasted as JSON,
 * plain text dumps, or HTML table/page copy—into clean standard exam .txt format.
 */

export interface RbeConvertedResult {
  title: string;
  id: string;
  totalQuestions: number;
  cleanTxt: string;
  sectionsCount: number;
  parsedQuestionsCount: number;
}

export function cleanRbeHtml(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw);

  // Normalize break and block tags to newlines
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n');
  str = str.replace(/<(p|div|li|tr|h[1-6])[^>]*>/gi, '');

  // Strip all remaining HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  str = str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ');

  // Clean LaTeX delimiters like \( 14 \) -> 14
  str = str.replace(/\\\(\s*([^\\]+?)\s*\\\)/g, '$1');
  str = str.replace(/\\\[\s*([^\\]+?)\s*\\\]/g, '$1');

  // Normalize spaces per line
  const lines = str.split('\n').map((l) => l.trim());
  const cleaned: string[] = [];
  let prevBlank = false;
  for (const l of lines) {
    if (!l) {
      if (!prevBlank) {
        cleaned.push('');
        prevBlank = true;
      }
    } else {
      cleaned.push(l);
      prevBlank = false;
    }
  }
  return cleaned.join('\n').trim();
}

interface ParsedRawQuestion {
  qNum: number;
  qEn: string;
  qHi: string;
  options: { code: string; en: string; hi: string; clean: string }[];
  ansLetter: string;
  ansText: string;
  solEn: string;
  solHi: string;
  section: string;
}

const OPT_CODES = ['A', 'B', 'C', 'D', 'E'];

/**
 * Parses JSON payloads from RBE Revolution / online mock dumps
 */
function tryParseJson(input: string): ParsedRawQuestion[] | null {
  try {
    let obj: unknown;
    try {
      obj = JSON.parse(input);
    } catch {
      // Try loose clean up of trailing commas
      const relaxed = input.replace(/,\s*([}\]])/g, '$1');
      obj = JSON.parse(relaxed);
    }

    if (!obj || typeof obj !== 'object') return null;

    const questionsList: Record<string, unknown>[] = [];

    const record = obj as Record<string, unknown>;

    // Case 1: sections object
    if (record.sections && typeof record.sections === 'object') {
      for (const [secName, secVal] of Object.entries(
        record.sections as Record<string, unknown>
      )) {
        if (secVal && typeof secVal === 'object') {
          const sObj = secVal as Record<string, unknown>;
          if (Array.isArray(sObj.questions)) {
            sObj.questions.forEach((q) => {
              if (q && typeof q === 'object') {
                questionsList.push({
                  ...(q as Record<string, unknown>),
                  _section: secName.toUpperCase(),
                });
              }
            });
          }
        }
      }
    }

    // Case 2: root questions array or data array
    if (questionsList.length === 0) {
      const arr = Array.isArray(obj)
        ? obj
        : Array.isArray(record.questions)
        ? record.questions
        : Array.isArray(record.data)
        ? record.data
        : null;

      if (arr) {
        arr.forEach((q) => {
          if (q && typeof q === 'object') {
            questionsList.push(q as Record<string, unknown>);
          }
        });
      }
    }

    if (questionsList.length === 0) return null;

    const results: ParsedRawQuestion[] = [];

    questionsList.forEach((rawQ, idx) => {
      const qNum = idx + 1;
      const section = String(rawQ._section || rawQ.section || rawQ.subject || 'GENERAL').toUpperCase();

      // Extract question text
      let qEn = '';
      let qHi = '';

      if (typeof rawQ.question === 'object' && rawQ.question !== null) {
        const qObj = rawQ.question as Record<string, unknown>;
        qEn = cleanRbeHtml(qObj.en || qObj.English || '');
        qHi = cleanRbeHtml(qObj.hi || qObj.Hindi || '');
      } else {
        qEn = cleanRbeHtml(rawQ.question || rawQ.question_en || rawQ.qEn || rawQ.text || '');
        qHi = cleanRbeHtml(rawQ.question_hi || rawQ.qHi || '');
      }

      // If bilingual in single string with "/"
      if (qEn && !qHi && qEn.includes(' / ')) {
        const parts = qEn.split(/\s+\/\s+/);
        if (parts.length >= 2 && /[\u0900-\u097F]/.test(parts[1])) {
          qEn = parts[0].trim();
          qHi = parts.slice(1).join(' / ').trim();
        }
      }

      // Extract options
      const options: { code: string; en: string; hi: string; clean: string }[] = [];

      // Check option_1..4
      const optKeys = [
        ['option_1', 'option1', 'opt1', 'opt_1'],
        ['option_2', 'option2', 'opt2', 'opt_2'],
        ['option_3', 'option3', 'opt3', 'opt_3'],
        ['option_4', 'option4', 'opt4', 'opt_4'],
      ];

      optKeys.forEach((keys, oIdx) => {
        let val: unknown = undefined;
        for (const k of keys) {
          if (rawQ[k] !== undefined) {
            val = rawQ[k];
            break;
          }
        }

        if (val !== undefined && val !== null) {
          let oEn = '';
          let oHi = '';
          if (typeof val === 'object') {
            const vObj = val as Record<string, unknown>;
            oEn = cleanRbeHtml(vObj.en || vObj.English || '');
            oHi = cleanRbeHtml(vObj.hi || vObj.Hindi || '');
          } else {
            oEn = cleanRbeHtml(val);
          }
          if (oEn && !oHi && oEn.includes(' / ')) {
            const parts = oEn.split(/\s+\/\s+/);
            if (parts.length >= 2 && /[\u0900-\u097F]/.test(parts[1])) {
              oEn = parts[0].trim();
              oHi = parts.slice(1).join(' / ').trim();
            }
          }
          const clean = oEn && oHi && oEn !== oHi ? `${oEn} / ${oHi}` : oEn || oHi;
          options.push({ code: OPT_CODES[oIdx] || 'A', en: oEn, hi: oHi, clean });
        }
      });

      // Check array format: rawQ.options
      if (options.length === 0 && Array.isArray(rawQ.options)) {
        rawQ.options.forEach((optVal, oIdx) => {
          let oEn = '';
          let oHi = '';
          if (typeof optVal === 'object' && optVal !== null) {
            const vObj = optVal as Record<string, unknown>;
            oEn = cleanRbeHtml(vObj.en || vObj.text || vObj.English || '');
            oHi = cleanRbeHtml(vObj.hi || vObj.Hindi || '');
          } else {
            oEn = cleanRbeHtml(optVal);
          }
          if (oEn && !oHi && oEn.includes(' / ')) {
            const parts = oEn.split(/\s+\/\s+/);
            if (parts.length >= 2 && /[\u0900-\u097F]/.test(parts[1])) {
              oEn = parts[0].trim();
              oHi = parts.slice(1).join(' / ').trim();
            }
          }
          const clean = oEn && oHi && oEn !== oHi ? `${oEn} / ${oHi}` : oEn || oHi;
          options.push({ code: OPT_CODES[oIdx] || 'A', en: oEn, hi: oHi, clean });
        });
      }

      // Answer resolution
      let ansLetter = 'A';
      let ansText = '';
      const rawAns = String(rawQ.answer || rawQ.correct_answer || rawQ.ans || rawQ.correct || '1').trim();
      const ansNum = parseInt(rawAns, 10);

      if (!isNaN(ansNum) && ansNum >= 1 && ansNum <= options.length) {
        ansLetter = OPT_CODES[ansNum - 1] || 'A';
        ansText = options[ansNum - 1]?.clean || '';
      } else if (['A', 'B', 'C', 'D', 'E'].includes(rawAns.toUpperCase())) {
        ansLetter = rawAns.toUpperCase();
        const found = options.find((o) => o.code === ansLetter);
        ansText = found?.clean || '';
      }

      // Solution / Explanation
      let solEn = '';
      let solHi = '';
      const solField = rawQ.solution_text || rawQ.solution || rawQ.explanation || rawQ.ex;
      if (typeof solField === 'object' && solField !== null) {
        const sObj = solField as Record<string, unknown>;
        solEn = cleanRbeHtml(sObj.en || sObj.English || '');
        solHi = cleanRbeHtml(sObj.hi || sObj.Hindi || '');
      } else if (solField) {
        solEn = cleanRbeHtml(solField);
      }

      results.push({
        qNum,
        qEn,
        qHi,
        options,
        ansLetter,
        ansText,
        solEn,
        solHi,
        section,
      });
    });

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

/**
 * Parses raw text dumps or copied Q&A lines from RBE tests
 */
function parseTextDump(input: string): ParsedRawQuestion[] {
  const cleanedText = cleanRbeHtml(input);
  const rawLines = cleanedText.split('\n');

  const questions: ParsedRawQuestion[] = [];
  let currentQ: Partial<ParsedRawQuestion> | null = null;
  let currentSection = 'GENERAL';
  let qCounter = 1;

  const pushCurrent = () => {
    if (currentQ && (currentQ.qEn || currentQ.qHi || (currentQ.options && currentQ.options.length > 0))) {
      questions.push({
        qNum: qCounter++,
        qEn: currentQ.qEn || `Question ${qCounter - 1}`,
        qHi: currentQ.qHi || '',
        options: currentQ.options || [],
        ansLetter: currentQ.ansLetter || 'A',
        ansText: currentQ.ansText || (currentQ.options?.[0]?.clean || ''),
        solEn: currentQ.solEn || '',
        solHi: currentQ.solHi || '',
        section: currentQ.section || currentSection,
      });
    }
    currentQ = null;
  };

  let inSolution = false;
  let inHindiSolution = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Detect section headers: ### [ ... ] or === [ ... ]
    const secMatch = line.match(/^(?:###|===)\s*\[?\s*(?:SECTION|SUBJECT)?\s*:?\s*([^\]=]+)\]?\s*(?:###|===)?$/i);
    if (secMatch) {
      pushCurrent();
      currentSection = secMatch[1].trim().toUpperCase();
      continue;
    }

    // Detect question start: Q1., Q.1, Question 1, 1., etc.
    const qMatch = line.match(/^(?:Q\.?|Question)\s*(\d+)[\.\:\-\)]\s*(.*)$/i);
    if (qMatch) {
      pushCurrent();
      inSolution = false;
      inHindiSolution = false;
      currentQ = {
        qEn: qMatch[2].trim(),
        qHi: '',
        options: [],
        ansLetter: 'A',
        ansText: '',
        solEn: '',
        solHi: '',
        section: currentSection,
      };
      continue;
    }

    // If no current question but line starts with options, create a new question
    const optMatch = line.match(/^(?:\(([A-D1-4])\)|([A-D1-4])[\.\:\-\)])\s*(.*)$/i);
    if (optMatch && !inSolution) {
      if (!currentQ) {
        currentQ = {
          qEn: `Question ${qCounter}`,
          qHi: '',
          options: [],
          ansLetter: 'A',
          ansText: '',
          solEn: '',
          solHi: '',
          section: currentSection,
        };
      }
      const rawCode = (optMatch[1] || optMatch[2]).toUpperCase();
      const numCode = parseInt(rawCode, 10);
      const code = isNaN(numCode) ? rawCode : OPT_CODES[numCode - 1] || 'A';
      const text = optMatch[3].trim();
      let en = text;
      let hi = '';
      if (text.includes(' / ')) {
        const parts = text.split(/\s+\/\s+/);
        if (parts.length >= 2 && /[\u0900-\u097F]/.test(parts[1])) {
          en = parts[0].trim();
          hi = parts.slice(1).join(' / ').trim();
        }
      }
      currentQ.options = currentQ.options || [];
      currentQ.options.push({ code, en, hi, clean: text });
      continue;
    }

    // Detect Answer line
    const ansMatch = line.match(/^(?:Ans|Answer|Correct\s*Option|Correct\s*Answer|Right\s*Answer)\s*[\:\-\=]?\s*(?:\(?([A-D1-4])\)?)?\s*(.*)$/i);
    if (ansMatch) {
      inSolution = false;
      inHindiSolution = false;
      if (currentQ) {
        const rawCode = (ansMatch[1] || '').toUpperCase();
        const numCode = parseInt(rawCode, 10);
        const resolvedLetter = isNaN(numCode)
          ? rawCode || 'A'
          : OPT_CODES[numCode - 1] || 'A';
        currentQ.ansLetter = resolvedLetter;
        currentQ.ansText = ansMatch[2].trim() || (currentQ.options?.find(o => o.code === resolvedLetter)?.clean || '');
      }
      continue;
    }

    // Detect Solution / Explanation
    if (/^(?:Ex|Explanation|Solution|हल|व्याख्या)\s*[\:\-\=]/i.test(line)) {
      inSolution = true;
      inHindiSolution = /[\u0900-\u097F]/.test(line);
      const solClean = line.replace(/^(?:Ex|Explanation|Solution|हल|व्याख्या)\s*[\:\-\=]\s*/i, '').trim();
      if (currentQ) {
        if (inHindiSolution) {
          currentQ.solHi = currentQ.solHi ? `${currentQ.solHi}\n${solClean}` : solClean;
        } else {
          currentQ.solEn = currentQ.solEn ? `${currentQ.solEn}\n${solClean}` : solClean;
        }
      }
      continue;
    }

    // Hindi solution block header: [Hindi / हिन्दी व्याख्या]:
    if (/\[Hindi\s*\/?\s*हिन्दी\s*व्याख्या\]/i.test(line)) {
      inSolution = true;
      inHindiSolution = true;
      continue;
    }

    // Divider line
    if (/^[\-\=]{5,}$/.test(line)) {
      pushCurrent();
      inSolution = false;
      inHindiSolution = false;
      continue;
    }

    // Append to current state
    if (currentQ) {
      if (inSolution) {
        if (inHindiSolution || /[\u0900-\u097F]/.test(line)) {
          currentQ.solHi = currentQ.solHi ? `${currentQ.solHi}\n${line}` : line;
        } else {
          currentQ.solEn = currentQ.solEn ? `${currentQ.solEn}\n${line}` : line;
        }
      } else if (!currentQ.options || currentQ.options.length === 0) {
        // Question text continuation or Hindi translation line
        if (/[\u0900-\u097F]/.test(line) && !currentQ.qHi) {
          currentQ.qHi = line;
        } else if (!currentQ.qHi) {
          currentQ.qEn = `${currentQ.qEn} ${line}`.trim();
        } else {
          currentQ.qHi = `${currentQ.qHi} ${line}`.trim();
        }
      }
    }
  }

  pushCurrent();
  return questions;
}

export function convertRbeRevolutionToCleanTxt(input: string): RbeConvertedResult {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Input is empty. Please paste your RBE test JSON or copied text.');
  }

  // Detect title if present in text/JSON
  let title = 'RBE REVOLUTION EXAM TEST';
  let examId = 'RBE-EXAM-MOCK';

  // Check if JSON
  let questions: ParsedRawQuestion[] | null = null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    questions = tryParseJson(trimmed);
    try {
      const parsedMeta = JSON.parse(trimmed);
      if (parsedMeta?.meta?.title) title = cleanRbeHtml(parsedMeta.meta.title);
      else if (parsedMeta?.test_title) title = cleanRbeHtml(parsedMeta.test_title);
      else if (parsedMeta?.testName) title = cleanRbeHtml(parsedMeta.testName);
      else if (parsedMeta?.title) title = cleanRbeHtml(parsedMeta.title);

      if (parsedMeta?.meta?.id) examId = cleanRbeHtml(parsedMeta.meta.id);
      else if (parsedMeta?.test_id) examId = cleanRbeHtml(parsedMeta.test_id);
    } catch {
      // ignore
    }
  }

  // If not JSON or JSON parsing failed, parse as text dump
  if (!questions || questions.length === 0) {
    // Check if first line contains title
    const firstLine = trimmed.split('\n')[0].trim();
    if (firstLine && !firstLine.startsWith('Q') && firstLine.length < 80 && !firstLine.startsWith('1')) {
      title = cleanRbeHtml(firstLine).replace(/^[=\s]+|[=\s]+$/g, '');
    }
    questions = parseTextDump(trimmed);
  }

  if (!questions || questions.length === 0) {
    throw new Error('No questions could be recognized. Please paste valid RBE mock JSON or text.');
  }

  // Build clean text output
  const lines: string[] = [];
  lines.push('==================================================');
  lines.push(title);
  lines.push(`ID: ${examId}`);
  lines.push(`Total Questions: ${questions.length}`);
  lines.push('Language Mode: Bilingual (English + Hindi)');
  lines.push('==================================================');
  lines.push('');
  lines.push('');

  let currentSec = '';

  questions.forEach((q, idx) => {
    const qSec = q.section || 'GENERAL';
    if (qSec !== currentSec) {
      currentSec = qSec;
      lines.push(`### [ ${currentSec} ] ###`);
      lines.push('');
    }

    const qNum = idx + 1;
    if (q.qEn && q.qHi && q.qEn !== q.qHi) {
      lines.push(`Q${qNum}. ${q.qEn}`);
      lines.push(`    ${q.qHi}`);
    } else {
      lines.push(`Q${qNum}. ${q.qEn || q.qHi}`);
    }

    // Options
    q.options.forEach((opt, oIdx) => {
      const letter = opt.code || OPT_CODES[oIdx] || 'A';
      if (opt.en && opt.hi && opt.en !== opt.hi) {
        lines.push(`  (${letter}) ${opt.en} / ${opt.hi}`);
      } else {
        lines.push(`  (${letter}) ${opt.clean || opt.en || opt.hi}`);
      }
    });

    // Answer
    const ansLet = q.ansLetter || 'A';
    if (q.ansText) {
      lines.push(`Ans: (${ansLet}) ${q.ansText}`);
    } else {
      lines.push(`Ans: (${ansLet})`);
    }

    // Solution
    if (q.solEn) {
      lines.push(`Ex: ${q.solEn}`);
    }
    if (q.solHi) {
      lines.push('');
      lines.push('[Hindi / हिन्दी व्याख्या]:');
      lines.push(q.solHi);
    }

    lines.push('--------------------------------------------------');
    lines.push('');
  });

  const cleanTxt = lines.join('\n').trim() + '\n';

  return {
    title,
    id: examId,
    totalQuestions: questions.length,
    cleanTxt,
    sectionsCount: 1,
    parsedQuestionsCount: questions.length,
  };
}

export interface RbeAppxQuestionItem {
  id?: string | number;
  test_series_id?: string | number;
  test_id?: string | number;
  question?: string;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_image_1?: string;
  option_image_2?: string;
  option_image_3?: string;
  option_image_4?: string;
  image_link_1?: string;
  image_link_2?: string;
  answer?: string | number;
  solution_heading?: string;
  solution_text?: string;
  solution_image_1?: string;
  section_id?: string | number;
  subject_title?: string;
  topic_title?: string;
  sortingparam?: string | number;
  positive_marks?: string | number;
  negative_marks?: string | number;
  [key: string]: unknown;
}

export interface RbeConvertedAppxResult {
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
    correctOptionLetter: 'A' | 'B' | 'C' | 'D' | '';
    answerClean: string;
    explanationEn: string;
    explanationHi: string;
    section: string;
  }>;
  rawJson: string;
}

/**
 * Strips HTML styles, classes, fonts, and decodes entities from AppX RBE questions
 */
export function cleanRbeAppxHtml(rawHtml?: string | null): string {
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

  // 4. Strip remaining HTML tags (only match valid tag names so math inequalities like a < b stay intact)
  str = str.replace(/<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s+[^>]*)?\/?>/g, '');

  // 5. Decode HTML entities
  str = str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '—')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
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

function getRbeSectionName(en: RbeAppxQuestionItem, hi: RbeAppxQuestionItem, index: number, totalCount: number, defaultSubject: string): string {
  // If human-readable title is already provided and not numeric
  const rawTitle = (en.subject_title || hi.subject_title || en.topic_title || hi.topic_title || '').trim();
  if (rawTitle && isNaN(Number(rawTitle))) {
    return rawTitle.toUpperCase();
  }

  // Check numeric section_id or subject
  const secId = String(en.section_id || hi.section_id || '').trim();
  const secMap: Record<string, string> = {
    '203': 'QUANTITATIVE APTITUDE',
    '204': 'GENERAL INTELLIGENCE & REASONING',
    '205': 'GENERAL AWARENESS',
    '206': 'ENGLISH COMPREHENSION',
    '39': 'COMPUTER KNOWLEDGE',
    '439': 'COMPUTER KNOWLEDGE',
    '318': 'MATHEMATICS - ADVANCED & ARITHMETIC',
    '319': 'REASONING & LOGICAL APTITUDE',
    '372': 'MATHS SECTIONAL TEST',
    '379': 'MATHS SECTIONAL TEST',
    '370': 'MATHS SECTIONAL TEST',
    '445': 'MATHS TOPIC-WISE TEST',
    '198': 'CALCULATION BOOSTER',
  };

  if (secMap[secId]) {
    return secMap[secId];
  }

  // If Tier-2 Mains (130 questions or 150 questions)
  if (totalCount === 130 || totalCount === 150) {
    if (index < 30) return 'SECTION 1 - MODULE I: MATHEMATICAL ABILITIES';
    if (index < 60) return 'SECTION 1 - MODULE II: REASONING & GENERAL INTELLIGENCE';
    if (index < 105) return 'SECTION 2 - MODULE I: ENGLISH LANGUAGE & COMPREHENSION';
    if (index < 130) return 'SECTION 2 - MODULE II: GENERAL AWARENESS';
    return 'SECTION 3 - MODULE I: COMPUTER KNOWLEDGE';
  }

  // If Tier-1 standard (100 questions)
  if (totalCount === 100) {
    if (index < 25) return 'GENERAL INTELLIGENCE & REASONING';
    if (index < 50) return 'GENERAL AWARENESS';
    if (index < 75) return 'QUANTITATIVE APTITUDE';
    return 'ENGLISH COMPREHENSION';
  }

  // If RRB NTPC (120 questions)
  if (totalCount === 120) {
    if (index < 35) return 'MATHEMATICS';
    if (index < 70) return 'GENERAL INTELLIGENCE & REASONING';
    return 'GENERAL AWARENESS';
  }

  if (defaultSubject && isNaN(Number(defaultSubject)) && defaultSubject !== 'All Sections') {
    return defaultSubject.toUpperCase();
  }

  return 'GENERAL SECTION';
}

/**
 * Converts AppX dual-JSON (URL1 English + URL2 Hindi) from rbelearning.com
 * into standard bilingual clean.txt format and structured question models.
 */
export function convertRbeAppxToCleanTxt(
  qEnList: RbeAppxQuestionItem[] = [],
  qHiList: RbeAppxQuestionItem[] = [],
  meta: {
    id?: string;
    title: string;
    seriesTitle?: string;
    subjectTitle?: string;
    totalQuestions?: number;
    isPaid?: boolean;
    sourceLabel?: string;
  }
): RbeConvertedAppxResult {
  const count = Math.max(qEnList.length, qHiList.length);
  const questions: RbeConvertedAppxResult['questions'] = [];
  const lines: string[] = [];

  const seriesHeader = meta.seriesTitle || 'RBE Revolution By Education (rbelearning.com)';
  const testTitle = meta.title || 'SSC Practice Test';
  const subjectHeader = meta.subjectTitle || 'All Sections';
  const sourceLabel = meta.sourceLabel || 'rbelearning.com (Shubham Jain Sir)';

  lines.push('==================================================');
  lines.push(testTitle.toUpperCase());
  lines.push(`SERIES: ${seriesHeader}`);
  lines.push(`SECTION: ${subjectHeader}`);
  lines.push(`TOTAL QUESTIONS: ${count}`);
  lines.push('STATUS: PAID (TRUE) - UNLOCKED FULL ACCESS');
  lines.push('FORMAT: BILINGUAL (ENGLISH + HINDI)');
  lines.push(`SOURCE: ${sourceLabel}`);
  lines.push('==================================================');
  lines.push('');

  let currentSection = '';

  for (let i = 0; i < count; i++) {
    const en = qEnList[i] || {};
    const hi = qHiList[i] || qEnList[i] || {};

    const qNum = i + 1;
    let qEnText = cleanRbeAppxHtml(en.question || '');
    let qHiText = cleanRbeAppxHtml(hi.question || '');

    // Add figure reference if text is empty or image is provided
    if (en.image_link_1) {
      qEnText = qEnText ? `${qEnText}\n[Question Figure: ${en.image_link_1}]` : `[Question Figure: ${en.image_link_1}]`;
    }
    if (hi.image_link_1) {
      qHiText = qHiText ? `${qHiText}\n[Question Figure: ${hi.image_link_1}]` : `[Question Figure: ${hi.image_link_1}]`;
    }

    // Section header if changes
    const sectionName = getRbeSectionName(en, hi, i, count, subjectHeader);
    if (sectionName && sectionName !== currentSection) {
      currentSection = sectionName;
      lines.push(`### [ ${currentSection} ] ###`);
      lines.push('');
    }

    // Question statement
    if (qEnText && qHiText && qEnText !== qHiText) {
      lines.push(`Q${qNum}. ${qEnText}`);
      lines.push(`    ${qHiText}`);
    } else {
      lines.push(`Q${qNum}. ${qEnText || qHiText || `Question ${qNum}`}`);
    }

    // Options (1 to 4)
    const optionsEn: string[] = [];
    const optionsHi: string[] = [];
    const letters = ['A', 'B', 'C', 'D'] as const;

    for (let optIdx = 1; optIdx <= 4; optIdx++) {
      const optKey = `option_${optIdx}` as keyof RbeAppxQuestionItem;
      const optImgKey = `option_image_${optIdx}` as keyof RbeAppxQuestionItem;
      let optEnStr = cleanRbeAppxHtml((en[optKey] || '') as string);
      let optHiStr = cleanRbeAppxHtml((hi[optKey] || '') as string);

      if (!optEnStr && en[optImgKey]) {
        optEnStr = `[Image: ${en[optImgKey]}]`;
      }
      if (!optHiStr && hi[optImgKey]) {
        optHiStr = `[Image: ${hi[optImgKey]}]`;
      }

      optionsEn.push(optEnStr);
      optionsHi.push(optHiStr);

      const letter = letters[optIdx - 1];
      if (optEnStr && optHiStr && optEnStr !== optHiStr) {
        lines.push(`  (${letter}) ${optEnStr} / ${optHiStr}`);
      } else {
        lines.push(`  (${letter}) ${optEnStr || optHiStr || `Option ${letter}`}`);
      }
    }

    // Correct Answer determination
    const rawAns = en.answer !== undefined ? en.answer : hi.answer;
    let correctLetter: 'A' | 'B' | 'C' | 'D' | '' = '';
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
    let solEn = cleanRbeAppxHtml(
      ((en.solution_text || en.solution || en.solution_heading || '') as string)
    );
    let solHi = cleanRbeAppxHtml(
      ((hi.solution_text || hi.solution || hi.solution_heading || '') as string)
    );

    if (en.solution_image_1) {
      solEn = solEn ? `${solEn}\n[Solution Figure: ${en.solution_image_1}]` : `[Solution Figure: ${en.solution_image_1}]`;
    }
    if (hi.solution_image_1) {
      solHi = solHi ? `${solHi}\n[Solution Figure: ${hi.solution_image_1}]` : `[Solution Figure: ${hi.solution_image_1}]`;
    }

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
      section: sectionName,
    });
  }

  const cleanTxt = lines.join('\n').trim() + '\n';
  const rawJson = JSON.stringify({ meta, questionsEn: qEnList, questionsHi: qHiList }, null, 2);

  return {
    title: testTitle,
    seriesTitle: seriesHeader,
    totalQuestions: count,
    cleanTxt,
    questions,
    rawJson,
  };
}
